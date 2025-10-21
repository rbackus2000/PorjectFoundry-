# Project Foundry

**Transform ideas → PRD → Backlog → ERD → UI Spec → Prompt Packs**

Project Foundry is a private tool that converts high-level ideas into production-ready development artifacts. It uses a visual module canvas, AI-powered agents, and a propagation engine to generate PRDs, database schemas, UI specifications, and optimized prompt packs for Cursor, Claude Code, Lovable, and Bolt.

---

## Features

- **Module Canvas**: Drag-and-drop modules with status tracking (in/out/maybe) and dependency visualization
- **AI Agents**: Orchestrated pipeline generating PRD, Backend Spec, Frontend Spec, and UI Spec
- **Research Pipeline**: Query planner, crawler interface, embeddings, and synthesis (stubs ready for integration)
- **Mermaid Diagrams**: Auto-generated flowcharts and ERDs
- **Prompt Packs**: Export ready-to-use prompts for:
  - Cursor (`.cursorrules` format)
  - Claude Code (workflow-optimized)
  - Lovable (frontend-focused)
  - Bolt.new (full-stack prototype)
- **Event-Sourced Reconciliation**: Changes propagate through dependency DAG to regenerate artifacts
- **Invariant Checks**: Cross-artifact validation (FE queries → BE APIs, ERD ↔ PRD features)
- **Observability**: Build log and decision log for transparency

---

## Tech Stack

### Frontend
- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** + design system tokens
- **shadcn/ui** components
- **React Flow** for module canvas
- **Tiptap** for PRD editor (read-only initially)

### Backend
- **Prisma ORM** (SQLite dev, Postgres prod)
- **zod** for schema validation
- **BullMQ** for job queues (requires Redis)

### Infrastructure
- **Supabase**-compatible (optional for production)
- Local dev: SQLite + Redis via Docker

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm or pnpm
- (Optional) Docker for Redis

### Installation

```bash
# Clone or navigate to the repository
cd ProjectFoundry/apps/web

# Install dependencies
npm install

# Set up environment
cp ../../.env.example .env
# Edit .env: DATABASE_URL defaults to SQLite (file:./dev.db)

# Initialize database
npm run gen        # Generate Prisma client
npm run migrate    # Run migrations (or use npm run db:push for dev)

# Start development server
npm run dev
```

Visit `http://localhost:3000`

---

## Project Structure

```
ProjectFoundry/
├── docs/
│   └── ProjectFoundry_Design_Document.md   # Full spec
├── logs/
│   └── build-log.md                        # Build history
├── TASKS.md                                 # Kanban task board
├── .env.example
├── apps/web/
│   ├── app/                                 # Next.js pages
│   │   ├── dashboard/page.tsx
│   │   ├── canvas/page.tsx
│   │   ├── prd/page.tsx
│   │   ├── artifacts/page.tsx
│   │   ├── settings/page.tsx
│   │   └── api/health/route.ts
│   ├── components/ui/                       # shadcn components
│   ├── features/
│   │   ├── canvas/                          # React Flow canvas (TODO: T5)
│   │   └── prd/                             # PRD viewer (TODO: T6)
│   ├── lib/
│   │   ├── zodSchemas.ts                    # All core types
│   │   ├── db/prisma.ts                     # Prisma client
│   │   ├── agents/                          # PM, BE, FE, UI, Research, Orchestrator
│   │   ├── events/                          # Bus, Reconcile, Invariants
│   │   ├── mermaid/                         # Flowchart, ERD builders
│   │   ├── promptpack/                      # Cursor, Claude, Lovable, Bolt builders
│   │   └── jobs/                            # BullMQ (TODO: T11)
│   └── prisma/schema.prisma                 # Database schema
├── design/                                  # Generated outputs
│   └── ui-spec.json
└── figma-plugin/                            # Figma plugin (TODO: T10)
```

---

## Usage

### 1. Create a Project
Navigate to **Settings** and fill in:
- Project Title
- Elevator Pitch
- Target Platforms (Web, iOS, Android)

### 2. Design Your Module Graph
Go to **Canvas** and:
- Add modules from the library
- Set status: `in` (include), `out` (exclude), `maybe` (undecided)
- Draw edges to show dependencies

