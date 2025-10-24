# BuildBridge Enterprise PRD System

## Overview

BuildBridge now implements an enterprise-grade PRD generation system that meets rigorous quality standards suitable for production launches and executive review. This system follows the **BuildBridge Enterprise Baseline** specification with quantified requirements, automated quality gates, and dual JSON+Markdown output.

## ✅ Implementation Status

### Completed Features

#### 1. **Enhanced JSON Schema** (lib/zodSchemas.ts)
- ✅ **PRDMetaSchema**: Domain detection, version tracking, source citations
- ✅ **PRDFeatureSchema**: Enhanced features with acceptance criteria (≥3 for P0)
- ✅ **PRDMetricsSchema**: Quantified activation/retention metrics with realistic targets
- ✅ **PRDEnhancedNFRSchema**: Numeric NFRs (availability, latency, security)
- ✅ **PRDEnhancedSafetySchema**: Claims scope, guardrails, escalation SLAs
- ✅ **PRDEnhancedPrivacySchema**: PII classification, retention days, audit events
- ✅ **PRDRoadmapSchema**: YYYY-MM-DD dates for MVP, beta, phase 2

#### 2. **Quality Gates Validator** (lib/validation/prdQualityGates.ts)
Automated validation that blocks PRD finalization if any critical gate fails:

- ✅ **Meta.Version**: Semver format required
- ✅ **NFR.Quantified**: Must have numeric values (no adjectives like "fast", "secure")
- ✅ **Features.AcceptanceCriteria**: All P0 features need ≥3 ACs
- ✅ **Metrics.Quantified**: Numeric targets for activation, retention, error budget
- ✅ **Metrics.Realistic**: Flags unrealistic targets (e.g., 80% month-3 retention)
- ✅ **Roadmap.Dates**: YYYY-MM-DD format, future dates, beta after MVP
- ✅ **Risks.Count**: Minimum 3 risks with H/M/L ratings and mitigations
- ✅ **DataModel.Count**: Minimum 3 entities with fields

Usage:
```typescript
import { validatePRDQualityGates, formatQualityGateReport } from "@/lib/validation/prdQualityGates";

const report = validatePRDQualityGates(prd);
console.log(formatQualityGateReport(report));

if (!report.passed) {
  throw new Error("PRD failed quality gates");
}
```

#### 3. **Enterprise PM Agent** (lib/agents/pmAgent.ts)
Enhanced prompts enforce enterprise requirements:

- ✅ Domain detection (generic/health/fintech/marketplace/saas)
- ✅ Quantified metrics with realistic targets (no fantasy numbers)
- ✅ Features with measurable acceptance criteria
- ✅ Numeric NFRs (latency in ms, availability in %, not words)
- ✅ Safety escalation with SLA times
- ✅ Privacy with retention policies
- ✅ Roadmap with calculated dates
- ✅ Risk register with mitigations
- ✅ Out of scope items

#### 4. **Markdown Export** (lib/export/prdMarkdown.ts)
Dual output contract: PRD JSON + PRD.md

```typescript
import { exportPRDToMarkdown } from "@/lib/export/prdMarkdown";

const markdown = exportPRDToMarkdown(prd);
// Save to file or display to user
```

#### 5. **Version Management** (lib/jobs/worker.ts, app/api/*/route.ts)
- ✅ Auto-increment version on each regeneration (1.0 → 1.1 → 1.2)
- ✅ Set lastUpdated to current ISO date
- ✅ Fixed across all generation routes

## 📋 PRD Schema Structure

### Core Fields (Backward Compatible)
```typescript
{
  title: string,
  version: string,           // "1.0", "1.1", etc.
  lastUpdated: string,       // ISO-8601 date
  overview: string,
  problemStatement: string,
  goals: string[],
  nonGoals: string[],
  userPersonas: Persona[],
  features: Feature[],
  // ... other legacy fields
}
```

