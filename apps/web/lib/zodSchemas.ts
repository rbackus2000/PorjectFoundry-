import { z } from "zod";

/**
 * Core Schemas for BuildBridge
 * These schemas define the structure of all data flowing through the system
 */

// ============================================================================
// MODULE & GRAPH SCHEMAS
// ============================================================================

export const ModuleStatusSchema = z.enum(["in", "out", "maybe"]);
export type ModuleStatus = z.infer<typeof ModuleStatusSchema>;

export const ModuleNodeSchema = z.object({
  id: z.string(),
  type: z.string(), // "feature", "integration", "infrastructure", etc.
  label: z.string(),
  status: ModuleStatusSchema,
  description: z.string().nullable(),
  position: z.object({ x: z.number(), y: z.number() }).nullable(),
});
export type ModuleNode = z.infer<typeof ModuleNodeSchema>;

export const ModuleEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  label: z.string().nullable(),
});
export type ModuleEdge = z.infer<typeof ModuleEdgeSchema>;

export const ProjectGraphSchema = z.object({
  nodes: z.array(ModuleNodeSchema),
  edges: z.array(ModuleEdgeSchema),
});
export type ProjectGraph = z.infer<typeof ProjectGraphSchema>;

// ============================================================================
// IDEA SCHEMA (Enhanced for comprehensive PRD generation)
// ============================================================================

export const UserPersonaSchema = z.object({
  name: z.string(),
  role: z.string(),
  goals: z.array(z.string()),
  painPoints: z.array(z.string()),
});
export type UserPersona = z.infer<typeof UserPersonaSchema>;

export const CompetitorSchema = z.object({
  name: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  url: z.string().nullable(),
});
export type Competitor = z.infer<typeof CompetitorSchema>;

export const IdeaSchema = z.object({
  title: z.string(),
  pitch: z.string(), // One-liner elevator pitch
  problem: z.string(), // Detailed problem statement
  solution: z.string(), // How the solution addresses the problem
  targetUsers: z.array(z.string()), // Simple list for backward compatibility
  userPersonas: z.array(UserPersonaSchema).nullable(), // Detailed personas
  platforms: z.array(z.string()), // ["Web", "iOS", "Android"]
  coreFeatures: z.array(z.string()),
  competitors: z.array(CompetitorSchema).nullable(), // Competitive landscape
  constraints: z.array(z.string()).nullable(), // Budget, timeline, technical constraints
  inspiration: z.array(z.string()).nullable(), // URLs or product names for inspiration
  successMetrics: z.array(z.string()).nullable(), // How to measure success (KPIs)
});
export type Idea = z.infer<typeof IdeaSchema>;

// ============================================================================
// PRD SCHEMA (Enhanced with enterprise best practices)
// ============================================================================

// Flattened section schema (no recursion - OpenAI doesn't support z.lazy())
export const PRDSectionSchema = z.object({
  heading: z.string(),
  content: z.string(), // Markdown or plain text
});
export type PRDSection = z.infer<typeof PRDSectionSchema>;

export const PRDPersonaSchema = z.object({
  name: z.string(),
  role: z.string(),
  goals: z.array(z.string()),
  painPoints: z.array(z.string()),
  useCases: z.array(z.string()),
});
export type PRDPersona = z.infer<typeof PRDPersonaSchema>;

export const PRDCompetitorSchema = z.object({
  name: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  differentiators: z.array(z.string()), // How we differ
});
export type PRDCompetitor = z.infer<typeof PRDCompetitorSchema>;

export const PRDSuccessMetricSchema = z.object({
  metric: z.string(),
  target: z.string(),
  baseline: z.string().nullable(),
  timeframe: z.string().nullable(),
});
export type PRDSuccessMetric = z.infer<typeof PRDSuccessMetricSchema>;

