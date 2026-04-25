import { NextRequest, NextResponse } from "next/server";
import { parseGenerateBody } from "@/lib/api/request_validation";
import { checkSlidingWindowLimit } from "@/lib/api/rate_limit";
import { auth } from "@/lib/auth/auth";
import { createQuiz, getUploadedFileTextForOwner } from "@/services/quiz_service";
import { GenerationFailedError, QuotaExceededError } from "@/services/ai_service";

const GENERATE_WINDOW_MS = 60 * 60 * 1000;
const GENERATE_MAX_PER_WINDOW = 30;

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: true, code: "UNAUTHORIZED", message: "Sign in required" }, { status: 401 });
    }
    const ownerId = session.user.id;
    const role = (session.user as { role?: string }).role ?? "STUDENT";
    const visibility = role === "TEACHER" ? ("SHARED" as const) : ("PRIVATE" as const);

    const body = await req.json();
    const parsed = parseGenerateBody(body);
    if (!parsed.ok) {
      return NextResponse.json(
        { error: true, code: parsed.code, message: parsed.message },
        { status: parsed.status }
      );
    }
    const { fileId, title, config } = parsed;

    const rl = checkSlidingWindowLimit({
      key: `generate:${ownerId}`,
      max: GENERATE_MAX_PER_WINDOW,
      windowMs: GENERATE_WINDOW_MS,
    });
    if (!rl.ok) {
      return NextResponse.json(
        { error: true, code: "RATE_LIMITED", message: "Too many quiz generations. Try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
      );
    }

    const extractedText = await getUploadedFileTextForOwner({ fileId, ownerId });
    if (!extractedText) {
      return NextResponse.json(
        { error: true, code: "FILE_NOT_FOUND", message: "Upload not found or you do not have access" },
        { status: 404 }
      );
    }

    const quiz = await createQuiz({ title, ownerId, extractedText, config, visibility });
    return NextResponse.json({ quiz });
  } catch (err) {
    if (err instanceof QuotaExceededError) {
      return NextResponse.json({ error: true, code: err.code, message: err.message }, { status: 429 });
    }
    if (err instanceof GenerationFailedError) {
      return NextResponse.json({ error: true, code: err.code, message: err.message }, { status: 500 });
    }
    console.error({ level: "ERROR", component: "api/generate", msg: err });
    return NextResponse.json({ error: true, code: "GENERATION_FAILED", message: "Quiz generation failed" }, { status: 500 });
  }
}
