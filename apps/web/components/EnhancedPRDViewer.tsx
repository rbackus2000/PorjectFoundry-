"use client";

import { PRD } from "@/lib/zodSchemas";
import { Badge } from "@/components/ui/badge";

type EnhancedPRDViewerProps = {
  prd: PRD;
};

export function EnhancedPRDViewer({ prd }: EnhancedPRDViewerProps) {
  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {/* Header */}
      <div className="space-y-3 pb-6 border-b border-border">
        <h1 className="text-4xl font-bold tracking-tight">{prd.title}</h1>
        <div className="flex items-center gap-3 text-sm text-subtext">
          <span>Version {prd.version}</span>
          <span>•</span>
          <span>Last updated {new Date(prd.lastUpdated).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Overview */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Overview</h2>
        <p className="text-base leading-relaxed">{prd.overview}</p>
      </section>

      {/* Problem Statement */}
      {prd.problemStatement && (
        <section className="space-y-4 bg-amber-50 dark:bg-amber-950/20 p-6 rounded-lg border border-amber-200 dark:border-amber-800">
          <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <span className="text-2xl">⚠️</span>
            Problem Statement
          </h2>
          <p className="text-base leading-relaxed">{prd.problemStatement}</p>
        </section>
      )}

      {/* Goals & Non-Goals */}
      <section className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              Goals
            </h2>
            <ul className="space-y-2">
              {prd.goals.map((goal, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                  <span>{goal}</span>
                </li>
              ))}
            </ul>
          </div>

          {prd.nonGoals && prd.nonGoals.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                <span className="text-2xl">🚫</span>
                Non-Goals
              </h2>
              <ul className="space-y-2">
                {prd.nonGoals.map((goal, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-red-600 dark:text-red-400 mt-1">✗</span>
                    <span className="text-subtext">{goal}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* User Personas */}
      {prd.userPersonas && prd.userPersonas.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <span className="text-2xl">👥</span>
            User Personas
          </h2>
          <div className="grid gap-4">
            {prd.userPersonas.map((persona, i) => (
              <div key={i} className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold">{persona.name}</h3>
                    <p className="text-subtext">{persona.role}</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Goals</h4>
                      <ul className="space-y-1">
                        {persona.goals.map((goal, j) => (
                          <li key={j} className="text-sm flex items-start gap-2">
                            <span className="text-green-600 dark:text-green-400">▸</span>
                            <span>{goal}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-2">Pain Points</h4>
                      <ul className="space-y-1">
                        {persona.painPoints.map((pain, j) => (
                          <li key={j} className="text-sm flex items-start gap-2">
                            <span className="text-red-600 dark:text-red-400">▸</span>
                            <span>{pain}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  {persona.useCases && persona.useCases.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Use Cases</h4>
                      <ul className="space-y-1">
                        {persona.useCases.map((useCase, j) => (
                          <li key={j} className="text-sm">{useCase}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Competitive Analysis */}
      {prd.competitiveAnalysis && prd.competitiveAnalysis.competitors.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <span className="text-2xl">📊</span>
            Competitive Analysis
          </h2>
          {prd.competitiveAnalysis.marketOpportunity && (
            <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <h3 className="font-medium mb-2">Market Opportunity</h3>
              <p className="text-sm">{prd.competitiveAnalysis.marketOpportunity}</p>
            </div>
          )}
          <div className="grid gap-4">
            {prd.competitiveAnalysis.competitors.map((comp, i) => (
              <div key={i} className="border border-border rounded-lg p-6 bg-surface">
                <h3 className="text-lg font-semibold mb-4">{comp.name}</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2 text-green-700 dark:text-green-400">Strengths</h4>
                    <ul className="space-y-1">
                      {comp.strengths.map((s, j) => (
                        <li key={j} className="text-sm">• {s}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-2 text-red-700 dark:text-red-400">Weaknesses</h4>
                    <ul className="space-y-1">
                      {comp.weaknesses.map((w, j) => (
                        <li key={j} className="text-sm">• {w}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-2 text-blue-700 dark:text-blue-400">Our Differentiators</h4>
                    <ul className="space-y-1">
                      {comp.differentiators.map((d, j) => (
                        <li key={j} className="text-sm">• {d}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Success Metrics */}
      {prd.successMetrics && prd.successMetrics.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <span className="text-2xl">📈</span>
            Success Metrics
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {prd.successMetrics.map((metric, i) => (
              <div key={i} className="border border-border rounded-lg p-4 bg-surface">
                <h3 className="font-semibold mb-2">{metric.metric}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-subtext">Target:</span>
                    <span className="font-medium">{metric.target}</span>
                  </div>
                  {metric.baseline && (
                    <div className="flex justify-between">
                      <span className="text-subtext">Baseline:</span>
                      <span>{metric.baseline}</span>
                    </div>
                  )}
                  {metric.timeframe && (
                    <div className="flex justify-between">
                      <span className="text-subtext">Timeframe:</span>
                      <span>{metric.timeframe}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* User Stories */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <span className="text-2xl">📖</span>
          User Stories
        </h2>
        <div className="space-y-4">
          {prd.userStories.map((story, i) => (
            <div key={story.id} className="border border-border rounded-lg p-6 bg-surface hover:border-primary transition-colors">
              <div className="flex items-start gap-4">
                <span className="text-subtext font-mono text-sm">{story.id}</span>
                <div className="flex-1 space-y-3">
                  <div>
                    <Badge variant="secondary" className="mb-2">{story.persona}</Badge>
                    <p className="text-base">{story.story}</p>
                  </div>
                  {story.acceptanceCriteria.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-subtext">Acceptance Criteria:</h4>
                      <ul className="space-y-1">
                        {story.acceptanceCriteria.map((criteria, j) => (
                          <li key={j} className="text-sm flex items-start gap-2">
                            <span className="text-green-600 dark:text-green-400 mt-0.5">□</span>
                            <span>{criteria}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <span className="text-2xl">⚙️</span>
          Features
        </h2>
        <div className="space-y-3">
          {["P0", "P1", "P2", "P3"].map((priority) => {
            const features = prd.features.filter((f) => f.priority === priority);
            if (features.length === 0) return null;

            const priorityColors = {
              P0: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-300 dark:border-red-700",
              P1: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-300 dark:border-orange-700",
              P2: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700",
              P3: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-300 dark:border-green-700",
            };

            return (
              <div key={priority} className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Badge className={priorityColors[priority as keyof typeof priorityColors]}>
                    {priority}
                  </Badge>
                  <span className="text-subtext text-sm">
                    {priority === "P0" && "Critical"}
                    {priority === "P1" && "High Priority"}
                    {priority === "P2" && "Medium Priority"}
                    {priority === "P3" && "Nice to Have"}
                  </span>
                </h3>
                {features.map((feature) => (
                  <div key={feature.id} className="border border-border rounded-lg p-4 bg-surface ml-8">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h4 className="font-semibold">{feature.name}</h4>
                      <span className="text-xs text-subtext font-mono">{feature.id}</span>
                    </div>
                    <p className="text-sm mb-3">{feature.description}</p>
                    {feature.dependencies && feature.dependencies.length > 0 && (
                      <div className="text-xs text-subtext">
                        <span className="font-medium">Dependencies:</span> {feature.dependencies.join(", ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </section>

      {/* Assumptions & Constraints */}
      {((prd.assumptions && prd.assumptions.length > 0) || (prd.constraints && prd.constraints.length > 0)) && (
        <section className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {prd.assumptions && prd.assumptions.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">Assumptions</h2>
                <ul className="space-y-2">
                  {prd.assumptions.map((assumption, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-blue-600 dark:text-blue-400 mt-1">ℹ</span>
                      <span>{assumption}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {prd.constraints && prd.constraints.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">Constraints</h2>
                <ul className="space-y-2">
                  {prd.constraints.map((constraint, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-orange-600 dark:text-orange-400 mt-1">⚠</span>
                      <span>{constraint}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Timeline */}
      {prd.timeline && prd.timeline.milestones.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <span className="text-2xl">📅</span>
            Timeline
          </h2>
          {prd.timeline.totalDuration && (
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <span className="font-medium">Total Duration:</span> {prd.timeline.totalDuration}
            </div>
          )}
          <div className="space-y-4">
            {prd.timeline.milestones.map((milestone, i) => (
              <div key={i} className="border-l-4 border-primary pl-6 py-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold">{milestone.name}</h3>
                    <p className="text-sm text-subtext mt-1">{milestone.description}</p>
                    {milestone.dependencies && milestone.dependencies.length > 0 && (
                      <p className="text-xs text-subtext mt-2">
                        Depends on: {milestone.dependencies.join(", ")}
                      </p>
                    )}
                  </div>
                  {milestone.targetDate && (
                    <span className="text-sm font-medium text-subtext whitespace-nowrap">
                      {milestone.targetDate}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Dependencies */}
      {prd.dependencies && prd.dependencies.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <span className="text-2xl">🔗</span>
            External Dependencies
          </h2>
          <ul className="space-y-2">
            {prd.dependencies.map((dep, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-purple-600 dark:text-purple-400 mt-1">▸</span>
                <span>{dep}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
