import Link from "next/link";
import { db } from "@/lib/db/drizzle_client";
import { quizzes, questions } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

export default async function StudentHomePage() {
  const rows = await db
    .select({ quiz: quizzes, questionCount: count(questions.id) })
    .from(quizzes)
    .leftJoin(questions, eq(questions.quizId, quizzes.id))
    .groupBy(quizzes.id)
    .orderBy(quizzes.createdAt);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Available Quizzes</h1>
        <p className="text-muted-foreground text-sm mt-1">{rows.length} quiz{rows.length !== 1 ? "zes" : ""} available</p>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center border rounded-xl bg-muted/30">
          <p className="text-muted-foreground">No quizzes available yet. Check back soon!</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map(({ quiz, questionCount }) => (
            <Card key={quiz.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-snug">{quiz.title}</CardTitle>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${DIFFICULTY_COLOR[quiz.difficulty]}`}>
                    {quiz.difficulty.toLowerCase()}
                  </span>
                </div>
                <CardDescription className="text-xs">
                  {TYPE_LABEL[quiz.quizType]} · {questionCount} question{questionCount !== 1 ? "s" : ""}
                  {quiz.timeLimitMinutes ? ` · ${quiz.timeLimitMinutes} min` : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1" />
              <CardFooter>
                <Button className="w-full" render={<Link href={`/student/take/${quiz.id}`} />}>
                  Start Quiz →
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
