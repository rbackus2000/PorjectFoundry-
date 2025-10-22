"use client";

import { KpiTile } from "@/components/ui/kpi-tile";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectCreationWizard, ProjectFormData } from "@/components/ProjectCreationWizard";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type DashboardStats = {
  projectCount: number;
  modulesInScope: number;
  lastGenerate: string;
  errors: number;
};

type Project = {
  id: string;
  title: string;
  pitch: string | null;
  platforms: string | null;
  status: string; // "draft" or "complete"
  createdAt: Date;
  modulesInScope: number;
  artifactCount: number;
};

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingDraftId, setEditingDraftId] = useState<string | undefined>(undefined);
  const [stats, setStats] = useState<DashboardStats>({
    projectCount: 0,
    modulesInScope: 0,
    lastGenerate: "Never",
    errors: 0,
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Fetch real dashboard stats and projects
    async function fetchData() {
      try {
        const [statsResponse, projectsResponse] = await Promise.all([
          fetch("/api/dashboard/stats"),
          fetch("/api/dashboard/projects"),
        ]);

        if (statsResponse.ok) {
          const data = await statsResponse.json();
          setStats(data);
        }

        if (projectsResponse.ok) {
          const data = await projectsResponse.json();
          setProjects(data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleCreateProject = async (formData: ProjectFormData) => {
    try {
      // Create project and trigger generation with comprehensive data
      const response = await fetch("/api/projects/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to create project");
      }

      const { projectId } = await response.json();

      // Close wizard
      setIsWizardOpen(false);

      // Refresh dashboard stats and projects
      const [statsResponse, projectsResponse] = await Promise.all([
        fetch("/api/dashboard/stats"),
        fetch("/api/dashboard/projects"),
      ]);

      if (statsResponse.ok) {
        const data = await statsResponse.json();
        setStats(data);
      }

      if (projectsResponse.ok) {
        const data = await projectsResponse.json();
        setProjects(data);
      }

      // Navigate to PRD to see the generated document
      router.push(`/prd?projectId=${projectId}`);
    } catch (error) {
      console.error("Error creating project:", error);
      alert("Failed to create project. Please try again.");
      throw error; // Re-throw so wizard can handle it
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-4 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 space-y-3">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-96" />
          <div className="flex gap-3 pt-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[2400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-subtext mt-1">Overview of your project status</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setIsWizardOpen(true)}>New Project</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
        <KpiTile
          label="Projects"
          value={stats.projectCount.toString()}
          sub={stats.projectCount === 1 ? "Active" : "Total"}
        />
        <KpiTile
          label="Modules In Scope"
          value={stats.modulesInScope.toString()}
          sub={`${stats.modulesInScope} total`}
        />
        <KpiTile
          label="Last Generate"
          value={stats.lastGenerate}
          sub=""
        />
        <KpiTile
          label="Errors"
          value={stats.errors.toString()}
          sub={stats.errors === 0 ? "All systems operational" : "Needs attention"}
        />
      </div>

      {stats.projectCount === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold mb-2">Get Started</h2>
          <p className="text-subtext text-sm">
            Click "New Project" above to create your first project. AI will generate a complete PRD, backend spec, frontend spec, UI design system, and populate your canvas with modules.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Your Projects</h2>
          <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="rounded-xl border border-border bg-surface p-6 hover:border-primary transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold">{project.title}</h3>
                      {project.status === "draft" && (
                        <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs font-medium rounded">
                          DRAFT
                        </span>
                      )}
                    </div>
                    {project.pitch && (
                      <p className="text-subtext text-sm mb-3">{project.pitch}</p>
                    )}
                    <div className="flex gap-4 text-xs text-subtext mb-3">
                      <span>{project.modulesInScope} modules</span>
                      <span>{project.artifactCount} artifacts</span>
                      {project.platforms && <span>{project.platforms}</span>}
                    </div>
                    <div className="flex gap-2">
                      {project.status === "draft" ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => {
                              setEditingDraftId(project.id);
                              setIsWizardOpen(true);
                            }}
                          >
                            Resume Editing
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (confirm("Delete this draft?")) {
                                // TODO: Add delete API call
                                console.log("Delete draft:", project.id);
                              }
                            }}
                          >
                            Delete Draft
                          </Button>
                        </>
                      ) : (
                        <Link href={`/prd?projectId=${project.id}`}>
                          <Button size="sm" variant="outline">
                            View PRD
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-subtext">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Project Creation Wizard */}
      <ProjectCreationWizard
        isOpen={isWizardOpen}
        onClose={() => {
          setIsWizardOpen(false);
          setEditingDraftId(undefined);
        }}
        onSubmit={handleCreateProject}
        projectId={editingDraftId}
      />
    </div>
  );
}
