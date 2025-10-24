#!/usr/bin/env tsx

/**
 * Test PRD Completeness Checker
 * Demonstrates auto-fill functionality
 */

import { PRD } from "../lib/zodSchemas";
import { checkAndFillPRDCompleteness, formatCompletenessReport } from "../lib/validation/prdCompleteness";
import { validatePRDQualityGates, formatQualityGateReport } from "../lib/validation/prdQualityGates";
import { exportPRDToMarkdown } from "../lib/export/prdMarkdown";
import * as fs from "fs";

// Create an INCOMPLETE PRD (like what AI might generate)
const incompletePRD: PRD = {
  title: "AI-Powered Personalized Fitness Coach for Seniors",
  version: "1.0",
  lastUpdated: new Date().toISOString(),
  overview: "A comprehensive fitness platform designed specifically for seniors (65+) that combines AI-powered personalized workout plans with real-time safety monitoring and caregiver engagement.",
  problemStatement: "Seniors struggle to maintain physical fitness due to fear of injury, lack of personalized guidance, and limited access to senior-focused fitness programs.",
  goals: [
    "Increase physical activity among seniors by 40%",
    "Reduce fall risk through targeted strength and balance training",
    "Enable safe, at-home exercise with real-time monitoring",
  ],
  nonGoals: ["Medical diagnosis or treatment", "Competitive fitness tracking"],

  // Meta section
  meta: {
    projectName: "SeniorFit AI Coach",
    version: "1.0",
    createdAt: new Date().toISOString(),
    domain: "health",
    sources: null,
  },

  userPersonas: [
    {
      name: "Margaret",
      role: "Active Senior",
      goals: ["Stay independent", "Improve balance", "Maintain strength"],
      painPoints: ["Fear of falling", "Don't know where to start", "No guidance"],
      useCases: ["Morning stretches", "Balance exercises", "Light strength training"],
    },
  ],

  competitiveAnalysis: null,

  // Incomplete metrics - missing activationD2!
  successMetrics: [
    {
      metric: "Week-4 Retention",
      target: "40%",
      baseline: null,
      timeframe: "4 weeks",
    },
  ],

  userStories: [
    {
      id: "US-1",
      persona: "Margaret",
      story: "As Margaret, I want personalized workout plans so I can exercise safely at home",
      acceptanceCriteria: [
        "Given Margaret completes assessment, When she views Today screen, Then personalized plan is shown",
        "Plan adapts based on RPE feedback",
        "Exercises match her fitness level",
      ],
    },
  ],

  features: [
    {
      id: "F-AUTH",
      name: "User Authentication",
      description: "Secure email-based authentication",
      priority: "P0",
      acceptanceCriteria: [
        "Given new user, When enters valid email/password, Then account created within 2s",
        "Given existing user, When enters correct credentials, Then logged in within 1s",
        "Given invalid credentials, When submits form, Then error shown within 500ms",
      ],
      dependencies: null,
      moduleIds: null,
    },
    {
      id: "F-PLAN",
      name: "Personalized Workout Plans",
      description: "AI-generated workout plans based on assessment",
      priority: "P0",
      acceptanceCriteria: [
        "Given completed assessment, When user views plan, Then exercises match fitness level",
        "Plan includes warm-up, main workout, cool-down",
        "Exercises have video demonstrations",
      ],
      dependencies: ["F-AUTH"],
      moduleIds: null,
    },
  ],

  // Missing: outOfScope
  outOfScope: null,

  assumptions: ["Users have smartphone or tablet", "Internet connectivity available"],
  constraints: ["Must work without special equipment", "Sessions under 30 minutes"],
  dependencies: ["Apple Health API", "Google Fit API"],

  timeline: null, // Missing!

  // Legacy enterprise sections (incomplete)
  safetyGuardrails: null,
  accessibilityRequirements: null,
  securityPrivacy: null,
  deviceIntegration: null,
  nonFunctionalRequirements: null,
  responsibleAI: null,
  releasePlan: null,
  riskRegister: null, // Missing!
  dataModel: null, // Missing!

  // New enterprise sections (all missing)
  metrics: null, // Missing activationD2!
  nfr: null, // Missing NFRs!
  safety: null, // Missing safety rules!
  privacy: null, // Missing privacy policy!
  roadmap: null, // Missing roadmap!

  sections: null,
  citations: null,
};

