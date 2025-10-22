"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export function ProjectSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");

  // If we're viewing a specific project, show project-specific nav
  if (projectId) {
    const projectItems = [
      { href: `/dashboard`, label: "← Back to Dashboard", icon: "⚡" },
      { href: `/canvas?projectId=${projectId}`, label: "Canvas", icon: "🎨" },
      { href: `/prd?projectId=${projectId}`, label: "PRD", icon: "📝" },
      { href: `/artifacts?projectId=${projectId}`, label: "Artifacts", icon: "📦" },
      { href: `/artifacts/rag?projectId=${projectId}`, label: "RAG Search", icon: "🔍" },
    ];

    return (
      <aside className="bg-surface rounded-xl border border-border sticky top-20 h-fit" role="navigation" aria-label="Project navigation">
        <nav className="p-2 space-y-1">
          {projectItems.map((item) => {
            const isActive = item.href.startsWith(pathname) && item.href !== "/dashboard";
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-bg/60 text-subtext hover:text-text focus-visible:bg-bg/60 focus-visible:text-text"
                )}
                aria-label={`Navigate to ${item.label}`}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="text-base" aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    );
  }

  // Default navigation when not viewing a specific project
  const defaultItems = [
    { href: "/dashboard", label: "Dashboard", icon: "⚡" },
    { href: "/settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <aside className="bg-surface rounded-xl border border-border sticky top-20 h-fit" role="navigation" aria-label="Main navigation">
      <nav className="p-2 space-y-1">
        {defaultItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-bg/60 text-subtext hover:text-text focus-visible:bg-bg/60 focus-visible:text-text"
              )}
              aria-label={`Navigate to ${item.label}`}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="text-base" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
