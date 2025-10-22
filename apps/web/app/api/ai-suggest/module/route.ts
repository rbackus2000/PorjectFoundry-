import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/llm/openai";

export async function POST(request: NextRequest) {
  try {
    const { moduleName, category, description, allModules, projectTitle } = await request.json();

    // Build context from all modules
    const moduleContext = allModules
      .map((m: any) => `- ${m.label} (${m.category || 'General'}): ${m.description || 'No description'}`)
      .join('\n');

    // Determine what to generate based on module name and category
    const systemPrompt = `You are an expert content generator for software projects. Based on the module name and project context, generate appropriate, actionable content that developers can immediately use.

**Guidelines:**
- For "Video Tutorial" or "Tutorial" modules: Generate detailed video scripts with scene descriptions, narration, and visuals
- For "Documentation" or "API" modules: Generate comprehensive technical documentation
- For "Email Templates" or "Notification" modules: Generate actual email/notification templates
- For "User Stories" or "Requirements" modules: Generate detailed user stories with acceptance criteria
- For "Test" modules: Generate test cases and scenarios
- For UI/Frontend modules: Generate component specifications and user flows
- For Backend/API modules: Generate endpoint specifications and data models
- For any other module: Generate practical, implementable content relevant to that module type

Be specific, detailed, and provide actionable content that can be directly used or adapted.`;

    const userPrompt = `Generate practical, implementable content for the following module:

**Project:** ${projectTitle || 'Untitled Project'}

**Module Name:** ${moduleName}
**Category:** ${category || 'General'}
**Description:** ${description || 'No description provided'}

**All Project Modules:**
${moduleContext}

Based on the module name "${moduleName}" and the overall project context, generate appropriate content.

- If this is a tutorial/training module, create 3-5 detailed video scripts with scene breakdowns, narration, and visual descriptions
- If this is a documentation module, create comprehensive technical documentation
- If this is an email/notification module, create actual email templates
- If this is a testing module, create detailed test cases
- For any other type, generate the most useful and practical content for that module type

Format your response as JSON with this structure:
{
  "contentType": "Video Scripts" | "Documentation" | "Email Templates" | "Test Cases" | "Component Specs" | "API Specs" | "User Stories" | "General Content",
  "items": [
    {
      "title": "Item title",
      "content": "Detailed content here...",
      "metadata": "Any additional metadata (duration, priority, etc.)"
    }
  ]
}

Make it comprehensive and immediately usable.`;

    const result = await generateText({
      systemPrompt,
      userPrompt,
      config: {
        maxTokens: 4000,
      },
    });

    // Parse the JSON response
    let parsedResult;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = result.match(/```json\n?([\s\S]*?)\n?```/) || result.match(/```\n?([\s\S]*?)\n?```/);
      const jsonString = jsonMatch ? jsonMatch[1] : result;
      parsedResult = JSON.parse(jsonString);
    } catch (parseError) {
      // If parsing fails, return raw text as a single item
      parsedResult = {
        contentType: "Generated Content",
        items: [
          {
            title: `${moduleName} Content`,
            content: result,
            metadata: "Auto-generated",
          },
        ],
      };
    }

    return NextResponse.json(parsedResult);
  } catch (error) {
    console.error("AI module generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate module content" },
      { status: 500 }
    );
  }
}
