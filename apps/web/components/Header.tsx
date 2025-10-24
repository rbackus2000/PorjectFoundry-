"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FileText,
  Palette,
  Package,
  Moon,
  Sun,
  User,
  Settings,
  LogOut
} from "lucide-react";

export function Header() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: `/prd${projectId ? `?projectId=${projectId}` : ""}`, label: "PRD", icon: FileText },
    { href: `/canvas${projectId ? `?projectId=${projectId}` : ""}`, label: "Canvas", icon: Palette },
    { href: `/artifacts${projectId ? `?projectId=${projectId}` : ""}`, label: "Artifacts", icon: Package },
  ];

  return (
    <header className="border-b border-border/60 bg-surface/70 backdrop-blur sticky top-0 z-50" role="banner">
      <div className="px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href={user ? "/dashboard" : "/"} className="font-semibold tracking-tight text-lg hover:text-primary transition-colors">
            BuildBridge
          </Link>
          {user && (
            <nav className="flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href.split("?")[0];
                const Icon = link.icon;
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
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-surface transition-colors flex items-center gap-2"
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            <span>{theme === "light" ? "Dark" : "Light"}</span>
          </button>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-surface transition-colors flex items-center gap-2"
                aria-label="User menu"
              >
                <User className="w-4 h-4" />
                <span className="max-w-[150px] truncate">{user.email}</span>
              </button>

              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-surface border border-border rounded-md shadow-lg z-50 overflow-hidden">
                    <Link
                      href="/settings"
                      className="block px-4 py-2 text-sm hover:bg-bg transition-colors flex items-center gap-2"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        signOut();
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-bg transition-colors border-t border-border flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link href="/auth/signin">
              <Button variant="default" size="sm">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