export const PRDMilestoneSchema = z.object({
  name: z.string(),
  description: z.string(),
  targetDate: z.string().nullable(), // Relative like "Week 4" or "Q2 2024"
  dependencies: z.array(z.string()).nullable(),
});
export type PRDMilestone = z.infer<typeof PRDMilestoneSchema>;

// Enterprise-level PRD sections (all fields nullable for flexible AI generation)
export const PRDSafetyGuardrailsSchema = z.object({
  scopeOfClaims: z.string().nullable(), // Wellness vs medical claims boundary
  contraindications: z.array(z.string()).nullable(), // What triggers stop conditions
  riskMitigation: z.array(z.string()).nullable(), // How we prevent harm
  escalationPath: z.string().nullable(), // When/how to escalate to human review
  humanReview: z.string().nullable(), // What requires PT/clinician review
}).nullable();
export type PRDSafetyGuardrails = z.infer<typeof PRDSafetyGuardrailsSchema>;

export const PRDAccessibilityRequirementsSchema = z.object({
  wcagLevel: z.string().nullable(), // "WCAG 2.1 AA", etc.
  textSize: z.string().nullable(), // "16-18pt default"
  tapTargets: z.string().nullable(), // "44x44 minimum"
  voiceSupport: z.string().nullable(), // Voice cueing capabilities
  colorContrast: z.string().nullable(), // "4.5:1 minimum"
  offlineMode: z.string().nullable(), // Offline capabilities
}).nullable();
export type PRDAccessibilityRequirements = z.infer<typeof PRDAccessibilityRequirementsSchema>;

export const PRDSecurityPrivacySchema = z.object({
  dataClassification: z.array(z.string()).nullable(), // PII, PHI, wellness data, etc.
  encryption: z.string().nullable(), // "TLS 1.2+, AES-256 at rest"
  authentication: z.string().nullable(), // Auth requirements
  accessControl: z.string().nullable(), // RLS, RBAC, etc.
  audit: z.array(z.string()).nullable(), // What gets logged
  dataRetention: z.string().nullable(), // Retention policy
  compliance: z.array(z.string()).nullable(), // GDPR, HIPAA, SOC 2, etc.
}).nullable();
export type PRDSecurityPrivacy = z.infer<typeof PRDSecurityPrivacySchema>;

export const PRDDeviceIntegrationSchema = z.object({
  phase1: z.array(z.string()).nullable(), // Apple Health, Google Fit
  phase2: z.array(z.string()).nullable(), // Fitbit, WHOOP, etc.
  degradedMode: z.string().nullable(), // Fallback if no device
}).nullable();
export type PRDDeviceIntegration = z.infer<typeof PRDDeviceIntegrationSchema>;

export const PRDNonFunctionalRequirementsSchema = z.object({
  performance: z.object({
    latencyP95: z.string().nullable(), // "< 400ms"
    uptime: z.string().nullable(), // "99.9%"
    coldStart: z.string().nullable(), // "< 1.5s"
  }).nullable(),
  scalability: z.string().nullable(), // "10k → 100k DAU"
  reliability: z.string().nullable(), // Error rates, recovery time
}).nullable();
export type PRDNonFunctionalRequirements = z.infer<typeof PRDNonFunctionalRequirementsSchema>;

export const PRDResponsibleAISchema = z.object({
  explainability: z.string().nullable(), // How we explain AI decisions
  biasReview: z.string().nullable(), // How we prevent bias
  hallucinationGuard: z.string().nullable(), // Safety rails for AI
  languageSupport: z.array(z.string()).nullable(), // EN, ES, etc.
}).nullable();
export type PRDResponsibleAI = z.infer<typeof PRDResponsibleAISchema>;

export const PRDReleasePlanSchema = z.object({
  betaCohort: z.string().nullable(), // "200 seniors, 6 weeks"
  pricing: z.string().nullable(), // "$7.99/mo after 14-day trial"
  support: z.string().nullable(), // Support channels and SLA
}).nullable();
export type PRDReleasePlan = z.infer<typeof PRDReleasePlanSchema>;

