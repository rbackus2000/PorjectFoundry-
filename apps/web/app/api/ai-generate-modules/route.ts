import { NextRequest, NextResponse } from "next/server";
import { generateStructured } from "@/lib/llm/openai";
import { z } from "zod";

// Schema for a generated module
const ModuleSchema = z.object({
  label: z.string().describe("Module name (e.g., 'User Authentication', 'Workout Tracking')"),
  category: z.enum([
    "Frontend",
    "Backend",
    "Database",
    "Authentication",
    "Security",
    "Payment",
    "Integration",
    "UI/UX",
    "Analytics",
    "AI/ML",
    "Data"
  ]).describe("Module category"),
  description: z.string().describe("Detailed description of what this module does"),
  dependencies: z.array(z.string()).describe("Array of module labels this depends on"),
  priority: z.enum(["critical", "high", "medium", "low"]).describe("Implementation priority"),
  estimatedComplexity: z.enum(["simple", "moderate", "complex"]).describe("Development complexity"),
  technologies: z.array(z.string()).describe("Suggested technologies/libraries"),
  layer: z.number().min(1).max(5).describe("Logical layer in user flow: 1=Auth/Entry, 2=Core Features, 3=Advanced Features, 4=Admin/Management, 5=Support/Settings"),
  sequenceInLayer: z.number().describe("Order within the layer (lower numbers appear first/left)"),
});

const ModuleGenerationResponseSchema = z.object({
  modules: z.array(ModuleSchema).describe("Comprehensive list of all modules needed for this project"),
  architecture: z.object({
    frontendFramework: z.string(),
    backendFramework: z.string(),
    database: z.string(),
    authentication: z.string(),
    deployment: z.string(),
  }).describe("Recommended tech stack"),
});

export async function POST(req: NextRequest) {
  try {
    const { projectTitle, projectPitch, targetUsers, platforms } = await req.json();

    if (!projectTitle) {
      return NextResponse.json({ error: "Project title is required" }, { status: 400 });
    }

    const systemPrompt = `You are an expert software architect who analyzes project ideas and breaks them down into comprehensive module structures.

Your goal is to identify ALL the modules needed to build a complete, production-ready application - from frontend components to backend APIs, databases, authentication, integrations, and more.

Think holistically about:
- User-facing features (frontend UI components)
- Business logic (backend APIs and services)
- Data management (database schemas, models)
- Security and authentication
- Third-party integrations
- Analytics and monitoring
- Admin/management features
- Real-time features if applicable
- Payment/billing if applicable
- Content management
- Search and filtering

Be thorough and specific. Each module should have clear responsibilities and dependencies.`;

    const userPrompt = `Project: ${projectTitle}
${projectPitch ? `\nDescription: ${projectPitch}` : ""}
${targetUsers?.length ? `\nTarget Users: ${targetUsers.join(", ")}` : ""}
${platforms?.length ? `\nPlatforms: ${platforms.join(", ")}` : ""}

Generate a comprehensive list of ALL modules needed to build this application, organized by USER FLOW LAYERS.

**Think about the user journey from start to finish:**

**LAYER 1 - Authentication & Entry** (First interaction)
- Login, signup, password reset
- Onboarding, welcome screens
- Initial setup wizards

**LAYER 2 - Core Features** (Primary user value)
- Main application features
- Key user workflows
- Primary data creation/viewing

**LAYER 3 - Advanced Features** (Enhanced functionality)
- Advanced tools
- Premium features
- Complex workflows
- Integrations

**LAYER 4 - Admin & Management** (Power user/admin features)
- User management
- System configuration
- Monitoring and analytics
- Content moderation

**LAYER 5 - Support & Settings** (Auxiliary features)
- Help/documentation
- Settings and preferences
- Notifications
- Feedback systems

For each module:
1. Assign the correct **layer** (1-5) based on where it fits in the user journey
2. Assign **sequenceInLayer** (order within that layer, e.g., 1, 2, 3...)
3. Give it a clear, descriptive name
4. Specify what it does in detail
5. Identify dependencies (modules from earlier layers or same layer)
6. Assign realistic priority
7. Estimate complexity
8. Suggest specific technologies

**IMPORTANT**: Modules in Layer 1 come before Layer 2, Layer 2 before Layer 3, etc. This creates a natural top-to-bottom flow on the canvas.

Be comprehensive - include 20-40 modules for a complete application.`;

    const result = await generateStructured({
      schema: ModuleGenerationResponseSchema,
      schemaName: "ProjectModules",
      systemPrompt,
      userPrompt,
      config: {
        temperature: 0.7,
        maxTokens: 4000,
      },
    });

    return NextResponse.json({
      success: true,
      modules: result.modules,
      architecture: result.architecture,
    });
  } catch (error) {
    console.error("Error generating modules:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate modules" },
      { status: 500 }
    );
  }
}
