import { NextRequest, NextResponse } from "next/server";
import { parseAttemptsBody } from "@/lib/api/request_validation";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/drizzle_client";
import { quizzes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { submitAttempt } from "@/services/quiz_service";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: true, code: "UNAUTHORIZED", message: "Sign in required" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = parseAttemptsBody(body);
    if (!parsed.ok) {
      return NextResponse.json(
        { error: true, code: parsed.code, message: parsed.message },
        { status: parsed.status }
      );
    }
    const { quizId, studentId, responses } = parsed;

    if (studentId !== session.user.id) {
      return NextResponse.json({ error: true, code: "FORBIDDEN", message: "Invalid student" }, { status: 403 });
    }

    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, quizId));
    if (!quiz) {
      return NextResponse.json({ error: true, code: "NOT_FOUND", message: "Quiz not found" }, { status: 404 });
    }
    if (quiz.visibility === "PRIVATE" && quiz.ownerId !== session.user.id) {
      return NextResponse.json({ error: true, code: "FORBIDDEN", message: "You do not have access to this quiz" }, { status: 403 });
    }

    const result = await submitAttempt({ quizId, studentId, responses });
    return NextResponse.json({ attemptId: result.attemptId, score: result.score });
  } catch (err) {
    console.error({ level: "ERROR", component: "api/attempts", msg: err });
    return NextResponse.json({ error: true, code: "SUBMIT_FAILED", message: "Submission failed" }, { status: 500 });
  }
}
