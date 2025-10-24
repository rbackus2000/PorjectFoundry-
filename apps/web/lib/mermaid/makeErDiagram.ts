import { BackendSpec, BackendEntity } from "../zodSchemas";

/**
 * Generate Mermaid ER Diagram from backend spec
 * Shows entities and relationships
 */

export function makeErDiagram(backendSpec: BackendSpec): string {
  const lines: string[] = ["erDiagram"];

  // Track relationships for later
  const relationships: Array<{ from: string; to: string; type: string }> = [];

  // Add entities
  for (const entity of backendSpec.entities) {
    lines.push(`  ${entity.name} {`);

    for (const field of entity.fields) {
      const typeStr = formatFieldType(field.type);
      const constraints: string[] = [];

      if (field.required) constraints.push("required");
      if (field.unique) constraints.push("unique");
      if (field.relation) {
        // Parse relation (e.g., "User.id")
        const [relatedEntity] = field.relation.split(".");
        relationships.push({
          from: entity.name,
          to: relatedEntity,
          type: "||--o{", // Many-to-one by default
        });
      }

      // Add constraints as comment if present (Mermaid ERD syntax)
      const constraintComment = constraints.length > 0 ? ` "${constraints.join(", ")}"` : "";
      lines.push(`    ${typeStr} ${field.name}${constraintComment}`);
    }

    lines.push(`  }`);
  }

  // Add relationships
  for (const rel of relationships) {
    lines.push(`  ${rel.to} ${rel.type} ${rel.from} : "has"`);
  }

  return lines.join("\n");
}

/**
 * Map our type system to Mermaid/SQL types
 */
function formatFieldType(type: string): string {
  const typeMap: Record<string, string> = {
    string: "string",
    number: "int",
    boolean: "boolean",
    date: "datetime",
  };
  return typeMap[type] || type;
}
