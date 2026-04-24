"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/auth_client";
import { buildAttemptPayload } from "@/lib/quiz/build_attempt_payload";
import { postStudentAttemptJson } from "@/lib/quiz/post_student_attempt";
import type { QuizQuestion } from "@/types/quiz";

export function useQuizSubmission({
  quizId,
  questions,
  responses,
}: {
  quizId: string;
  questions: QuizQuestion[];
  responses: Record<string, string>;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const submit = useCallback(async () => {
    setSubmitting(true);
    try {
      const session = await authClient.getSession();
      const studentId = session.data?.user.id;
      if (!studentId) {
        router.push("/login");
        return;
      }

      const payload = buildAttemptPayload(questions, responses);

      const result = await postStudentAttemptJson({
        quizId,
        studentId,
        responses: payload,
        fetchImpl: fetch,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      router.push(`/student/results/${result.attemptId}`);
    } finally {
      setSubmitting(false);
    }
  }, [quizId, questions, responses, router]);

  return { submitting, submit };
}
