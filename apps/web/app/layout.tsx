import "./globals.css";
import { ReactNode, Suspense } from "react";
import { Inter } from "next/font/google";
import Link from "next/link";
import { ProjectSidebar } from "@/components/ProjectSidebar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "Project Foundry",
  description: "Transform ideas into production-ready prompts",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="bg-bg text-text antialiased font-sans">
        <a href="#main-content" className="skip-to-main">
          Skip to main content
        </a>
        <div className="min-h-dvh grid grid-rows-[auto,1fr]">
          <Header />
          <div className="grid grid-cols-[240px,1fr] max-w-[1400px] mx-auto w-full gap-6 px-6 py-6">
            <Suspense fallback={<SidebarSkeleton />}>
              <ProjectSidebar />
            </Suspense>
            <main id="main-content" className="" tabIndex={-1}>
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}

function Header() {
  return (
    <header className="border-b border-border/60 bg-surface/70 backdrop-blur sticky top-0 z-50" role="banner">
      <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="font-semibold tracking-tight text-lg hover:text-primary transition-colors">
          Project Foundry
        </Link>
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

function SidebarSkeleton() {
  return (
    <aside className="bg-surface rounded-xl border border-border sticky top-20 h-fit">
      <nav className="p-2 space-y-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-9 bg-border/30 rounded-lg animate-pulse" />
        ))}
      </nav>
    </aside>
  );
}
