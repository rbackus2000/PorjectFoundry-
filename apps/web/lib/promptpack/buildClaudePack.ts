import { PRD, BackendSpec, FrontendSpec, UISpec } from "../zodSchemas";

/**
 * Build Claude Code prompt pack
 * Generates master.claude-code.md optimized for Claude Code workflow
 */

export function buildClaudePack(artifacts: {
  prd: PRD;
  backendSpec: BackendSpec;
  frontendSpec: FrontendSpec;
  uiSpec: UISpec;
  mermaidFlow: string;
  mermaidERD: string;
}): string {
  const sections: string[] = [];

  // Header
  sections.push(`# ${artifacts.prd.title} - Claude Code Prompt Pack`);
  sections.push(`\nGenerated: ${new Date().toISOString()}\n`);

  // System Context
  sections.push(`## System Context`);
  sections.push(`You are building: **${artifacts.prd.title}**`);
  sections.push(artifacts.prd.overview);
  sections.push("");

  // Architecture
  sections.push(`## Architecture`);
  sections.push("```mermaid");
  sections.push(artifacts.mermaidFlow);
  sections.push("```");
  sections.push("");

  // Data Model
  sections.push(`## Data Model`);
  sections.push("```mermaid");
  sections.push(artifacts.mermaidERD);
  sections.push("```");
  sections.push("");

  // Backend Specification
  sections.push(`## Backend Specification`);
  sections.push(`**Entities (${artifacts.backendSpec.entities.length}):**`);
  artifacts.backendSpec.entities.forEach((entity) => {
    sections.push(`- ${entity.name}: ${entity.fields.map((f) => f.name).join(", ")}`);
  });
  sections.push("");
  sections.push(`**APIs (${artifacts.backendSpec.apis.length}):**`);
  artifacts.backendSpec.apis.forEach((api) => {
    sections.push(`- ${api.method} ${api.path}: ${api.description}`);
  });
  sections.push("");

  // Frontend Specification
  sections.push(`## Frontend Specification`);
  sections.push(`**Routes:**`);
  artifacts.frontendSpec.routes.forEach((route) => {
    sections.push(`- ${route.path} (${route.component})${route.auth ? " 🔒" : ""}`);
  });
  sections.push("");
  sections.push(`**Components (${artifacts.frontendSpec.components.length}):**`);
  artifacts.frontendSpec.components.forEach((comp) => {
    sections.push(`- ${comp.name} (${comp.type}): ${comp.description}`);
  });
  sections.push("");

  // UI Design System
  sections.push(`## UI Design System`);
  sections.push(`**Palette:**`);
  artifacts.uiSpec.designSystem.colors.slice(0, 6).forEach((color) => {
    sections.push(`- ${color.name}: ${color.hex}`);
  });
  sections.push("");
  sections.push(`**Typography:**`);
  artifacts.uiSpec.designSystem.typography.forEach((typo) => {
    sections.push(`- ${typo.name}: ${typo.fontSize}px / ${typo.lineHeight}`);
  });
  sections.push("");

  // User Stories
  sections.push(`## User Stories (Backlog)`);
  artifacts.prd.userStories.forEach((story, idx) => {
    sections.push(`${idx + 1}. **${story.id}**: ${story.story}`);
  });
  sections.push("");

  // Usage Instructions
  sections.push(`## Usage with Claude Code`);
  sections.push(`1. Place this file in your project root`);
  sections.push(`2. Reference sections when implementing features`);
  sections.push(`3. Use the data model and API specs to ensure consistency`);
  sections.push(`4. Follow the design system for all UI components`);
  sections.push("");

  return sections.join("\n");
}
