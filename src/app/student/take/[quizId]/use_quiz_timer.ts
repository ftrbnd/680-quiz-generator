"use client";

import { useEffect, useState } from "react";
import { initialQuizTimerSeconds } from "@/lib/quiz/quiz_timer_state";

export function useQuizTimer({
  timeLimitMinutes,
  onExpire,
}: {
  timeLimitMinutes?: number;
  onExpire: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(() =>
    initialQuizTimerSeconds(timeLimitMinutes)
  );

  useEffect(() => {
    if (secondsLeft === null) return;
    if (secondsLeft <= 0) {
      onExpire();
      return;
    }
    const id = setInterval(() => setSecondsLeft((s) => (s !== null ? s - 1 : null)), 1000);
    return () => clearInterval(id);
  }, [secondsLeft, onExpire]);

  return { secondsLeft };
}
