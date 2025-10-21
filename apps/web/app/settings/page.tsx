"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-subtext mt-1">Configure your project metadata</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Information</CardTitle>
          <CardDescription>Basic details about your project</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Project Title</Label>
            <Input id="title" placeholder="My Awesome Project" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pitch">Elevator Pitch</Label>
            <Input id="pitch" placeholder="A tool that helps developers..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="platforms">Target Platforms</Label>
            <Input id="platforms" placeholder="Web, iOS, Android" />
          </div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize the look and feel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Theme</Label>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Light</Button>
              <Button variant="outline" size="sm">Dark</Button>
              <Button variant="outline" size="sm">System</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Export or reset your project data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline">Export Project JSON</Button>
          <Button variant="destructive">Reset Project</Button>
        </CardContent>
      </Card>
    </div>
  );
}
