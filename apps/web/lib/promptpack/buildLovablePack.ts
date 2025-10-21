import { PRD, FrontendSpec, UISpec } from "../zodSchemas";

/**
 * Build Lovable prompt pack
 * Optimized for Lovable.dev's frontend-focused workflow
 */

export function buildLovablePack(artifacts: {
  prd: PRD;
  frontendSpec: FrontendSpec;
  uiSpec: UISpec;
}): string {
  const sections: string[] = [];

  sections.push(`# ${artifacts.prd.title} - Lovable Prompt Pack`);
  sections.push(`\nGenerated: ${new Date().toISOString()}\n`);

  // Project Brief
  sections.push(`## Project Brief`);
  sections.push(artifacts.prd.overview);
  sections.push("");

  // Screens
  sections.push(`## Screens to Build`);
  artifacts.uiSpec.screens.forEach((screen, idx) => {
    sections.push(`### ${idx + 1}. ${screen.name}`);
    sections.push(`**Route**: ${screen.path}`);
    sections.push(`**Layout**: ${screen.layout || "default"}`);
    sections.push(`**Components**: ${screen.components.join(", ")}`);
    sections.push("");
  });

  // Design System
  sections.push(`## Design System`);
  sections.push(`Use the following design tokens:\n`);
  sections.push(`**Colors:**`);
  artifacts.uiSpec.designSystem.colors.forEach((color) => {
    sections.push(`- ${color.name}: ${color.hex}`);
  });
  sections.push("");
  sections.push(`**Typography:**`);
  artifacts.uiSpec.designSystem.typography.forEach((typo) => {
    sections.push(`- ${typo.name}: ${typo.fontSize}px, weight ${typo.fontWeight || 400}`);
  });
  sections.push("");
  sections.push(`**Spacing Scale**: ${artifacts.uiSpec.designSystem.spacing?.join(", ")}px`);
  sections.push("");

  // Component Library
  sections.push(`## Component Library`);
  artifacts.uiSpec.components.forEach((comp) => {
    sections.push(`### ${comp.name}`);
    if (comp.variants) {
      sections.push(`**Variants**: ${comp.variants.join(", ")}`);
    }
    if (comp.states) {
      sections.push(`**States**: ${comp.states.join(", ")}`);
    }
    sections.push("");
  });

  // User Flows
  sections.push(`## Key User Flows`);
  artifacts.prd.userStories.slice(0, 5).forEach((story) => {
    sections.push(`- ${story.story}`);
  });
  sections.push("");

  // Instructions
  sections.push(`## Lovable Usage`);
  sections.push(`1. Start with the design system above`);
  sections.push(`2. Build screens one by one following the layout specs`);
  sections.push(`3. Use the component library for consistency`);
  sections.push(`4. Test user flows against acceptance criteria`);
  sections.push("");

  return sections.join("\n");
}
