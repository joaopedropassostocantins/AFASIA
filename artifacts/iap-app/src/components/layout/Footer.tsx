import React from "react";

export function Footer() {
  return (
    <footer className="border-t border-border/40 py-6 md:py-0">
      <div className="container max-w-screen-2xl mx-auto flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row px-4 md:px-8 text-center md:text-left">
        <p className="text-xs text-muted-foreground leading-loose text-balance">
          Kaggle × Google DeepMind — Gemma 4 Good Hackathon 2026 | João Pedro Pereira Passos, UFT
        </p>
        <p className="text-xs text-muted-foreground">
          Orientação técnica: Claude (Anthropic)
        </p>
      </div>
    </footer>
  );
}
