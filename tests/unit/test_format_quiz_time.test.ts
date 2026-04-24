// @vitest-environment node
import { describe, it, expect } from "vitest";
import { formatQuizTime } from "@/lib/quiz/format_quiz_time";

describe("formatQuizTime", () => {
  it("pads_minutes_and_seconds", () => {
    expect(formatQuizTime(0)).toBe("00:00");
    expect(formatQuizTime(65)).toBe("01:05");
    expect(formatQuizTime(3599)).toBe("59:59");
  });
});