### Enterprise Fields (New)
```typescript
{
  // Meta section - domain detection and source tracking
  meta: {
    projectName: string,
    version: string,
    createdAt: string,       // ISO-8601
    domain: "generic" | "health" | "fintech" | "marketplace" | "saas",
    sources: string[]        // URLs or doc IDs from RAG
  },

  // Enhanced features with acceptance criteria
  features: [{
    id: string,
    name: string,
    description: string,
    priority: "P0" | "P1" | "P2" | "P3",
    acceptanceCriteria: string[],  // ≥3 for P0 features
    dependencies: string[],
    moduleIds: string[]
  }],

  // Out of scope items
  outOfScope: string[],

  // Quantified metrics (NUMBERS, not adjectives)
  metrics: {
    activationD2: { targetPct: 0.6, baseline: 0.0 },  // 60% target
    retentionW4: { targetPct: 0.4, baseline: 0.0 },   // 40% target (realistic!)
    retentionM3: { targetPct: 0.28, baseline: 0.0 },  // 28% target (realistic!)
    errorBudget: { slo: "p95<400ms", targetAvailability: 0.999 }
  },

  // Quantified NFRs (actual numbers)
  nfr: {
    availability: 99.9,           // percent
    latencyP95ReadMs: 400,        // milliseconds
    latencyP95WriteMs: 800,       // milliseconds
    security: ["RLS", "TLS1.2+", "AES-256"],
    a11y: "WCAG2.1-AA",
    i18n: ["en", "es"],
    offlineSupport: true
  },

  // Enhanced safety with escalation
  safety: {
    claimsScope: "wellness" | "informational" | "transactional" | "regulated",
    guardrails: string[],
    escalation: [{
      condition: string,
      action: string,
      slaSeconds: number
    }]
  },

  // Enhanced privacy with retention
  privacy: {
    piiClasses: ["basic", "sensitive", "financial", "health"],
    retentionDays: 730,      // 2 years
    auditEvents: ["profile_view", "export", "share"],
    compliance: ["GDPR", "CCPA", "HIPAA"]
  },

  // Roadmap with dates
  roadmap: {
    mvpFreeze: "2025-12-18",  // YYYY-MM-DD
    beta: "2026-01-01",       // YYYY-MM-DD
    phase2: "2026-04-01",     // YYYY-MM-DD
    milestones: Milestone[]
  }
}
```

## 🎯 Quality Gates (Enforced)

### Critical Gates (Block merge if failed)

1. **No Vague NFRs**
   - ❌ "The app should be fast and secure"
   - ✅ "p95 latency < 400ms, 99.9% uptime, TLS 1.2+, AES-256"

2. **P0 Features Need ACs**
   - Every P0 feature must have ≥3 measurable acceptance criteria
   - Format: Gherkin or "When X for Y, Then Z"
   - Example: "When user heart rate > 180 BPM for 60s, Then show alert within 2s"

3. **Quantified Metrics**
   - activationD2, retentionW4, retentionM3 must be numbers (0-1)
   - Realistic targets enforced (warns if retentionW4 > 0.5)

4. **Roadmap Dates**
   - YYYY-MM-DD format required
   - Must be in the future
   - Beta must be after MVP freeze

5. **Risk Register**
   - Minimum 3 risks
   - Each with H/M/L impact and likelihood
   - Each with specific mitigation

6. **Data Model**
   - Minimum 3 entities
   - Each with fields and indices

## 🔧 Domain Overlays

The system detects project domain and applies appropriate overlays:

### Health (health, wellness, fitness)
- Claims scope: "wellness" (not medical)
- Escalation SLAs for safety conditions
- Device integrations (Apple Health, Google Fit)
- Caregiver access considerations

### Fintech (payments, banking, investing)
- PCI compliance scope
- Fraud thresholds and monitoring
- Money-movement flows
- Reconciliation requirements

### Marketplace (e-commerce, two-sided platforms)
- Supply/demand KPIs
- Take-rate and fees
- Dispute resolution flows

### SaaS (B2B, enterprise)
- Roles and permissions (RBAC)
- SSO/SAML integration
- Audit trails
- Data residency options

## 📊 Realistic Metric Targets

Based on industry benchmarks, BuildBridge enforces realistic targets:

