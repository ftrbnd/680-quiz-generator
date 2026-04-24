export async function postStudentAttemptJson(options: {
  quizId: string;
  studentId: string;
  responses: { questionId: string; response: string }[];
  fetchImpl: typeof fetch;
}): Promise<{ ok: true; attemptId: string } | { ok: false; message: string }> {
  const { quizId, studentId, responses, fetchImpl } = options;
  const res = await fetchImpl("/api/attempts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quizId, studentId, responses }),
  });
  const data = (await res.json()) as { message?: string; attemptId?: string };
  if (!res.ok) {
    return { ok: false, message: data.message ?? "Submission failed" };
  }
  if (!data.attemptId) {
    return { ok: false, message: "Submission failed" };
  }
  return { ok: true, attemptId: data.attemptId };
}
