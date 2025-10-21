# Project Foundry — Design Documentation
_A one‑stop document capturing enterprise‑level PRD best practices, backend (Supabase) best practices, frontend best practices, prompt‑engineering best practices, CodeSpring’s inspirations, and the specific architecture & blueprint for your “idea→PRD→MVP” tool._

---

## Table of Contents
1. Enterprise‑Level PRD: Purpose & Best Practices
2. Backend Best Practices for Supabase
3. Frontend Best Practices for Modern Web Apps
4. Prompt‑Engineering Best Practices (OpenAI / GPT‑Style)
5. Comparative Inspiration: CodeSpring Features & Positioning
6. Deeper Research & Analysis Pipeline
7. Your Application Blueprint
8. Appendices & Templates

---

## 1. Enterprise‑Level PRD: Purpose & Best Practices
### Purpose
A Product Requirements Document (PRD) is a blueprint defining **what** to build, **why**, **for whom**, and **how success is measured**. It ensures alignment across product, engineering, design, and leadership teams.

### Best Practices
- Establish the **vision and strategic fit** first.
- Identify **target personas** and **pains/jobs‑to‑be‑done**.
- Define clear **Scope In** / **Scope Out**.
- Every feature must include **acceptance criteria (Given/When/Then)**.
- Include **Non‑Functional Requirements** (NFRs) such as security, scalability, and privacy.
- Maintain a **living document** — update it as research and scope evolve.
- Encourage cross‑functional input from engineering, QA, UX, and PMs.

### PRD Template Outline
| Section | Description |
|----------|-------------|
| Title / Author / Date / Version | Metadata |
| Vision & Strategic Fit | Product goals & business alignment |
| Background & Market Context | Research summary |
| Users / Personas | Who it serves |
| Scope In / Scope Out | Boundaries |
| Features & Acceptance Criteria | Functional details |
| Non‑Functional Requirements | Perf, security, accessibility |
| Analytics / KPIs | Success metrics |
| Dependencies & Risks | External factors |
| Timeline / Milestones | Delivery roadmap |

---

## 2. Backend Best Practices for Supabase
### Overview
Supabase combines Postgres, Auth, Storage, and Realtime APIs — perfect for MVPs that must scale securely.

### Best Practices
- **Enable RLS (Row‑Level Security)** everywhere.
- **Never** expose service-role keys on the frontend.
- Use **policies** and **roles** to isolate tenants or customers.
- Automate **backups** and test **restore workflows**.
- Create **indexes** for filtered columns to prevent RLS slowdowns.
- Use **pgvector** for embeddings and AI integration.
- Audit **API calls** and **auth logs** regularly.
- Separate **dev**, **staging**, and **prod** environments.

### Production Checklist
✅ RLS enabled  
✅ Indexes optimized  
✅ Service role secret hidden  
✅ Backups scheduled  
✅ Schema/role separation  
✅ Monitoring (DB & API latency)  
✅ Controlled REST endpoint exposure  
✅ S3/Storage security validated

---

## 3. Frontend Best Practices for Modern Web Apps
### Core Principles
- Component‑driven architecture (React + Next.js).
- File‑based routing and feature modules.
- Shared **design system** (tokens, typography, color, spacing).
- Use **SSR/SSG** for performance and SEO.
- Accessibility (a11y) baked in from the start.

### Best Practices
- Keep **logic, data, and UI** layers separate.
- Apply **linting, testing, and CI/CD**.
- Version and document your design system.
- Optimize performance: lazy‑loading, caching, and compression.
- Include **metrics** (TTFB, FID, CLS, etc.) and monitor via analytics.

---

## 4. Prompt‑Engineering Best Practices
### Guidelines
- Define **clear roles and goals** in the system prompt.
- Specify **output formats** (JSON schemas preferred).
- Include **examples (few‑shot prompting)** when possible.
- Validate with **schema checks**; regenerate on failure.
- Encourage the model to **cite sources** or admit uncertainty.
- Chain steps: Plan → Reason → Produce → Validate → Summarize.
- Use **function calling** to structure results programmatically.

---

