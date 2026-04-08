import React from "react";
import { Github, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/40 py-6 md:py-0">
      <div className="container max-w-screen-2xl mx-auto flex flex-col items-center justify-between gap-4 md:h-auto md:min-h-16 md:py-4 md:flex-row px-4 md:px-8 text-center md:text-left">
        <p className="text-xs text-muted-foreground leading-loose text-balance">
          Kaggle × Google DeepMind — Gemma 4 Good Hackathon 2026 | João Pedro Pereira Passos, UFT
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-3 text-xs text-muted-foreground">
          <a
            href="mailto:joaopedro.passos@mail.uft.edu.br"
            className="flex items-center gap-1.5 hover:text-primary transition-colors"
          >
            <Mail className="h-3.5 w-3.5" />
            joaopedro.passos@mail.uft.edu.br
          </a>
          <span className="hidden sm:inline text-border">|</span>
          <a
            href="https://github.com/joaopedropassostocantins/AFASIA"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-primary transition-colors"
          >
            <Github className="h-3.5 w-3.5" />
            GitHub
          </a>
          <span className="hidden sm:inline text-border">|</span>
          <span>Orientação técnica: Claude (Anthropic)</span>
        </div>
      </div>
    </footer>
  );
}
