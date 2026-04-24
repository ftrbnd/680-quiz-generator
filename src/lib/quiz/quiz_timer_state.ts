export function initialQuizTimerSeconds(timeLimitMinutes?: number): number | null {
  return timeLimitMinutes ? timeLimitMinutes * 60 : null;
}
