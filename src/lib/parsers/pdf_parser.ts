import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";

type TextResultLike = { text: string };

type PDFParseCtor = new (opts: { data: Buffer }) => {
  getText: () => Promise<TextResultLike>;
  destroy: () => Promise<void>;
};

type PDFParseModule = {
  PDFParse: PDFParseCtor & { setWorker?: (src: string) => string };
};

let pdfWorkerConfigured = false;

function resolvePdfWorkerHref(): string {
  const requireFromProject = createRequire(join(process.cwd(), "package.json"));
  const pdfParseMain = requireFromProject.resolve("pdf-parse");
  const workerPath = join(dirname(pdfParseMain), "pdf.worker.mjs");
  if (!existsSync(workerPath)) {
    throw new Error(`pdf.worker.mjs not found at ${workerPath}`);
  }
  return pathToFileURL(workerPath).href;
}

export class PdfParseError extends Error {
  readonly code = "PDF_PARSE_FAILED";
}

export async function parsePdf({ buffer }: { buffer: Buffer }): Promise<string> {
  try {
    const { PDFParse } = (await import("pdf-parse")) as unknown as PDFParseModule;
    if (typeof PDFParse.setWorker === "function" && !pdfWorkerConfigured) {
      PDFParse.setWorker(resolvePdfWorkerHref());
      pdfWorkerConfigured = true;
    }
    const parser = new PDFParse({ data: buffer });
    try {
      const textResult = await parser.getText();
      return textResult.text.trim();
    } finally {
      await parser.destroy().catch(() => {});
    }
  } catch (err) {
    throw new PdfParseError(
      `Failed to extract text from PDF: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}
