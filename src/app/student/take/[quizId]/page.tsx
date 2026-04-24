import { notFound } from "next/navigation";
import { db } from "@/lib/db/drizzle_client";
import { quizzes, questions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { QuizRunner } from "./quiz_runner";
import type { QuizQuestion, QuestionOption } from "@/types/quiz";

export default async function TakeQuizPage({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = await params;

  const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, quizId));
  if (!quiz) notFound();

  const quizQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.quizId, quizId))
    .orderBy(questions.orderIndex);

  const serializedQuestions: QuizQuestion[] = quizQuestions.map((q) => ({
    id: q.id,
    quizId: q.quizId,
    body: q.body,
    options: (q.options as QuestionOption[] | null) ?? undefined,
    correctAnswer: q.correctAnswer,
    hasLatex: q.hasLatex,
    orderIndex: q.orderIndex,
  }));

  return (
    <QuizRunner
      quizId={quiz.id}
      title={quiz.title}
      quizType={quiz.quizType}
      timeLimitMinutes={quiz.timeLimitMinutes ?? undefined}
      questions={serializedQuestions}
    />
  );
}
