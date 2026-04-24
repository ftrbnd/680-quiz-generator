import { NextRequest, NextResponse } from "next/server";
import { parseAttemptsBody } from "@/lib/api/request_validation";
import { submitAttempt } from "@/services/quiz_service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = parseAttemptsBody(body);
    if (!parsed.ok) {
      return NextResponse.json(
        { error: true, code: parsed.code, message: parsed.message },
        { status: parsed.status }
      );
    }
    const { quizId, studentId, responses } = parsed;

    const result = await submitAttempt({ quizId, studentId, responses });
    return NextResponse.json({ attemptId: result.attemptId, score: result.score });
  } catch (err) {
    console.error({ level: "ERROR", component: "api/attempts", msg: err });
    return NextResponse.json({ error: true, code: "SUBMIT_FAILED", message: "Submission failed" }, { status: 500 });
  }
}
