import { UISpec, PRD, FrontendSpec } from "../zodSchemas";

/**
 * UI Agent
 * Generates UI specifications for Figma plugin
 */

export type UIInput = {
  prd: PRD;
  frontendSpec: FrontendSpec;
};

export const uiAgent = {
  async generate(input: UIInput): Promise<UISpec> {
    // TODO: Replace with actual LLM call
    // For now, return a stub UISpec

    const uiSpec: UISpec = {
      designSystem: {
        colors: [
          { name: "Primary", hex: "#2563EB", usage: "Primary actions, links" },
          { name: "Secondary", hex: "#64748B", usage: "Secondary actions" },
          { name: "Background", hex: "#FAFAFA", usage: "Page background" },
          { name: "Surface", hex: "#FFFFFF", usage: "Card backgrounds" },
          { name: "Text", hex: "#0F172A", usage: "Primary text" },
          { name: "Subtext", hex: "#475569", usage: "Secondary text" },
        ],
        typography: [
          { name: "Heading 1", fontSize: 32, lineHeight: 1.2, fontWeight: 600 },
          { name: "Heading 2", fontSize: 24, lineHeight: 1.2, fontWeight: 600 },
          { name: "Body", fontSize: 16, lineHeight: 1.5, fontWeight: 400 },
          { name: "Caption", fontSize: 14, lineHeight: 1.4, fontWeight: 400 },
        ],
        spacing: [4, 8, 12, 16, 20, 24, 32, 48],
        borderRadius: [4, 8, 12, 16],
      },
      components: [
        {
          name: "Button",
          type: "Button",
          variants: ["primary", "secondary", "outline", "ghost"],
          states: ["default", "hover", "active", "disabled"],
        },
        {
          name: "Card",
          type: "Card",
          variants: ["default", "elevated"],
          states: ["default", "hover"],
        },
        {
          name: "Input",
          type: "Input",
          states: ["default", "focus", "error", "disabled"],
        },
      ],
      screens: input.frontendSpec.routes.map((route) => ({
        name: route.component,
        path: route.path,
        components: ["NavBar", "Button", "Card"],
        layout: "single-column",
      })),
    };

    return uiSpec;
  },
};