### 3. Generate Artifacts
Click **"Regenerate"** on the Dashboard to trigger:
1. **Research Agent** (optional): Gathers context
2. **PM Agent**: Generates PRD
3. **Backend Agent**: Defines entities, APIs, jobs
4. **Frontend Agent**: Defines routes, components, state
5. **UI Agent**: Designs system, components, screens
6. **Mermaid**: Builds flowchart + ERD
7. **Prompt Packs**: Exports all 4 formats

### 4. View Artifacts
Visit **Artifacts** to:
- Preview Mermaid diagrams
- Download Prompt Packs
- Copy `ui-spec.json` for Figma plugin

### 5. Review PRD
Go to **PRD** to see the generated Product Requirements Document.

---

## Scripts

```bash
npm run dev          # Start Next.js dev server
npm run build        # Production build
npm run start        # Production server
npm run worker       # Run BullMQ worker (requires Redis)
npm run gen          # Generate Prisma client
npm run migrate      # Run Prisma migrations
npm run db:push      # Push schema (dev)
npm run db:studio    # Open Prisma Studio
```

---

## Architecture

### Event-Sourced Reconciliation

When modules change, the system:
1. Emits `ModuleAdded/Removed/Updated` events
2. Triggers `reconcile()` with dependency order:
   ```
   Research → PRD → BackendSpec → FrontendSpec → UISpec → Mermaid → PromptPacks
   ```
3. Regenerates only affected artifacts
4. Runs invariant checks to ensure consistency

### Agents

All agents are **stubs** returning JSON. To integrate real LLMs:
1. Add your API keys to `.env` (e.g., `OPENAI_API_KEY`)
2. Replace `TODO` sections in `lib/agents/*.ts`
3. Use `zod` schemas to validate LLM outputs

Example (PM Agent):
```typescript
// lib/agents/pmAgent.ts
const prompt = `Generate a PRD for: ${input.idea.title}...`;
const response = await openai.chat.completions.create({ ... });
const prd = PRDSchema.parse(JSON.parse(response.content));
```

---

## Production Deployment

### Database (Supabase)
1. Create a Supabase project
2. Update `.env`:
   ```
   DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public"
   ```
3. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"  // was "sqlite"
     url      = env("DATABASE_URL")
   }
   ```
4. Change `String` fields to `Json` type for `graphData` and `payload`
5. Run `npm run migrate`

### Redis (BullMQ)
1. Deploy Redis (e.g., Upstash, Redis Cloud)
2. Update `.env`:
   ```
   REDIS_URL="redis://your-redis-host:6379"
   ```
3. Start worker: `npm run worker`

### Row-Level Security (RLS)
If using Supabase, enable RLS policies:
```sql
-- Example policy (adjust to your auth)
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own projects"
ON "Project" FOR ALL
USING (auth.uid() = "userId");
```

---

## Configuration

### Environment Variables

See `.env.example`:
```bash
NODE_ENV=development
DATABASE_URL="file:./dev.db"          # SQLite (dev) or Postgres URL (prod)
REDIS_URL="redis://localhost:6379"
# Optional: LLM API keys
# OPENAI_API_KEY=""
# ANTHROPIC_API_KEY=""
```

### Design Tokens

Edit `apps/web/app/globals.css`:
```css
:root {
  --bg: 250 14% 98%;
  --surface: 0 0% 100%;
  --text: 222 47% 11%;
  --primary: 221 83% 53%;
  /* ... */
}
```

---

## Roadmap

- [x] T1-T4: Core infrastructure (Next.js, Prisma, zod, event bus)
- [x] T5a/T5b/T5e: UI shell and basic pages
- [x] T7-T9: Agents, Mermaid, Prompt Packs
- [ ] T5: React Flow canvas with module library
- [ ] T6: Tiptap PRD viewer with regeneration
- [ ] T10: Figma plugin (reads `ui-spec.json`, builds frames)
- [ ] T11: BullMQ job queue for async generation
- [ ] T12: Full documentation + examples
- [ ] T13: Vitest tests for invariants
- [ ] T14: Research pipeline (crawler, embeddings, synthesis)

---

## Contributing

This is a private tool. For team use:
1. Add `.env` with your credentials (do not commit)
2. Follow the task board in `/TASKS.md`
3. Update `/logs/build-log.md` after completing tasks
4. Run invariant tests before pushing

---

## License

Private / Internal Use Only

---

## Support

See `/docs/ProjectFoundry_Design_Document.md` for full specifications.

For issues, check `/logs/build-log.md` for recent changes.
