import { FrontendSpec, PRD, BackendSpec, ProjectGraph, FrontendSpecSchema } from "../zodSchemas";
import { generateStructured } from "../llm/openai";
import { retrieveHybrid } from "../rag/retriever";

/**
 * Frontend Agent
 * Generates frontend specifications from PRD and backend spec
 */

export type FEInput = {
  prd: PRD;
  backendSpec: BackendSpec;
  graph: ProjectGraph;
};

export async function generateFrontendSpec(input: FEInput): Promise<FrontendSpec> {
  return feAgent.generate(input);
}

export const feAgent = {
  async generate(input: FEInput): Promise<FrontendSpec> {
    // Retrieve frontend best practices from RAG
    let bestPracticesContext = "";
    try {
      console.log("[FE Agent] Retrieving frontend best practices from RAG...");
      const ragResults = await retrieveHybrid(
        "frontend architecture best practices React Next.js Supabase components state management",
        { topK: 5 }
      );

      console.log(`[FE Agent] Retrieved ${ragResults.length} best practice chunks from RAG`);

      if (ragResults.length > 0) {
        bestPracticesContext = "\n\n## Frontend Best Practices (from knowledge base)\n\n" +
          ragResults
            .slice(0, 5)
            .map((result, idx) => {
              const sourceInfo = result.document
                ? `[Source: ${result.document.title}]`
                : "";
              return `### Best Practice ${idx + 1} ${sourceInfo}\n${result.content}`;
            })
            .join("\n\n");
      }
    } catch (error) {
      console.warn("[FE Agent] Failed to retrieve best practices from RAG:", error);
      // Continue without RAG context if retrieval fails
    }

    const systemPrompt = `You are an expert Frontend Architect creating comprehensive frontend specifications for web applications.

Your task is to transform a PRD and backend specification into a detailed, well-structured frontend spec that includes:
- Complete route definitions with paths, components, layouts, and authentication requirements
- Detailed component breakdowns including pages, layouts, features, and reusable components
- Component properties, state management needs, and API dependencies
- State management approach (useState, zustand, redux, context)
- Data fetching strategies
- Styling approach (tailwind, css-modules, styled-components)

Focus on:
- Modern React patterns and best practices
- Clean component architecture with clear separation of concerns
- Proper state management and data flow
- Type-safe component interfaces
- Reusable, composable components
- Performance considerations (lazy loading, code splitting)
- Accessibility and responsive design

Be specific about which components use which APIs and what state they manage.${bestPracticesContext}`;

    const userPrompt = `Create a comprehensive frontend specification for the following project:

## PRD Summary
**Title:** ${input.prd.title}
**Overview:** ${input.prd.overview}

## Goals
${input.prd.goals.map((g, i) => `${i + 1}. ${g}`).join("\n")}

## Features
${input.prd.features.map(f => `- **[${f.priority}] ${f.name}**: ${f.description}`).join("\n")}

## User Stories
${input.prd.userStories.map(us => `- **${us.id}** (${us.persona}): ${us.story}`).join("\n")}

## Available Backend APIs
${input.backendSpec.apis.map(api => `- ${api.method} ${api.path}${api.auth ? " (auth required)" : ""}: ${api.description}`).join("\n")}

## Backend Entities
${input.backendSpec.entities.map(e => `- **${e.name}**: ${e.fields.map(f => f.name).join(", ")}`).join("\n")}

${input.backendSpec.integrations && input.backendSpec.integrations.length > 0 ? `## External Integrations\n${input.backendSpec.integrations.map(i => `- **${i.service}**: ${i.purpose}`).join("\n")}` : ""}

## Requirements
Based on the PRD and backend specification above, create a complete frontend architecture that:

1. **Routes**: Define all routes needed to support the features and user stories
   - Include proper authentication guards for protected routes
   - Map routes to appropriate page components
   - Consider nested layouts where appropriate

2. **Components**: Break down the UI into a well-structured component hierarchy
   - **Pages**: Top-level route components that compose features and layouts
   - **Layouts**: Reusable layout components (navigation, headers, footers, sidebars)
   - **Features**: Complex feature components that combine multiple smaller components
   - **Components**: Reusable UI components (buttons, cards, forms, modals, etc.)
   - Specify which APIs each component needs to call
   - Define what state each component manages

3. **State Management**: Choose the appropriate state management approach
   - Use "useState" for simple local state
   - Use "zustand" or "context" for shared app state
   - Use "redux" only for complex state needs

4. **Data Fetching**: Consider how components fetch and cache data from the backend APIs

5. **Styling**: Specify the styling approach (default to "tailwind" unless there's a specific reason for another approach)

Generate at least 8-15 components covering all major features and user flows. Be thorough and consider the complete user journey.`;

    console.log("[FE Agent] Generating Frontend Spec with AI...");

    const frontendSpec = await generateStructured({
      schema: FrontendSpecSchema,
      schemaName: "FrontendSpec",
      systemPrompt,
      userPrompt,
      config: {
        temperature: 0.7,
        maxTokens: 12000,
      },
    });

    console.log("[FE Agent] Frontend Spec generated successfully with", frontendSpec.routes.length, "routes and", frontendSpec.components.length, "components");

    return frontendSpec;
  },
};
