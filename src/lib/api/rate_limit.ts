type Bucket = { timestamps: number[] };

const buckets = new Map<string, Bucket>();

function prune(ts: number[], windowMs: number, now: number): number[] {
  const cutoff = now - windowMs;
  return ts.filter((t) => t > cutoff);
}

/** Simple in-memory sliding-window limiter (per process). */
export function checkSlidingWindowLimit({
  key,
  max,
  windowMs,
  now = Date.now(),
}: {
  key: string;
  max: number;
  windowMs: number;
  now?: number;
}): { ok: true } | { ok: false; retryAfterMs: number } {
  let b = buckets.get(key);
  if (!b) {
    b = { timestamps: [] };
    buckets.set(key, b);
  }
  b.timestamps = prune(b.timestamps, windowMs, now);
  if (b.timestamps.length >= max) {
    const oldest = b.timestamps[0]!;
    return { ok: false, retryAfterMs: Math.max(0, oldest + windowMs - now) };
  }
  b.timestamps.push(now);
  return { ok: true };
}