async function main() {
  console.log("\n" + "=".repeat(80));
  console.log("PRD COMPLETENESS CHECKER - DEMONSTRATION");
  console.log("=".repeat(80));

  console.log("\n📄 Testing with INCOMPLETE PRD:");
  console.log(`   Title: ${incompletePRD.title}`);
  console.log(`   Domain: ${incompletePRD.meta?.domain}`);
  console.log(`   Features: ${incompletePRD.features.length}`);

  // Run quality gates on incomplete PRD
  console.log("\n🔍 Running quality gates on INCOMPLETE PRD...\n");
  const beforeReport = validatePRDQualityGates(incompletePRD);
  console.log(formatQualityGateReport(beforeReport));

  // Run completeness checker
  console.log("\n🔧 Running completeness checker and auto-fill...\n");
  const { prd: completePRD, report } = checkAndFillPRDCompleteness(incompletePRD);
  console.log(formatCompletenessReport(report));

  // Run quality gates on COMPLETE PRD
  console.log("\n✅ Running quality gates on COMPLETE PRD...\n");
  const afterReport = validatePRDQualityGates(completePRD);
  console.log(formatQualityGateReport(afterReport));

  // Show before/after comparison
  console.log("\n" + "=".repeat(80));
  console.log("BEFORE vs AFTER COMPARISON");
  console.log("=".repeat(80));
  console.log(`
BEFORE (Incomplete PRD):
  - Quality Score: ${beforeReport.score}/100
  - Errors: ${beforeReport.results.filter(r => !r.passed && r.severity === "error").length}
  - Warnings: ${beforeReport.results.filter(r => !r.passed && r.severity === "warning").length}
  - Missing: NFRs, Safety, Privacy, Metrics, Roadmap, Risks, Data Model

AFTER (Auto-Filled):
  - Quality Score: ${afterReport.score}/100
  - Errors: ${afterReport.results.filter(r => !r.passed && r.severity === "error").length}
  - Warnings: ${afterReport.results.filter(r => !r.passed && r.severity === "warning").length}
  - Auto-Filled: ${report.filledSections.join(", ")}
  `);

  // Export to markdown
  console.log("\n📝 Exporting complete PRD to Markdown...\n");
  const markdown = exportPRDToMarkdown(completePRD);

  const outputPath = "./test-prd-output.md";
  fs.writeFileSync(outputPath, markdown);
  console.log(`✅ Markdown exported to: ${outputPath}`);
  console.log(`   File size: ${Math.round(markdown.length / 1024)} KB`);
  console.log(`   Sections: ${markdown.split("\n## ").length - 1}`);

  // Show key sections
  console.log("\n" + "=".repeat(80));
  console.log("KEY ENTERPRISE SECTIONS (Auto-Filled)");
  console.log("=".repeat(80));

  if (completePRD.nfr) {
    console.log("\n📊 Non-Functional Requirements:");
    console.log(`   - Availability: ${completePRD.nfr.availability}%`);
    console.log(`   - Read Latency (p95): ${completePRD.nfr.latencyP95ReadMs}ms`);
    console.log(`   - Write Latency (p95): ${completePRD.nfr.latencyP95WriteMs}ms`);
    console.log(`   - Security: ${completePRD.nfr.security?.join(", ")}`);
    console.log(`   - Accessibility: ${completePRD.nfr.a11y}`);
  }

  if (completePRD.metrics) {
    console.log("\n📈 Success Metrics:");
    console.log(`   - Activation D2: ${(completePRD.metrics.activationD2!.targetPct * 100).toFixed(0)}%`);
    console.log(`   - Retention W4: ${(completePRD.metrics.retentionW4!.targetPct * 100).toFixed(0)}%`);
    console.log(`   - Retention M3: ${(completePRD.metrics.retentionM3!.targetPct * 100).toFixed(0)}%`);
  }

  if (completePRD.safety?.escalation) {
    console.log("\n🚨 Safety Escalation Rules:");
    completePRD.safety.escalation.forEach((esc, i) => {
      console.log(`   ${i + 1}. ${esc.condition}`);
      console.log(`      → ${esc.action}`);
      console.log(`      SLA: ${esc.slaSeconds}s`);
    });
  }

  if (completePRD.dataModel?.entities) {
    console.log("\n🗄️  Data Model:");
    completePRD.dataModel.entities.forEach((entity) => {
      console.log(`   - ${entity.name}: ${entity.keyFields.join(", ")}`);
    });
  }

  if (completePRD.roadmap) {
    console.log("\n📅 Roadmap:");
    console.log(`   - MVP Freeze: ${completePRD.roadmap.mvpFreeze}`);
    console.log(`   - Beta: ${completePRD.roadmap.beta}`);
    console.log(`   - Phase 2: ${completePRD.roadmap.phase2}`);
  }

  if (completePRD.riskRegister) {
    console.log(`\n⚠️  Risk Register (${completePRD.riskRegister.length} risks):`);
    completePRD.riskRegister.forEach((risk, i) => {
      console.log(`   ${i + 1}. ${risk.risk}`);
      console.log(`      Impact: ${risk.impact} | Likelihood: ${risk.likelihood}`);
      console.log(`      Mitigation: ${risk.mitigation}`);
    });
  }

  console.log("\n" + "=".repeat(80));
  console.log("✅ DEMONSTRATION COMPLETE");
  console.log("=".repeat(80));
  console.log(`
Summary:
- Started with incomplete PRD (score: ${beforeReport.score}/100)
- Auto-filled ${report.filledSections.length} missing sections
- Final PRD score: ${afterReport.score}/100
- All enterprise requirements met: ${afterReport.passed ? "YES" : "NO"}
- Markdown export: ${outputPath}

The auto-fill system ensures EVERY PRD has all enterprise sections,
even if the AI generation misses them!
  `);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
