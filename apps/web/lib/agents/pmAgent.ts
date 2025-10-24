import { PRD, Idea, ProjectGraph, ResearchReport, PRDSchema } from "../zodSchemas";
import { generateStructured } from "../llm/openai";
import { retrieveHybrid } from "../rag/retriever";

/**
 * PM/PRD Agent
 * Generates Product Requirements Documents from ideas, graphs, and research
 */

export type PMInput = {
  idea: Idea;
  graph: ProjectGraph;
  research?: ResearchReport;
};

export async function generatePRD(input: PMInput): Promise<PRD> {
  return pmAgent.generate(input);
}

export const pmAgent = {
  async generate(input: PMInput): Promise<PRD> {
    // Retrieve PRD best practices from RAG
    let bestPracticesContext = "";
    try {
      console.log("[PM Agent] Retrieving PRD best practices from RAG...");
      const bestPractices = await retrieveHybrid(
        "PRD best practices enterprise requirements document",
        { topK: 5 }
      );

      console.log(`[PM Agent] Retrieved ${bestPractices.length} best practice chunks`);

      if (bestPractices.length > 0) {
        bestPracticesContext = `BEST PRACTICES (follow these strictly):
${bestPractices.map((bp, idx) => `${idx + 1}. ${bp.content}`).join('\n\n')}

`;
      }
    } catch (error) {
      console.warn("[PM Agent] Failed to retrieve best practices from RAG, continuing without them:", error);
      // Continue without best practices if RAG fails
    }

    const systemPrompt = `You are an expert Product Manager creating comprehensive, enterprise-grade Product Requirements Documents (PRDs) suitable for executive review and production launches. You follow the BuildBridge Enterprise PRD Baseline.

${bestPracticesContext}**ENTERPRISE QUALITY GATES (blockers if missing):**
1. **No vague NFRs**: NEVER use "fast", "secure", "robust" → MUST provide numeric targets (e.g., "p95 < 400ms", "99.9% uptime")
2. **Acceptance Criteria**: Every P0 feature MUST have ≥3 measurable acceptance criteria in clear format
3. **Domain Detection**: Detect project domain (generic/health/fintech/marketplace/saas) and apply appropriate overlays
4. **Quantified Metrics**: MUST include numeric targets for activation, retention, error budget (not adjectives!)
5. **Roadmap Dates**: Provide realistic YYYY-MM-DD dates for MVP, beta, phase 2
6. **Risk Register**: ≥3 risks with H/M/L ratings and specific mitigations
7. **Data Model**: ≥3 entities with fields and at least one index per entity
8. **Source Tracking**: Track which sections came from research vs. assumptions

**CRITICAL PRD STRUCTURE:**

**Meta Section (REQUIRED):**
- Detect domain: generic|health|fintech|marketplace|saas based on project description
- Track sources from research (if available)
- Set version and createdAt

**Features (P0 features MUST have ≥3 ACs):**
- Each feature needs: id, name, description, priority, acceptanceCriteria[], dependencies[], moduleIds[]
- Acceptance criteria format: "Given [context], When [action], Then [outcome]" OR measurable conditions
- Example AC: "When user heart rate exceeds 180 BPM for 60 seconds, Then display alert modal within 2 seconds"

**Quantified Metrics (NUMBERS ONLY - NO ADJECTIVES):**
- activationD2: {targetPct: 0.6} (60% of users complete onboarding within 2 days)
- retentionW4: {targetPct: 0.4} (40% of users return in week 4 - REALISTIC!)
- retentionM3: {targetPct: 0.28} (28% of users return in month 3 - REALISTIC!)
- errorBudget: {slo: "p95<400ms", targetAvailability: 0.999}

**Quantified NFRs (NUMBERS, NOT WORDS):**
- availability: 99.9 (percent)
- latencyP95ReadMs: 400
- latencyP95WriteMs: 800
- security: ["RLS", "TLS1.2+", "AES-256"]
- a11y: "WCAG2.1-AA"
- i18n: ["en"]
- offlineSupport: true/false

**Enhanced Safety (if health/wellness/fitness domain):**
- claimsScope: "wellness" (NOT "medical" unless explicitly regulated)
- guardrails: ["No diagnostic claims", "Age 18+ only", "Disclaimer on every screen"]
- escalation: [{condition: "HR > 200 BPM", action: "Show emergency services prompt", slaSeconds: 3}]

**Enhanced Privacy:**
- piiClasses: ["basic", "sensitive"] (or ["financial"], ["health"])
- retentionDays: 730 (2 years default, or specify)
- auditEvents: ["profile_view", "export", "share"]
- compliance: ["GDPR", "CCPA"]

**Roadmap (YYYY-MM-DD dates):**
- mvpFreeze: Calculate realistic date (e.g., 8 weeks from today)
- beta: 2 weeks after MVP freeze
- phase2: 3 months after beta

**Domain Overlays:**
- health: wellness claims only, escalation SLAs, caregiver access, device integrations
- fintech: PCI scope, fraud thresholds, money-movement flows, reconciliation
- marketplace: supply/demand KPIs, take-rate, dispute resolution
- saas: roles/permissions, SSO/SAML, audit trails, data residency

**Output Contract:**
You must produce a valid PRD JSON that conforms to the BuildBridge schema with ALL required enterprise fields.`;

    const userPrompt = `Create a comprehensive, enterprise-grade PRD for the following project:

## Project Title
${input.idea.title}

## Elevator Pitch
${input.idea.pitch}

## Problem Statement
${input.idea.problem}

## Proposed Solution
${input.idea.solution}

## Target Users
${input.idea.targetUsers.length > 0 ? input.idea.targetUsers.join(", ") : "General users"}

${input.idea.userPersonas && input.idea.userPersonas.length > 0 ? `\n## Detailed User Personas\n${input.idea.userPersonas.map(p => `### ${p.name} - ${p.role}\n**Goals:**\n${p.goals.map(g => `- ${g}`).join("\n")}\n**Pain Points:**\n${p.painPoints.map(pp => `- ${pp}`).join("\n")}`).join("\n\n")}` : ""}

${input.idea.competitors && input.idea.competitors.length > 0 ? `\n## Competitive Landscape\n${input.idea.competitors.map(c => `### ${c.name}${c.url ? ` (${c.url})` : ""}\n**Strengths:**\n${c.strengths.map(s => `- ${s}`).join("\n")}\n**Weaknesses:**\n${c.weaknesses.map(w => `- ${w}`).join("\n")}`).join("\n\n")}\n\n**Market Opportunity:** Based on competitor analysis, identify gaps and opportunities for differentiation.` : ""}

## Platforms
${input.idea.platforms.join(", ")}

${input.idea.coreFeatures && input.idea.coreFeatures.length > 0 ? `\n## Desired Core Features\n${input.idea.coreFeatures.map(f => `- ${f}`).join("\n")}` : ""}

${input.idea.successMetrics && input.idea.successMetrics.length > 0 ? `\n## Success Metrics (User Provided)\n${input.idea.successMetrics.map(m => `- ${m}`).join("\n")}\n\nExpand on these with specific targets, baselines, and timeframes where applicable.` : ""}

${input.idea.constraints && input.idea.constraints.length > 0 ? `\n## Constraints & Limitations\n${input.idea.constraints.map(c => `- ${c}`).join("\n")}` : ""}

${input.idea.inspiration && input.idea.inspiration.length > 0 ? `\n## Inspiration\n${input.idea.inspiration.map(i => `- ${i}`).join("\n")}` : ""}

${input.research ? `\n## Research Insights\n${input.research.insights.map(i => `### ${i.topic}\n${i.summary}\n**Key Findings:**\n${i.citations.map(c => `- ${c.snippet} (Source: ${c.source})`).join("\n")}`).join("\n\n")}` : ""}

---

**ENTERPRISE PRD REQUIREMENTS (must pass all quality gates):**

1. **Meta Section**: Detect domain from project description and set: {projectName, version, createdAt, domain, sources}
2. **Features with ACs**: Create 5-10 features. Every P0 feature MUST have ≥3 measurable acceptance criteria
3. **Out of Scope**: List 3-5 things explicitly NOT included in this release
4. **Quantified Metrics** (NUMBERS, not adjectives - ALL REQUIRED):
   - activationD2: {targetPct: 0.5-0.7} - REQUIRED! (% completing onboarding + first action within 2 days)
   - retentionW4: {targetPct: 0.35-0.45} - BE REALISTIC!
   - retentionM3: {targetPct: 0.25-0.30} - NO FANTASY NUMBERS!
   - errorBudget: {slo: "p95<400ms", targetAvailability: 0.999}
   - NEVER omit activationD2 - it's a critical gate!
5. **Quantified NFRs** (actual numbers):
   - availability: 99.9 (number)
   - latencyP95ReadMs: 400 (number)
   - latencyP95WriteMs: 800 (number)
   - security: ["RLS", "TLS1.2+", "AES-256"]
   - a11y: "WCAG2.1-AA"
   - i18n: ["en"] or ["en", "es"]
   - offlineSupport: true/false
6. **Enhanced Safety** (if health/wellness/fintech domain):
   - claimsScope: "wellness"|"informational"|"transactional"|"regulated"
   - guardrails: [list of rules]
   - escalation: [{condition, action, slaSeconds}] with specific SLA times
7. **Enhanced Privacy**:
   - piiClasses: ["basic"|"sensitive"|"financial"|"health"]
   - retentionDays: 730 (or project-specific)
   - auditEvents: ["profile_view", "export", "share", ...]
   - compliance: ["GDPR", "CCPA", ...]
8. **Roadmap** (YYYY-MM-DD format - CRITICAL: Calculate from ${new Date().toISOString().split('T')[0]}):
   - mvpFreeze: ADD 8 weeks to current date (e.g., if today is 2025-10-23, then 2025-12-18)
   - beta: ADD 6 weeks to mvpFreeze date
   - phase2: ADD 2 months to beta date
   - NEVER use 2024 dates! ALWAYS >= 2025!
9. **Risk Register**: ≥3 risks with {risk, impact:"H"|"M"|"L", likelihood:"H"|"M"|"L", mitigation}
10. **Data Model**: ≥3 entities (health apps MUST include Alert, User, Session entities)
    - Each entity: {name, description, keyFields:[]}
    - Health domain: MUST have Alert entity with fields: [id, user_id, ts, type, severity, delivered]

**Acceptance Criteria Format (CRITICAL - provide specific examples):**
- Gherkin: "Given [context], When [action], Then [outcome with timing]"
- Numeric: "When [measurable condition], Then [action] within [time]"
- Examples:
  * "Given new user, When enters valid email/password, Then account created within 2s"
  * "When HR > (220-age)*0.85 for 60s, Then show pause alert within 3s"
  * "Given RPE ≤ 6 for 3 sessions, Then increase volume by 5-10%"

**HEALTH DOMAIN REQUIREMENTS (CRITICAL for health/wellness/fitness apps):**
1. **Claims Scope**: MUST specify "wellness" (NOT "medical device" or "diagnostic")
2. **Safety Thresholds** (NUMERIC with escalation):
   - HR threshold: If HR > (220-age)*0.85 for ≥60s → pause alert
   - Escalation: If HR remains high for ≥180s → stop session, log Alert(severity=high)
   - Fall-risk mode: Auto-select low-impact if fall history
   - Contraindications: Chest pain, recent surgery → show "consult clinician" banner
   - SLA: ≥95% of alerts visible in <3s (NOT 5s!)
3. **Device Integration + Fallback**:
   - Phase 1: Apple Health, Google Fit
   - Phase 2: Fitbit, WHOOP
   - Fallback: No device → RPE prompts + manual logging
4. **Caregiver Permissions** (if mentioned):
   - Invite via email
   - Read-only dashboard (adherence, alerts, trends)
   - Permissions: caregiver sees adherence/alerts ONLY (no medical notes)
5. **Data Model**: MUST include User, Session, Alert, Plan entities
6. **Compliance**: "HIPAA not in scope for v1 unless BA with covered entity. Best practices applied."

**Domain-Specific Overlays:**
- If health/wellness/fitness → apply FULL health requirements above (safety thresholds, devices, caregiver, Alert entity)
- If fintech/payments → PCI scope, fraud thresholds, reconciliation, money-movement flows
- If marketplace → supply/demand KPIs, take-rate, dispute resolution
- If B2B SaaS → roles/permissions (RBAC), SSO/SAML, audit trails, data residency

Generate a production-ready, BuildBridge Enterprise PRD that passes ALL quality gates.`;

    console.log("[PM Agent] Generating PRD with AI...");

    const prd = await generateStructured({
      schema: PRDSchema,
      schemaName: "PRD",
      systemPrompt,
      userPrompt,
      config: {
        temperature: 0.7,
        maxTokens: 16000, // Increased for enterprise-level PRDs
      },
    });

    console.log("[PM Agent] PRD generated successfully with", prd.features.length, "features");

    return prd;
  },
};
