"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useTheme } from "@/components/ThemeProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const IDE_OPTIONS = [
  { value: "cursor", label: "Cursor" },
  { value: "claude-code", label: "Claude Code" },
  { value: "vscode", label: "VS Code" },
  { value: "loveable", label: "Loveable" },
  { value: "bolt", label: "Bolt" },
  { value: "codex", label: "Codex" },
] as const;

type IDEChoice = typeof IDE_OPTIONS[number]["value"];

export default function SettingsPage() {
  const { user, updateEmail, updatePassword } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  // Account state
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Preferences state
  const [defaultIDE, setDefaultIDE] = useState<IDEChoice>("cursor");

  useEffect(() => {
    // Load saved IDE preference from localStorage
    const saved = localStorage.getItem("defaultIDE") as IDEChoice | null;
    if (saved) {
      setDefaultIDE(saved);
    }
  }, []);

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newEmail || newEmail === user?.email) {
      toast({
        title: "No changes",
        description: "Please enter a different email address",
        variant: "error",
      });
      return;
    }

    setIsUpdatingEmail(true);

    try {
      const { error } = await updateEmail(newEmail);

      if (error) {
        toast({
          title: "Failed to update email",
          description: error.message,
          variant: "error",
        });
      } else {
        toast({
          title: "Email update initiated",
          description: "Please check both your old and new email to confirm the change.",
          variant: "success",
        });
        setNewEmail("");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "error",
      });
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmNewPassword) {
      toast({
        title: "Missing fields",
        description: "Please fill in all password fields",
        variant: "error",
      });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your new passwords match",
        variant: "error",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long",
        variant: "error",
      });
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const { error } = await updatePassword(newPassword);

      if (error) {
        toast({
          title: "Failed to update password",
          description: error.message,
          variant: "error",
        });
      } else {
        toast({
          title: "Password updated",
          description: "Your password has been successfully changed.",
          variant: "success",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "error",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleIDEChange = (value: IDEChoice) => {
    setDefaultIDE(value);
    localStorage.setItem("defaultIDE", value);
    toast({
      title: "Preference saved",
      description: `Default IDE set to ${IDE_OPTIONS.find(ide => ide.value === value)?.label}`,
      variant: "success",
    });
  };

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    if (newTheme === "system") {
      const systemPreference = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      localStorage.setItem("theme", systemPreference);
      if (theme !== systemPreference) {
        toggleTheme();
      }
    } else {
      if (theme !== newTheme) {
        toggleTheme();
      }
    }
  };

  const handleExportData = () => {
    // TODO: Implement data export
    toast({
      title: "Export initiated",
      description: "Your project data will be downloaded shortly.",
      variant: "success",
    });
  };

  const handleClearCache = async () => {
    await confirm({
      title: "Clear Application Cache",
      description: "This will clear all cached data including saved preferences (except auth). You will remain logged in. This action cannot be undone.",
      confirmText: "Clear Cache",
      variant: "destructive",
      onConfirm: () => {
        try {
          // Clear localStorage except auth-related items
          const keysToKeep = ["sb-ttkkojdoydaadrlezeyi-auth-token"];
          const allKeys = Object.keys(localStorage);
          allKeys.forEach(key => {
            if (!keysToKeep.some(keepKey => key.includes(keepKey))) {
              localStorage.removeItem(key);
            }
          });

          toast({
            title: "Cache cleared",
            description: "Application cache has been cleared successfully.",
            variant: "success",
          });

          // Reload to apply changes
          setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
          toast({
            title: "Failed to clear cache",
            description: "An error occurred while clearing the cache",
            variant: "error",
          });
        }
      },
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Account Settings</h1>
        <p className="text-subtext mt-1">Manage your account, preferences, and data</p>
      </div>

      {/* Account Section */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Manage your email and password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Email Display */}
          <div className="space-y-2">
            <Label>Current Email</Label>
            <Input value={user?.email || "Not signed in"} disabled />
          </div>

          {/* Update Email */}
          <form onSubmit={handleUpdateEmail} className="space-y-4 pt-4 border-t">
            <div>
              <h3 className="text-sm font-medium mb-3">Change Email</h3>
              <div className="space-y-2">
                <Label htmlFor="newEmail">New Email</Label>
                <Input
                  id="newEmail"
                  type="email"
                  placeholder="newemail@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  disabled={isUpdatingEmail || !user}
                />
              </div>
            </div>
            <Button type="submit" disabled={isUpdatingEmail || !user || !newEmail}>
              {isUpdatingEmail ? "Updating..." : "Update Email"}
            </Button>
          </form>

          {/* Update Password */}
          <form onSubmit={handleUpdatePassword} className="space-y-4 pt-4 border-t">
            <div>
              <h3 className="text-sm font-medium mb-3">Change Password</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isUpdatingPassword || !user}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                  <Input
                    id="confirmNewPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    disabled={isUpdatingPassword || !user}
                  />
                </div>
              </div>
            </div>
            <Button type="submit" disabled={isUpdatingPassword || !user || !newPassword}>
              {isUpdatingPassword ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Appearance Section */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize how BuildBridge looks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Theme</Label>
            <div className="flex gap-2">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                size="sm"
                onClick={() => handleThemeChange("light")}
              >
                Light
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                size="sm"
                onClick={() => handleThemeChange("dark")}
              >
                Dark
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleThemeChange("system")}
              >
                System
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences Section */}
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Set your default tools and workflow preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="defaultIDE">Default IDE</Label>
            <Select value={defaultIDE} onValueChange={handleIDEChange}>
              <SelectTrigger id="defaultIDE" className="w-full max-w-xs">
                <SelectValue placeholder="Select your IDE" />
              </SelectTrigger>
              <SelectContent>
                {IDE_OPTIONS.map((ide) => (
                  <SelectItem key={ide.value} value={ide.value}>
                    {ide.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-subtext mt-2">
              This will be used as the default IDE when generating prompts and code exports
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Data Management Section */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Manage your application data and cache</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Export Data</h3>
            <p className="text-sm text-subtext mb-2">
              Download all your project data as JSON for backup or migration purposes
            </p>
            <Button variant="outline" onClick={handleExportData}>
              Export All Projects
            </Button>
          </div>

          <div className="space-y-2 pt-4 border-t">
            <h3 className="text-sm font-medium">Clear Cache</h3>
            <p className="text-sm text-subtext mb-2">
              Clear application cache and reset preferences. This can help resolve issues but will reset your settings (you'll stay logged in)
            </p>
            <Button variant="outline" onClick={handleClearCache}>
              Clear Application Cache
            </Button>
          </div>

          <div className="space-y-2 pt-4 border-t">
            <h3 className="text-sm font-medium text-red-600 dark:text-red-400">Danger Zone</h3>
            <p className="text-sm text-subtext mb-2">
              Delete all your projects and data. This action is permanent and cannot be undone
            </p>
            <Button variant="destructive" disabled>
              Delete All Data (Coming Soon)
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog />
    </div>
  );
}
