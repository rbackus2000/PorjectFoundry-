import { FrontendSpec, PRD, BackendSpec, ProjectGraph } from "../zodSchemas";

/**
 * Frontend Agent
 * Generates frontend specifications from PRD and backend spec
 */

export type FEInput = {
  prd: PRD;
  backendSpec: BackendSpec;
  graph: ProjectGraph;
};

export const feAgent = {
  async generate(input: FEInput): Promise<FrontendSpec> {
    // TODO: Replace with actual LLM call
    // For now, return a stub FrontendSpec

    const frontendSpec: FrontendSpec = {
      routes: [
        {
          path: "/",
          component: "HomePage",
          auth: false,
        },
        {
          path: "/dashboard",
          component: "DashboardPage",
          auth: true,
        },
        {
          path: "/projects/:id",
          component: "ProjectDetailPage",
          auth: true,
        },
        {
          path: "/settings",
          component: "SettingsPage",
          auth: true,
        },
      ],
      components: [
        {
          name: "HomePage",
          type: "page",
          description: "Landing page with hero and CTA",
          props: [],
        },
        {
          name: "DashboardPage",
          type: "page",
          description: "User dashboard showing projects",
          apis: ["/api/projects"],
          state: ["projects", "loading"],
        },
        {
          name: "ProjectDetailPage",
          type: "page",
          description: "Detail view for a single project",
          apis: ["/api/projects/:id"],
          state: ["project", "loading"],
        },
        {
          name: "ProjectCard",
          type: "component",
          description: "Card component to display project summary",
          props: [
            { name: "title", type: "string", required: true },
            { name: "description", type: "string", required: false },
          ],
        },
        {
          name: "NavBar",
          type: "layout",
          description: "Top navigation bar",
          props: [],
        },
      ],
      stateManagement: "useState",
      styling: "tailwind",
    };

    return frontendSpec;
  },
};
