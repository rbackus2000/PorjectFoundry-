"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Zap,
  Target,
  Brain,
  FileText,
  Package,
  ArrowRight,
  CheckCircle2,
  Rocket,
  Shield,
  LayoutDashboard,
  GitBranch,
  Workflow,
  LogIn,
} from "lucide-react";

export default function LandingPage() {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered PRDs",
      description:
        "Transform your ideas into enterprise-grade Product Requirements Documents with GPT-5. No more blank page syndrome.",
    },
    {
      icon: Workflow,
      title: "Intelligent Canvas",
      description:
        "Visualize your entire product architecture with AI-generated module graphs. Drag, drop, and organize with smart auto-layout.",
    },
    {
      icon: FileText,
      title: "Complete Specifications",
      description:
        "Generate backend specs, frontend specs, UI designs, and data models—all from a single idea. Every artifact you need.",
    },
    {
      icon: Package,
      title: "Instant Prompt Packs",
      description:
        "Export ready-to-use prompts for Cursor, Claude, Lovable, and Bolt. Go from idea to implementation in minutes.",
    },
    {
      icon: GitBranch,
      title: "Version Control",
      description:
        "Auto-incrementing versions (1.0 → 1.1 → 1.2) for every PRD regeneration. Track changes and iterate with confidence.",
    },
    {
      icon: Shield,
      title: "Enterprise Quality Gates",
      description:
        "Built-in validation ensures every PRD meets enterprise standards—numeric NFRs, safety rules, data models, and more.",
    },
  ];

  const benefits = [
    {
      title: "10x Faster Product Planning",
      description:
        "What used to take days of meetings and documentation now takes minutes. BuildBridge does the heavy lifting.",
      stat: "10x",
    },
    {
      title: "Zero Experience Required",
      description:
        "No PM background? No problem. Our AI guides you through best practices and generates professional artifacts.",
      stat: "0",
    },
    {
      title: "100% Complete",
      description:
        "Auto-fill guarantees every PRD has all enterprise sections. Never miss critical requirements again.",
      stat: "100%",
    },
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Describe Your Idea",
      description: "Write a simple pitch for your product. That's it.",
      icon: Sparkles,
    },
    {
      step: "2",
      title: "AI Builds Everything",
      description:
        "Watch as BuildBridge generates PRDs, modules, specs, and diagrams in real-time.",
      icon: Zap,
    },
    {
      step: "3",
      title: "Review & Refine",
      description:
        "Use the interactive canvas to adjust modules, set priorities, and fine-tune details.",
      icon: Target,
    },
    {
      step: "4",
      title: "Export & Build",
      description:
        "Download prompt packs optimized for your favorite AI coding tools and start building.",
      icon: Rocket,
    },
  ];

  const differentiators = [
    {
      competitor: "Traditional PM Tools",
      them: "Manual documentation, endless meetings, scattered artifacts",
      us: "AI-generated PRDs, unified workspace, instant artifacts",
    },
    {
      competitor: "Generic AI Prompts",
      them: "Vague outputs, missing context, no structure",
      us: "Enterprise-grade PRDs, complete specs, validation built-in",
    },
    {
      competitor: "Diagramming Tools",
      them: "Just boxes and arrows, no implementation details",
      us: "Smart modules + full backend/frontend/UI specifications",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-surface">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 py-24 sm:py-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.primary/10%),transparent)]" />
        <div className="absolute inset-y-0 right-1/2 -z-10 mr-16 w-[200%] origin-bottom-left skew-x-[-30deg] bg-surface/5 shadow-xl shadow-primary/10 ring-1 ring-border/50 sm:mr-28 lg:mr-0 xl:mr-16 xl:origin-center" />

        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-8 flex justify-center">
              <div className="relative rounded-full px-4 py-1.5 text-sm leading-6 text-muted-foreground ring-1 ring-border hover:ring-primary/50 transition-all">
                <span className="font-semibold text-primary">Now powered by GPT-5</span>{" "}
                <span className="mx-1">·</span> AI-Generated PRDs in seconds
                <ArrowRight className="ml-2 inline-block w-4 h-4" />
              </div>
            </div>

            <h1 className="text-5xl font-bold tracking-tight sm:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              From Idea to
              <br />
              <span className="bg-gradient-to-r from-primary via-blue-500 to-purple-600 bg-clip-text text-transparent">
                Production-Ready Prompts
              </span>
            </h1>

            <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
              BuildBridge transforms your product ideas into complete, enterprise-grade PRDs, technical
              specifications, and AI-optimized prompt packs—automatically.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4">
              <div className="flex items-center gap-x-4">
                <Link href="/auth/signup">
                  <Button size="lg" className="text-base px-8 py-6">
                    Start Building Free
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/auth/signin">
                  <Button size="lg" variant="outline" className="text-base px-8 py-6">
                    <LogIn className="mr-2 w-4 h-4" />
                    Sign In
                  </Button>
                </Link>
              </div>
              <Link href="#how-it-works" className="text-sm text-primary hover:underline">
                See how it works ↓
              </Link>
            </div>

            <div className="mt-8 flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Enterprise quality
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Export to any tool
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 py-24 sm:py-32" id="features">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-base font-semibold leading-7 text-primary">Everything You Need</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              The Complete Product Development Platform
            </p>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              From idea validation to implementation-ready artifacts, BuildBridge handles every step of the product
              planning process.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="relative group bg-surface p-8 rounded-2xl border border-border hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="px-6 py-24 bg-surface/30">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Why Teams Choose BuildBridge</h2>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="text-center">
                <div className="text-6xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent mb-4">
                  {benefit.stat}
                </div>
                <h3 className="text-2xl font-semibold mb-3">{benefit.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-24 sm:py-32" id="how-it-works">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-base font-semibold leading-7 text-primary">Simple Process</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Four Steps to Production-Ready Specs
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {howItWorks.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.step} className="relative">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                      <div className="relative w-20 h-20 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                        <Icon className="w-10 h-10 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-surface border-2 border-primary rounded-full flex items-center justify-center text-sm font-bold text-primary">
                        {step.step}
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                  {parseInt(step.step) < 4 && (
                    <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="px-6 py-24 bg-surface/30">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How BuildBridge Is Different</h2>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Stop piecing together fragmented tools. Get everything in one place.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border">
            <table className="w-full">
              <thead className="bg-surface">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Solution</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                    Traditional Approach
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary">BuildBridge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-background">
                {differentiators.map((diff, idx) => (
                  <tr key={idx} className="hover:bg-surface/50 transition-colors">
                    <td className="px-6 py-4 font-medium">{diff.competitor}</td>
                    <td className="px-6 py-4 text-muted-foreground text-sm">{diff.them}</td>
                    <td className="px-6 py-4 text-sm font-medium text-primary">{diff.us}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">
            Ready to Build Your Next Product?
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join teams using BuildBridge to ship faster, document better, and build with confidence.
          </p>
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="text-base px-10 py-7">
                  Start Building Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/canvas">
                <Button size="lg" variant="outline" className="text-base px-10 py-7">
                  View Demo Canvas
                  <LayoutDashboard className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/auth/signin" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-2xl font-bold">BuildBridge</div>
            <div className="flex gap-8 text-sm text-muted-foreground">
              <Link href="/dashboard" className="hover:text-foreground transition-colors">
                Dashboard
              </Link>
              <Link href="/canvas" className="hover:text-foreground transition-colors">
                Canvas
              </Link>
              <Link href="/artifacts" className="hover:text-foreground transition-colors">
                Artifacts
              </Link>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2025 BuildBridge. Transform ideas into reality.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
