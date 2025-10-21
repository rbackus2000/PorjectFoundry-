import { PRD, BackendSpec, FrontendSpec, UISpec } from "../zodSchemas";

/**
 * Build Cursor prompt pack
 * Generates master.cursor.md with comprehensive project context
 */

export function buildCursorPack(artifacts: {
  prd: PRD;
  backendSpec: BackendSpec;
  frontendSpec: FrontendSpec;
  uiSpec: UISpec;
  mermaidFlow: string;
  mermaidERD: string;
}): string {
  const sections: string[] = [];

  // Header
  sections.push(`# ${artifacts.prd.title} - Cursor Prompt Pack`);
  sections.push(`\nGenerated: ${new Date().toISOString()}\n`);

  // Project Overview
  sections.push(`## Project Overview`);
  sections.push(artifacts.prd.overview);
  sections.push("");

  // Goals
  sections.push(`## Goals`);
  artifacts.prd.goals.forEach((goal) => {
    sections.push(`- ${goal}`);
  });
  sections.push("");

  // Tech Stack
  sections.push(`## Tech Stack`);
  sections.push(`- **Frontend**: ${artifacts.frontendSpec.styling || "TBD"}, ${artifacts.frontendSpec.stateManagement || "React"}`);
  sections.push(`- **Backend**: Node.js / Express (or framework TBD)`);
  sections.push(`- **Database**: Prisma + PostgreSQL`);
  sections.push("");

  // Database Schema
  sections.push(`## Database Schema`);
  sections.push("```mermaid");
  sections.push(artifacts.mermaidERD);
  sections.push("```");
  sections.push("");

  // Backend APIs
  sections.push(`## Backend APIs`);
  artifacts.backendSpec.apis.forEach((api) => {
    sections.push(`### ${api.method} ${api.path}`);
    sections.push(api.description);
    if (api.auth) sections.push("**Auth required**: Yes");
    sections.push("");
  });

  // Frontend Routes
  sections.push(`## Frontend Routes`);
  artifacts.frontendSpec.routes.forEach((route) => {
    sections.push(`- **${route.path}** → ${route.component} ${route.auth ? "(Protected)" : ""}`);
  });
  sections.push("");

  // User Stories
  sections.push(`## User Stories`);
  artifacts.prd.userStories.forEach((story) => {
    sections.push(`### ${story.id}: ${story.story}`);
    sections.push(`**Acceptance Criteria:**`);
    story.acceptanceCriteria.forEach((ac) => {
      sections.push(`- ${ac}`);
    });
    sections.push("");
  });

  // Design System
  sections.push(`## Design System`);
  sections.push(`### Colors`);
  artifacts.uiSpec.designSystem.colors.forEach((color) => {
    sections.push(`- **${color.name}**: ${color.hex} - ${color.usage || ""}`);
  });
  sections.push("");

  // Implementation Notes
  sections.push(`## Implementation Notes`);
  sections.push(`Use this pack with Cursor by:`);
  sections.push(`1. Adding this file to your project root as \`.cursorrules\` or reference it in prompts`);
  sections.push(`2. Ask Cursor to implement features referencing the PRD sections above`);
  sections.push(`3. Ensure all APIs match the backend spec`);
  sections.push("");

  return sections.join("\n");
}
