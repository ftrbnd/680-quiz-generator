import type { ComponentProps } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function getFlashcardsCreateHref(quizId: string, attemptId: string) {
  return `/student/flashcards/create?quizId=${encodeURIComponent(quizId)}&attemptId=${encodeURIComponent(attemptId)}`;
}

type CreateFlashcardsButtonProps = {
  quizId: string;
  attemptId: string;
} & Pick<ComponentProps<typeof Button>, "variant" | "size" | "className">;

export function CreateFlashcardsButton({
  quizId,
  attemptId,
  variant = "secondary",
  size,
  className,
}: CreateFlashcardsButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      render={<Link href={getFlashcardsCreateHref(quizId, attemptId)} />}
    >
      Create flashcards
    </Button>
  );
}
