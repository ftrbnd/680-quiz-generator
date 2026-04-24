// @vitest-environment node
import { describe, it, expect } from "vitest";
import { initialQuizTimerSeconds } from "@/lib/quiz/quiz_timer_state";

describe("initialQuizTimerSeconds", () => {
  it("returns_null_when_no_limit_or_zero", () => {
    expect(initialQuizTimerSeconds(undefined)).toBe(null);
    expect(initialQuizTimerSeconds(0)).toBe(null);
  });

  it("converts_minutes_to_seconds", () => {
    expect(initialQuizTimerSeconds(1)).toBe(60);
    expect(initialQuizTimerSeconds(2)).toBe(120);
  });
});
