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

    const systemPrompt = `You are an expert Product Manager creating comprehensive, enterprise-grade Product Requirements Documents (PRDs).

${bestPracticesContext}Your task is to transform a project idea into a detailed, well-structured PRD following best practices from top companies like Google, Airbnb, and Asana.

**Your PRD MUST include:**
1. **Problem Statement**: Clear articulation of the user problem and market opportunity
2. **User Personas**: Detailed personas with goals, pain points, and specific use cases
3. **Competitive Analysis**: Analysis of competitors with strengths, weaknesses, and how we differentiate
4. **Success Metrics**: Specific, measurable KPIs with targets and timeframes
5. **Goals & Non-Goals**: Clear scope boundaries
6. **User Stories**: Comprehensive stories with acceptance criteria for each persona
7. **Features**: Prioritized feature list (P0 = critical, P1 = high, P2 = medium, P3 = low) with dependencies
8. **Assumptions & Constraints**: External dependencies and limitations
9. **Timeline**: Key milestones with dependencies
10. **Technical Considerations**: Architecture, integrations, and scalability needs

**Guidelines:**
- Be specific and actionable - avoid vague statements
- Focus on WHY we're building this, not just WHAT
- Think about the complete user journey and edge cases
- Consider accessibility, security, and performance from the start
- Include real-world examples in user stories
- Make success metrics SMART (Specific, Measurable, Achievable, Relevant, Time-bound)`;

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

**Instructions:**
1. Generate a complete, enterprise-quality PRD with ALL required sections
2. Create 5-10 detailed features based on the problem, solution, and user needs
3. Include specific user stories for EACH user persona (at least 2-3 stories per persona)
4. Provide detailed competitive differentiators based on the competitive landscape
5. Define clear, measurable success metrics with targets
6. Create a realistic timeline with 3-5 key milestones
7. List assumptions and external dependencies
8. Keep non-goals specific to prevent scope creep

Generate the PRD now with professional quality suitable for executive review.`;

    console.log("[PM Agent] Generating PRD with AI...");

    const prd = await generateStructured({
      schema: PRDSchema,
      schemaName: "PRD",
      systemPrompt,
      userPrompt,
      config: {
        temperature: 0.7,
        maxTokens: 12000,
      },
    });

    console.log("[PM Agent] PRD generated successfully with", prd.features.length, "features");

    return prd;
  },
};
