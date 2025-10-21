import { PRD, BackendSpec, FrontendSpec } from "../zodSchemas";

/**
 * Build Bolt.new prompt pack
 * Optimized for Bolt.new's full-stack rapid prototyping
 */

export function buildBoltPack(artifacts: {
  prd: PRD;
  backendSpec: BackendSpec;
  frontendSpec: FrontendSpec;
}): string {
  const sections: string[] = [];

  sections.push(`# ${artifacts.prd.title} - Bolt.new Prompt Pack`);
  sections.push(`\nGenerated: ${new Date().toISOString()}\n`);

  // Quick Start
  sections.push(`## Quick Start`);
  sections.push(`Build a full-stack app for: **${artifacts.prd.title}**`);
  sections.push(artifacts.prd.overview);
  sections.push("");

  // Tech Stack
  sections.push(`## Tech Stack`);
  sections.push(`- Frontend: React + ${artifacts.frontendSpec.styling || "Tailwind"}`);
  sections.push(`- State: ${artifacts.frontendSpec.stateManagement || "useState"}`);
  sections.push(`- Backend: Express.js`);
  sections.push(`- Database: In-memory (prototype) or SQLite`);
  sections.push("");

  // Features Checklist
  sections.push(`## Features to Implement`);
  artifacts.prd.features.forEach((feature, idx) => {
    sections.push(`${idx + 1}. **${feature.name}** (${feature.priority})`);
    sections.push(`   ${feature.description}`);
  });
  sections.push("");

  // API Endpoints
  sections.push(`## API Endpoints`);
  artifacts.backendSpec.apis.forEach((api) => {
    sections.push(`- \`${api.method} ${api.path}\`: ${api.description}`);
  });
  sections.push("");

  // Pages
  sections.push(`## Pages / Routes`);
  artifacts.frontendSpec.routes.forEach((route) => {
    sections.push(`- \`${route.path}\` → ${route.component}${route.auth ? " (Auth)" : ""}`);
  });
  sections.push("");

  // Data Schema
  sections.push(`## Data Schema (Simplified)`);
  artifacts.backendSpec.entities.forEach((entity) => {
    sections.push(`### ${entity.name}`);
    sections.push("```javascript");
    sections.push(`{`);
    entity.fields.forEach((field) => {
      sections.push(`  ${field.name}: ${field.type}, // ${field.required ? "required" : "optional"}`);
    });
    sections.push(`}`);
    sections.push("```");
    sections.push("");
  });

  // MVP Scope
  sections.push(`## MVP Scope`);
  sections.push(`Focus on P0 features first:`);
  const p0Features = artifacts.prd.features.filter((f) => f.priority === "P0");
  p0Features.forEach((f) => {
    sections.push(`- ${f.name}`);
  });
  sections.push("");

  // Instructions
  sections.push(`## Bolt Usage`);
  sections.push(`1. Copy this entire pack into Bolt.new`);
  sections.push(`2. Ask Bolt to scaffold the project structure`);
  sections.push(`3. Implement features incrementally, testing each`);
  sections.push(`4. Iterate based on feedback`);
  sections.push("");

  return sections.join("\n");
}
