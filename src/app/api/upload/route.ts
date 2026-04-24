import { NextRequest, NextResponse } from "next/server";
import { parseUploadForm } from "@/lib/api/request_validation";
import { db } from "@/lib/db/drizzle_client";
import { uploadedFiles } from "@/lib/db/schema";
import { generateId } from "@/lib/utils/generate_id";
import { extractTextFromFile, InvalidFileTypeError, FileTooLargeError, InsufficientContentError } from "@/services/file_service";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const parsed = parseUploadForm(form);
    if (!parsed.ok) {
      return NextResponse.json(
        { error: true, code: parsed.code, message: parsed.message },
        { status: parsed.status }
      );
    }
    const { file, ownerId } = parsed;

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
