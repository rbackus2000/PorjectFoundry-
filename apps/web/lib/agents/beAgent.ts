import { BackendSpec, PRD, ProjectGraph } from "../zodSchemas";

/**
 * Backend Agent
 * Generates backend specifications from PRD and graph
 */

export type BEInput = {
  prd: PRD;
  graph: ProjectGraph;
};

export const beAgent = {
  async generate(input: BEInput): Promise<BackendSpec> {
    // TODO: Replace with actual LLM call
    // For now, return a stub BackendSpec

    const backendSpec: BackendSpec = {
      entities: [
        {
          name: "User",
          fields: [
            { name: "id", type: "string", required: true, unique: true },
            { name: "email", type: "string", required: true, unique: true },
            { name: "name", type: "string", required: true },
            { name: "createdAt", type: "date", required: true },
          ],
          indexes: ["email"],
        },
        {
          name: "Project",
          fields: [
            { name: "id", type: "string", required: true, unique: true },
            { name: "title", type: "string", required: true },
            { name: "userId", type: "string", required: true, relation: "User.id" },
            { name: "createdAt", type: "date", required: true },
          ],
          indexes: ["userId"],
        },
      ],
      apis: [
        {
          method: "GET",
          path: "/api/users/:id",
          description: "Get user by ID",
          auth: true,
        },
        {
          method: "POST",
          path: "/api/projects",
          description: "Create a new project",
          auth: true,
          body: {
            title: "string",
            description: "string",
          },
        },
        {
          method: "GET",
          path: "/api/projects",
          description: "List user's projects",
          auth: true,
        },
      ],
      jobs: [
        {
          name: "sendDailyDigest",
          trigger: "cron:0 9 * * *",
          description: "Send daily digest email to users",
        },
      ],
      integrations: [],
    };

    return backendSpec;
  },
};
