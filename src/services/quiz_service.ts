import { db } from "@/lib/db/drizzle_client";
import { quizzes, questions, attempts, answers, uploadedFiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { buildAttemptFeedback, gradeResponses } from "@/lib/quiz/grade_responses";
import { generateQuestions } from "@/services/ai_service";
import { generateId } from "@/lib/utils/generate_id";
import type { Quiz, QuizConfig, AttemptResult, QuestionOption } from "@/types/quiz";

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
}: {
  title: string;
  ownerId: string;
  extractedText: string;
  config: QuizConfig;
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

export async function getUploadedFileText({ fileId }: { fileId: string }): Promise<string | null> {
  const [file] = await db.select().from(uploadedFiles).where(eq(uploadedFiles.id, fileId));
  return file?.extractedText ?? null;
}
