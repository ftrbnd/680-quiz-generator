import { z } from "zod";
import type { QuizConfig } from "@/types/quiz";

const QuizConfigSchema = z.object({
  questionCount: z.number().int().positive(),
  quizType: z.enum([
    "MULTIPLE_CHOICE",
    "SHORT_ANSWER",
    "FILL_IN_THE_BLANK",
    "READING_COMPREHENSION",
  ]),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  timeLimitMinutes: z.number().int().nonnegative().optional(),
});

export type ApiValidationError = {
  ok: false;
  status: number;
  code: "INVALID_REQUEST";
  message: string;
};

export type ParseGenerateOk = {
  ok: true;
  fileId: string;
  title: string;
  config: QuizConfig;
};

export function parseGenerateBody(input: unknown): ParseGenerateOk | ApiValidationError {
  if (input === null || typeof input !== "object") {
    return { ok: false, status: 400, code: "INVALID_REQUEST", message: "Missing required fields" };
  }
  const o = input as Record<string, unknown>;
  const fileId = o.fileId;
  const title = o.title;
  const rawConfig = o.config;

  if (typeof fileId !== "string" || !fileId.trim()) {
    return { ok: false, status: 400, code: "INVALID_REQUEST", message: "Missing required fields" };
  }
  if (typeof title !== "string" || !title.trim()) {
    return { ok: false, status: 400, code: "INVALID_REQUEST", message: "Missing required fields" };
  }

  const parsed = QuizConfigSchema.safeParse(rawConfig);
  if (!parsed.success) {
    return { ok: false, status: 400, code: "INVALID_REQUEST", message: "Missing required fields" };
  }

  return {
    ok: true,
    fileId,
    title,
    config: parsed.data,
  };
}

export type ParseUploadOk = { ok: true; file: File };

export function parseUploadForm(form: FormData): ParseUploadOk | ApiValidationError {
  const file = form.get("file");

  if (!(file instanceof File) || !file.size) {
    return { ok: false, status: 400, code: "INVALID_REQUEST", message: "Missing file" };
  }

  return { ok: true, file };
}

export type ParseAttemptsOk = {
  ok: true;
  quizId: string;
  studentId: string;
  responses: { questionId: string; response: string }[];
};

export function parseAttemptsBody(input: unknown): ParseAttemptsOk | ApiValidationError {
  if (input === null || typeof input !== "object") {
    return { ok: false, status: 400, code: "INVALID_REQUEST", message: "Missing required fields" };
  }
  const o = input as Record<string, unknown>;
  const quizId = o.quizId;
  const studentId = o.studentId;
  const responses = o.responses;

  if (typeof quizId !== "string" || !quizId.trim()) {
    return { ok: false, status: 400, code: "INVALID_REQUEST", message: "Missing required fields" };
  }
  if (typeof studentId !== "string" || !studentId.trim()) {
    return { ok: false, status: 400, code: "INVALID_REQUEST", message: "Missing required fields" };
  }
  if (!Array.isArray(responses)) {
    return { ok: false, status: 400, code: "INVALID_REQUEST", message: "Missing required fields" };
  }

  for (const item of responses) {
    if (item === null || typeof item !== "object") {
      return { ok: false, status: 400, code: "INVALID_REQUEST", message: "Missing required fields" };
    }
    const r = item as Record<string, unknown>;
    if (typeof r.questionId !== "string" || typeof r.response !== "string") {
      return { ok: false, status: 400, code: "INVALID_REQUEST", message: "Missing required fields" };
    }
  }

  return {
    ok: true,
    quizId,
    studentId,
    responses: responses as { questionId: string; response: string }[],
  };
}

export type ParseExportQuizIdOk = { ok: true; quizId: string };

export function parseExportQuizId(searchParams: URLSearchParams): ParseExportQuizIdOk | ApiValidationError {
  const quizId = searchParams.get("quizId");
  if (!quizId?.trim()) {
    return { ok: false, status: 400, code: "INVALID_REQUEST", message: "Missing quizId" };
  }
  return { ok: true, quizId };
}
