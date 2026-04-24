// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("fs/promises", () => ({
  writeFile: vi.fn().mockResolvedValue(undefined),
  unlink: vi.fn().mockResolvedValue(undefined),
}));

const execMock = vi.hoisted(() =>
  vi.fn((command: string, callback: (err: Error | null, stdout: string, stderr: string) => void) => {
    queueMicrotask(() => callback(null, `${"slide".repeat(30)}`, ""));
    return {} as import("child_process").ChildProcess;
  })
);

vi.mock("child_process", () => ({
  exec: (...args: unknown[]) => execMock(...(args as [string, (err: Error | null, stdout: string, stderr: string) => void])),
}));

import { parsePpt } from "@/lib/parsers/ppt_parser";

describe("parsePpt", () => {
  beforeEach(() => {
    execMock.mockClear();
  });

  it("returns_trimmed_stdout_text", async () => {
    const text = await parsePpt({ buffer: Buffer.from("pptx"), filename: "deck.pptx" });
    expect(text.length).toBeGreaterThanOrEqual(100);
    expect(text.startsWith("slide")).toBe(true);
    expect(execMock).toHaveBeenCalled();
  });

  it("maps_exec_failure_to_ppt_parse_error", async () => {
    execMock.mockImplementationOnce((command: string, callback: (err: Error | null, stdout: string, stderr: string) => void) => {
      queueMicrotask(() => callback(new Error("python failed"), "", ""));
      return {} as import("child_process").ChildProcess;
    });
    await expect(parsePpt({ buffer: Buffer.from("x"), filename: "bad.pptx" })).rejects.toMatchObject({
      code: "PPT_PARSE_FAILED",
    });
  });
});
