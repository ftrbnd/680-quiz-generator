import { NextRequest, NextResponse } from "next/server";
import { parseUploadForm } from "@/lib/api/request_validation";
import { checkSlidingWindowLimit } from "@/lib/api/rate_limit";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/drizzle_client";
import { uploadedFiles } from "@/lib/db/schema";
import { generateId } from "@/lib/utils/generate_id";
import { extractTextFromFile, InvalidFileTypeError, FileTooLargeError, InsufficientContentError } from "@/services/file_service";

const UPLOAD_WINDOW_MS = 60 * 60 * 1000;
const UPLOAD_MAX_PER_WINDOW = 40;

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: true, code: "UNAUTHORIZED", message: "Sign in required" }, { status: 401 });
    }
    const ownerId = session.user.id;

    const form = await req.formData();
    const parsed = parseUploadForm(form);
    if (!parsed.ok) {
      return NextResponse.json(
        { error: true, code: parsed.code, message: parsed.message },
        { status: parsed.status }
      );
    }
    const { file } = parsed;

    const rl = checkSlidingWindowLimit({
      key: `upload:${ownerId}`,
      max: UPLOAD_MAX_PER_WINDOW,
      windowMs: UPLOAD_WINDOW_MS,
    });
    if (!rl.ok) {
      return NextResponse.json(
        { error: true, code: "RATE_LIMITED", message: "Too many uploads. Try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const extractedText = await extractTextFromFile({ buffer, mimeType: file.type, filename: file.name });

    const [record] = await db
      .insert(uploadedFiles)
      .values({
        id: generateId(),
        ownerId,
        originalName: file.name,
        fileType: file.type,
        storagePath: "",
        extractedText,
      })
      .returning();

    return NextResponse.json({ fileId: record.id, extractedText });
  } catch (err) {
    if (err instanceof InvalidFileTypeError) {
      return NextResponse.json({ error: true, code: err.code, message: err.message }, { status: 400 });
    }
    if (err instanceof FileTooLargeError) {
      return NextResponse.json({ error: true, code: err.code, message: err.message }, { status: 413 });
    }
    if (err instanceof InsufficientContentError) {
      return NextResponse.json({ error: true, code: err.code, message: err.message }, { status: 422 });
    }
    console.error({ level: "ERROR", component: "api/upload", msg: err });
    return NextResponse.json({ error: true, code: "UPLOAD_FAILED", message: "Upload failed" }, { status: 500 });
  }
}
