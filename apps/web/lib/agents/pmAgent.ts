import { PRD, Idea, ProjectGraph, ResearchReport } from "../zodSchemas";

/**
 * PM/PRD Agent
 * Generates Product Requirements Documents from ideas, graphs, and research
 */

export type PMInput = {
  idea: Idea;
  graph: ProjectGraph;
  research?: ResearchReport;
};

export const pmAgent = {
  async generate(input: PMInput): Promise<PRD> {
    // TODO: Replace with actual LLM call
    // For now, return a stub PRD based on input

    const prd: PRD = {
      title: input.idea.title,
      version: "1.0",
      lastUpdated: new Date().toISOString(),
      overview: input.idea.pitch,
      goals: input.idea.coreFeatures.map((f) => `Implement ${f}`),
      nonGoals: input.idea.constraints || [],
      userStories: input.idea.targetUsers.map((user, idx) => ({
        id: `US-${idx + 1}`,
        persona: user,
        story: `As a ${user}, I want to use ${input.idea.title}`,
        acceptanceCriteria: ["Feature works", "UI is intuitive"],
      })),
      features: input.graph.nodes
        .filter((n) => n.status === "in")
        .map((node, idx) => ({
          id: `F-${idx + 1}`,
          name: node.label,
          description: node.description || `Feature: ${node.label}`,
          priority: idx === 0 ? "P0" : "P1",
          moduleIds: [node.id],
        })),
      citations: input.research?.insights.flatMap((insight) => insight.citations) || [],
    };

    return prd;
  },
};
