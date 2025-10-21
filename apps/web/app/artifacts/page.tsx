"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const tabItems = [
  { value: "flows", label: "Mermaid (Flows)" },
  { value: "erd", label: "ERD" },
  { value: "packs", label: "Prompt Packs" },
  { value: "uispec", label: "UI Spec" },
] as const;

export default function ArtifactsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Artifacts</h1>
          <p className="text-subtext mt-1">Generated outputs and exports</p>
        </div>
        <Button>Generate All</Button>
      </div>

      <Tabs defaultValue="flows" className="w-full">
        <TabsList>
          {tabItems.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="flows" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Flow Diagrams</CardTitle>
              <CardDescription>Mermaid flowcharts generated from your project graph</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="min-h-[320px] border border-border rounded-lg p-4 text-subtext text-sm">
                No flowchart generated yet
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="erd" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Entity Relationship Diagram</CardTitle>
              <CardDescription>Database schema from backend spec</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="min-h-[320px] border border-border rounded-lg p-4 text-subtext text-sm">
                No ERD generated yet
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="packs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Prompt Packs</CardTitle>
              <CardDescription>Download ready-to-use prompt packs for various AI tools</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-subtext text-sm">No prompt packs generated yet</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="uispec" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>UI Specification</CardTitle>
              <CardDescription>Structured UI spec for Figma plugin</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="min-h-[320px] border border-border rounded-lg p-4 text-subtext text-sm">
                No UI spec generated yet
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