export const PRDRiskSchema = z.object({
  risk: z.string(),
  impact: z.enum(["High", "Med", "Low"]),
  likelihood: z.enum(["High", "Med", "Low"]),
  mitigation: z.string(),
});
export type PRDRisk = z.infer<typeof PRDRiskSchema>;

export const PRDDataModelSchema = z.object({
  entities: z.array(z.object({
    name: z.string(),
    description: z.string(),
    keyFields: z.array(z.string()),
  })).nullable(),
  invariants: z.array(z.string()).nullable(), // "Every WorkoutSession must map to a Plan version"
}).nullable();
export type PRDDataModel = z.infer<typeof PRDDataModelSchema>;

// Enterprise PRD: Meta section
export const PRDMetaSchema = z.object({
  projectName: z.string(),
  version: z.string(),
  createdAt: z.string(), // ISO-8601
  domain: z.enum(["generic", "health", "fintech", "marketplace", "saas"]),
  sources: z.array(z.string()).nullable(), // URLs or doc IDs from RAG
});
export type PRDMeta = z.infer<typeof PRDMetaSchema>;

// Enterprise PRD: Enhanced feature with acceptance criteria
export const PRDFeatureSchema = z.object({
  id: z.string(),
  name: z.string(), // Keep "name" for backward compatibility
  title: z.string().optional(), // Add "title" as optional alias
  description: z.string(),
  priority: z.enum(["P0", "P1", "P2", "P3"]),
  acceptanceCriteria: z.array(z.string()), // Gherkin-style or clear ACs
  dependencies: z.array(z.string()).nullable(), // Feature IDs
  moduleIds: z.array(z.string()).nullable(), // References to graph nodes
});
export type PRDFeature = z.infer<typeof PRDFeatureSchema>;

// Enterprise PRD: Quantified metrics
export const PRDMetricsSchema = z.object({
  activationD2: z.object({
    targetPct: z.number().min(0).max(1), // e.g., 0.6 for 60%
    baseline: z.number().min(0).max(1).nullable(),
  }).nullable(),
  retentionW4: z.object({
    targetPct: z.number().min(0).max(1), // e.g., 0.4 for 40%
    baseline: z.number().min(0).max(1).nullable(),
  }).nullable(),
  retentionM3: z.object({
    targetPct: z.number().min(0).max(1), // e.g., 0.28 for 28%
    baseline: z.number().min(0).max(1).nullable(),
  }).nullable(),
  errorBudget: z.object({
    slo: z.string(), // e.g., "p95<400ms"
    targetAvailability: z.number().min(0).max(1), // e.g., 0.999
  }).nullable(),
  customMetrics: z.array(z.object({
    name: z.string(),
    target: z.string(),
    baseline: z.string().nullable(),
  })).nullable(),
}).nullable();
export type PRDMetrics = z.infer<typeof PRDMetricsSchema>;

// Enterprise PRD: Enhanced NFR with numbers
export const PRDEnhancedNFRSchema = z.object({
  availability: z.number().min(0).max(100).nullable(), // e.g., 99.9
  latencyP95ReadMs: z.number().nullable(), // e.g., 400
  latencyP95WriteMs: z.number().nullable(), // e.g., 800
  security: z.array(z.string()).nullable(), // ["RLS", "TLS1.2+", "AES-256"]
  a11y: z.string().nullable(), // "WCAG2.1-AA"
  i18n: z.array(z.string()).nullable(), // ["en", "es"]
  offlineSupport: z.boolean().nullable(),
}).nullable();
export type PRDEnhancedNFR = z.infer<typeof PRDEnhancedNFRSchema>;

