"use client";

import { useState } from "react";
import { LatexText } from "@/components/quiz/latex_text";
import { formatQuizTime } from "@/lib/quiz/format_quiz_time";
import { useQuizSubmission } from "@/app/student/take/[quizId]/use_quiz_submission";
import { useQuizTimer } from "@/app/student/take/[quizId]/use_quiz_timer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { QuizQuestion, QuizType } from "@/types/quiz";

interface QuizRunnerProps {
  quizId: string;
  title: string;
  quizType: QuizType;
  timeLimitMinutes?: number;
  questions: QuizQuestion[];
}

export function QuizRunner({ quizId, title, quizType, timeLimitMinutes, questions }: QuizRunnerProps) {
  const [current, setCurrent] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});

  const { submitting, submit } = useQuizSubmission({ quizId, questions, responses });
  const { secondsLeft } = useQuizTimer({ timeLimitMinutes, onExpire: submit });

  const question = questions[current];
  const totalAnswered = Object.keys(responses).length;
  const progressPct = (totalAnswered / questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Question {current + 1} of {questions.length}
          </p>
        </div>
        {secondsLeft !== null && (
          <Badge
            variant={secondsLeft < 60 ? "destructive" : "secondary"}
            className="text-base px-3 py-1 font-mono"
          >
            {formatQuizTime(secondsLeft)}
          </Badge>
        )}
      </div>

      {/* Progress */}
      <div className="flex flex-col gap-1">
        <Progress value={progressPct} className="h-1.5" />
        <p className="text-xs text-muted-foreground">{totalAnswered} of {questions.length} answered</p>
      </div>

      {/* Question card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-normal leading-relaxed">
            <span className="font-semibold mr-2">{current + 1}.</span>
            {question.hasLatex ? <LatexText text={question.body} /> : question.body}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <QuestionInput
            question={question}
            quizType={quizType}
            value={responses[question.id] ?? ""}
            onChange={(v) => setResponses((r) => ({ ...r, [question.id]: v }))}
          />
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          disabled={current === 0}
          onClick={() => setCurrent((c) => c - 1)}
        >
          ← Previous
        </Button>

        <div className="flex gap-1.5">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                i === current
                  ? "bg-primary text-primary-foreground"
                  : responses[questions[i].id]
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {current < questions.length - 1 ? (
          <Button onClick={() => setCurrent((c) => c + 1)}>Next →</Button>
        ) : (
          <Button
            onClick={submit}
            disabled={submitting}
            variant={totalAnswered < questions.length ? "outline" : "default"}
          >
            {submitting ? "Submitting…" : "Submit Quiz"}
          </Button>
        )}
      </div>

      {totalAnswered < questions.length && current === questions.length - 1 && (
        <p className="text-xs text-center text-muted-foreground">
          {questions.length - totalAnswered} question{questions.length - totalAnswered !== 1 ? "s" : ""} unanswered. You can still submit.
        </p>
      )}
    </div>
  );
}

function QuestionInput({
  question,
  quizType,
  value,
  onChange,
}: {
  question: QuizQuestion;
  quizType: QuizType;
  value: string;
  onChange: (v: string) => void;
}) {
  if (quizType === "MULTIPLE_CHOICE" && question.options) {
    return (
      <RadioGroup value={value} onValueChange={onChange} className="flex flex-col gap-3">
        {question.options.map((opt) => (
          <div key={opt.label} className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/40 transition-colors cursor-pointer">
            <RadioGroupItem value={opt.label} id={`${question.id}-${opt.label}`} className="mt-0.5" />
            <Label htmlFor={`${question.id}-${opt.label}`} className="cursor-pointer font-normal leading-relaxed">
              <span className="font-semibold">{opt.label}.</span>{" "}
              {question.hasLatex ? <LatexText text={opt.text} /> : opt.text}
            </Label>
          </div>
        ))}
      </RadioGroup>
    );
  }

  if (quizType === "FILL_IN_THE_BLANK") {
    return (
      <Input
        placeholder="Type the missing word or phrase…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="max-w-sm"
      />
    );
  }

  return (
    <Textarea
      placeholder="Write your answer here…"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={4}
      className="resize-none"
    />
  );
}
