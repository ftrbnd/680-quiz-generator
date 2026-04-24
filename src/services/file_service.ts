import { parsePdf } from "@/lib/parsers/pdf_parser";
import { parsePpt } from "@/lib/parsers/ppt_parser";
import { parseTxt } from "@/lib/parsers/txt_parser";

const ACCEPTED_TYPES = ["application/pdf", "text/plain", "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation"] as const;

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const MIN_TEXT_LENGTH = 100;

export class InvalidFileTypeError extends Error {
  readonly code = "INVALID_FILE_TYPE";
}
export class FileTooLargeError extends Error {
  readonly code = "FILE_TOO_LARGE";
}
export class InsufficientContentError extends Error {
  readonly code = "INSUFFICIENT_CONTENT";
}

export async function extractTextFromFile({
  buffer,
  mimeType,
  filename,
}: {
  buffer: Buffer;
  mimeType: string;
  filename: string;
}): Promise<string> {
  if (buffer.byteLength > MAX_FILE_SIZE_BYTES) {
    throw new FileTooLargeError(
      `File exceeds the 10 MB limit. Uploaded size: ${(buffer.byteLength / 1024 / 1024).toFixed(1)} MB`
    );
  }

  if (!ACCEPTED_TYPES.includes(mimeType as typeof ACCEPTED_TYPES[number])) {
    const ext = filename.split(".").pop();
    throw new InvalidFileTypeError(
      `Unsupported file type: .${ext}. Accepted types: .pdf, .ppt, .pptx, .txt`
    );
  }

  let text: string;

  if (mimeType === "application/pdf") {
    text = await parsePdf({ buffer });
  } else if (
    mimeType === "application/vnd.ms-powerpoint" ||
    mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ) {
    text = await parsePpt({ buffer, filename });
  } else {
    text = parseTxt({ buffer });
  }

  if (text.length < MIN_TEXT_LENGTH) {
    throw new InsufficientContentError(
      `Extracted text is too short (${text.length} chars). Minimum required: ${MIN_TEXT_LENGTH} chars. Ensure the file contains readable text content.`
    );
  }

  return text;
}