// Enterprise PRD: Enhanced safety with escalation
export const PRDEnhancedSafetySchema = z.object({
  claimsScope: z.enum(["wellness", "informational", "transactional", "regulated", "none"]).nullable(),
  guardrails: z.array(z.string()).nullable(), // Rules and boundaries
  escalation: z.array(z.object({
    condition: z.string(),
    action: z.string(),
    slaSeconds: z.number().nullable(),
  })).nullable(),
}).nullable();
export type PRDEnhancedSafety = z.infer<typeof PRDEnhancedSafetySchema>;

// Enterprise PRD: Privacy with specific retention
export const PRDEnhancedPrivacySchema = z.object({
  piiClasses: z.array(z.enum(["basic", "sensitive", "financial", "health"])).nullable(),
  retentionDays: z.number().nullable(), // e.g., 730
  auditEvents: z.array(z.string()).nullable(), // ["profile_view", "export", "share"]
  compliance: z.array(z.string()).nullable(), // ["GDPR", "HIPAA", "SOC2"]
}).nullable();
export type PRDEnhancedPrivacy = z.infer<typeof PRDEnhancedPrivacySchema>;

// Enterprise PRD: Roadmap with dates
export const PRDRoadmapSchema = z.object({
  mvpFreeze: z.string().nullable(), // YYYY-MM-DD
  beta: z.string().nullable(), // YYYY-MM-DD
  phase2: z.string().nullable(), // YYYY-MM-DD
  milestones: z.array(PRDMilestoneSchema).nullable(),
}).nullable();
export type PRDRoadmap = z.infer<typeof PRDRoadmapSchema>;

export const PRDSchema = z.object({
  // Legacy fields (maintain backward compatibility)
  title: z.string(),
  version: z.string(),
  lastUpdated: z.string(), // ISO date
  overview: z.string(),
  problemStatement: z.string(), // Clear articulation of the user problem
  goals: z.array(z.string()),
  nonGoals: z.array(z.string()).nullable(),

  // Enterprise: Meta section
  meta: PRDMetaSchema.nullable(),

  // Enhanced persona section
  userPersonas: z.array(PRDPersonaSchema).nullable(),

  // Competitive landscape
  competitiveAnalysis: z.object({
    competitors: z.array(PRDCompetitorSchema),
    marketOpportunity: z.string().nullable(),
  }).nullable(),

  // Success metrics and KPIs
  successMetrics: z.array(PRDSuccessMetricSchema).nullable(),

  userStories: z.array(
    z.object({
      id: z.string(),
      persona: z.string(),
      story: z.string(),
      acceptanceCriteria: z.array(z.string()),
    })
  ),

  // Enterprise: Enhanced features with ACs
  features: z.array(PRDFeatureSchema),
  outOfScope: z.array(z.string()).nullable(), // What's explicitly not included

  // Assumptions and constraints
  assumptions: z.array(z.string()).nullable(),
  constraints: z.array(z.string()).nullable(),
  dependencies: z.array(z.string()).nullable(), // External dependencies

  // Timeline and milestones
  timeline: z.object({
    milestones: z.array(PRDMilestoneSchema),
    totalDuration: z.string().nullable(), // "12 weeks", "3 months", etc.
  }).nullable(),

  // Enterprise-level sections (legacy - descriptive)
  safetyGuardrails: PRDSafetyGuardrailsSchema,
  accessibilityRequirements: PRDAccessibilityRequirementsSchema,
  securityPrivacy: PRDSecurityPrivacySchema,
  deviceIntegration: PRDDeviceIntegrationSchema,
  nonFunctionalRequirements: PRDNonFunctionalRequirementsSchema,
  responsibleAI: PRDResponsibleAISchema,
  releasePlan: PRDReleasePlanSchema,
  riskRegister: z.array(PRDRiskSchema).nullable(),
  dataModel: PRDDataModelSchema,

  // Enterprise: Quantified sections (new - measurable)
  metrics: PRDMetricsSchema,
  nfr: PRDEnhancedNFRSchema,
  safety: PRDEnhancedSafetySchema,
  privacy: PRDEnhancedPrivacySchema,
  roadmap: PRDRoadmapSchema,

  sections: z.array(PRDSectionSchema).nullable(), // Free-form sections
  citations: z
    .array(
      z.object({
        id: z.string(),
        source: z.string(),
        url: z.string().nullable(),
        snippet: z.string().nullable(),
      })
    )
    .nullable(),
});
export type PRD = z.infer<typeof PRDSchema>;

