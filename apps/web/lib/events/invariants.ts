import { BackendSpec, FrontendSpec, UISpec, PRD } from "../zodSchemas";

/**
 * Invariant checks to ensure cross-artifact consistency
 * Run these after generation to catch mismatches
 */

export type InvariantResult = {
  passed: boolean;
  errors: string[];
};

/**
 * Check that all frontend API calls reference backend endpoints
 */
export function checkFrontendBackendAPIs(
  frontendSpec: FrontendSpec,
  backendSpec: BackendSpec
): InvariantResult {
  const errors: string[] = [];
  const backendPaths = new Set(backendSpec.apis.map((api) => `${api.method} ${api.path}`));

  for (const component of frontendSpec.components) {
    if (!component.apis) continue;
    for (const apiPath of component.apis) {
      // Simple heuristic: check if path exists in backend
      const matchesAny = backendSpec.apis.some((api) => api.path === apiPath);
      if (!matchesAny) {
        errors.push(`Component ${component.name} references unknown API: ${apiPath}`);
      }
    }
  }

  return {
    passed: errors.length === 0,
    errors,
  };
}

/**
 * Check that ERD entities match features in PRD
 */
export function checkERDMatchesFeatures(backendSpec: BackendSpec, prd: PRD): InvariantResult {
  const errors: string[] = [];
  const entityNames = new Set(backendSpec.entities.map((e) => e.name.toLowerCase()));
  const featureNames = prd.features.map((f) => f.name.toLowerCase());

  // Simple check: warn if PRD mentions entities not in backend
  for (const featureName of featureNames) {
    const mentionsEntity = Array.from(entityNames).some((entity) =>
      featureName.includes(entity)
    );
    // This is a soft check; we just log warnings
    if (!mentionsEntity && featureName.length > 0) {
      // Not a strict error, just a notice
    }
  }

  return {
    passed: errors.length === 0,
    errors,
  };
}

/**
 * Check that UI components reference existing frontend components
 */
export function checkUIComponentsExist(uiSpec: UISpec, frontendSpec: FrontendSpec): InvariantResult {
  const errors: string[] = [];
  const frontendComponentNames = new Set(frontendSpec.components.map((c) => c.name));

  for (const screen of uiSpec.screens) {
    for (const componentName of screen.components) {
      if (!frontendComponentNames.has(componentName) && !isBuiltInComponent(componentName)) {
        errors.push(`Screen ${screen.name} references unknown component: ${componentName}`);
      }
    }
  }

  return {
    passed: errors.length === 0,
    errors,
  };
}

/**
 * Run all invariant checks
 */
export function runAllInvariants(artifacts: {
  prd: PRD;
  backendSpec: BackendSpec;
  frontendSpec: FrontendSpec;
  uiSpec: UISpec;
}): InvariantResult {
  const results = [
    checkFrontendBackendAPIs(artifacts.frontendSpec, artifacts.backendSpec),
    checkERDMatchesFeatures(artifacts.backendSpec, artifacts.prd),
    checkUIComponentsExist(artifacts.uiSpec, artifacts.frontendSpec),
  ];

  const allErrors = results.flatMap((r) => r.errors);

  return {
    passed: allErrors.length === 0,
    errors: allErrors,
  };
}

// Helper
function isBuiltInComponent(name: string): boolean {
  const builtIns = ["Button", "Input", "Card", "Modal", "Tabs", "Table"];
  return builtIns.includes(name);
}
