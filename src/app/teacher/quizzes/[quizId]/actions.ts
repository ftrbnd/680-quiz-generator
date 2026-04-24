"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/drizzle_client";
import { quizzes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function deleteQuiz({ quizId }: { quizId: string }): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const deleted = await db
    .delete(quizzes)
    .where(and(eq(quizzes.id, quizId), eq(quizzes.ownerId, session.user.id)))
    .returning();

  if (deleted.length === 0) throw new Error("Quiz not found or not authorized");
}
