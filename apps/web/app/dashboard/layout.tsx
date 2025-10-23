import { ReactNode, Suspense } from "react";
import { ProjectSidebar } from "@/components/ProjectSidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-full w-full grid grid-cols-[240px,1fr] gap-6 px-6 py-6 max-w-[1600px] mx-auto">
      <Suspense fallback={<SidebarSkeleton />}>
        <ProjectSidebar />
      </Suspense>
      <main className="overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <aside className="bg-surface rounded-xl border border-border sticky top-6 h-fit">
      <nav className="p-2 space-y-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-9 bg-border/30 rounded-lg animate-pulse" />
        ))}
      </nav>
    </aside>
  );
}