## 5. Comparative Inspiration: CodeSpring Features & Positioning
CodeSpring markets itself as an AI copilot to *plan, design, and build apps*. Key features:
- **AI Mindmaps** — Visual planning of product ideas.  
- **PRD & Technical Documentation generation** — Automated spec writing.  
- **Competitor & Market Research** — Validate ideas and track competitors.  
- **Boilerplate Starter Kits** — Frontend/backend code scaffolds.  
- **Automated Marketing Carousels** — Launch assets from within the platform.  

### How Project Foundry Advances This
- Adds **Graph‑based propagation** — changes sync across PRD, ERD, UI, and prompt exports.  
- Offers **Universal Prompt Packs** for Cursor, Lovable, Bolt, Clause Code, etc.  
- Supports **visual module drag‑and‑drop** mindmaps that remain executable.  
- Includes **real AI research pipeline** with citations.  

---

## 6. Deeper Research & Analysis Pipeline
### Pipeline Overview
1. **Query Generation** — from idea + modules, create structured web queries.  
2. **Crawler & Fetcher** — Playwright gathers content from top ranked results.  
3. **Cleaner & Deduper** — extracts main text, deduplicates by hash.  
4. **Chunk & Embed** — store text chunks in pgvector or Qdrant.  
5. **Categorize** — classify each chunk into Market, Competitors, Risks, Tech Constraints, etc.  
6. **Synthesis** — LLM summarizes each category into structured JSON with `title`, `body`, `confidence`, and `sourceRefs`.  
7. **Fact Check** — verify numeric data and flag low confidence claims.  
8. **Integrate to PRD** — PRD sections require at least one source reference.  
9. **Monitor Competitors** — optional periodic re‑crawl to refresh insights.  

### Example Research JSON
```json
{
  "sectionId": "market‑size",
  "title": "Market Size for AI SaaS Tools 2025",
  "body": "Analysts project ~$4.3B TAM with 22% CAGR.",
  "sourceRefs": ["url123","url456"],
  "confidence": "high"
}
```

---

## 7. Your Application Blueprint
### System Overview
**Project Foundry** converts ideas → PRD → Backlog → ERD → UI Spec → Prompt Packs.  
Each artifact lives within a `ProjectGraph` and is automatically updated when any piece changes.

### Agent Framework
- **Orchestrator Agent** — runs full pipeline, validates outputs.  
- **PM/PRD Agent** — produces research‑backed PRDs.  
- **Backend Agent** — defines entities, relations, APIs.  
- **Frontend Agent** — maps routes, pages, components.  
- **UI Agent** — builds UI spec JSON for Figma plugin.  
- **Research Agent** — runs pipeline described above.

### Module Graph Example
```ts
type ProjectGraph = {
  id: string;
  meta: { title: string; pitch: string; platforms: string[] };
  modules: Module[];
  prd: PRD;
  backend: BackendSpec;
  frontend: FrontendSpec;
  ui: UISpec;
  prompts: PromptPack;
  version: number;
};
```

### Propagation Workflow
1. User drags module → event fired.  
2. Orchestrator marks dependent artifacts dirty.  
3. Reconciliation regenerates only necessary agents.  
4. Validation ensures cross‑artifact consistency.  
5. Mermaid diagrams auto‑update.  
6. Prompt Packs re‑exported instantly.

### Execution Timeline
| Week | Deliverable |
|------|--------------|
| 1 | DB + Canvas + Module Library |
| 2 | Agents (PM, BE, FE, UI) wired |
| 3 | Prompt Pack export |
| 4 | Figma plugin integration |
| 5 | Backlog + acceptance criteria |
| 6 | Polish + documentation |

---

## 8. Appendices & Templates
### Supabase Production Checklist
- RLS on all tables  
- Index heavy queries  
- Hide service role keys  
- Backups & restore tested  
- API exposure reviewed  
- Metrics & logging active  

### Prompt Pack Wrapper Example (Cursor)
```md
# ROLE
You are a senior full‑stack engineer in Cursor. Follow the plan strictly.

# PROJECT CONTEXT
{ProjectGraph JSON}

# PLAN
1. Create files as listed.
2. Implement API routes per spec.
3. Follow acceptance criteria.

# CONSTRAINTS
TypeScript strict, Next.js App Router, Prisma with Postgres.
```

---

### End of Document
**Project Foundry: The evolution of CodeSpring — idea to PRD to MVP, automatically.**
