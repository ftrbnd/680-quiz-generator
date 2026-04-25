// @vitest-environment node
import { describe, it, expect } from "vitest";
import {
  parseAttemptsBody,
  parseExportQuizId,
  parseGenerateBody,
  parseUploadForm,
} from "@/lib/api/request_validation";

describe("parseGenerateBody", () => {
  const valid = {
    fileId: "f1",
    title: "T",
    config: {
      questionCount: 5,
      quizType: "MULTIPLE_CHOICE",
      difficulty: "EASY",
    },
  };

  it("accepts_valid_payload", () => {
    const r = parseGenerateBody(valid);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.fileId).toBe("f1");
      expect(r.config.questionCount).toBe(5);
    }
  });

  it("rejects_missing_or_invalid_fields", () => {
    expect(parseGenerateBody(null).ok).toBe(false);
    expect(parseGenerateBody({}).ok).toBe(false);
    expect(parseGenerateBody({ ...valid, fileId: "" }).ok).toBe(false);
    expect(parseGenerateBody({ ...valid, title: "   " }).ok).toBe(false);
    expect(parseGenerateBody({ ...valid, config: { questionCount: 0, quizType: "MULTIPLE_CHOICE", difficulty: "EASY" } }).ok).toBe(
      false
    );
  });
});

describe("parseUploadForm", () => {
  it("accepts_file_only", () => {
    const form = new FormData();
    form.set("file", new File([Buffer.from("x")], "a.txt", { type: "text/plain" }));
    const r = parseUploadForm(form);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.file.name).toBe("a.txt");
    }
  });

  it("rejects_missing_parts", () => {
    const empty = new FormData();
    expect(parseUploadForm(empty).ok).toBe(false);
    const f = new FormData();
    f.set("file", new File([], "empty.txt"));
    expect(parseUploadForm(f).ok).toBe(false);
  });
});

describe("parseAttemptsBody", () => {
  it("accepts_valid_payload", () => {
    const r = parseAttemptsBody({
      quizId: "q1",
      studentId: "s1",
      responses: [{ questionId: "a", response: "r" }],
    });
    expect(r.ok).toBe(true);
  });

  it("rejects_invalid_shape", () => {
    expect(parseAttemptsBody({ quizId: "q", studentId: "s" }).ok).toBe(false);
    expect(parseAttemptsBody({ quizId: "q", studentId: "s", responses: [{}] }).ok).toBe(false);
  });
});

describe("parseExportQuizId", () => {
  it("parses_quizId", () => {
    const params = new URLSearchParams("quizId=abc");
    const r = parseExportQuizId(params);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.quizId).toBe("abc");
  });

  it("rejects_missing_quizId", () => {
    expect(parseExportQuizId(new URLSearchParams()).ok).toBe(false);
  });
});
