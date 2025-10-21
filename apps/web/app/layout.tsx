import "./globals.css";
import { ReactNode } from "react";
import { Inter } from "next/font/google";
import Link from "next/link";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "Project Foundry",
  description: "Transform ideas into production-ready prompts",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="bg-bg text-text antialiased font-sans">
        <div className="min-h-dvh grid grid-rows-[auto,1fr]">
          <Header />
          <div className="grid grid-cols-[240px,1fr] max-w-[1400px] mx-auto w-full gap-6 px-6 py-6">
            <Sidebar />
            <main className="">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}

function Header() {
  return (
    <header className="border-b border-border/60 bg-surface/70 backdrop-blur sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
        <div className="font-semibold tracking-tight text-lg">Project Foundry</div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-surface">
            Theme
          </button>
        </div>
      </div>
    </header>
  );
}

function Sidebar() {
  const items = [
    { href: "/dashboard", label: "Dashboard", icon: "⚡" },
    { href: "/canvas", label: "Canvas", icon: "🎨" },
    { href: "/prd", label: "PRD", icon: "📝" },
    { href: "/artifacts", label: "Artifacts", icon: "📦" },
    { href: "/settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <aside className="bg-surface rounded-xl border border-border sticky top-20 h-fit">
      <nav className="p-2 space-y-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              "hover:bg-bg/60 text-subtext hover:text-text"
            )}
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
