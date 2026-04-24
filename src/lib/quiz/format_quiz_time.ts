export function formatQuizTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const sec = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}
