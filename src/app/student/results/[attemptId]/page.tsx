import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db/drizzle_client";
import { attempts, answers, questions, quizzes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { LatexText } from "@/components/quiz/latex_text";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { QuestionOption } from "@/types/quiz";

export default async function ResultsPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;

  const [attempt] = await db.select().from(attempts).where(eq(attempts.id, attemptId));
  if (!attempt) notFound();

  const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, attempt.quizId));
  const attemptAnswers = await db.select().from(answers).where(eq(answers.attemptId, attemptId));
  const quizQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.quizId, attempt.quizId))
    .orderBy(questions.orderIndex);

  const score = attempt.score ?? 0;
  const pct = Math.round(score * 100);
  const correct = attemptAnswers.filter((a) => a.isCorrect).length;
  const total = quizQuestions.length;
  const answerMap = new Map(attemptAnswers.map((a) => [a.questionId, a]));

  function gradeColor(p: number) {
    if (p >= 80) return "text-green-600";
    if (p >= 60) return "text-yellow-600";
    return "text-red-600";
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-8">
      {/* Score summary */}
      <Card className="text-center">
        <CardContent className="py-10 flex flex-col items-center gap-3">
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Your Score</p>
          <p className={`text-6xl font-bold ${gradeColor(pct)}`}>{pct}%</p>
          <p className="text-muted-foreground">{correct} out of {total} correct</p>
          <Badge variant={pct >= 80 ? "default" : pct >= 60 ? "secondary" : "destructive"}>
            {pct >= 80 ? "Excellent" : pct >= 60 ? "Passing" : "Needs improvement"}
          </Badge>
          {quiz && <p className="text-sm text-muted-foreground mt-2">{quiz.title}</p>}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">Answer Review</h2>
        <p className="text-sm text-muted-foreground">See which questions you got right and wrong.</p>
      </div>

      <div className="flex flex-col gap-4">
        {quizQuestions.map((q, i) => {
          const answer = answerMap.get(q.id);
          const isCorrect = answer?.isCorrect ?? false;
          const opts = q.options as QuestionOption[] | null;

          return (
            <Card key={q.id} className={`border-l-4 ${isCorrect ? "border-l-green-500" : "border-l-red-500"}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-start gap-2">
                  <span className="shrink-0 text-muted-foreground">{i + 1}.</span>
                  <span className="font-normal leading-relaxed">
                    {q.hasLatex ? <LatexText text={q.body} /> : q.body}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm">
                {opts ? (
                  <div className="flex flex-col gap-1">
                    {opts.map((opt) => {
                      const isStudentChoice = answer?.studentResponse === opt.label;
                      const isCorrectOption = q.correctAnswer === opt.label;
                      return (
                        <div
                          key={opt.label}
                          className={`px-3 py-1.5 rounded-md flex items-center gap-2 ${
                            isCorrectOption
                              ? "bg-green-50 text-green-800 font-medium"
                              : isStudentChoice && !isCorrect
                              ? "bg-red-50 text-red-800 line-through"
                              : "text-muted-foreground"
                          }`}
                        >
                          <span>{opt.label}.</span>
                          <span>{q.hasLatex ? <LatexText text={opt.text} /> : opt.text}</span>
                          {isCorrectOption && <span className="ml-auto text-xs">✓ correct</span>}
                          {isStudentChoice && !isCorrect && <span className="ml-auto text-xs">your answer</span>}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-xs text-muted-foreground">Your answer</p>
                      <p className={`rounded-md px-3 py-1.5 ${isCorrect ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                        {answer?.studentResponse || <em>No answer given</em>}
                      </p>
                    </div>
                    {!isCorrect && (
                      <>
                        <Separator />
                        <div className="flex flex-col gap-0.5">
                          <p className="text-xs text-muted-foreground">Correct answer</p>
                          <p className="rounded-md px-3 py-1.5 bg-green-50 text-green-800">
                            {q.hasLatex ? <LatexText text={q.correctAnswer} /> : q.correctAnswer}
                          </p>
                        </div>
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex gap-3 pb-8">
        <Button variant="outline" render={<Link href="/student" />}>← Back to Quizzes</Button>
        <Button render={<Link href={`/student/take/${attempt.quizId}`} />}>Retake Quiz</Button>
      </div>
    </div>
  );
}