| Metric | Realistic Range | Unrealistic | Notes |
|--------|----------------|-------------|-------|
| Activation (D2) | 50-70% | >80% | Depends on onboarding friction |
| Retention (W4) | 35-45% | >50% | Very good apps reach 40-45% |
| Retention (M3) | 25-30% | >35% | Excellent if 28%+ |
| Availability | 99.0-99.99% | 100% | Allow for error budget |
| Read Latency (p95) | <400ms | "fast" | Numeric only |
| Write Latency (p95) | <800ms | "quick" | Numeric only |

## 🚀 Usage Examples

### Generate PRD with Quality Gates
```typescript
import { generatePRD } from "@/lib/agents/pmAgent";
import { validatePRDQualityGates } from "@/lib/validation/prdQualityGates";

const prd = await generatePRD({ idea, graph, research });

// Validate against quality gates
const report = validatePRDQualityGates(prd);

if (!report.passed) {
  console.error("PRD failed quality gates:", report.results);
  // Fix issues or regenerate
} else {
  console.log(`PRD passed with score ${report.score}/100`);
  // Proceed with saving
}
```

### Export to Markdown
```typescript
import { exportPRDToMarkdown } from "@/lib/export/prdMarkdown";

const markdown = exportPRDToMarkdown(prd);

// Save to file system
fs.writeFileSync(`${projectId}-PRD.md`, markdown);
```

### Check Specific Gate
```typescript
const report = validatePRDQualityGates(prd);

const nfrGate = report.results.find(r => r.gate === "NFR.Quantified");
if (!nfrGate?.passed) {
  console.error("NFRs are not quantified:", nfrGate.message);
}
```

## 📝 Next Steps (Future Enhancements)

### Phase 2: Code Generation from PRD
- [ ] Backend scaffolding (routes from P0 features)
- [ ] Frontend component stubs (pages from user stories)
- [ ] Database migrations (from data model)
- [ ] Test stubs (from acceptance criteria)
- [ ] Observability dashboards (from NFRs)

### Phase 3: CI/CD Integration
- [ ] `npm run prd:check` - Run quality gates in CI
- [ ] `npm run prd:new` - CLI to draft new PRD
- [ ] `npm run gen` - Codegen from PRD
- [ ] Block PRs that fail quality gates

### Phase 4: Invariant Checks
- [ ] Feature ↔ API: Every P0 feature has ≥1 API route
- [ ] AC ↔ Tests: Each AC yields a test stub
- [ ] Entity usage: Every entity referenced by ≥1 feature
- [ ] NFR ↔ Monitor: NFR metrics exist in monitoring config

## 🎓 Best Practices

### Writing Good Acceptance Criteria
```
✅ Good:
"Given a user with premium subscription, When they view a live class with >50 concurrent viewers, Then video quality degrades gracefully to 720p within 5 seconds to maintain <2s latency"

❌ Bad:
"Video should work well under load"
```

### Setting Realistic Metrics
```
✅ Good:
retentionW4: { targetPct: 0.42 }  // 42% is excellent for new apps

❌ Bad:
retentionW4: { targetPct: 0.80 }  // 80% is fantasy
```

### Defining Safety Escalations
```
✅ Good:
{
  condition: "Heart rate > 200 BPM for 60 seconds",
  action: "Display emergency services prompt with one-tap 911 dial",
  slaSeconds: 3
}

❌ Bad:
{
  condition: "High heart rate",
  action: "Show warning",
  slaSeconds: null
}
```

## 🔗 Related Files

- **Schema:** `lib/zodSchemas.ts` (lines 201-356)
- **PM Agent:** `lib/agents/pmAgent.ts`
- **Quality Gates:** `lib/validation/prdQualityGates.ts`
- **Markdown Export:** `lib/export/prdMarkdown.ts`
- **Worker (versioning):** `lib/jobs/worker.ts`
- **This Document:** `docs/buildbridge_prd_enterprise.md`

## 📚 References

- BuildBridge Enterprise PRD Baseline (original spec)
- Google PRD Template (best practices)
- Airbnb Engineering Standards
- Asana Product Specs

---

*Generated by BuildBridge AI - Enterprise PRD System v1.0*
