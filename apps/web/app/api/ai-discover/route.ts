import { NextRequest, NextResponse } from "next/server";
import { generateStructured } from "@/lib/llm/openai";
import { z } from "zod";

// Schema for discovered app ideas
const AppIdeaSchema = z.object({
  title: z.string(),
  pitch: z.string(),
  problem: z.string(),
  solution: z.string(),
  targetUsers: z.array(z.string()),
  platforms: z.array(z.string()),
  tags: z.array(z.string()),
});

const DiscoveryResponseSchema = z.object({
  ideas: z.array(AppIdeaSchema),
});

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const systemPrompt = "You are a product strategy expert who discovers emerging app opportunities based on market trends and user needs.";

    const userPrompt = `The user is looking for app ideas related to: "${query}"

Your task:
1. Think about current market trends, emerging technologies, and user needs in this space
2. Identify 3-5 promising app opportunities that could be built
3. For each idea, consider: market demand, technical feasibility, potential for growth, and competitive differentiation

Focus on:
- Trending technologies and user behaviors in 2025
- Underserved markets and pain points
- Opportunities where AI, mobile-first, or new platforms create advantages
- Ideas that are technically feasible but not overcrowded

Be specific and actionable. Each idea should be ready to build.`;

    const result = await generateStructured({
      schema: DiscoveryResponseSchema,
      schemaName: "DiscoveredAppIdeas",
      systemPrompt,
      userPrompt,
      config: {
        temperature: 0.8, // Higher creativity for idea generation
        maxTokens: 2000,
      },
    });

    return NextResponse.json({
      success: true,
      ideas: result.ideas,
    });
  } catch (error) {
    console.error("Error discovering app ideas:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to discover app ideas" },
      { status: 500 }
    );
  }
}
