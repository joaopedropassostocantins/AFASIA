# IAP — Inteligência Artificial Pictórica

## Overview

Proof-of-concept web app for the **Gemma 4 Good Hackathon** (Kaggle/Google DeepMind, May 2026). Demonstrates **JP Algorithm** (regressive planning with topological heuristics) and **Pictorial Artificial Intelligence (IAP)** by João Pedro Pereira Passos. Uses Gemma 4 (via Google Generative AI) for aphasia accessibility support.

## Architecture

pnpm workspace monorepo with:
- **`artifacts/iap-app`** — React + Vite frontend (previewPath: `/`)
- **`artifacts/api-server`** — Express 5 backend (port 8080, proxied under `/api`)
- **`lib/db`** — PostgreSQL + Drizzle ORM schema
- **`lib/api-spec`** — OpenAPI 3.0 spec
- **`lib/api-zod`** — Zod schemas (generated from OpenAPI via Orval)
- **`lib/api-client-react`** — TanStack Query hooks (generated from OpenAPI via Orval)
- **`lib/integrations-gemini-ai`** — Google Gemini AI client wrapper

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (ESM bundle)
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui + Framer Motion
- **Routing**: wouter
- **Data fetching**: TanStack Query (Orval-generated hooks)
- **Charts**: Recharts
- **AI**: Google Generative AI (`@google/genai`); **Gemma 4 31B** via `GEMINI_USER_API_KEY` (direct) for IAP vectors + chat; Replit AI Integrations as fallback (`gemini-2.5-flash`)

## App Modules

### Landing Page (`/`)
- Hero section introducing IAP theory
- 3 module cards with navigation

### Module 1: JP Algorithm (`/algorithm`)
- Regressive planning visualizer
- 3 preset scenarios (Become a Lawyer, Learn Programming, Start a Business)
- Step-by-step plan output with topological distances
- Dependency graph visualization
- API: `POST /api/iap/plan`

### Module 2: Pictorial Communication (`/aphasia`)
- Accessible AAC interface for people with aphasia
- Symbol grid (Emotions, Needs, Actions, Places, People)
- Sentence strip builder
- Gemma 4-powered translation (PT/EN toggle)
- API: `POST /api/iap/pictoric-chat`

### Module 3: Topological Analysis (`/topology`)
- Wasserstein distance visualizer between two knowledge states
- Persistence diagrams via Recharts
- Real-time slider-based exploration (debounced 500ms)
- API: `POST /api/iap/topology`

## Key Backend Routes

- `GET /api/gemini/conversations` — list conversations
- `POST /api/gemini/conversations` — create conversation
- `GET /api/gemini/conversations/:id` — get conversation with messages
- `DELETE /api/gemini/conversations/:id` — delete conversation
- `GET /api/gemini/conversations/:id/messages` — list messages
- `POST /api/gemini/conversations/:id/messages` — send message (SSE streaming)
- `POST /api/gemini/generate-image` — generate image with Gemma
- `POST /api/iap/plan` — run JP Algorithm (regressive planning)
- `POST /api/iap/pictoric-chat` — pictorial → natural language via Gemma 4
- `POST /api/iap/topology` — compute Wasserstein distance + persistence diagrams

## Database Schema

- `conversations` — Gemini conversation sessions
- `messages` — messages within conversations (user/assistant)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (auto-provisioned)
- `AI_INTEGRATIONS_GEMINI_BASE_URL` — Gemini proxy base URL (auto-provisioned via Replit integration)
- `AI_INTEGRATIONS_GEMINI_API_KEY` — Gemini API key (auto-provisioned via Replit integration)
- `PORT` — server port (set by Replit runtime per artifact)

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
