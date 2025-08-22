"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import {
  IconUser,
  IconBell,
  IconShield,
  IconPalette,
  IconDownload,
  IconLoader2,
  IconCheck,
} from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// API functions
const fetchUserProfile = async () => {
  const response = await fetch("/api/user/profile");
  if (!response.ok) throw new Error("Failed to fetch profile");
  return response.json();
};

const fetchUserPreferences = async () => {
  const response = await fetch("/api/user/preferences");
  if (!response.ok) throw new Error("Failed to fetch preferences");
  return response.json();
};

const updateUserProfile = async (data: any) => {
  const response = await fetch("/api/user/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update profile");
  return response.json();
};

const updateUserPreferences = async (data: any) => {
  const response = await fetch("/api/user/preferences", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update preferences");
  return response.json();
};

const changeUserPassword = async (data: any) => {
  const response = await fetch("/api/user/password", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to change password");
  }
  return response.json();
};

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState("profile");
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // React Query hooks for fetching data
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: fetchUserProfile,
  });

  const { data: userPreferences, isLoading: preferencesLoading } = useQuery({
    queryKey: ["userPreferences"],
    queryFn: fetchUserPreferences,
  });

  // Local state for form inputs
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    image: "",
  });

  const [preferencesForm, setPreferencesForm] = useState({
    notifications: {
      email: true,
      turnApprovals: true,
      overdueTurns: true,
      vendorUpdates: false,
      weeklyReports: true,
    },
    display: {
      theme: "light",
      language: "en",
      timezone: "America/Los_Angeles",
      dateFormat: "MM/DD/YYYY",
    },
    security: {
      sessionTimeout: "4h",
      twoFactorEnabled: false,
    },
  });

  // Update local state when data is fetched
  React.useEffect(() => {
    if (userProfile) {
      setProfileForm({
        name: userProfile.name || "",
        email: userProfile.email || "",
        image: userProfile.image || "",
      });
    }
  }, [userProfile]);

  React.useEffect(() => {
    if (userPreferences) {
      setPreferencesForm(userPreferences);
    }
  }, [userPreferences]);

  // Mutations
  const profileMutation = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      toast.success("Profile updated successfully");
    },
    onError: () => {
      toast.error("Failed to update profile");
    },
  });

  const notificationsMutation = useMutation({
    mutationFn: (data: any) => updateUserPreferences({ notifications: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userPreferences"] });
      toast.success("Notification preferences saved");
    },
    onError: () => {
      toast.error("Failed to save notification preferences");
    },
  });

  const displayMutation = useMutation({
    mutationFn: (data: any) => updateUserPreferences({ display: data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["userPreferences"] });
      toast.success("Display preferences saved");
      
      // Apply theme if changed
      if (variables.theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    },
    onError: () => {
      toast.error("Failed to save display preferences");
    },
  });

  const securityMutation = useMutation({
    mutationFn: (data: any) => updateUserPreferences({ security: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userPreferences"] });
      toast.success("Security settings saved");
    },
    onError: () => {
      toast.error("Failed to save security settings");
    },
  });

  const passwordMutation = useMutation({
    mutationFn: changeUserPassword,
    onSuccess: () => {
      toast.success("Password changed successfully");
      setPasswordDialogOpen(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const exportDataMutation = useMutation({
    mutationFn: async () => {
      // Simulate data export
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { success: true };
    },
    onSuccess: () => {
      toast.success("Your data has been exported and will be sent to your email");
    },
    onError: () => {
      toast.error("Failed to export data");
    },
  });

  const handlePasswordChange = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    
    passwordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

  const sectionButtons = [
    { id: "profile", label: "Profile", icon: IconUser },
    { id: "notifications", label: "Notifications", icon: IconBell },
    { id: "security", label: "Security", icon: IconShield },
    { id: "display", label: "Display", icon: IconPalette },
    { id: "data", label: "Data & Export", icon: IconDownload },
  ];

  if (profileLoading || preferencesLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <IconLoader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and system preferences
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Settings Navigation */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <nav className="space-y-2">
                  {sectionButtons.map(({ id, label, icon: Icon }) => (
                    <Button
                      key={id}
                      variant={activeSection === id ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setActiveSection(id)}
                    >
                      <Icon className="mr-3 h-4 w-4" />
                      {label}
                    </Button>
                  ))}
                </nav>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Account Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Verified</span>
                  <Badge variant="outline" className="text-green-600">
                    <IconCheck className="mr-1 h-3 w-3" />
                    Verified
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">2FA</span>
                  {preferencesForm.security.twoFactorEnabled ? (
                    <Badge variant="outline" className="text-green-600">Active</Badge>
                  ) : (
                    <Badge variant="outline">Inactive</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Member Since</span>
                  <span className="text-sm font-medium">Jan 2024</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Settings */}
            {activeSection === "profile" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconUser className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>
                    Update your personal information and contact details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profileForm.name || ""}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      placeholder="Enter your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileForm.email || ""}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      placeholder="Enter your email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="avatar">Avatar URL</Label>
                    <Input
                      id="avatar"
                      value={profileForm.image}
                      onChange={(e) => setProfileForm({ ...profileForm, image: e.target.value })}
                      placeholder="https://example.com/avatar.jpg"
                    />
                  </div>
                  <div className="pt-4">
                    <Button 
                      onClick={() => profileMutation.mutate(profileForm)} 
                      disabled={profileMutation.isPending}
                    >
                      {profileMutation.isPending && (
                        <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notification Settings */}
            {activeSection === "notifications" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconBell className="h-5 w-5" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>
                    Control how and when you receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Email Notifications</Label>
                        <p className="text-xs text-muted-foreground">
                          Receive notifications via email
                        </p>
                      </div>
                      <Switch
                        checked={preferencesForm.notifications.email}
                        onCheckedChange={(checked) =>
                          setPreferencesForm({
                            ...preferencesForm,
                            notifications: { ...preferencesForm.notifications, email: checked },
                          })
                        }
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Turn Approvals</Label>
                        <p className="text-xs text-muted-foreground">
                          Notify when turns need approval
                        </p>
                      </div>
                      <Switch
                        checked={preferencesForm.notifications.turnApprovals}
                        onCheckedChange={(checked) =>
                          setPreferencesForm({
                            ...preferencesForm,
                            notifications: { ...preferencesForm.notifications, turnApprovals: checked },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Overdue Turns</Label>
                        <p className="text-xs text-muted-foreground">
                          Alert when turns are overdue
                        </p>
                      </div>
                      <Switch
                        checked={preferencesForm.notifications.overdueTurns}
                        onCheckedChange={(checked) =>
                          setPreferencesForm({
                            ...preferencesForm,
                            notifications: { ...preferencesForm.notifications, overdueTurns: checked },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Vendor Updates</Label>
                        <p className="text-xs text-muted-foreground">
                          Updates about vendor performance
                        </p>
                      </div>
                      <Switch
                        checked={preferencesForm.notifications.vendorUpdates}
                        onCheckedChange={(checked) =>
                          setPreferencesForm({
                            ...preferencesForm,
                            notifications: { ...preferencesForm.notifications, vendorUpdates: checked },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Weekly Reports</Label>
                        <p className="text-xs text-muted-foreground">
                          Weekly performance summaries
                        </p>
                      </div>
                      <Switch
                        checked={preferencesForm.notifications.weeklyReports}
                        onCheckedChange={(checked) =>
                          setPreferencesForm({
                            ...preferencesForm,
                            notifications: { ...preferencesForm.notifications, weeklyReports: checked },
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="pt-4">
                    <Button 
                      onClick={() => notificationsMutation.mutate(preferencesForm.notifications)} 
                      disabled={notificationsMutation.isPending}
                    >
                      {notificationsMutation.isPending && (
                        <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Save Preferences
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Security Settings */}
            {activeSection === "security" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconShield className="h-5 w-5" />
                    Security Settings
                  </CardTitle>
                  <CardDescription>
                    Manage your account security and authentication
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Password</Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Change your account password
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setPasswordDialogOpen(true)}
                      >
                        Change Password
                      </Button>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          Two-Factor Authentication
                          <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <Switch
                        checked={preferencesForm.security.twoFactorEnabled}
                        onCheckedChange={(checked) =>
                          setPreferencesForm({
                            ...preferencesForm,
                            security: { ...preferencesForm.security, twoFactorEnabled: checked },
                          })
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Session Timeout</Label>
                        <p className="text-xs text-muted-foreground">
                          Automatically log out after inactivity
                        </p>
                      </div>
                      <Select
                        value={preferencesForm.security.sessionTimeout}
                        onValueChange={(value) =>
                          setPreferencesForm({
                            ...preferencesForm,
                            security: { ...preferencesForm.security, sessionTimeout: value },
                          })
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1h">1 hour</SelectItem>
                          <SelectItem value="4h">4 hours</SelectItem>
                          <SelectItem value="8h">8 hours</SelectItem>
                          <SelectItem value="never">Never</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="pt-4">
                    <Button 
                      onClick={() => securityMutation.mutate(preferencesForm.security)} 
                      disabled={securityMutation.isPending}
                    >
                      {securityMutation.isPending && (
                        <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Save Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Display Settings */}
            {activeSection === "display" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconPalette className="h-5 w-5" />
                    Display Preferences
                  </CardTitle>
                  <CardDescription>
                    Customize your application experience
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Dark Mode</Label>
                        <p className="text-xs text-muted-foreground">
                          Switch between light and dark theme
                        </p>
                      </div>
                      <Switch
                        checked={preferencesForm.display.theme === "dark"}
                        onCheckedChange={(checked) =>
                          setPreferencesForm({
                            ...preferencesForm,
                            display: { ...preferencesForm.display, theme: checked ? "dark" : "light" },
                          })
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Language</Label>
                      <Select
                        value={preferencesForm.display.language}
                        onValueChange={(value) =>
                          setPreferencesForm({
                            ...preferencesForm,
                            display: { ...preferencesForm.display, language: value },
                          })
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Timezone</Label>
                      <Select
                        value={preferencesForm.display.timezone}
                        onValueChange={(value) =>
                          setPreferencesForm({
                            ...preferencesForm,
                            display: { ...preferencesForm.display, timezone: value },
                          })
                        }
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time</SelectItem>
                          <SelectItem value="America/Chicago">Central Time</SelectItem>
                          <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Date Format</Label>
                      <Select
                        value={preferencesForm.display.dateFormat}
                        onValueChange={(value) =>
                          setPreferencesForm({
                            ...preferencesForm,
                            display: { ...preferencesForm.display, dateFormat: value },
                          })
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="pt-4">
                    <Button 
                      onClick={() => displayMutation.mutate(preferencesForm.display)} 
                      disabled={displayMutation.isPending}
                    >
                      {displayMutation.isPending && (
                        <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Save Preferences
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Data & Export */}
            {activeSection === "data" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconDownload className="h-5 w-5" />
                    Data & Export
                  </CardTitle>
                  <CardDescription>
                    Export your data or request account deletion
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Export Your Data</Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Download all your data in JSON format
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => exportDataMutation.mutate()}
                        disabled={exportDataMutation.isPending}
                      >
                        {exportDataMutation.isPending ? (
                          <>
                            <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                            Exporting...
                          </>
                        ) : (
                          <>
                            <IconDownload className="mr-2 h-4 w-4" />
                            Export Data
                          </>
                        )}
                      </Button>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <Label className="text-sm font-medium text-destructive">Danger Zone</Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Permanently delete your account and all associated data
                      </p>
                      <Button variant="destructive" size="sm" disabled>
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new one
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current">Current Password</Label>
              <Input
                id="current"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, currentPassword: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new">New Password</Label>
              <Input
                id="new"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, newPassword: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm New Password</Label>
              <Input
                id="confirm"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setPasswordDialogOpen(false)}
                disabled={passwordMutation.isPending}
              >
                Cancel
              </Button>
              <Button onClick={handlePasswordChange} disabled={passwordMutation.isPending}>
                {passwordMutation.isPending && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                Change Password
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}