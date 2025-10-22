/**
 * Maps PRD feature names/descriptions to semantic categories
 * Used to ensure AI-generated modules have proper styling
 */

export type ModuleCategory =
  | "Authentication"
  | "Backend"
  | "Frontend"
  | "UI/UX"
  | "Analytics"
  | "AI/ML"
  | "Integration"
  | "Payment"
  | "Security"
  | "Data";

/**
 * Analyze feature title and description to determine best category match
 */
export function mapFeatureToCategory(
  title: string,
  description?: string
): ModuleCategory {
  const text = `${title} ${description || ""}`.toLowerCase();

  // Authentication keywords
  if (
    text.match(
      /\b(auth|login|signup|sign-up|sign-in|signin|oauth|sso|password|session|token|jwt)\b/
    )
  ) {
    return "Authentication";
  }

  // Security keywords
  if (
    text.match(
      /\b(security|encryption|2fa|mfa|multi-factor|rbac|permission|role|access control|firewall)\b/
    )
  ) {
    return "Security";
  }

  // Payment keywords
  if (
    text.match(
      /\b(payment|billing|subscription|stripe|paypal|checkout|invoice|receipt|pricing|plan)\b/
    )
  ) {
    return "Payment";
  }

  // AI/ML keywords
  if (
    text.match(
      /\b(ai|ml|machine learning|gpt|chatbot|bot|recommendation|sentiment|nlp|neural|model)\b/
    )
  ) {
    return "AI/ML";
  }

  // Analytics keywords
  if (
    text.match(
      /\b(analytics|metrics|reporting|report|dashboard|chart|graph|visualization|kpi|stats|tracking)\b/
    )
  ) {
    return "Analytics";
  }

  // Data keywords
  if (
    text.match(
      /\b(database|storage|file|upload|download|s3|cdn|cache|backup|export|import|data)\b/
    )
  ) {
    return "Data";
  }

  // Integration keywords
  if (
    text.match(
      /\b(integration|api|webhook|notification|email|sms|push|slack|discord|third-party|external)\b/
    )
  ) {
    return "Integration";
  }

  // UI/UX keywords
  if (
    text.match(
      /\b(ui|ux|design|theme|layout|navigation|menu|modal|dialog|toast|onboarding|wizard|settings)\b/
    )
  ) {
    return "UI/UX";
  }

  // Frontend keywords
  if (
    text.match(
      /\b(frontend|component|page|view|form|input|button|profile|search|comment|editor)\b/
    )
  ) {
    return "Frontend";
  }

  // Backend keywords (default for anything else)
  if (
    text.match(
      /\b(backend|server|endpoint|crud|admin|management|service|worker|job|queue)\b/
    )
  ) {
    return "Backend";
  }

  // Default fallback
  return "Backend";
}

/**
 * Map multiple features to categories with smart edge suggestions
 */
export function mapFeaturesWithRelationships(
  features: Array<{ title: string; description?: string }>
): Array<{
  title: string;
  description?: string;
  category: ModuleCategory;
  suggestedConnections: number[]; // indices of related features
}> {
  const mappedFeatures = features.map((feature, index) => ({
    ...feature,
    category: mapFeatureToCategory(feature.title, feature.description),
    suggestedConnections: [] as number[],
  }));

  // Auto-suggest connections based on common patterns
  mappedFeatures.forEach((feature, index) => {
    const category = feature.category;

    // Authentication connects to most user-facing features
    if (category === "Authentication") {
      mappedFeatures.forEach((other, otherIndex) => {
        if (
          otherIndex !== index &&
          (other.category === "Frontend" ||
            other.category === "UI/UX" ||
            other.category === "Analytics")
        ) {
          feature.suggestedConnections.push(otherIndex);
        }
      });
    }

    // Payment connects to billing/subscription features
    if (category === "Payment") {
      mappedFeatures.forEach((other, otherIndex) => {
        if (
          otherIndex !== index &&
          (other.title.toLowerCase().includes("subscription") ||
            other.title.toLowerCase().includes("billing") ||
            other.title.toLowerCase().includes("checkout"))
        ) {
          feature.suggestedConnections.push(otherIndex);
        }
      });
    }

    // Analytics connects to data sources
    if (category === "Analytics") {
      mappedFeatures.forEach((other, otherIndex) => {
        if (
          otherIndex !== index &&
          (other.category === "Data" || other.category === "Backend")
        ) {
          feature.suggestedConnections.push(otherIndex);
        }
      });
    }

    // Frontend connects to Backend
    if (category === "Frontend") {
      mappedFeatures.forEach((other, otherIndex) => {
        if (otherIndex !== index && other.category === "Backend") {
          feature.suggestedConnections.push(otherIndex);
        }
      });
    }
  });

  return mappedFeatures;
}
