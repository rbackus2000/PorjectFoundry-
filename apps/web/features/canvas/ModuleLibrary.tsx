"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { getCategoryStyle } from "./layoutUtils";

export type ModuleTemplate = {
  id: string;
  label: string;
  category: string;
  description: string;
};

const moduleTemplates: ModuleTemplate[] = [
  // Authentication & Security
  {
    id: "auth",
    label: "Authentication",
    category: "Authentication",
    description: "Login, signup, OAuth, password reset",
  },
  {
    id: "mfa",
    label: "Multi-Factor Auth",
    category: "Security",
    description: "2FA, TOTP, SMS verification",
  },
  {
    id: "rbac",
    label: "Role-Based Access",
    category: "Security",
    description: "Permissions, roles, access control",
  },

  // User Management
  {
    id: "user-profile",
    label: "User Profile",
    category: "Frontend",
    description: "Profile editing, avatar, preferences",
  },
  {
    id: "user-management",
    label: "User Management",
    category: "Backend",
    description: "Admin CRUD for users",
  },
  {
    id: "team-management",
    label: "Teams & Organizations",
    category: "Backend",
    description: "Multi-tenant teams, invitations",
  },

  // UI/UX
  {
    id: "dashboard",
    label: "Dashboard",
    category: "UI/UX",
    description: "Overview with KPIs, charts, widgets",
  },
  {
    id: "settings",
    label: "Settings",
    category: "UI/UX",
    description: "User preferences, app configuration",
  },
  {
    id: "onboarding",
    label: "Onboarding Flow",
    category: "UI/UX",
    description: "Guided tour, setup wizard",
  },

  // Analytics & Reporting
  {
    id: "analytics",
    label: "Analytics",
    category: "Analytics",
    description: "Track events, visualize metrics",
  },
  {
    id: "reports",
    label: "Reports",
    category: "Analytics",
    description: "Generate PDF/Excel reports",
  },
  {
    id: "activity-log",
    label: "Activity Log",
    category: "Analytics",
    description: "Audit trail, user actions",
  },

  // Communication
  {
    id: "notifications",
    label: "Notifications",
    category: "Integration",
    description: "Email, push, in-app, SMS alerts",
  },
  {
    id: "chat",
    label: "Chat/Messaging",
    category: "Integration",
    description: "Real-time messaging, channels",
  },
  {
    id: "email-templates",
    label: "Email Templates",
    category: "Integration",
    description: "Transactional emails, marketing",
  },

  // Content & Search
  {
    id: "search",
    label: "Search",
    category: "Integration",
    description: "Full-text, filters, autocomplete",
  },
  {
    id: "comments",
    label: "Comments",
    category: "Frontend",
    description: "Nested comments, reactions, mentions",
  },
  {
    id: "content-editor",
    label: "Rich Text Editor",
    category: "Frontend",
    description: "WYSIWYG, markdown support",
  },

  // Payments & Billing
  {
    id: "payments",
    label: "Payments",
    category: "Payment",
    description: "Stripe, PayPal, card processing",
  },
  {
    id: "subscription",
    label: "Subscriptions",
    category: "Payment",
    description: "Recurring billing, plan tiers",
  },
  {
    id: "invoicing",
    label: "Invoicing",
    category: "Payment",
    description: "Generate invoices, receipts",
  },

  // Storage & Files
  {
    id: "file-upload",
    label: "File Upload",
    category: "Data",
    description: "S3, CloudFlare, drag-and-drop",
  },
  {
    id: "image-processing",
    label: "Image Processing",
    category: "Data",
    description: "Resize, crop, optimization",
  },
  {
    id: "cdn",
    label: "CDN Integration",
    category: "Data",
    description: "Asset delivery, caching",
  },

  // AI & ML
  {
    id: "ai-chat",
    label: "AI Chatbot",
    category: "AI/ML",
    description: "GPT-powered assistant",
  },
  {
    id: "recommendations",
    label: "Recommendations",
    category: "AI/ML",
    description: "ML-based suggestions",
  },
  {
    id: "sentiment-analysis",
    label: "Sentiment Analysis",
    category: "AI/ML",
    description: "Text emotion detection",
  },

  // Admin & Management
  {
    id: "admin-panel",
    label: "Admin Panel",
    category: "Backend",
    description: "Full CRUD interface, management",
  },
  {
    id: "feature-flags",
    label: "Feature Flags",
    category: "Backend",
    description: "Toggle features, A/B testing",
  },
  {
    id: "monitoring",
    label: "Monitoring",
    category: "Backend",
    description: "Error tracking, performance",
  },

  // Integrations
  {
    id: "api-integration",
    label: "API Integration",
    category: "Integration",
    description: "Third-party API connectors",
  },
  {
    id: "webhooks",
    label: "Webhooks",
    category: "Integration",
    description: "Event-driven integrations",
  },
  {
    id: "calendar",
    label: "Calendar",
    category: "Integration",
    description: "Google Calendar, scheduling",
  },
];

