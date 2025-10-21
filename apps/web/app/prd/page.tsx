"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PRDPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between sticky top-20 bg-bg py-2 z-10">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">PRD</h1>
          <p className="text-subtext mt-1">Product Requirements Document</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">Export PRD.md</Button>
          <Button>Regenerate PRD</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>PRD Viewer (Coming Soon)</CardTitle>
          <CardDescription>Tiptap read-only editor will be implemented here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[500px] border border-border rounded-lg p-4 text-subtext">
            No PRD generated yet. Click "Regenerate PRD" to generate from your modules.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
