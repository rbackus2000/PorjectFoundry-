import { UISpec, PRD, FrontendSpec, UISpecSchema } from "../zodSchemas";
import { generateStructured } from "../llm/openai";
import { retrieveHybrid } from "../rag/retriever";

/**
 * UI Agent
 * Generates UI specifications for Figma plugin
 */

export type UIInput = {
  prd: PRD;
  frontendSpec: FrontendSpec;
};

export async function generateUISpec(input: UIInput): Promise<UISpec> {
  return uiAgent.generate(input);
}

export const uiAgent = {
  async generate(input: UIInput): Promise<UISpec> {
    // Retrieve design and security best practices from RAG
    let bestPracticesContext = "";
    try {
      console.log("[UI Agent] Retrieving design/security best practices from RAG...");
      const results = await retrieveHybrid(
        "UI design system best practices components accessibility security",
        { topK: 5 }
      );

      console.log(`[UI Agent] Retrieved ${results.length} best practice documents`);

      if (results.length > 0) {
        // Extract content from top results
        const practicesContent = results
          .map((result, index) => {
            const source = result.document?.title || "Unknown source";
            return `### Best Practice ${index + 1} (from: ${source})\n${result.content}`;
          })
          .join("\n\n");

        bestPracticesContext = `\n\n## IMPORTANT: Design & Security Best Practices\nThe following best practices MUST be incorporated into your design:\n\n${practicesContent}\n`;
      }
    } catch (error) {
      console.warn("[UI Agent] Failed to retrieve best practices from RAG:", error);
      // Continue without best practices rather than failing completely
    }

    const systemPrompt = `You are an expert UI/UX designer creating comprehensive design systems and UI specifications.

Your task is to transform a Product Requirements Document (PRD) and Frontend Specification into a complete design system that includes:
- A cohesive design system with colors, typography, spacing, and border radius values
- Detailed component designs with variants and states
- Screen designs that map to the frontend routes and show which components are used
- Responsive considerations and layout patterns

The output will be used to generate designs in Figma, so be specific about:
- Exact hex color values and their usage
- Typography sizes, line heights, and font weights
- Component variants (e.g., "primary", "secondary", "outline" for buttons)
- Component states (e.g., "default", "hover", "active", "disabled")
- Screen layouts and component composition

Create a modern, accessible, and user-friendly design that aligns with the project's goals.${bestPracticesContext}`;

    const userPrompt = `Create a comprehensive UI specification for the following project:

## Project Overview
**Title:** ${input.prd.title}
**Description:** ${input.prd.overview}

## Features
${input.prd.features.map(f => `- **${f.name}** (${f.priority}): ${f.description}`).join("\n")}

## Frontend Routes & Components
The application has the following routes that need UI designs:
${input.frontendSpec.routes.map(r => `- ${r.path} → ${r.component}${r.auth ? " (authenticated)" : ""}`).join("\n")}

The following components need to be designed:
${input.frontendSpec.components.map(c => `- **${c.name}** (${c.type}): ${c.description}`).join("\n")}

${input.frontendSpec.stateManagement ? `\n## State Management\n${input.frontendSpec.stateManagement}` : ""}
${input.frontendSpec.styling ? `\n## Styling Approach\n${input.frontendSpec.styling}` : ""}

## Instructions
Create a complete design system with:

1. **Design System:**
   - 8-12 colors including primary, secondary, background, surface, text colors, success, error, warning
   - 4-6 typography styles (headings, body, captions)
   - Spacing scale (e.g., 4, 8, 12, 16, 24, 32, 48, 64)
   - Border radius values

2. **Components:**
   - Design all necessary UI components (Button, Input, Card, Modal, Navigation, etc.)
   - Include variants for each component (e.g., primary/secondary/outline for buttons)
   - Include states (default, hover, active, disabled, focus, error)
   - Provide clear descriptions

3. **Screens:**
   - Design each screen/route from the frontend spec
   - Specify which components are used in each screen
   - Define the layout pattern (e.g., "single-column", "sidebar-layout", "dashboard-grid")
   - Optionally include ASCII wireframes or layout descriptions

Make sure the design system is cohesive, modern, and suitable for Figma implementation.`;

    console.log("[UI Agent] Generating UI specification with AI...");

    const uiSpec = await generateStructured({
      schema: UISpecSchema,
      schemaName: "UISpec",
      systemPrompt,
      userPrompt,
      config: {
        temperature: 0.7,
        maxTokens: 12000,
      },
    });

    console.log(
      "[UI Agent] UI specification generated successfully with",
      uiSpec.components.length,
      "components and",
      uiSpec.screens.length,
      "screens"
    );

    return uiSpec;
  },
};
