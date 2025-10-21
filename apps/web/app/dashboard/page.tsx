"use client";

import { KpiTile } from "@/components/ui/kpi-tile";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-subtext mt-1">Overview of your project status</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">Regenerate</Button>
          <Button>Create Prompt Pack</Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <KpiTile label="Projects" value="1" sub="Active" />
        <KpiTile label="Modules In Scope" value="0" sub="0 pending" />
        <KpiTile label="Last Generate" value="Never" sub="" />
        <KpiTile label="Errors" value="0" sub="All systems operational" />
      </div>

      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold mb-2">Quick Actions</h2>
        <p className="text-subtext text-sm mb-4">
          Get started by adding modules to your canvas or generating your first PRD
        </p>
        <div className="flex gap-3">
          <Button variant="outline">Open Canvas</Button>
          <Button variant="outline">View PRD</Button>
        </div>
      </div>
    </div>
  );
}
