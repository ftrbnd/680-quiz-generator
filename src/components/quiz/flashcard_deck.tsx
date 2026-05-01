"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { postCreateFlashcards } from "@/lib/quiz/post_create_flashcards";
import { LatexText } from "@/components/quiz/latex_text";
import type { Flashcard } from "@/lib/quiz/build_flashcards";

type DeckState =
  | { phase: "loading" }
  | { phase: "done"; flashcards: Flashcard[] }
  | { phase: "error"; message: string };

export function FlashcardDeck({
  quizId,
  attemptId,
}: {
  quizId: string;
  attemptId: string;
}) {
  const [state, setState] = useState<DeckState>({ phase: "loading" });
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  useEffect(() => { generate(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function generate() {
    setState({ phase: "loading" });
    const result = await postCreateFlashcards({ quizId, attemptId });
    if (!result.ok) {
      setState({ phase: "error", message: result.message });
      return;
    }
    setState({ phase: "done", flashcards: result.flashcards });
    setRevealed(new Set());
  }

  function toggleReveal(questionId: string) {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  }

  if (state.phase === "loading") {
    return <p className="text-sm text-muted-foreground">Generating flashcards…</p>;
  }

  if (state.phase === "error") {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-destructive">{state.message}</p>
        <Button variant="outline" onClick={generate}>Try again</Button>
      </div>
    );
  }

  if (state.phase !== "done") return null;

  if (state.flashcards.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        You got every question right — no flashcards needed!
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {state.flashcards.length} flashcard{state.flashcards.length !== 1 ? "s" : ""} from your wrong answers. Click a card to reveal the answer.
      </p>
      {state.flashcards.map((card, i) => {
        const isRevealed = revealed.has(card.questionId);
        return (
          <button
            key={card.questionId}
            onClick={() => toggleReveal(card.questionId)}
            className="w-full rounded-2xl border border-border bg-background p-6 text-left shadow-sm transition-colors hover:bg-muted/50"
            aria-expanded={isRevealed}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
              Question {i + 1}
            </p>
            <p className="font-medium">
              {card.hasLatex ? <LatexText text={card.front} /> : card.front}
            </p>
            {isRevealed && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                  Answer
                </p>
                <p className="text-green-700 dark:text-green-400 font-medium">
                  {card.hasLatex ? <LatexText text={card.back} /> : card.back}
                </p>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
