// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const pdfMocks = vi.hoisted(() => ({
  getText: vi.fn(),
  destroy: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("pdf-parse", () => ({
  PDFParse: class {
    static setWorker() {
      return "";
    }
    constructor(_opts: { data: Buffer }) {}
    getText = pdfMocks.getText;
    destroy = pdfMocks.destroy;
  },
}));

import { parsePdf, PdfParseError } from "@/lib/parsers/pdf_parser";

describe("parsePdf", () => {
  beforeEach(() => {
    pdfMocks.getText.mockReset();
    pdfMocks.destroy.mockClear();
  });

  it("returns_trimmed_text_from_getText", async () => {
    pdfMocks.getText.mockResolvedValue({
      text: ["  page1  ", " page2 "].join(" "),
    });
    await expect(parsePdf({ buffer: Buffer.from("pdf") })).resolves.toBe("page1    page2");
  });

  it("wraps_getText_errors_in_pdf_parse_error", async () => {
    pdfMocks.getText.mockRejectedValue(new Error("corrupt"));
    await expect(parsePdf({ buffer: Buffer.from("x") })).rejects.toMatchObject({
      code: "PDF_PARSE_FAILED",
    });
    await expect(parsePdf({ buffer: Buffer.from("x") })).rejects.toBeInstanceOf(PdfParseError);
  });
});
