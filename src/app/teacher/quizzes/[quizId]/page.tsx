import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/drizzle_client";
import { quizzes, questions, attempts } from "@/lib/db/schema";
import { eq, count, avg } from "drizzle-orm";
import { LatexText } from "@/components/quiz/latex_text";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DeleteQuizButton } from "./delete_quiz_button";
import type { QuestionOption } from "@/types/quiz";

const DIFFICULTY_COLOR = {
  EASY: "bg-green-100 text-green-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HARD: "bg-red-100 text-red-800",
} as const;

const TYPE_LABEL = {
  MULTIPLE_CHOICE: "Multiple Choice",
  SHORT_ANSWER: "Short Answer",
  FILL_IN_THE_BLANK: "Fill in the Blank",
  READING_COMPREHENSION: "Reading Comprehension",
} as const;

export default async function QuizDetailPage({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  const ownerId = session!.user.id;

  const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, quizId));
  if (!quiz || quiz.ownerId !== ownerId) notFound();

  const quizQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.quizId, quizId))
    .orderBy(questions.orderIndex);

  const [stats] = await db
    .select({ attemptCount: count(attempts.id), avgScore: avg(attempts.score) })
    .from(attempts)
    .where(eq(attempts.quizId, quizId));

  const attemptCount = stats?.attemptCount ?? 0;
  const avgScorePct = stats?.avgScore != null ? Math.round(Number(stats.avgScore) * 100) : null;

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/teacher/quizzes" className="hover:text-foreground transition-colors">← My Quizzes</Link>
          </div>
          <h1 className="text-2xl font-bold mt-1">{quiz.title}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${DIFFICULTY_COLOR[quiz.difficulty]}`}>
              {quiz.difficulty.toLowerCase()}
            </span>
            <Badge variant="secondary" className="text-xs">{TYPE_LABEL[quiz.quizType]}</Badge>
            <span className="text-xs text-muted-foreground">{quizQuestions.length} questions</span>
            {quiz.timeLimitMinutes && (
              <span className="text-xs text-muted-foreground">{quiz.timeLimitMinutes} min</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" render={<Link href={`/api/export?quizId=${quiz.id}`} target="_blank" />}>
            Export PDF
          </Button>
          <DeleteQuizButton quizId={quiz.id} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold">{attemptCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Total Attempts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold">
              {avgScorePct != null ? `${avgScorePct}%` : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Average Score</p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Questions */}
      <div className="flex flex-col gap-2">
        <h2 className="text-base font-semibold">Questions &amp; Answer Key</h2>
        <p className="text-sm text-muted-foreground">Only you can see the correct answers here.</p>
      </div>

      <div className="flex flex-col gap-4">
        {quizQuestions.map((q, i) => {
          const opts = q.options as QuestionOption[] | null;
          return (
            <Card key={q.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-start gap-2">
                  <span className="shrink-0 text-muted-foreground">{i + 1}.</span>
                  <span className="font-normal leading-relaxed">
                    {q.hasLatex ? <LatexText text={q.body} /> : q.body}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm flex flex-col gap-2">
                {opts ? (
                  <div className="flex flex-col gap-1">
                    {opts.map((opt) => (
                      <div
                        key={opt.label}
                        className={`px-3 py-1.5 rounded-md flex items-center gap-2 ${
                          q.correctAnswer === opt.label
                            ? "bg-green-50 text-green-800 font-medium"
                            : "text-muted-foreground"
                        }`}
                      >
                        <span>{opt.label}.</span>
                        <span>{q.hasLatex ? <LatexText text={opt.text} /> : opt.text}</span>
                        {q.correctAnswer === opt.label && (
                          <span className="ml-auto text-xs">✓ correct</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-3 py-1.5 rounded-md bg-green-50 text-green-800 text-sm">
                    <span className="text-xs text-green-700 block mb-0.5">Correct answer</span>
                    {q.hasLatex ? <LatexText text={q.correctAnswer} /> : q.correctAnswer}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
