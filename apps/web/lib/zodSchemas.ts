import { z } from "zod";

/**
 * Core Schemas for Project Foundry
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
  description: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  position: z.object({ x: z.number(), y: z.number() }).optional(),
});
export type ModuleNode = z.infer<typeof ModuleNodeSchema>;

export const ModuleEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  label: z.string().optional(),
});
export type ModuleEdge = z.infer<typeof ModuleEdgeSchema>;

export const ProjectGraphSchema = z.object({
  nodes: z.array(ModuleNodeSchema),
  edges: z.array(ModuleEdgeSchema),
});
export type ProjectGraph = z.infer<typeof ProjectGraphSchema>;

// ============================================================================
// IDEA SCHEMA
// ============================================================================

export const IdeaSchema = z.object({
  title: z.string(),
  pitch: z.string(), // One-liner
  problem: z.string(),
  solution: z.string(),
  targetUsers: z.array(z.string()),
  platforms: z.array(z.string()), // ["Web", "iOS", "Android"]
  coreFeatures: z.array(z.string()),
  constraints: z.array(z.string()).optional(),
  inspiration: z.array(z.string()).optional(), // URLs or product names
});
export type Idea = z.infer<typeof IdeaSchema>;

// ============================================================================
// PRD SCHEMA
// ============================================================================

export const PRDSectionSchema = z.object({
  heading: z.string(),
  content: z.string(), // Markdown or plain text
  subsections: z.array(z.lazy(() => PRDSectionSchema)).optional(),
});
export type PRDSection = z.infer<typeof PRDSectionSchema>;

export const PRDSchema = z.object({
  title: z.string(),
  version: z.string().default("1.0"),
  lastUpdated: z.string(), // ISO date
  overview: z.string(),
  goals: z.array(z.string()),
  nonGoals: z.array(z.string()).optional(),
  userStories: z.array(
    z.object({
      id: z.string(),
      persona: z.string(),
      story: z.string(),
      acceptanceCriteria: z.array(z.string()),
    })
  ),
  features: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      priority: z.enum(["P0", "P1", "P2", "P3"]),
      moduleIds: z.array(z.string()).optional(), // References to graph nodes
    })
  ),
  sections: z.array(PRDSectionSchema).optional(), // Free-form sections
  citations: z
    .array(
      z.object({
        id: z.string(),
        source: z.string(),
        url: z.string().optional(),
        snippet: z.string().optional(),
      })
    )
    .optional(),
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
      required: z.boolean().default(true),
      unique: z.boolean().optional(),
      relation: z.string().optional(), // "User.id" for foreign keys
    })
  ),
  indexes: z.array(z.string()).optional(),
});
export type BackendEntity = z.infer<typeof BackendEntitySchema>;

export const BackendAPISchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  path: z.string(),
  description: z.string(),
  auth: z.boolean().default(false),
  params: z
    .array(
      z.object({
        name: z.string(),
        type: z.string(),
        required: z.boolean(),
      })
    )
    .optional(),
  body: z.record(z.unknown()).optional(),
  response: z.record(z.unknown()).optional(),
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
    .optional(),
  integrations: z
    .array(
      z.object({
        service: z.string(), // "Stripe", "SendGrid", etc.
        purpose: z.string(),
      })
    )
    .optional(),
});
export type BackendSpec = z.infer<typeof BackendSpecSchema>;

// ============================================================================
// FRONTEND SPEC SCHEMA
// ============================================================================

export const FrontendRouteSchema = z.object({
  path: z.string(),
  component: z.string(),
  auth: z.boolean().default(false),
  props: z.record(z.unknown()).optional(),
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
    .optional(),
  state: z.array(z.string()).optional(), // State variables used
  apis: z.array(z.string()).optional(), // API paths used
});
export type FrontendComponent = z.infer<typeof FrontendComponentSchema>;

export const FrontendSpecSchema = z.object({
  routes: z.array(FrontendRouteSchema),
  components: z.array(FrontendComponentSchema),
  stateManagement: z.enum(["useState", "zustand", "redux", "context"]).optional(),
  styling: z.enum(["tailwind", "css-modules", "styled-components"]).optional(),
});
export type FrontendSpec = z.infer<typeof FrontendSpecSchema>;

// ============================================================================
// UI SPEC SCHEMA (for Figma plugin)
// ============================================================================

export const UIColorSchema = z.object({
  name: z.string(),
  hex: z.string(),
  usage: z.string().optional(),
});
export type UIColor = z.infer<typeof UIColorSchema>;

export const UITypographySchema = z.object({
  name: z.string(),
  fontSize: z.number(),
  lineHeight: z.number(),
  fontWeight: z.number().optional(),
  fontFamily: z.string().optional(),
});
export type UITypography = z.infer<typeof UITypographySchema>;

export const UIComponentSchema = z.object({
  name: z.string(),
  type: z.string(), // "Button", "Input", "Card", etc.
  variants: z.array(z.string()).optional(),
  states: z.array(z.string()).optional(), // ["default", "hover", "active", "disabled"]
  description: z.string().optional(),
});
export type UIComponent = z.infer<typeof UIComponentSchema>;

export const UIScreenSchema = z.object({
  name: z.string(),
  path: z.string(),
  components: z.array(z.string()), // Component names used
  layout: z.string().optional(), // "single-column", "sidebar-layout", etc.
  wireframe: z.string().optional(), // ASCII or description
});
export type UIScreen = z.infer<typeof UIScreenSchema>;

export const UISpecSchema = z.object({
  designSystem: z.object({
    colors: z.array(UIColorSchema),
    typography: z.array(UITypographySchema),
    spacing: z.array(z.number()).optional(), // [4, 8, 12, 16, ...]
    borderRadius: z.array(z.number()).optional(),
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
  url: z.string().optional(),
  snippet: z.string(),
  relevance: z.number().min(0).max(1).optional(), // Confidence score
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
  changes: z.record(z.unknown()),
});

export const PRDEditedEventSchema = z.object({
  type: z.literal("PRDEdited"),
  section: z.string().optional(),
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
