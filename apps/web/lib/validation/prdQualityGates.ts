import { PRD } from "../zodSchemas";

/**
 * BuildBridge Enterprise PRD Quality Gates
 * Block PRD finalization if any gate fails
 */

export type QualityGateResult = {
  passed: boolean;
  gate: string;
  message: string;
  severity: "error" | "warning";
};

export type QualityGateReport = {
  passed: boolean;
  results: QualityGateResult[];
  score: number; // 0-100
};

/**
 * Validate PRD against enterprise quality gates
 */
export function validatePRDQualityGates(prd: PRD): QualityGateReport {
  const results: QualityGateResult[] = [];

  // Gate 1: Meta section present with version
  if (!prd.meta || !prd.meta.version) {
    results.push({
      passed: false,
      gate: "Meta.Version",
      message: "Meta section must include version (semver format)",
      severity: "error",
    });
  } else if (!/^\d+\.\d+(\.\d+)?$/.test(prd.meta.version)) {
    results.push({
      passed: false,
      gate: "Meta.Version",
      message: `Version must be semver format (got: ${prd.meta.version})`,
      severity: "error",
    });
  } else {
    results.push({
      passed: true,
      gate: "Meta.Version",
      message: "Meta version present and valid",
      severity: "error",
    });
  }

  // Gate 2: No vague NFRs - must have numbers
  if (prd.nfr) {
    const hasAvailability = typeof prd.nfr.availability === "number";
    const hasLatencyRead = typeof prd.nfr.latencyP95ReadMs === "number";
    const hasLatencyWrite = typeof prd.nfr.latencyP95WriteMs === "number";

    if (!hasAvailability || !hasLatencyRead || !hasLatencyWrite) {
      results.push({
        passed: false,
        gate: "NFR.Quantified",
        message: "NFRs must include numeric values for availability, latencyP95ReadMs, latencyP95WriteMs",
        severity: "error",
      });
    } else {
      results.push({
        passed: true,
        gate: "NFR.Quantified",
        message: "NFRs are properly quantified",
        severity: "error",
      });
    }
  } else {
    results.push({
      passed: false,
      gate: "NFR.Present",
      message: "Enhanced NFR section (nfr) is missing",
      severity: "warning",
    });
  }

  // Gate 3: P0 features must have ≥3 acceptance criteria
  const p0Features = prd.features.filter((f) => f.priority === "P0");
  const p0FeaturesWithAC = p0Features.filter((f) => f.acceptanceCriteria && f.acceptanceCriteria.length >= 3);

  if (p0Features.length > 0 && p0FeaturesWithAC.length < p0Features.length) {
    results.push({
      passed: false,
      gate: "Features.AcceptanceCriteria",
      message: `${p0Features.length - p0FeaturesWithAC.length} P0 feature(s) have fewer than 3 acceptance criteria`,
      severity: "error",
    });
  } else {
    results.push({
      passed: true,
      gate: "Features.AcceptanceCriteria",
      message: "All P0 features have ≥3 acceptance criteria",
      severity: "error",
    });
  }

  // Gate 4: Metrics must be quantified (ACTIVATION IS REQUIRED!)
  if (!prd.metrics) {
    results.push({
      passed: false,
      gate: "Metrics.Present",
      message: "Metrics section is REQUIRED (must include activationD2, retentionW4, retentionM3)",
      severity: "error",
    });
  } else {
    const hasActivation = prd.metrics.activationD2 && typeof prd.metrics.activationD2.targetPct === "number";
    const hasRetentionW4 = prd.metrics.retentionW4 && typeof prd.metrics.retentionW4.targetPct === "number";
    const hasRetentionM3 = prd.metrics.retentionM3 && typeof prd.metrics.retentionM3.targetPct === "number";

    if (!hasActivation) {
      results.push({
        passed: false,
        gate: "Metrics.Activation",
        message: "activationD2 metric is REQUIRED (critical enterprise requirement)",
        severity: "error",
      });
    }

    if (!hasRetentionW4 || !hasRetentionM3) {
      results.push({
        passed: false,
        gate: "Metrics.Retention",
        message: "Retention metrics (retentionW4, retentionM3) must include numeric targetPct",
        severity: "error",
      });
    }

    if (hasActivation && hasRetentionW4 && hasRetentionM3) {
      // Check for realistic values
      const unrealisticMetrics = [];
      if (prd.metrics.retentionW4.targetPct > 0.5) {
        unrealisticMetrics.push(`retentionW4 ${prd.metrics.retentionW4.targetPct} (should be 0.35-0.45)`);
      }
      if (prd.metrics.retentionM3.targetPct > 0.35) {
        unrealisticMetrics.push(`retentionM3 ${prd.metrics.retentionM3.targetPct} (should be 0.25-0.30)`);
      }

      if (unrealisticMetrics.length > 0) {
        results.push({
          passed: false,
          gate: "Metrics.Realistic",
          message: `Unrealistic metric targets: ${unrealisticMetrics.join(", ")}`,
          severity: "warning",
        });
      } else {
        results.push({
          passed: true,
          gate: "Metrics.Quantified",
          message: "Metrics are properly quantified and realistic",
          severity: "error",
        });
      }
    }
  }

  // Gate 5: Roadmap must have dates in YYYY-MM-DD format
  if (prd.roadmap) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const hasMvp = prd.roadmap.mvpFreeze && dateRegex.test(prd.roadmap.mvpFreeze);
    const hasBeta = prd.roadmap.beta && dateRegex.test(prd.roadmap.beta);

    if (!hasMvp || !hasBeta) {
      results.push({
        passed: false,
        gate: "Roadmap.Dates",
        message: "Roadmap must include mvpFreeze and beta dates in YYYY-MM-DD format",
        severity: "error",
      });
    } else {
      // Check dates are in the future
      const mvpDate = new Date(prd.roadmap.mvpFreeze);
      const betaDate = new Date(prd.roadmap.beta);
      const today = new Date();

      if (mvpDate < today || betaDate < today) {
        results.push({
          passed: false,
          gate: "Roadmap.Dates",
          message: "Roadmap dates must be in the future",
          severity: "error",
        });
      } else if (betaDate < mvpDate) {
        results.push({
          passed: false,
          gate: "Roadmap.Dates",
          message: "Beta date must be after MVP freeze date",
          severity: "error",
        });
      } else {
        results.push({
          passed: true,
          gate: "Roadmap.Dates",
          message: "Roadmap dates are valid",
          severity: "error",
        });
      }
    }
  } else {
    results.push({
      passed: false,
      gate: "Roadmap.Present",
      message: "Roadmap section is missing",
      severity: "warning",
    });
  }

  // Gate 6: Risk register must have ≥3 risks
  const riskCount = prd.riskRegister?.length || 0;
  if (riskCount < 3) {
    results.push({
      passed: false,
      gate: "Risks.Count",
      message: `Risk register must have ≥3 risks (found ${riskCount})`,
      severity: "error",
    });
  } else {
    // Check all risks have mitigations
    const risksWithMitigation = prd.riskRegister!.filter((r) => r.mitigation && r.mitigation.length > 0);
    if (risksWithMitigation.length < riskCount) {
      results.push({
        passed: false,
        gate: "Risks.Mitigations",
        message: `${riskCount - risksWithMitigation.length} risk(s) missing mitigation strategies`,
        severity: "error",
      });
    } else {
      results.push({
        passed: true,
        gate: "Risks.Complete",
        message: "Risk register has ≥3 risks with mitigations",
        severity: "error",
      });
    }
  }

  // Gate 7: Data model must have ≥3 entities
  const entityCount = prd.dataModel?.entities?.length || 0;
  if (entityCount < 3) {
    results.push({
      passed: false,
      gate: "DataModel.Count",
      message: `Data model must have ≥3 entities (found ${entityCount})`,
      severity: "error",
    });
  } else {
    results.push({
      passed: true,
      gate: "DataModel.Count",
      message: "Data model has ≥3 entities",
      severity: "error",
    });
  }

  // Gate 8: Health domain specific - Alert entity required
  const isHealthDomain = prd.meta?.domain === "health" ||
                         prd.title.toLowerCase().includes("health") ||
                         prd.title.toLowerCase().includes("wellness") ||
                         prd.title.toLowerCase().includes("fitness");

  if (isHealthDomain && prd.dataModel?.entities) {
    const hasAlertEntity = prd.dataModel.entities.some((e) =>
      e.name.toLowerCase() === "alert" || e.name.toLowerCase().includes("alert")
    );

    if (!hasAlertEntity) {
      results.push({
        passed: false,
        gate: "Health.AlertEntity",
        message: "Health apps MUST include Alert entity in data model (for safety escalation)",
        severity: "error",
      });
    } else {
      results.push({
        passed: true,
        gate: "Health.AlertEntity",
        message: "Alert entity found in data model",
        severity: "error",
      });
    }
  }

  // Gate 9: Health domain specific - Safety escalation with SLA
  if (isHealthDomain && prd.safety) {
    if (!prd.safety.escalation || prd.safety.escalation.length === 0) {
      results.push({
        passed: false,
        gate: "Health.SafetyEscalation",
        message: "Health apps MUST define safety escalation rules with SLA times",
        severity: "error",
      });
    } else {
      // Check for 3s SLA (not 5s)
      const has3sSLA = prd.safety.escalation.some((esc) =>
        esc.slaSeconds !== null && esc.slaSeconds !== undefined && esc.slaSeconds <= 3
      );

      if (!has3sSLA) {
        results.push({
          passed: false,
          gate: "Health.SafetySLA",
          message: "Safety alerts must have SLA ≤ 3s (found longer SLA or missing)",
          severity: "warning",
        });
      } else {
        results.push({
          passed: true,
          gate: "Health.SafetyEscalation",
          message: "Safety escalation rules defined with proper SLA",
          severity: "error",
        });
      }
    }
  }

  // Gate 10: Roadmap dates must be >= 2025 (no stale dates!)
  if (prd.roadmap) {
    const dates = [prd.roadmap.mvpFreeze, prd.roadmap.beta, prd.roadmap.phase2].filter(Boolean);
    const staleDates = dates.filter((date) => {
      if (!date) return false;
      const year = parseInt(date.split("-")[0]);
      return year < 2025;
    });

    if (staleDates.length > 0) {
      results.push({
        passed: false,
        gate: "Roadmap.NoStale",
        message: `Roadmap has stale dates from ${staleDates.join(", ")} - must be >= 2025`,
        severity: "error",
      });
    } else {
      results.push({
        passed: true,
        gate: "Roadmap.NoStale",
        message: "Roadmap dates are current (>= 2025)",
        severity: "error",
      });
    }
  }

  // Calculate score
  const totalGates = results.filter((r) => r.severity === "error").length;
  const passedGates = results.filter((r) => r.passed && r.severity === "error").length;
  const score = totalGates > 0 ? Math.round((passedGates / totalGates) * 100) : 0;

  const allPassed = results.filter((r) => r.severity === "error").every((r) => r.passed);

  return {
    passed: allPassed,
    results,
    score,
  };
}

