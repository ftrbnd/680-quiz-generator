export class TxtReadError extends Error {
  readonly code = "TXT_READ_FAILED";
}

export function parseTxt({ buffer }: { buffer: Buffer }): string {
  try {
    return buffer.toString("utf-8").trim();
  } catch (err) {
    throw new TxtReadError(
      `Failed to read text file: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}