// ============================================================================
// BACKEND SPEC SCHEMA
// ============================================================================

export const BackendEntitySchema = z.object({
  name: z.string(),
  fields: z.array(
    z.object({
      name: z.string(),
      type: z.string(), // "string", "number", "boolean", "date", etc.
      required: z.boolean(),
      unique: z.boolean().nullable(),
      relation: z.string().nullable(), // "User.id" for foreign keys
    })
  ),
  indexes: z.array(z.string()).nullable(),
});
export type BackendEntity = z.infer<typeof BackendEntitySchema>;

export const BackendAPISchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  path: z.string(),
  description: z.string(),
  auth: z.boolean(),
  params: z
    .array(
      z.object({
        name: z.string(),
        type: z.string(),
        required: z.boolean(),
      })
    )
    .nullable(),
});
export type BackendAPI = z.infer<typeof BackendAPISchema>;

export const BackendSpecSchema = z.object({
  entities: z.array(BackendEntitySchema),
  apis: z.array(BackendAPISchema),
  jobs: z
    .array(
      z.object({
        name: z.string(),
        trigger: z.string(), // "cron:0 * * * *", "event:user.created"
        description: z.string(),
      })
    )
    .nullable(),
  integrations: z
    .array(
      z.object({
        service: z.string(), // "Stripe", "SendGrid", etc.
        purpose: z.string(),
      })
    )
    .nullable(),
});
export type BackendSpec = z.infer<typeof BackendSpecSchema>;

// ============================================================================
// FRONTEND SPEC SCHEMA
// ============================================================================

export const FrontendRouteSchema = z.object({
  path: z.string(),
  component: z.string(),
  auth: z.boolean(),
});
export type FrontendRoute = z.infer<typeof FrontendRouteSchema>;

export const FrontendComponentSchema = z.object({
  name: z.string(),
  type: z.enum(["page", "layout", "component", "feature"]),
  description: z.string(),
  props: z
    .array(
      z.object({
        name: z.string(),
        type: z.string(),
        required: z.boolean(),
      })
    )
    .nullable(),
  state: z.array(z.string()).nullable(), // State variables used
  apis: z.array(z.string()).nullable(), // API paths used
});
export type FrontendComponent = z.infer<typeof FrontendComponentSchema>;

export const FrontendSpecSchema = z.object({
  routes: z.array(FrontendRouteSchema),
  components: z.array(FrontendComponentSchema),
  stateManagement: z.enum(["useState", "zustand", "redux", "context"]).nullable(),
  styling: z.enum(["tailwind", "css-modules", "styled-components"]).nullable(),
});
export type FrontendSpec = z.infer<typeof FrontendSpecSchema>;

// ============================================================================
// UI SPEC SCHEMA (for Figma plugin)
// ============================================================================

export const UIColorSchema = z.object({
  name: z.string(),
  hex: z.string(),
  usage: z.string().nullable(),
});
export type UIColor = z.infer<typeof UIColorSchema>;

export const UITypographySchema = z.object({
  name: z.string(),
  fontSize: z.number(),
  lineHeight: z.number(),
  fontWeight: z.number().nullable(),
  fontFamily: z.string().nullable(),
});
export type UITypography = z.infer<typeof UITypographySchema>;

