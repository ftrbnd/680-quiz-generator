// @vitest-environment node
import { describe, it, expect } from "vitest";
import { checkSlidingWindowLimit } from "@/lib/api/rate_limit";

describe("checkSlidingWindowLimit", () => {
  it("allows_requests_under_max", () => {
    const now = 1_000_000;
    const r1 = checkSlidingWindowLimit({ key: "test-a", max: 3, windowMs: 10_000, now });
    const r2 = checkSlidingWindowLimit({ key: "test-a", max: 3, windowMs: 10_000, now: now + 1000 });
    const r3 = checkSlidingWindowLimit({ key: "test-a", max: 3, windowMs: 10_000, now: now + 2000 });
    expect(r1.ok).toBe(true);
    expect(r2.ok).toBe(true);
    expect(r3.ok).toBe(true);
  });

  it("rejects_when_max_reached", () => {
    const now = 2_000_000;
    const key = "test-b";
    expect(checkSlidingWindowLimit({ key, max: 2, windowMs: 10_000, now }).ok).toBe(true);
    expect(checkSlidingWindowLimit({ key, max: 2, windowMs: 10_000, now: now + 1 }).ok).toBe(true);
    const blocked = checkSlidingWindowLimit({ key, max: 2, windowMs: 10_000, now: now + 2 });
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.retryAfterMs).toBeGreaterThanOrEqual(0);
    }
  });

  it("isolates_keys", () => {
    const now = 3_000_000;
    expect(checkSlidingWindowLimit({ key: "u1", max: 1, windowMs: 60_000, now }).ok).toBe(true);
    expect(checkSlidingWindowLimit({ key: "u1", max: 1, windowMs: 60_000, now: now + 1 }).ok).toBe(false);
    expect(checkSlidingWindowLimit({ key: "u2", max: 1, windowMs: 60_000, now: now + 2 }).ok).toBe(true);
  });
});
