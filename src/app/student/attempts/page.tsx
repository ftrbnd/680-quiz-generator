import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { listStudentAttemptsWithStats } from "@/services/quiz_service";
import { Button } from "@/components/ui/button";
import { CreateFlashcardsButton } from "@/components/quiz/create_flashcards_button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const TYPE_LABEL: Record<string, string> = {
  MULTIPLE_CHOICE: "Multiple Choice",
  SHORT_ANSWER: "Short Answer",
  FILL_IN_THE_BLANK: "Fill in the Blank",
  READING_COMPREHENSION: "Reading Comprehension",
};

const DIFFICULTY_COLOR: Record<string, string> = {
  EASY: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  MEDIUM: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200",
  HARD: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

function scoreTone(pct: number) {
  if (pct >= 80) return "text-green-600 dark:text-green-400";
  if (pct >= 60) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

export default async function StudentAttemptsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/login");

  const { rows, stats } = await listStudentAttemptsWithStats({ studentId: session.user.id });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My attempts</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Review past quiz submissions and how you are trending overall.
          </p>
        </div>
        <Button variant="outline" size="sm" render={<Link href="/student" />}>
          ← Available quizzes
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average score</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {stats.averageScorePercent != null ? `${stats.averageScorePercent}%` : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Across {stats.submittedWithScore} scored attempt{stats.submittedWithScore !== 1 ? "s" : ""}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Best score</CardDescription>
            <CardTitle className={`text-2xl tabular-nums ${stats.bestScorePercent != null ? scoreTone(stats.bestScorePercent) : ""}`}>
              {stats.bestScorePercent != null ? `${stats.bestScorePercent}%` : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Highest percentage on any attempt</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total attempts</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{stats.totalAttempts}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">All submitted sessions</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Quizzes tried</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{stats.uniqueQuizzesAttempted}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Distinct quizzes you opened</CardContent>
        </Card>
      </div>

      {rows.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center text-muted-foreground">
            <p>You have not submitted any quizzes yet.</p>
            <Button className="mt-4" render={<Link href="/student" />}>
              Browse quizzes
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">History</h2>
          <ul className="flex flex-col gap-2">
            {rows.map((row) => {
              const pct = row.score != null ? Math.round(row.score * 100) : null;
              const when = row.submittedAt ?? row.startedAt;
              const dateLabel = when.toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              });

              return (
                <li key={row.attemptId}>
                  <Card className="transition-colors hover:bg-muted/40">
                    <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-4">
                      <div className="flex flex-col gap-1 min-w-0">
                        <p className="font-medium leading-snug truncate">{row.quizTitle}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>{TYPE_LABEL[row.quizType] ?? row.quizType}</span>
                          <span>·</span>
                          <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${DIFFICULTY_COLOR[row.difficulty] ?? ""}`}>
                            {row.difficulty.toLowerCase()}
                          </Badge>
                          <span>·</span>
                          <span>{row.questionCount} question{row.questionCount !== 1 ? "s" : ""}</span>
                          <span>·</span>
                          <span>{row.submittedAt ? "Submitted" : "Started"} {dateLabel}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        {pct != null ? (
                          <span className={`text-xl font-semibold tabular-nums ${scoreTone(pct)}`}>{pct}%</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">No score</span>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {row.submittedAt && (
                            <>
                              <Button size="sm" variant="secondary" render={<Link href={`/student/results/${row.attemptId}`} />}>
                                Review
                              </Button>
                              <CreateFlashcardsButton
                                quizId={row.quizId}
                                attemptId={row.attemptId}
                                size="sm"
                                variant="outline"
                              />
                            </>
                          )}
                          <Button size="sm" variant="outline" render={<Link href={`/student/take/${row.quizId}`} />}>
                            Retake
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
