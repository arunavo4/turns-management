"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  IconUser,
  IconMail,
  IconPhone,
  IconBriefcase,
  IconCalendar,
  IconEdit,
  IconCamera,
  IconArrowLeft,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { IconLoader2 } from "@tabler/icons-react";

// API functions
const fetchUserProfile = async () => {
  const response = await fetch("/api/user/profile");
  if (!response.ok) throw new Error("Failed to fetch profile");
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

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [isEditMode, setIsEditMode] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  // Fetch user profile
  const { data: userProfile, isLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: fetchUserProfile,
  });

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "(555) 123-4567",
    role: "Property Manager",
    department: "Property Management",
    joinDate: "January 15, 2023",
    location: "San Francisco, CA",
    bio: "Experienced property manager with over 8 years in real estate management. Specialized in residential and commercial properties.",
  });

  const [editedProfile, setEditedProfile] = useState(profile);

  // Update profile state when data is fetched
  useEffect(() => {
    if (userProfile) {
      const newProfile = {
        name: userProfile.name || "",
        email: userProfile.email || "",
        phone: profile.phone, // Keep default for now
        role: profile.role, // Keep default for now
        department: profile.department, // Keep default for now
        joinDate: new Date(userProfile.createdAt).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        location: profile.location, // Keep default for now
        bio: profile.bio, // Keep default for now
      };
      setProfile(newProfile);
      setEditedProfile(newProfile);
    }
  }, [userProfile]);

  // Mutations
  const profileMutation = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      setProfile({
        ...profile,
        name: data.name,
        email: data.email,
      });
      setIsEditMode(false);
      toast.success("Profile updated successfully");
    },
    onError: () => {
      toast.error("Failed to update profile");
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

  const handleSaveProfile = () => {
    profileMutation.mutate({
      name: editedProfile.name,
      email: editedProfile.email,
      image: session?.user?.image || null,
    });
  };

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

  const handleCancelEdit = () => {
    setEditedProfile(profile);
    setIsEditMode(false);
  };

  if (isLoading) {
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
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
            >
              <IconArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
              <p className="text-muted-foreground">
                Manage your personal information and preferences
              </p>
            </div>
          </div>
          <Button
            onClick={() => setIsEditMode(!isEditMode)}
            variant={isEditMode ? "outline" : "default"}
          >
            <IconEdit className="h-4 w-4 mr-2" />
            {isEditMode ? "Cancel" : "Edit Profile"}
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-1">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="h-32 w-32">
                    <AvatarImage src={session?.user?.image || undefined} className="object-cover" />
                    <AvatarFallback className="text-2xl">
                      {profile.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {isEditMode && (
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute bottom-0 right-0 rounded-full"
                    >
                      <IconCamera className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="text-center space-y-1">
                  <h2 className="text-2xl font-semibold">{profile.name}</h2>
                  <Badge variant="secondary">{profile.role}</Badge>
                </div>
                <Separator className="w-full" />
                <div className="w-full space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <IconMail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{profile.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <IconPhone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{profile.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <IconBriefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{profile.department}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <IconCalendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Joined {profile.joinDate}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isEditMode ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={editedProfile.name}
                        onChange={(e) =>
                          setEditedProfile({ ...editedProfile, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={editedProfile.email}
                        onChange={(e) =>
                          setEditedProfile({ ...editedProfile, email: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={editedProfile.phone}
                        onChange={(e) =>
                          setEditedProfile({ ...editedProfile, phone: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={editedProfile.location}
                        onChange={(e) =>
                          setEditedProfile({ ...editedProfile, location: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      rows={4}
                      value={editedProfile.bio}
                      onChange={(e) =>
                        setEditedProfile({ ...editedProfile, bio: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveProfile}>Save Changes</Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                      <p className="mt-1">{profile.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email Address</p>
                      <p className="mt-1">{profile.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
                      <p className="mt-1">{profile.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Location</p>
                      <p className="mt-1">{profile.location}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Bio</p>
                    <p className="mt-1">{profile.bio}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Activity Statistics</CardTitle>
              <CardDescription>Your performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Properties Managed</p>
                  <p className="text-2xl font-bold">24</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Active Turns</p>
                  <p className="text-2xl font-bold">8</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Completed This Month</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Avg. Turn Time</p>
                  <p className="text-2xl font-bold">5.2 days</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    Change Password
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogDescription>
                      Enter your current password and choose a new password
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input 
                        id="current-password" 
                        type="password" 
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input 
                        id="new-password" 
                        type="password" 
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input 
                        id="confirm-password" 
                        type="password" 
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setPasswordDialogOpen(false)}
                      disabled={passwordMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handlePasswordChange} disabled={passwordMutation.isPending}>
                      {passwordMutation.isPending && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Update Password
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push('/settings?section=security')}
              >
                Two-Factor Authentication
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push('/settings?section=notifications')}
              >
                Email Notifications
              </Button>
              <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}