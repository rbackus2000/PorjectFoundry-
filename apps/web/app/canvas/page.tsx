"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CanvasPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Module Canvas</h1>
          <p className="text-subtext mt-1">Drag and drop modules to design your project</p>
        </div>
        <Button>Save Graph</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Canvas (Coming Soon)</CardTitle>
          <CardDescription>React Flow canvas will be implemented here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[500px] border-2 border-dashed border-border rounded-lg flex items-center justify-center text-subtext">
            Canvas placeholder - T5 will implement React Flow here
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
