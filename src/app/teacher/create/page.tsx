"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/auth_client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import type { QuizConfig, QuizType, Difficulty } from "@/types/quiz";

type Step = "upload" | "configure" | "generating";

const QUIZ_TYPES: { value: QuizType; label: string }[] = [
  { value: "MULTIPLE_CHOICE", label: "Multiple Choice" },
  { value: "SHORT_ANSWER", label: "Short Answer" },
  { value: "FILL_IN_THE_BLANK", label: "Fill in the Blank" },
  { value: "READING_COMPREHENSION", label: "Reading Comprehension" },
];

const DIFFICULTIES: { value: Difficulty; label: string; desc: string }[] = [
  { value: "EASY", label: "Easy", desc: "Recall & definitions" },
  { value: "MEDIUM", label: "Medium", desc: "Application & comprehension" },
  { value: "HARD", label: "Hard", desc: "Analysis & synthesis" },
];

export default function CreateQuizPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [title, setTitle] = useState("");
  const [questionCount, setQuestionCount] = useState(10);
  const [quizType, setQuizType] = useState<QuizType>("MULTIPLE_CHOICE");
  const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | "">(0);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);

    setUploading(true);
    setUploadProgress(10);

    try {
      const session = await authClient.getSession();
      const ownerId = session.data?.user.id;
      if (!ownerId) { router.push("/login"); return; }

      const form = new FormData();
      form.append("file", selected);
      form.append("ownerId", ownerId);

      setUploadProgress(40);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      setUploadProgress(90);
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message ?? "Upload failed");
        setFile(null);
        return;
      }

      setFileId(data.fileId);
      setUploadProgress(100);
      toast.success(`"${selected.name}" uploaded and parsed.`);
      setStep("configure");
    } finally {
      setUploading(false);
    }
  }

  async function handleGenerate() {
    if (!fileId) return;
    setStep("generating");

    try {
      const session = await authClient.getSession();
      const ownerId = session.data?.user.id;
      if (!ownerId) { router.push("/login"); return; }

      const config: QuizConfig = {
        questionCount,
        quizType,
        difficulty,
        timeLimitMinutes: timeLimitMinutes || undefined,
      };

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId, title: (title || file?.name?.split(".")[0]) ?? "Untitled Quiz", ownerId, config }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message ?? "Generation failed");
        setStep("configure");
        return;
      }

      toast.success("Quiz created!");
      router.push("/teacher/quizzes");
    } catch {
      toast.error("Something went wrong. Please try again.");
      setStep("configure");
    }
  }

  if (step === "generating") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <div>
          <h2 className="text-xl font-semibold">Generating your quiz…</h2>
          <p className="text-muted-foreground text-sm mt-1">Claude is reading your material and crafting {questionCount} questions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Create a Quiz</h1>
        <p className="text-muted-foreground text-sm mt-1">Upload study material and configure your quiz.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3 text-sm">
        <StepDot active={step === "upload"} done={step === "configure"} label="1. Upload" />
        <div className="flex-1 h-px bg-border" />
        <StepDot active={step === "configure"} done={false} label="2. Configure" />
      </div>

      {/* Upload step */}
      {step === "upload" && (
        <Card>
          <CardHeader><CardTitle className="text-base">Upload your file</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="border-2 border-dashed rounded-xl p-12 flex flex-col items-center gap-3 text-center hover:border-primary hover:bg-muted/40 transition-colors cursor-pointer disabled:opacity-50"
            >
              <div className="text-3xl">📄</div>
              <div>
                <p className="font-medium">{file ? file.name : "Click to choose a file"}</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, PPTX, or TXT · Max 10 MB</p>
              </div>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.ppt,.pptx,.txt"
              className="hidden"
              onChange={handleFileSelect}
            />
            {uploading && (
              <div className="flex flex-col gap-1.5">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-muted-foreground">Uploading and extracting text…</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Configure step */}
      {step === "configure" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Configure quiz</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">{file?.name}</Badge>
              <button onClick={() => { setStep("upload"); setFile(null); setFileId(null); }} className="text-xs text-muted-foreground underline underline-offset-2">
                Change file
              </button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label>Quiz title</Label>
              <Input
                placeholder={file?.name?.split(".")[0] ?? "My Quiz"}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <Separator />

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Question type</Label>
                <Select value={quizType} onValueChange={(v) => setQuizType(v as QuizType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {QUIZ_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Number of questions</Label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Math.min(50, Math.max(1, Number(e.target.value))))}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Difficulty</Label>
              <div className="grid grid-cols-3 gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setDifficulty(d.value)}
                    className={`rounded-lg border p-3 text-left transition-colors ${
                      difficulty === d.value
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/60"
                    }`}
                  >
                    <p className="text-sm font-medium">{d.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{d.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Time limit (minutes) <span className="text-muted-foreground font-normal">— 0 for unlimited</span></Label>
              <Input
                type="number"
                min={0}
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-32"
              />
            </div>

            <Button onClick={handleGenerate} size="lg" className="w-full mt-2">
              Generate quiz with Claude →
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StepDot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <span className={`text-sm font-medium ${active ? "text-foreground" : done ? "text-primary" : "text-muted-foreground"}`}>
      {done ? "✓ " : ""}{label}
    </span>
  );
}
