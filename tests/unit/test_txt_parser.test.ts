// @vitest-environment node
import { describe, it, expect } from "vitest";
import { parseTxt, TxtReadError } from "@/lib/parsers/txt_parser";

describe("parseTxt", () => {
  it("test_returns_trimmed_utf8_string", () => {
    const buffer = Buffer.from("  Hello World  ", "utf-8");
    expect(parseTxt({ buffer })).toBe("Hello World");
  });

  it("test_handles_multiline_content", () => {
    const buffer = Buffer.from("line1\nline2\nline3", "utf-8");
    expect(parseTxt({ buffer })).toBe("line1\nline2\nline3");
  });
});
