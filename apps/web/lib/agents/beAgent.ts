import { BackendSpec, PRD, ProjectGraph, BackendSpecSchema } from "../zodSchemas";
import { generateStructured } from "../llm/openai";
import { retrieveHybrid } from "../rag/retriever";

/**
 * Backend Agent
 * Generates backend specifications from PRD and graph
 */

export type BEInput = {
  prd: PRD;
  graph: ProjectGraph;
};

export async function generateBackendSpec(input: BEInput): Promise<BackendSpec> {
  return beAgent.generate(input);
}

export const beAgent = {
  async generate(input: BEInput): Promise<BackendSpec> {
    // Retrieve Supabase backend best practices from RAG
    let bestPracticesContext = "";
    try {
      console.log("[Backend Agent] Retrieving Supabase best practices from RAG...");
      const ragResults = await retrieveHybrid(
        "Supabase backend best practices database RLS performance security",
        { topK: 5 }
      );

      console.log(`[Backend Agent] Retrieved ${ragResults.length} best practice chunks from RAG`);

      if (ragResults.length > 0) {
        bestPracticesContext = `\n## SUPABASE BACKEND BEST PRACTICES (from knowledge base)\n\n${ragResults
          .map((result, idx) => `### Best Practice ${idx + 1} (relevance: ${result.hybridScore.toFixed(3)})\n${result.content}`)
          .join("\n\n")}\n\n---\n`;
      }
    } catch (error) {
      console.warn("[Backend Agent] Failed to retrieve best practices from RAG:", error);
      // Continue without best practices context
    }

    const systemPrompt = `You are an expert Backend Architect and Database Designer specializing in modern web applications with Supabase.
${bestPracticesContext}
Your task is to design a comprehensive backend specification that includes:
- Database entities (tables/models) with proper field definitions, types, constraints, and relationships
- RESTful API endpoints with clear HTTP methods, paths, authentication requirements, and data contracts
- Background jobs for async processing (if needed)
- Third-party integrations (if needed)

Key principles to follow:
1. **Database Design**: Use proper normalization, foreign keys for relationships, appropriate indexes for query performance
2. **Field Types**: Use accurate types (string, number, boolean, date, json, etc.)
3. **Constraints**: Mark fields as required/optional and unique where appropriate
4. **Relations**: Clearly define foreign key relationships using "Entity.field" notation
5. **API Design**: Follow REST conventions (GET for read, POST for create, PUT/PATCH for update, DELETE for remove)
6. **Authentication**: Mark endpoints requiring auth with auth: true
7. **Data Contracts**: Specify request body and response structures for complex endpoints
8. **Jobs**: Include background jobs for email, notifications, cleanup, data processing, etc.
9. **Integrations**: Identify third-party services needed (payment, email, storage, analytics, etc.)
10. **Supabase Best Practices**: Apply the Supabase best practices provided above, including RLS policies, performance optimizations, and security measures

Be thorough and think about real-world production requirements like user management, audit trails, and data integrity.`;

    const userPrompt = `Design a complete backend specification for the following project:

## Project Overview
${input.prd.overview}

## Goals
${input.prd.goals.map((g, i) => `${i + 1}. ${g}`).join("\n")}

## User Stories
${input.prd.userStories.map((us) => `- ${us.story}\n  Acceptance Criteria: ${us.acceptanceCriteria.join(", ")}`).join("\n\n")}

## Features
${input.prd.features
  .map(
    (f) =>
      `### ${f.name} (${f.priority})
${f.description}`
  )
  .join("\n\n")}

## Modules in Scope
${input.graph.nodes
  .filter((n) => n.status === "in")
  .map((n) => `- ${n.label}${n.description ? `: ${n.description}` : ""}`)
  .join("\n")}

Based on this PRD, generate a complete backend specification with:
1. All necessary database entities with fields, types, constraints, and relationships
2. Complete CRUD and business logic API endpoints
3. Background jobs if the features require async processing
4. Third-party integrations if needed for the features

Ensure the backend can support ALL features described in the PRD.`;

    console.log("[Backend Agent] Generating backend spec with AI...");

    const backendSpec = await generateStructured({
      schema: BackendSpecSchema,
      schemaName: "BackendSpec",
      systemPrompt,
      userPrompt,
      config: {
        temperature: 0.7,
        maxTokens: 12000,
      },
    });

    console.log(
      "[Backend Agent] Backend spec generated successfully with",
      backendSpec.entities.length,
      "entities and",
      backendSpec.apis.length,
      "APIs"
    );

    return backendSpec;
  },
};
