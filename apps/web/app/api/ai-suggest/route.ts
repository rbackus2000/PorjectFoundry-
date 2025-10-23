import { NextRequest, NextResponse } from "next/server";
import { generateText, generateStructured } from "@/lib/llm/openai";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

// Schema for user personas
const UserPersonaSchema = z.object({
  name: z.string(),
  role: z.string(),
  goals: z.array(z.string()),
  painPoints: z.array(z.string()),
});

const UserPersonasResponseSchema = z.object({
  personas: z.array(UserPersonaSchema),
});

// Schema for competitors
const CompetitorSchema = z.object({
  name: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  url: z.null(),
});

const CompetitorsResponseSchema = z.object({
  competitors: z.array(CompetitorSchema),
});

/**
 * POST /api/ai-suggest
 * Generate AI suggestions for wizard fields based on project context
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fieldType, context } = body;

    if (!fieldType) {
      return NextResponse.json({ error: "Missing fieldType" }, { status: 400 });
    }

    // For most fields, title is required. For title/pitch/problem/solution, we can work with partial context
    const requiresTitle = !["title", "pitch", "problem", "solution"].includes(fieldType);
    if (requiresTitle && (!context || !context.title)) {
      return NextResponse.json({ error: "Missing project context (title required)" }, { status: 400 });
    }

    const { title, pitch, problem, solution, targetUsers, platforms, coreFeatures } = context;

    let systemPrompt = "";
    let userPrompt = "";

    switch (fieldType) {
      case "title":
        systemPrompt = `You are a product naming expert. Create catchy, memorable project names.`;
        userPrompt = `Based on this information, suggest a great project title:

${pitch ? `**Pitch:** ${pitch}` : ""}
${problem ? `**Problem:** ${problem}` : ""}
${solution ? `**Solution:** ${solution}` : ""}

Create a clear, memorable project title (2-5 words). Make it professional yet catchy.

Return ONLY the title, nothing else.`;
        break;

      case "pitch":
        systemPrompt = `You are an expert at writing elevator pitches. Create compelling one-sentence descriptions.`;
        userPrompt = `Based on this project information, write a compelling elevator pitch (1-2 sentences):

${title ? `**Project Title:** ${title}` : ""}
${problem ? `**Problem:** ${problem}` : ""}
${solution ? `**Solution:** ${solution}` : ""}

Write a clear, compelling elevator pitch that explains what the product does and why it matters.

Return ONLY the pitch, nothing else.`;
        break;

      case "problem":
        systemPrompt = `You are a product strategist expert at identifying user problems and pain points.`;
        userPrompt = `Based on this project context, write a detailed problem statement:

${title ? `**Project Title:** ${title}` : ""}
${pitch ? `**Pitch:** ${pitch}` : ""}
${solution ? `**Solution:** ${solution}` : ""}

Write a clear problem statement (2-3 sentences) that:
1. Identifies who has the problem
2. Describes what the problem is
3. Explains why it matters

Return ONLY the problem statement, nothing else.`;
        break;

      case "solution":
        systemPrompt = `You are a product strategist expert at crafting solution descriptions.`;
        userPrompt = `Based on this project context, write a detailed solution description:

${title ? `**Project Title:** ${title}` : ""}
${pitch ? `**Pitch:** ${pitch}` : ""}
${problem ? `**Problem:** ${problem}` : ""}

Write a clear solution description (2-3 sentences) that:
1. Explains how the product solves the problem
2. Highlights unique approach or differentiation
3. Describes key benefits

Return ONLY the solution description, nothing else.`;
        break;

      case "userPersonas":
        systemPrompt = `You are an expert product manager creating detailed user personas based on project context.`;
        userPrompt = `Create 2-3 detailed, realistic user personas for this project:

**Project:** ${title}
**Pitch:** ${pitch || "Not provided"}
**Problem:** ${problem || "Not provided"}
**Solution:** ${solution || "Not provided"}
**Target Users:** ${targetUsers || "Not specified"}

For each persona, provide:
- **Name**: Realistic full name (e.g., "Sarah Chen", "Mike Rodriguez")
- **Role**: Specific job title or role
- **Goals**: 3-4 concrete, specific goals this persona wants to achieve
- **Pain Points**: 3-4 specific frustrations or challenges they face

Make personas realistic and specific to this product domain.`;
        break;

      case "competitors":
        systemPrompt = `You are an expert market researcher analyzing competitive landscape.`;
        userPrompt = `Identify 2-3 realistic competitors for this project:

**Project:** ${title}
**Pitch:** ${pitch || "Not provided"}
**Problem:** ${problem || "Not provided"}
**Solution:** ${solution || "Not provided"}

For each competitor, provide:
- **Name**: Actual company/product name if you know it, or create a realistic example
- **Strengths**: 3-4 key competitive advantages they have
- **Weaknesses**: 3-4 gaps or weaknesses we can exploit

Focus on realistic competitors in this product space.`;
        break;

      case "successMetrics":
        systemPrompt = `You are a product metrics expert. Based on the project information, suggest 3-5 specific, measurable success metrics (KPIs).`;
        userPrompt = `Project: ${title}
Pitch: ${pitch || "Not provided"}
Problem: ${problem || "Not provided"}
Solution: ${solution || "Not provided"}

Suggest 3-5 SMART success metrics (Specific, Measurable, Achievable, Relevant, Time-bound) for this project.

Format as a simple list (one per line), for example:
- Achieve 10,000 active users within 6 months
- Reduce customer support tickets by 30% in Q1
- Reach 90% user satisfaction score by end of year

Return just the list, one metric per line.`;
        break;

      case "coreFeatures":
        systemPrompt = `You are a product strategist. Based on the project information, suggest 5-8 core features that would solve the stated problem.`;
        userPrompt = `Project: ${title}
Pitch: ${pitch || "Not provided"}
Problem: ${problem || "Not provided"}
Solution: ${solution || "Not provided"}
Platforms: ${platforms?.join(", ") || "Not specified"}

Suggest 5-8 core features that this product should have to solve the problem effectively. Be specific and actionable.

Format as a simple list (one per line), for example:
- Real-time notifications
- Dashboard with analytics
- Mobile app for iOS and Android

Return just the list, one feature per line.`;
        break;

      case "constraints":
        systemPrompt = `You are a project manager identifying realistic constraints and limitations for a new project.`;
        userPrompt = `Project: ${title}
Pitch: ${pitch || "Not provided"}
Problem: ${problem || "Not provided"}
Solution: ${solution || "Not provided"}

Suggest 3-5 realistic constraints or limitations that this project might face (e.g., budget, timeline, technical, regulatory, resource constraints).

Format as a simple list (one per line), for example:
- Must comply with GDPR and data privacy regulations
- Limited to $50K initial budget
- 3-month timeline to MVP

Return just the list, one constraint per line.`;
        break;

      case "targetUsers":
        systemPrompt = `You are a market researcher identifying target user segments.`;
        userPrompt = `Project: ${title}
Pitch: ${pitch || "Not provided"}
Problem: ${problem || "Not provided"}
Solution: ${solution || "Not provided"}

Identify 2-4 specific target user segments or roles who would benefit from this product.

Format as a simple list (one per line), for example:
- Small business owners
- Marketing managers
- Freelance designers

Return just the list, one user segment per line.`;
        break;

      default:
        return NextResponse.json({ error: "Invalid fieldType" }, { status: 400 });
    }

    console.log(`[AI Suggest] Generating suggestions for ${fieldType}...`);

    let suggestion: any;

    // Use structured generation for JSON responses
    if (fieldType === "userPersonas") {
      suggestion = await generateStructured({
        schema: UserPersonasResponseSchema,
        schemaName: "UserPersonas",
        systemPrompt,
        userPrompt,
        config: {
          temperature: 0.7,
          maxTokens: 1500,
        },
      });
    } else if (fieldType === "competitors") {
      suggestion = await generateStructured({
        schema: CompetitorsResponseSchema,
        schemaName: "Competitors",
        systemPrompt,
        userPrompt,
        config: {
          temperature: 0.7,
          maxTokens: 1500,
        },
      });
    } else {
      // Use text generation for non-JSON responses
      suggestion = await generateText({
        systemPrompt,
        userPrompt,
        config: {
          temperature: 0.7,
          maxTokens: 1500,
        },
      });
    }

    console.log(`[AI Suggest] Generated suggestions for ${fieldType}`);

    return NextResponse.json({
      success: true,
      fieldType,
      suggestion: suggestion,
    });
  } catch (error: any) {
    console.error("[AI Suggest] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}