type ModuleLibraryProps = {
  onAddModule: (module: ModuleTemplate) => void;
};

export default function ModuleLibrary({ onAddModule }: ModuleLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [customModuleName, setCustomModuleName] = useState("");
  const [customModuleDescription, setCustomModuleDescription] = useState("");
  const [customModuleCategory, setCustomModuleCategory] = useState("Backend");

  const categories = Array.from(new Set(moduleTemplates.map((m) => m.category)));

  const filteredModules = moduleTemplates.filter((mod) => {
    const matchesSearch =
      mod.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mod.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mod.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = !selectedCategory || mod.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleCreateCustomModule = () => {
    if (!customModuleName.trim()) {
      alert("Please enter a module name");
      return;
    }

    const customModule: ModuleTemplate = {
      id: `custom-${Date.now()}`,
      label: customModuleName,
      category: customModuleCategory,
      description: customModuleDescription || "Custom module",
    };

    onAddModule(customModule);
    setIsDialogOpen(false);
    setCustomModuleName("");
    setCustomModuleDescription("");
    setCustomModuleCategory("Backend");
  };

  return (
    <Card className="h-full overflow-hidden flex flex-col">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">📦 Module Library</CardTitle>
            <CardDescription>
              {filteredModules.length} modules available
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                ➕ Custom
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Custom Module</DialogTitle>
                <DialogDescription>
                  Add a custom module to your canvas
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Module Name</label>
                  <Input
                    placeholder="e.g., Custom API Gateway"
                    value={customModuleName}
                    onChange={(e) => setCustomModuleName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <select
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    value={customModuleCategory}
                    onChange={(e) => setCustomModuleCategory(e.target.value)}
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description (optional)</label>
                  <Textarea
                    placeholder="Brief description of this module..."
                    value={customModuleDescription}
                    onChange={(e) => setCustomModuleDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCustomModule}>
                  Create Module
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto space-y-3 pb-4 pt-4">
        {/* Search Bar */}
        <Input
          placeholder="🔍 Search modules..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mb-3"
        />

        {/* Category Filter */}
        <div className="flex flex-wrap gap-1.5 mb-3 pb-3 border-b border-border">
          <Button
            size="sm"
            variant={selectedCategory === null ? "default" : "ghost"}
            onClick={() => setSelectedCategory(null)}
            className="h-7 text-xs"
          >
            All
          </Button>
          {categories.slice(0, 5).map((category) => {
            const Icon = getCategoryStyle(category).icon;
            return (
              <Button
                key={category}
                size="sm"
                variant={selectedCategory === category ? "default" : "ghost"}
                onClick={() => setSelectedCategory(category)}
                className="h-7 text-xs flex items-center gap-1.5"
              >
                <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                {category}
              </Button>
            );
          })}
        </div>

        {/* Module List */}
        <div className="space-y-2">
          {filteredModules.map((module) => {
            const categoryStyle = getCategoryStyle(module.category);
            const Icon = categoryStyle.icon;
            return (
              <div
                key={module.id}
                className="group relative overflow-hidden p-3 border border-border rounded-lg hover:border-primary/50 cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-primary/20"
                onClick={() => onAddModule(module)}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData("application/reactflow", JSON.stringify(module));
                  event.dataTransfer.effectAllowed = "move";
                }}
              >
                {/* Background Gradient */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${categoryStyle.gradient} opacity-0 group-hover:opacity-10 transition-opacity`}
                />

                {/* Content */}
                <div className="relative flex items-start gap-2">
                  <Icon className="w-5 h-5 flex-shrink-0 text-foreground/80" strokeWidth={2} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">
                        {module.label}
                      </h4>
                      <Badge
                        variant="secondary"
                        className="text-xs flex-shrink-0"
                      >
                        {module.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {module.description}
                    </p>
                  </div>
                </div>

                {/* Hover Indicator */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-primary">+ Add</span>
                </div>
              </div>
            );
          })}
        </div>

        {filteredModules.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-12">
            <div className="text-4xl mb-2">🔍</div>
            <p>No modules found</p>
            <p className="text-xs mt-1">Try a different search term</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
