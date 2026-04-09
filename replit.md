# IAP — Inteligência Artificial Pictórica

## Overview

Proof-of-concept web app for the **Gemma 4 Good Hackathon** (Kaggle/Google DeepMind, May 2026). Demonstrates **JP Algorithm** (regressive planning with topological heuristics) and **Pictorial Artificial Intelligence (IAP)** by João Pedro Pereira Passos (UFT, 2024). Uses **Gemma 4 31B** (`gemma-4-31b-it`) for IAP vector generation and all chat endpoints. Three pictogram atlases: Noun 3k (3,443 icons), Atlas CAA (300 icons), Disfasia (38 ARASAAC icons).

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
- **AI**: **Gemma 4 31B** (`gemma-4-31b-it`) via `GEMINI_USER_API_KEY` (direct, Google AI Studio) for all IAP vectors + chat; Replit AI Integrations as fallback (`gemini-2.5-flash`)

## App Modules

### Landing Page (`/`)
- Hero section introducing IAP theory
- 6 module cards with navigation (Algorithm, Aphasia, Topology, Noun Atlas, CAA Atlas, Disfasia, Compare, Appendice)

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
- Gemma 4 31B-powered translation (PT/EN toggle)
- API: `POST /api/iap/pictoric-chat`

### Module 3: Topological Analysis (`/topology`)
- Wasserstein distance visualizer between two knowledge states
- Persistence diagrams via Recharts
- Real-time slider-based exploration (debounced 500ms)
- API: `POST /api/iap/topology`

### Module 4: Noun Project Atlas (`/noun-atlas`)
- 3,443 icons with 12D IAP vectors (Gemma 4 31B)
- 2D MDS canvas scatter plot with category coloring
- Neighbor graph and Wasserstein heatmap
- API: `GET /api/iap/atlas/noun`

### Module 5: Atlas CAA (`/caa-atlas`)
- 300 CAA-specific icons (communication, speech, language, family, support)
- 12D IAP vectors computed by Gemma 4 31B
- Local PNGs in `artifacts/iap-app/public/icons/caa/`
- API: `GET /api/iap/atlas/caa`

### Module 6: Atlas Disfasia (`/disfasia`)
- 38 ARASAAC real pictograms (CC BY-NC-SA)
- 5 categories: fluencia, sequencia, emocao, espaco, comunicacao
- 12D IAP vectors via Gemma 4 31B (cached in `disfasia_gemini_cache.json`)
- Interactive grid + neighbor visualization
- API: `GET /api/iap/atlas/disfasia`

### Module 7: Compare Atlas (`/compare-atlas`)
- Side-by-side comparison of all 3 atlases (Disfasia 38, CAA 300, Noun 3k)
- Atlas metrics endpoint: `GET /api/iap/atlas-metrics`
- Displays MDS stress, Wasserstein mean/max, lambda1/lambda2, category counts

### Module 8: Apêndice Científico (`/appendice`)
- 5-section scientific appendix explaining IAP as non-probabilistic topological AI
- Comparison table: LLMs vs IAP
- Explains persistence diagrams, Wasserstein metric, aphasia as test case

## Key Backend Routes

- `GET /api/gemini/conversations` — list conversations
- `POST /api/gemini/conversations` — create conversation
- `GET /api/gemini/conversations/:id` — get conversation with messages
- `DELETE /api/gemini/conversations/:id` — delete conversation
- `GET /api/gemini/conversations/:id/messages` — list messages
- `POST /api/gemini/conversations/:id/messages` — send message (SSE streaming)
- `POST /api/iap/plan` — run JP Algorithm (regressive planning)
- `POST /api/iap/pictoric-chat` — pictorial → natural language via Gemma 4 31B
- `POST /api/iap/topology` — compute Wasserstein distance + persistence diagrams
- `GET /api/iap/atlas/noun` — Noun 3k atlas data (3,443 icons)
- `GET /api/iap/atlas/caa` — Atlas CAA data (300 icons)
- `GET /api/iap/atlas/disfasia` — Disfasia atlas data (38 ARASAAC icons)
- `GET /api/iap/atlas-metrics` — comparative metrics across all 3 atlases

## Data Files (`artifacts/api-server/data/`)

- `noun_atlas_data.json` — 3,443 Noun Project icons with 12D vectors + MDS coords
- `caa_atlas_data.json` — 300 CAA icons with 12D Gemma 4 31B vectors + MDS coords
- `caa_gemini_cache.json` — raw Gemma 4 31B responses for CAA icons
- `disfasia_atlas_data.json` — 38 ARASAAC icons with MDS coords + neighbors
- `disfasia_gemini_cache.json` — 38 actual 12D Gemma 4 31B vectors for disfasia icons
- `atlas_data.json` — legacy atlas data

## Kaggle Notebook

- **`disfasia_iap_kaggle.ipynb`** — Hackathon submission notebook (root of repo)
  - 12 cells, ~58KB, pure Python (no ripser/persim/tqdm/networkx)
  - Dependencies: `google-generativeai`, `numpy`, `scipy`, `scikit-learn`, `matplotlib`, `Pillow`, `requests`
  - H0 persistence: numpy gaps; Wasserstein: `scipy.optimize.linear_sum_assignment`; MDS: `sklearn.manifold.MDS`
  - 38 pre-computed Gemma 4 31B vectors as offline fallback
  - GitHub branch: `disfasia`

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
- `GEMINI_USER_API_KEY` — Gemma 4 31B API key (Google AI Studio, for IAP vectors + chat)
- `AI_INTEGRATIONS_GEMINI_BASE_URL` — Gemini proxy base URL (auto-provisioned via Replit integration)
- `AI_INTEGRATIONS_GEMINI_API_KEY` — Gemini API key (auto-provisioned via Replit integration)
- `PORT` — server port (set by Replit runtime per artifact)
- `NOUN_PROJECT_KEY` / `NOUN_PROJECT_SECRET` — Noun Project API credentials

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
