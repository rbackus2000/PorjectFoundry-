"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: "🏠" },
    { href: `/prd${projectId ? `?projectId=${projectId}` : ""}`, label: "PRD", icon: "📄" },
    { href: `/canvas${projectId ? `?projectId=${projectId}` : ""}`, label: "Canvas", icon: "🎨" },
    { href: `/artifacts${projectId ? `?projectId=${projectId}` : ""}`, label: "Artifacts", icon: "📦" },
  ];

  return (
    <header className="border-b border-border/60 bg-surface/70 backdrop-blur sticky top-0 z-50" role="banner">
      <div className="px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="font-semibold tracking-tight text-lg hover:text-primary transition-colors">
            Project Foundry
          </Link>
          <nav className="flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href.split("?")[0];
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface"
                  }`}
                >
                  <span>{link.icon}</span>
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-surface transition-colors"
            aria-label="Toggle theme"
          >
            Theme
          </button>
        </div>
      </div>
    </header>
  );
}
