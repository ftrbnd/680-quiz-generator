import { db } from "@/lib/db/drizzle_client";
import { quizzes, questions, attempts, answers, uploadedFiles } from "@/lib/db/schema";
import { and, count, desc, eq, inArray } from "drizzle-orm";
import { buildAttemptFeedback, gradeResponses } from "@/lib/quiz/grade_responses";
import { generateQuestions } from "@/services/ai_service";
import { generateId } from "@/lib/utils/generate_id";
import type { Quiz, QuizConfig, QuizVisibility, AttemptResult, QuestionOption } from "@/types/quiz";

export class DbWriteError extends Error {
  readonly code = "DB_WRITE_FAILED";
}

function toQuestionOption(raw: unknown): QuestionOption[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw as QuestionOption[];
}

export async function createQuiz({
  title,
  ownerId,
  extractedText,
  config,
  visibility,
}: {
  title: string;
  ownerId: string;
  extractedText: string;
  config: QuizConfig;
  visibility: QuizVisibility;
}): Promise<Quiz> {
  const generated = await generateQuestions({ text: extractedText, config });

  const quizId = generateId();

  try {
    const [quiz] = await db
      .insert(quizzes)
      .values({
        id: quizId,
        title,
        ownerId,
        quizType: config.quizType,
        difficulty: config.difficulty,
        timeLimitMinutes: config.timeLimitMinutes ?? null,
        visibility,
      })
      .returning();

    const questionRows = generated.map((q) => ({
      id: generateId(),
      quizId,
      body: q.body,
      options: q.options ?? null,
      correctAnswer: q.correctAnswer,
      hasLatex: q.hasLatex,
      orderIndex: q.orderIndex,
    }));

    const insertedQuestions = await db.insert(questions).values(questionRows).returning();

    return {
      id: quiz.id,
      title: quiz.title,
      ownerId: quiz.ownerId,
      visibility: quiz.visibility,
      quizType: quiz.quizType,
      difficulty: quiz.difficulty,
      timeLimitMinutes: quiz.timeLimitMinutes ?? undefined,
      createdAt: quiz.createdAt,
      questions: insertedQuestions
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((q) => ({
          id: q.id,
          quizId: q.quizId,
          body: q.body,
          options: toQuestionOption(q.options),
          correctAnswer: q.correctAnswer,
          hasLatex: q.hasLatex,
          orderIndex: q.orderIndex,
        })),
    };
  } catch (err) {
    throw new DbWriteError(`Failed to persist quiz: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function getQuizWithQuestions({ quizId }: { quizId: string }): Promise<Quiz | null> {
  const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, quizId));
  if (!quiz) return null;

  const quizQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.quizId, quizId))
    .orderBy(questions.orderIndex);

  return {
    id: quiz.id,
    title: quiz.title,
    ownerId: quiz.ownerId,
    visibility: quiz.visibility,
    quizType: quiz.quizType,
    difficulty: quiz.difficulty,
    timeLimitMinutes: quiz.timeLimitMinutes ?? undefined,
    createdAt: quiz.createdAt,
    questions: quizQuestions.map((q) => ({
      id: q.id,
      quizId: q.quizId,
      body: q.body,
      options: toQuestionOption(q.options),
      correctAnswer: q.correctAnswer,
      hasLatex: q.hasLatex,
      orderIndex: q.orderIndex,
    })),
  };
}

export async function submitAttempt({
  quizId,
  studentId,
  responses,
}: {
  quizId: string;
  studentId: string;
  responses: { questionId: string; response: string }[];
}): Promise<AttemptResult> {
  const quizQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.quizId, quizId));

  const { scoredAnswers, score, questionMap } = gradeResponses(quizQuestions, responses);
  const attemptId = generateId();

  await db.insert(attempts).values({
    id: attemptId,
    quizId,
    studentId,
    submittedAt: new Date(),
    score,
  });

  await db.insert(answers).values(
    scoredAnswers.map((a) => ({
      id: generateId(),
      attemptId,
      questionId: a.questionId,
      studentResponse: a.studentResponse,
      isCorrect: a.isCorrect,
    }))
  );

  return {
    attemptId,
    score,
    totalQuestions: scoredAnswers.length,
    feedback: buildAttemptFeedback(scoredAnswers, questionMap),
  };
}

export async function getUploadedFileTextForOwner({
  fileId,
  ownerId,
}: {
  fileId: string;
  ownerId: string;
}): Promise<string | null> {
  const [file] = await db
    .select()
    .from(uploadedFiles)
    .where(and(eq(uploadedFiles.id, fileId), eq(uploadedFiles.ownerId, ownerId)));
  return file?.extractedText ?? null;
}

export type StudentAttemptListRow = {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  quizType: string;
  difficulty: string;
  questionCount: number;
  submittedAt: Date | null;
  startedAt: Date;
  score: number | null;
};

export type StudentAttemptStats = {
  totalAttempts: number;
  submittedWithScore: number;
  averageScorePercent: number | null;
  bestScorePercent: number | null;
  uniqueQuizzesAttempted: number;
};

export async function listStudentAttemptsWithStats({
  studentId,
}: {
  studentId: string;
}): Promise<{ rows: StudentAttemptListRow[]; stats: StudentAttemptStats }> {
  const joined = await db
    .select({ attempt: attempts, quiz: quizzes })
    .from(attempts)
    .innerJoin(quizzes, eq(attempts.quizId, quizzes.id))
    .where(eq(attempts.studentId, studentId))
    .orderBy(desc(attempts.submittedAt), desc(attempts.startedAt));

  const quizIds = [...new Set(joined.map((j) => j.quiz.id))];
  const countMap = new Map<string, number>();
  if (quizIds.length > 0) {
    const countRows = await db
      .select({ quizId: questions.quizId, n: count(questions.id) })
      .from(questions)
      .where(inArray(questions.quizId, quizIds))
      .groupBy(questions.quizId);
    for (const r of countRows) {
      countMap.set(r.quizId, Number(r.n));
    }
  }

  const rows: StudentAttemptListRow[] = joined.map(({ attempt, quiz }) => ({
    attemptId: attempt.id,
    quizId: quiz.id,
    quizTitle: quiz.title,
    quizType: quiz.quizType,
    difficulty: quiz.difficulty,
    questionCount: countMap.get(quiz.id) ?? 0,
    submittedAt: attempt.submittedAt,
    startedAt: attempt.startedAt,
    score: attempt.score,
  }));

  const scored = rows.filter((r) => r.submittedAt != null && r.score != null);
  const percents = scored.map((r) => Math.round((r.score ?? 0) * 100));

  const stats: StudentAttemptStats = {
    totalAttempts: rows.length,
    submittedWithScore: scored.length,
    averageScorePercent:
      percents.length > 0 ? Math.round(percents.reduce((a, b) => a + b, 0) / percents.length) : null,
    bestScorePercent: percents.length > 0 ? Math.max(...percents) : null,
    uniqueQuizzesAttempted: new Set(rows.map((r) => r.quizId)).size,
  };

  return { rows, stats };
}
