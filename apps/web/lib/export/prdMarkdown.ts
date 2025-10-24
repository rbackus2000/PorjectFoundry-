import { PRD } from "../zodSchemas";

/**
 * Export PRD to Markdown format
 * Generates PRD.md from prd.json
 */

export function exportPRDToMarkdown(prd: PRD): string {
  const lines: string[] = [];

  // Header
  lines.push(`# ${prd.title}`);
  lines.push("");
  lines.push(`**Version:** ${prd.version} | **Last Updated:** ${new Date(prd.lastUpdated).toLocaleDateString()}`);

  if (prd.meta) {
    lines.push(`**Domain:** ${prd.meta.domain.toUpperCase()}`);
    if (prd.meta.sources && prd.meta.sources.length > 0) {
      lines.push(`**Sources:** ${prd.meta.sources.length} research documents`);
    }
  }
  lines.push("");
  lines.push("---");
  lines.push("");

  // Executive Summary
  lines.push("## Executive Summary");
  lines.push("");
  lines.push(prd.overview);
  lines.push("");

  // Problem Statement
  if (prd.problemStatement) {
    lines.push("## Problem Statement");
    lines.push("");
    lines.push(prd.problemStatement);
    lines.push("");
  }

  // Goals & Non-Goals
  lines.push("## Goals & Non-Goals");
  lines.push("");
  lines.push("### Goals");
  prd.goals.forEach((goal) => {
    lines.push(`- ${goal}`);
  });
  lines.push("");

  if (prd.nonGoals && prd.nonGoals.length > 0) {
    lines.push("### Non-Goals");
    prd.nonGoals.forEach((goal) => {
      lines.push(`- ${goal}`);
    });
    lines.push("");
  }

  if (prd.outOfScope && prd.outOfScope.length > 0) {
    lines.push("### Out of Scope");
    prd.outOfScope.forEach((item) => {
      lines.push(`- ${item}`);
    });
    lines.push("");
  }

  // User Personas
  if (prd.userPersonas && prd.userPersonas.length > 0) {
    lines.push("## User Personas");
    lines.push("");
    prd.userPersonas.forEach((persona) => {
      lines.push(`### ${persona.name} - ${persona.role}`);
      lines.push("");
      lines.push("**Goals:**");
      persona.goals.forEach((goal) => {
        lines.push(`- ${goal}`);
      });
      lines.push("");
      lines.push("**Pain Points:**");
      persona.painPoints.forEach((pain) => {
        lines.push(`- ${pain}`);
      });
      lines.push("");
      if (persona.useCases && persona.useCases.length > 0) {
        lines.push("**Use Cases:**");
        persona.useCases.forEach((useCase) => {
          lines.push(`- ${useCase}`);
        });
        lines.push("");
      }
    });
  }

  // Features
  lines.push("## Features");
  lines.push("");

  const priorityLabels = {
    P0: "🔴 P0 - Critical",
    P1: "🟠 P1 - High Priority",
    P2: "🟡 P2 - Medium Priority",
    P3: "🟢 P3 - Nice to Have",
  };

  ["P0", "P1", "P2", "P3"].forEach((priority) => {
    const features = prd.features.filter((f) => f.priority === priority);
    if (features.length > 0) {
      lines.push(`### ${priorityLabels[priority as keyof typeof priorityLabels]}`);
      lines.push("");
      features.forEach((feature) => {
        lines.push(`#### ${feature.name} \`${feature.id}\``);
        lines.push("");
        lines.push(feature.description);
        lines.push("");

        if (feature.acceptanceCriteria && feature.acceptanceCriteria.length > 0) {
          lines.push("**Acceptance Criteria:**");
          feature.acceptanceCriteria.forEach((ac) => {
            lines.push(`- ${ac}`);
          });
          lines.push("");
        }

        if (feature.dependencies && feature.dependencies.length > 0) {
          lines.push(`**Dependencies:** ${feature.dependencies.join(", ")}`);
          lines.push("");
        }
      });
    }
  });

  // Metrics
  if (prd.metrics) {
    lines.push("## Success Metrics");
    lines.push("");

    if (prd.metrics.activationD2) {
      lines.push(`- **Day-2 Activation:** ${(prd.metrics.activationD2.targetPct * 100).toFixed(0)}% target${prd.metrics.activationD2.baseline ? `, ${(prd.metrics.activationD2.baseline * 100).toFixed(0)}% baseline` : ""}`);
    }
    if (prd.metrics.retentionW4) {
      lines.push(`- **Week-4 Retention:** ${(prd.metrics.retentionW4.targetPct * 100).toFixed(0)}% target${prd.metrics.retentionW4.baseline ? `, ${(prd.metrics.retentionW4.baseline * 100).toFixed(0)}% baseline` : ""}`);
    }
    if (prd.metrics.retentionM3) {
      lines.push(`- **Month-3 Retention:** ${(prd.metrics.retentionM3.targetPct * 100).toFixed(0)}% target${prd.metrics.retentionM3.baseline ? `, ${(prd.metrics.retentionM3.baseline * 100).toFixed(0)}% baseline` : ""}`);
    }
    if (prd.metrics.errorBudget) {
      lines.push(`- **Error Budget:** ${prd.metrics.errorBudget.slo} | ${(prd.metrics.errorBudget.targetAvailability * 100).toFixed(2)}% availability`);
    }
    lines.push("");
  }

  // Non-Functional Requirements
  if (prd.nfr) {
    lines.push("## Non-Functional Requirements");
    lines.push("");

    if (prd.nfr.availability) {
      lines.push(`- **Availability:** ${prd.nfr.availability}%`);
    }
    if (prd.nfr.latencyP95ReadMs) {
      lines.push(`- **Read Latency (p95):** < ${prd.nfr.latencyP95ReadMs}ms`);
    }
    if (prd.nfr.latencyP95WriteMs) {
      lines.push(`- **Write Latency (p95):** < ${prd.nfr.latencyP95WriteMs}ms`);
    }
    if (prd.nfr.security && prd.nfr.security.length > 0) {
      lines.push(`- **Security:** ${prd.nfr.security.join(", ")}`);
    }
    if (prd.nfr.a11y) {
      lines.push(`- **Accessibility:** ${prd.nfr.a11y}`);
    }
    if (prd.nfr.i18n && prd.nfr.i18n.length > 0) {
      lines.push(`- **Localization:** ${prd.nfr.i18n.join(", ")}`);
    }
    if (prd.nfr.offlineSupport !== null && prd.nfr.offlineSupport !== undefined) {
      lines.push(`- **Offline Support:** ${prd.nfr.offlineSupport ? "Yes" : "No"}`);
    }
    lines.push("");
  }

  // Safety
  if (prd.safety) {
    lines.push("## Safety & Compliance");
    lines.push("");

    if (prd.safety.claimsScope) {
      lines.push(`**Claims Scope:** ${prd.safety.claimsScope}`);
      lines.push("");
    }

    if (prd.safety.guardrails && prd.safety.guardrails.length > 0) {
      lines.push("**Guardrails:**");
      prd.safety.guardrails.forEach((rule) => {
        lines.push(`- ${rule}`);
      });
      lines.push("");
    }

    if (prd.safety.escalation && prd.safety.escalation.length > 0) {
      lines.push("**Escalation Paths:**");
      lines.push("");
      lines.push("| Condition | Action | SLA |");
      lines.push("|-----------|--------|-----|");
      prd.safety.escalation.forEach((esc) => {
        lines.push(`| ${esc.condition} | ${esc.action} | ${esc.slaSeconds ? `${esc.slaSeconds}s` : "N/A"} |`);
      });
      lines.push("");
    }
  }

  // Privacy & Security
  if (prd.privacy) {
    lines.push("## Privacy & Security");
    lines.push("");

    if (prd.privacy.piiClasses && prd.privacy.piiClasses.length > 0) {
      lines.push(`**PII Classes:** ${prd.privacy.piiClasses.join(", ")}`);
    }
    if (prd.privacy.retentionDays) {
      lines.push(`**Data Retention:** ${prd.privacy.retentionDays} days (${Math.round(prd.privacy.retentionDays / 365)} years)`);
    }
    if (prd.privacy.auditEvents && prd.privacy.auditEvents.length > 0) {
      lines.push(`**Audit Events:** ${prd.privacy.auditEvents.join(", ")}`);
    }
    if (prd.privacy.compliance && prd.privacy.compliance.length > 0) {
      lines.push(`**Compliance:** ${prd.privacy.compliance.join(", ")}`);
    }
    lines.push("");
  }

  // Data Model
  if (prd.dataModel && prd.dataModel.entities && prd.dataModel.entities.length > 0) {
    lines.push("## Data Model");
    lines.push("");

    prd.dataModel.entities.forEach((entity) => {
      lines.push(`### ${entity.name}`);
      lines.push("");
      lines.push(entity.description);
      lines.push("");
      lines.push("**Fields:**");
      entity.keyFields.forEach((field) => {
        lines.push(`- ${field}`);
      });
      lines.push("");
    });

    if (prd.dataModel.invariants && prd.dataModel.invariants.length > 0) {
      lines.push("**Critical Invariants:**");
      prd.dataModel.invariants.forEach((inv) => {
        lines.push(`- ${inv}`);
      });
      lines.push("");
    }
  }

  // Roadmap
  if (prd.roadmap) {
    lines.push("## Roadmap");
    lines.push("");

    if (prd.roadmap.mvpFreeze) {
      lines.push(`- **MVP Freeze:** ${prd.roadmap.mvpFreeze}`);
    }
    if (prd.roadmap.beta) {
      lines.push(`- **Beta Release:** ${prd.roadmap.beta}`);
    }
    if (prd.roadmap.phase2) {
      lines.push(`- **Phase 2:** ${prd.roadmap.phase2}`);
    }
    lines.push("");

    if (prd.roadmap.milestones && prd.roadmap.milestones.length > 0) {
      lines.push("### Milestones");
      lines.push("");
      prd.roadmap.milestones.forEach((milestone) => {
        lines.push(`**${milestone.name}**${milestone.targetDate ? ` (${milestone.targetDate})` : ""}`);
        lines.push(milestone.description);
        if (milestone.dependencies && milestone.dependencies.length > 0) {
          lines.push(`Depends on: ${milestone.dependencies.join(", ")}`);
        }
        lines.push("");
      });
    }
  }

  // Risk Register
  if (prd.riskRegister && prd.riskRegister.length > 0) {
    lines.push("## Risk Register");
    lines.push("");
    lines.push("| Risk | Impact | Likelihood | Mitigation |");
    lines.push("|------|--------|------------|------------|");
    prd.riskRegister.forEach((risk) => {
      lines.push(`| ${risk.risk} | ${risk.impact} | ${risk.likelihood} | ${risk.mitigation} |`);
    });
    lines.push("");
  }

  // Citations (if any)
  if (prd.citations && prd.citations.length > 0) {
    lines.push("## Research Sources");
    lines.push("");
    prd.citations.forEach((citation, idx) => {
      lines.push(`${idx + 1}. **${citation.source}**${citation.url ? ` - [Link](${citation.url})` : ""}`);
      if (citation.snippet) {
        lines.push(`   > ${citation.snippet}`);
      }
      lines.push("");
    });
  }

  // Footer
  lines.push("---");
  lines.push("");
  lines.push(`*Generated by BuildBridge AI on ${new Date().toLocaleDateString()}*`);

  if (prd.meta && prd.meta.sources && prd.meta.sources.length > 0) {
    lines.push(`*Based on ${prd.meta.sources.length} research source(s)*`);
  }

  return lines.join("\n");
}
