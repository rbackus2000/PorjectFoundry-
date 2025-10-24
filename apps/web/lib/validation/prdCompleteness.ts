import { PRD } from "../zodSchemas";

/**
 * PRD Completeness Checker & Filler
 * Ensures all enterprise sections are present, fills in defaults if missing
 */

export type CompletenessIssue = {
  section: string;
  severity: "critical" | "warning";
  message: string;
  fix?: string;
};

export type CompletenessReport = {
  complete: boolean;
  issues: CompletenessIssue[];
  filledSections: string[];
};

/**
 * Check PRD completeness and provide default values for missing sections
 */
export function checkAndFillPRDCompleteness(prd: PRD): { prd: PRD; report: CompletenessReport } {
  const issues: CompletenessIssue[] = [];
  const filledSections: string[] = [];
  let updatedPRD = { ...prd };

  const isHealthDomain = prd.meta?.domain === "health" ||
                         prd.title.toLowerCase().includes("health") ||
                         prd.title.toLowerCase().includes("wellness") ||
                         prd.title.toLowerCase().includes("fitness");

  // 1. Check NFR section
  if (!prd.nfr || !prd.nfr.availability || !prd.nfr.latencyP95ReadMs) {
    issues.push({
      section: "Non-Functional Requirements",
      severity: "critical",
      message: "NFRs section missing or incomplete (must have numeric values)",
      fix: "Added default NFRs with industry-standard values",
    });

    updatedPRD.nfr = {
      availability: 99.9,
      latencyP95ReadMs: 400,
      latencyP95WriteMs: 800,
      security: ["RLS", "TLS1.2+", "AES-256"],
      a11y: "WCAG2.1-AA",
      i18n: ["en"],
      offlineSupport: false,
    };
    filledSections.push("nfr");
  }

  // 2. Check Privacy section
  if (!prd.privacy || !prd.privacy.piiClasses || !prd.privacy.retentionDays) {
    issues.push({
      section: "Security & Privacy",
      severity: "critical",
      message: "Privacy section missing or incomplete",
      fix: "Added default privacy policy with 2-year retention",
    });

    updatedPRD.privacy = {
      piiClasses: ["basic", "sensitive"],
      retentionDays: 730, // 2 years
      auditEvents: ["profile_view", "export", "share"],
      compliance: ["GDPR", "CCPA"],
    };
    filledSections.push("privacy");
  }

  // 3. Check Metrics - activationD2 is REQUIRED
  if (!prd.metrics || !prd.metrics.activationD2) {
    issues.push({
      section: "Metrics",
      severity: "critical",
      message: "activationD2 metric is REQUIRED",
      fix: "Added activation metric with 60% target",
    });

    updatedPRD.metrics = {
      activationD2: { targetPct: 0.6, baseline: null },
      retentionW4: prd.metrics?.retentionW4 || { targetPct: 0.4, baseline: null },
      retentionM3: prd.metrics?.retentionM3 || { targetPct: 0.28, baseline: null },
      errorBudget: {
        slo: "p95<400ms",
        targetAvailability: 0.999,
      },
      customMetrics: null,
    };
    filledSections.push("metrics");
  }

  // 4. Check Safety section (health apps only)
  if (isHealthDomain) {
    if (!prd.safety || !prd.safety.escalation || prd.safety.escalation.length === 0) {
      issues.push({
        section: "Safety & Escalation Rules",
        severity: "critical",
        message: "Health apps MUST have safety escalation rules with numeric thresholds",
        fix: "Added default safety thresholds and 3s SLA escalation",
      });

      updatedPRD.safety = {
        claimsScope: "wellness",
        guardrails: [
          "No diagnostic claims",
          "Wellness-only guidance",
          "Age 18+ only",
          "Disclaimer on every screen",
        ],
        escalation: [
          {
            condition: "HR > (220-age)*0.85 for ≥60s",
            action: "Show Pause & Recover alert",
            slaSeconds: 3,
          },
          {
            condition: "HR remains elevated for ≥180s or user flags dizziness/pain",
            action: "Stop session, log Alert(severity=high), prompt caregiver notify",
            slaSeconds: 3,
          },
        ],
      };
      filledSections.push("safety");
    } else if (prd.safety.escalation.some((esc) => !esc.slaSeconds || esc.slaSeconds > 3)) {
      issues.push({
        section: "Safety & Escalation Rules",
        severity: "warning",
        message: "Safety SLA should be ≤ 3s (found longer or missing)",
      });
    }
  }

  // 5. Check Data Model (≥3 entities, Alert for health apps)
  if (!prd.dataModel || !prd.dataModel.entities || prd.dataModel.entities.length < 3) {
    issues.push({
      section: "Data Model",
      severity: "critical",
      message: "Data model must have ≥3 entities",
      fix: "Added default data model with User, Session, Alert entities",
    });

    const defaultEntities = [
      {
        name: "User",
        description: "User account and profile",
        keyFields: ["id", "email", "age", "conditions[]", "settings", "locale"],
      },
      {
        name: "Session",
        description: "Workout or activity session",
        keyFields: ["id", "user_id", "started_at", "ended_at", "rpe", "metrics_json", "flags[]"],
      },
    ];

    if (isHealthDomain) {
      defaultEntities.push({
        name: "Alert",
        description: "Safety and health alerts",
        keyFields: ["id", "user_id", "ts", "type", "severity", "delivered", "channel"],
      });
    }

    updatedPRD.dataModel = {
      entities: defaultEntities,
      invariants: [
        "Every session must map to a valid User",
        "Alerts must be delivered within SLA",
      ],
    };
    filledSections.push("dataModel");
  } else if (isHealthDomain && !prd.dataModel.entities.some((e) => e.name.toLowerCase().includes("alert"))) {
    issues.push({
      section: "Data Model",
      severity: "critical",
      message: "Health apps MUST include Alert entity",
      fix: "Added Alert entity to data model",
    });

    updatedPRD.dataModel.entities.push({
      name: "Alert",
      description: "Safety and health alerts",
      keyFields: ["id", "user_id", "ts", "type", "severity", "delivered", "channel"],
    });
    filledSections.push("dataModel.entities");
  }

  // 6. Check Roadmap (must have dates >= 2025)
  if (!prd.roadmap || !prd.roadmap.mvpFreeze || !prd.roadmap.beta) {
    issues.push({
      section: "Roadmap",
      severity: "critical",
      message: "Roadmap must include mvpFreeze and beta dates (YYYY-MM-DD)",
      fix: "Added roadmap with dates calculated from today",
    });

    const today = new Date();
    const mvpDate = new Date(today);
    mvpDate.setDate(mvpDate.getDate() + 56); // 8 weeks

    const betaDate = new Date(mvpDate);
    betaDate.setDate(betaDate.getDate() + 42); // 6 weeks after MVP

    const phase2Date = new Date(betaDate);
    phase2Date.setMonth(phase2Date.getMonth() + 2); // 2 months after beta

    updatedPRD.roadmap = {
      mvpFreeze: mvpDate.toISOString().split("T")[0],
      beta: betaDate.toISOString().split("T")[0],
      phase2: phase2Date.toISOString().split("T")[0],
      milestones: prd.roadmap?.milestones || null,
    };
    filledSections.push("roadmap");
  }

  // 7. Check Risks (≥3 required)
  if (!prd.riskRegister || prd.riskRegister.length < 3) {
    issues.push({
      section: "Risks & Mitigations",
      severity: "critical",
      message: "Risk register must have ≥3 risks with mitigations",
      fix: "Added default risk register",
    });

    const defaultRisks = [
      {
        risk: "Safety incident (user injury or medical event)",
        impact: "High" as const,
        likelihood: "Med" as const,
        mitigation: "HR/RPE gates, clinician-reviewed plans, escalation flow with 3s SLA",
      },
      {
        risk: "Low retention (users stop using after week 2)",
        impact: "High" as const,
        likelihood: "Med" as const,
        mitigation: "Caregiver loop, streaks, quick wins (<10 min sessions), weekly emails",
      },
      {
        risk: "Data breach or unauthorized access",
        impact: "High" as const,
        likelihood: "Low" as const,
        mitigation: "RLS on all tables, secret hygiene, audits, least privilege access",
      },
    ];

    if (isHealthDomain) {
      defaultRisks.push({
        risk: "App store rejection due to medical claims",
        impact: "High" as const,
        likelihood: "Med" as const,
        mitigation: "Wellness-only language, legal review, no diagnostic features",
      });
    }

    updatedPRD.riskRegister = defaultRisks;
    filledSections.push("riskRegister");
  }

  // 8. Check outOfScope
  if (!prd.outOfScope || prd.outOfScope.length === 0) {
    issues.push({
      section: "Out of Scope",
      severity: "warning",
      message: "Should explicitly list what's NOT included in this release",
      fix: "Added default out-of-scope items",
    });

    updatedPRD.outOfScope = [
      "Medical diagnosis or treatment recommendations",
      "Prescription or medication tracking",
      "Real-time video coaching (Phase 2)",
      "Community features and social sharing (Phase 2)",
      "Custom exercise library creation",
    ];
    filledSections.push("outOfScope");
  }

  const complete = issues.filter((i) => i.severity === "critical").length === 0;

  return {
    prd: updatedPRD,
    report: {
      complete,
      issues,
      filledSections,
    },
  };
}

