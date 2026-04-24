// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const parsePdfMock = vi.hoisted(() => vi.fn());
const parsePptMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/parsers/pdf_parser", () => ({
  parsePdf: (...args: unknown[]) => parsePdfMock(...args),
  PdfParseError: class PdfParseError extends Error {
    readonly code = "PDF_PARSE_FAILED";
  },
}));

vi.mock("@/lib/parsers/ppt_parser", () => ({
  parsePpt: (...args: unknown[]) => parsePptMock(...args),
  PptParseError: class PptParseError extends Error {
    readonly code = "PPT_PARSE_FAILED";
  },
}));

import {
  extractTextFromFile,
  FileTooLargeError,
  InsufficientContentError,
  InvalidFileTypeError,
} from "@/services/file_service";

describe("extractTextFromFile", () => {
  beforeEach(() => {
    parsePdfMock.mockReset();
    parsePptMock.mockReset();
    parsePdfMock.mockResolvedValue("x".repeat(120));
    parsePptMock.mockResolvedValue("y".repeat(120));
  });

  it("test_rejects_unsupported_file_type", async () => {
    const buffer = Buffer.from("content");
    await expect(
      extractTextFromFile({ buffer, mimeType: "application/exe", filename: "virus.exe" })
    ).rejects.toThrow(InvalidFileTypeError);
  });

  it("test_rejects_file_exceeding_10mb_limit", async () => {
    const buffer = Buffer.alloc(11 * 1024 * 1024);
    await expect(
      extractTextFromFile({ buffer, mimeType: "text/plain", filename: "huge.txt" })
    ).rejects.toThrow(FileTooLargeError);
  });

  it("test_extracts_text_from_plain_txt_buffer", async () => {
    const content = "A".repeat(200);
    const buffer = Buffer.from(content, "utf-8");
    const result = await extractTextFromFile({ buffer, mimeType: "text/plain", filename: "notes.txt" });
    expect(result).toBe(content);
  });

  it("throws_insufficient_content_when_extracted_text_is_short", async () => {
    const buffer = Buffer.from("a".repeat(99), "utf-8");
    await expect(
      extractTextFromFile({ buffer, mimeType: "text/plain", filename: "short.txt" })
    ).rejects.toThrow(InsufficientContentError);
  });

  it("delegates_to_parse_pdf_for_pdf_mime", async () => {
    const buffer = Buffer.from("%PDF");
    await extractTextFromFile({ buffer, mimeType: "application/pdf", filename: "doc.pdf" });
    expect(parsePdfMock).toHaveBeenCalledWith({ buffer });
    expect(parsePptMock).not.toHaveBeenCalled();
  });

  it("delegates_to_parse_ppt_for_pptx_mime", async () => {
    const buffer = Buffer.from("PK");
    await extractTextFromFile({
      buffer,
      mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      filename: "slides.pptx",
    });
    expect(parsePptMock).toHaveBeenCalledWith({ buffer, filename: "slides.pptx" });
    expect(parsePdfMock).not.toHaveBeenCalled();
  });

  it("throws_insufficient_content_when_parser_returns_short_text", async () => {
    parsePdfMock.mockResolvedValueOnce("brief");
    await expect(
      extractTextFromFile({ buffer: Buffer.from("x"), mimeType: "application/pdf", filename: "a.pdf" })
    ).rejects.toThrow(InsufficientContentError);
  });
});