/**
 * Get a human-readable quality gate report
 */
export function formatQualityGateReport(report: QualityGateReport): string {
  const lines = [
    `\n========================================`,
    `PRD QUALITY GATE REPORT`,
    `========================================`,
    `Score: ${report.score}/100`,
    `Status: ${report.passed ? "✓ PASSED" : "✗ FAILED"}`,
    `\n`,
  ];

  const errors = report.results.filter((r) => !r.passed && r.severity === "error");
  const warnings = report.results.filter((r) => !r.passed && r.severity === "warning");
  const passed = report.results.filter((r) => r.passed);

  if (errors.length > 0) {
    lines.push(`ERRORS (${errors.length}):`);
    errors.forEach((r) => {
      lines.push(`  ✗ [${r.gate}] ${r.message}`);
    });
    lines.push("");
  }

  if (warnings.length > 0) {
    lines.push(`WARNINGS (${warnings.length}):`);
    warnings.forEach((r) => {
      lines.push(`  ⚠ [${r.gate}] ${r.message}`);
    });
    lines.push("");
  }

  if (passed.length > 0) {
    lines.push(`PASSED (${passed.length}):`);
    passed.forEach((r) => {
      lines.push(`  ✓ [${r.gate}] ${r.message}`);
    });
  }

  lines.push(`\n========================================\n`);

  return lines.join("\n");
}
