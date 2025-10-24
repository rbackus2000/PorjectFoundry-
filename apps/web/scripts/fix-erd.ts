import { PrismaClient } from "@prisma/client";
import { makeErDiagram } from "../lib/mermaid/makeErDiagram";

const prisma = new PrismaClient();

const backendSpec = {
  entities: [
    {
      name: "users",
      fields: [
        { name: "id", type: "uuid", required: true, unique: true, relation: "" },
        { name: "email", type: "string", required: true, unique: true, relation: "" },
        { name: "password_hash", type: "string", required: true, unique: false, relation: "" },
        { name: "name", type: "string", required: true, unique: false, relation: "" },
        { name: "date_of_birth", type: "date", required: true, unique: false, relation: "" },
        { name: "created_at", type: "timestamp", required: true, unique: false, relation: "" }
      ],
      indexes: ["email"]
    },
    {
      name: "health_assessments",
      fields: [
        { name: "id", type: "uuid", required: true, unique: true, relation: "" },
        { name: "user_id", type: "uuid", required: true, unique: false, relation: "users.id" },
        { name: "assessment_data", type: "json", required: true, unique: false, relation: "" },
        { name: "created_at", type: "timestamp", required: true, unique: false, relation: "" }
      ],
      indexes: ["user_id"]
    },
    {
      name: "workout_plans",
      fields: [
        { name: "id", type: "uuid", required: true, unique: true, relation: "" },
        { name: "user_id", type: "uuid", required: true, unique: false, relation: "users.id" },
        { name: "plan_data", type: "json", required: true, unique: false, relation: "" },
        { name: "created_at", type: "timestamp", required: true, unique: false, relation: "" }
      ],
      indexes: ["user_id"]
    },
    {
      name: "workout_sessions",
      fields: [
        { name: "id", type: "uuid", required: true, unique: true, relation: "" },
        { name: "user_id", type: "uuid", required: true, unique: false, relation: "users.id" },
        { name: "session_data", type: "json", required: true, unique: false, relation: "" },
        { name: "created_at", type: "timestamp", required: true, unique: false, relation: "" }
      ],
      indexes: ["user_id"]
    },
    {
      name: "alerts",
      fields: [
        { name: "id", type: "uuid", required: true, unique: true, relation: "" },
        { name: "user_id", type: "uuid", required: true, unique: false, relation: "users.id" },
        { name: "alert_type", type: "string", required: true, unique: false, relation: "" },
        { name: "alert_data", type: "json", required: true, unique: false, relation: "" },
        { name: "created_at", type: "timestamp", required: true, unique: false, relation: "" }
      ],
      indexes: ["user_id"]
    }
  ]
};

async function main() {
  console.log("Generating corrected ERD...");
  const erdContent = makeErDiagram(backendSpec as any);
  console.log("Generated ERD:");
  console.log(erdContent);
  console.log("\nUpdating database...");

  await prisma.artifact.upsert({
    where: {
      projectId_type: {
        projectId: "cmh2r99cn0000133fkojsehio",
        type: "Mermaid_ERD"
      }
    },
    update: {
      content: erdContent,
      version: { increment: 1 }
    },
    create: {
      projectId: "cmh2r99cn0000133fkojsehio",
      type: "Mermaid_ERD",
      content: erdContent,
      version: 1
    }
  });

  console.log("✅ ERD artifact updated successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
