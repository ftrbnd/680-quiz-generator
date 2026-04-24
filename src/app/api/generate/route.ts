import { NextRequest, NextResponse } from "next/server";
import { parseGenerateBody } from "@/lib/api/request_validation";
import { createQuiz, getUploadedFileText } from "@/services/quiz_service";
import { GenerationFailedError, QuotaExceededError } from "@/services/ai_service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = parseGenerateBody(body);
    if (!parsed.ok) {
      return NextResponse.json(
        { error: true, code: parsed.code, message: parsed.message },
        { status: parsed.status }
      );
    }
    const { fileId, title, ownerId, config } = parsed;

    const extractedText = await getUploadedFileText({ fileId });
    if (!extractedText) {
      return NextResponse.json({ error: true, code: "INSUFFICIENT_CONTENT", message: "No extracted text for this file" }, { status: 422 });
    }

    const quiz = await createQuiz({ title, ownerId, extractedText, config });
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