export const UIComponentSchema = z.object({
  name: z.string(),
  type: z.string(), // "Button", "Input", "Card", etc.
  variants: z.array(z.string()).nullable().optional(),
  states: z.array(z.string()).nullable().optional(), // ["default", "hover", "active", "disabled"]
  description: z.string().nullable().optional(),
});
export type UIComponent = z.infer<typeof UIComponentSchema>;

export const UIScreenSchema = z.object({
  name: z.string(),
  path: z.string(),
  components: z.array(z.string()), // Component names used
  layout: z.string().nullable().optional(), // "single-column", "sidebar-layout", etc.
  wireframe: z.string().nullable().optional(), // ASCII or description
});
export type UIScreen = z.infer<typeof UIScreenSchema>;

export const UISpecSchema = z.object({
  designSystem: z.object({
    colors: z.array(UIColorSchema),
    typography: z.array(UITypographySchema),
    spacing: z.array(z.number()).nullable().optional(), // [4, 8, 12, 16, ...]
    borderRadius: z.array(z.number()).nullable().optional(),
  }),
  components: z.array(UIComponentSchema),
  screens: z.array(UIScreenSchema),
});
export type UISpec = z.infer<typeof UISpecSchema>;

// ============================================================================
// RESEARCH SCHEMA
// ============================================================================

export const ResearchCitationSchema = z.object({
  id: z.string(),
  source: z.string(),
  url: z.string().nullable().optional(),
  snippet: z.string(),
  relevance: z.number().min(0).max(1).nullable().optional(), // Confidence score
});
export type ResearchCitation = z.infer<typeof ResearchCitationSchema>;

export const ResearchInsightSchema = z.object({
  topic: z.string(),
  summary: z.string(),
  citations: z.array(ResearchCitationSchema),
});
export type ResearchInsight = z.infer<typeof ResearchInsightSchema>;

export const ResearchReportSchema = z.object({
  query: z.string(),
  insights: z.array(ResearchInsightSchema),
  generatedAt: z.string(), // ISO date
});
export type ResearchReport = z.infer<typeof ResearchReportSchema>;

// ============================================================================
// EVENT SCHEMAS (for event bus)
// ============================================================================

export const ModuleAddedEventSchema = z.object({
  type: z.literal("ModuleAdded"),
  moduleId: z.string(),
  node: ModuleNodeSchema,
});

export const ModuleRemovedEventSchema = z.object({
  type: z.literal("ModuleRemoved"),
  moduleId: z.string(),
});

export const ModuleUpdatedEventSchema = z.object({
  type: z.literal("ModuleUpdated"),
  moduleId: z.string(),
});

export const PRDEditedEventSchema = z.object({
  type: z.literal("PRDEdited"),
  section: z.string().nullable().optional(),
});

export const ResearchUpdatedEventSchema = z.object({
  type: z.literal("ResearchUpdated"),
  reportId: z.string(),
});

export const ArtifactGeneratedEventSchema = z.object({
  type: z.literal("ArtifactGenerated"),
  artifactType: z.string(),
  artifactId: z.string(),
});

export const SystemEventSchema = z.discriminatedUnion("type", [
  ModuleAddedEventSchema,
  ModuleRemovedEventSchema,
  ModuleUpdatedEventSchema,
  PRDEditedEventSchema,
  ResearchUpdatedEventSchema,
  ArtifactGeneratedEventSchema,
]);
export type SystemEvent = z.infer<typeof SystemEventSchema>;

// ============================================================================
// ARTIFACT METADATA
// ============================================================================

export const ArtifactTypeSchema = z.enum([
  "PRD",
  "BackendSpec",
  "FrontendSpec",
  "UISpec",
  "ResearchReport",
  "Mermaid_Flow",
  "Mermaid_ERD",
  "PromptPack_Cursor",
  "PromptPack_Claude",
  "PromptPack_Lovable",
  "PromptPack_Bolt",
  "Backlog_CSV",
]);
export type ArtifactType = z.infer<typeof ArtifactTypeSchema>;
