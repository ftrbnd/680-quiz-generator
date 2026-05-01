import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/drizzle_client";
import { attempts, answers, questions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { buildFlashcardsFromWrongAnswers } from "@/lib/quiz/build_flashcards";
import { buildAttemptFeedback } from "@/lib/quiz/grade_responses";
import type { QuestionForGrading } from "@/lib/quiz/grade_responses";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: true, code: "UNAUTHORIZED", message: "Sign in required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { quizId, attemptId } = (body ?? {}) as Record<string, unknown>;

    if (typeof quizId !== "string" || !quizId.trim() || typeof attemptId !== "string" || !attemptId.trim()) {
      return NextResponse.json(
        { error: true, code: "INVALID_REQUEST", message: "Missing required fields" },
        { status: 400 }
      );
    }

    const [attempt] = await db.select().from(attempts).where(eq(attempts.id, attemptId));
    if (!attempt) {
      return NextResponse.json(
        { error: true, code: "NOT_FOUND", message: "Attempt not found" },
        { status: 404 }
      );
    }
    if (attempt.studentId !== session.user.id) {
      return NextResponse.json(
        { error: true, code: "FORBIDDEN", message: "Access denied" },
        { status: 403 }
      );
    }

    const wrongAnswers = await db
      .select()
      .from(answers)
      .where(and(eq(answers.attemptId, attemptId), eq(answers.isCorrect, false)));

    if (wrongAnswers.length === 0) {
      return NextResponse.json({ flashcards: [] });
    }

    const wrongQuestionIds = new Set(wrongAnswers.map((a) => a.questionId));
    const allQuestions = await db
      .select()
      .from(questions)
      .where(eq(questions.quizId, attempt.quizId));

    const questionMap = new Map<string, QuestionForGrading>(
      allQuestions
        .filter((q) => wrongQuestionIds.has(q.id))
        .map((q) => [q.id, q])
    );

    const scoredAnswers = wrongAnswers.map((a) => ({
      questionId: a.questionId,
      studentResponse: a.studentResponse,
      isCorrect: false as const,
    }));

    const feedback = buildAttemptFeedback(scoredAnswers, questionMap);
    const flashcards = buildFlashcardsFromWrongAnswers(feedback);

    return NextResponse.json({ flashcards });
  } catch (err) {
    console.error({ level: "ERROR", component: "api/flashcards", msg: err });
    return NextResponse.json(
      { error: true, code: "INTERNAL_ERROR", message: "Failed to generate flashcards" },
      { status: 500 }
    );
  }
}