/**
 * Format completeness report for logging
 */
export function formatCompletenessReport(report: CompletenessReport): string {
  const lines = [
    `\n========================================`,
    `PRD COMPLETENESS REPORT`,
    `========================================`,
    `Status: ${report.complete ? "✓ COMPLETE" : "⚠ INCOMPLETE"}`,
    ``,
  ];

  if (report.issues.length > 0) {
    const critical = report.issues.filter((i) => i.severity === "critical");
    const warnings = report.issues.filter((i) => i.severity === "warning");

    if (critical.length > 0) {
      lines.push(`CRITICAL ISSUES (${critical.length}):`);
      critical.forEach((issue) => {
        lines.push(`  ✗ [${issue.section}] ${issue.message}`);
        if (issue.fix) {
          lines.push(`    → Fix applied: ${issue.fix}`);
        }
      });
      lines.push(``);
    }

    if (warnings.length > 0) {
      lines.push(`WARNINGS (${warnings.length}):`);
      warnings.forEach((issue) => {
        lines.push(`  ⚠ [${issue.section}] ${issue.message}`);
        if (issue.fix) {
          lines.push(`    → Fix applied: ${issue.fix}`);
        }
      });
      lines.push(``);
    }
  }

  if (report.filledSections.length > 0) {
    lines.push(`FILLED SECTIONS (${report.filledSections.length}):`);
    report.filledSections.forEach((section) => {
      lines.push(`  ✓ ${section}`);
    });
    lines.push(``);
  }

  lines.push(`========================================\n`);

  return lines.join("\n");
}
