"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "@/lib/auth-client";
import {
  IconHome2,
  IconBuilding,
  IconRefresh,
  IconUsers,
  IconChartBar,
  IconSettings,
  IconMenu2,
  IconX,
  IconBell,
  IconSearch,
  IconHelp,
  IconChevronDown,
  IconLogout,
  IconUser,
  IconChevronLeft,
  IconChevronRight,
  IconHistory,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface Stats {
  properties: number;
  turns: number;
  activeTurns: number;
  vendors: number;
  approvedVendors: number;
  reports: number;
  users: number;
}

// Fetch function for React Query
const fetchStats = async () => {
  const response = await fetch('/api/stats');
  if (!response.ok) throw new Error('Failed to fetch stats');
  return response.json();
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Default to collapsed
  const { data: session, isPending: sessionLoading } = useSession();
  
  const { data: stats } = useQuery<Stats>({
    queryKey: ['layout-stats'],
    queryFn: fetchStats,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  const navigation = [
    { 
      name: "Dashboard", 
      href: "/dashboard", 
      icon: IconHome2, 
      badge: null 
    },
    { 
      name: "Properties", 
      href: "/properties", 
      icon: IconBuilding, 
      badge: stats?.properties || null
    },
    { 
      name: "Turns", 
      href: "/turns", 
      icon: IconRefresh, 
      badge: stats?.activeTurns || null
    },
    { 
      name: "Vendors", 
      href: "/vendors", 
      icon: IconUsers, 
      badge: stats?.vendors || null
    },
    { 
      name: "Reports", 
      href: "/reports", 
      icon: IconChartBar, 
      badge: null 
    },
    { 
      name: "Audit Logs", 
      href: "/audit-logs", 
      icon: IconHistory, 
      badge: null 
    },
    { 
      name: "Settings", 
      href: "/settings", 
      icon: IconSettings, 
      badge: null 
    },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-card border-r transform transition-all duration-200 lg:translate-x-0",
          sidebarCollapsed ? "w-16" : "w-64",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className={cn(
            "flex h-16 items-center border-b",
            sidebarCollapsed ? "justify-center px-4" : "justify-between px-6"
          )}>
            {sidebarCollapsed ? (
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <IconRefresh className="h-5 w-5 text-primary-foreground" />
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                    <IconRefresh className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Turns Management</h2>
                    <p className="text-xs text-muted-foreground">Property ERP</p>
                  </div>
                </div>
                <button 
                  className="lg:hidden" 
                  onClick={() => setSidebarOpen(false)}
                >
                  <IconX className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

          {/* Navigation */}
          <nav className={cn(
            "flex-1 space-y-1 overflow-y-auto",
            sidebarCollapsed ? "p-2" : "p-4"
          )}>
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-md transition-colors group",
                    sidebarCollapsed 
                      ? "justify-center px-2 py-3" 
                      : "justify-between px-3 py-2",
                    "text-sm font-medium",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  onClick={() => setSidebarOpen(false)}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  {sidebarCollapsed ? (
                    <div className="relative">
                      <item.icon
                        className={cn(
                          "h-5 w-5",
                          isActive
                            ? "text-primary-foreground"
                            : "text-muted-foreground"
                        )}
                      />
                      {item.badge && item.badge > 0 && (
                        <Badge
                          variant="secondary"
                          className="absolute -top-2 -right-2 h-4 w-4 p-0 text-xs flex items-center justify-center"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center">
                        <item.icon
                          className={cn(
                            "mr-3 h-4 w-4",
                            isActive
                              ? "text-primary-foreground"
                              : "text-muted-foreground"
                          )}
                        />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && item.badge > 0 && (
                        <Badge
                          variant="secondary"
                          className="ml-auto h-5 px-1.5 text-xs"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className={cn(
            "border-t",
            sidebarCollapsed ? "p-2" : "p-4"
          )}>
            {sidebarCollapsed ? (
              <div className="flex justify-center">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session?.user?.image || undefined} className="object-cover" />
                  <AvatarFallback className="h-8 w-8 flex items-center justify-center">
                    {session?.user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
            ) : (
              <div className="flex items-center">
                <Avatar className="h-10 w-10 flex-none">
                  <AvatarImage src={session?.user?.image || undefined} className="object-cover" />
                  <AvatarFallback className="h-10 w-10 flex items-center justify-center">
                    {session?.user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium">{session?.user?.name || 'User'}</p>
                  <p className="text-xs text-muted-foreground">{session?.user?.email || 'Loading...'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Collapse Toggle Button */}
          <div className={cn(
            "border-t p-2 hidden lg:block",
            sidebarCollapsed ? "flex justify-center" : ""
          )}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={cn(
                "transition-colors",
                sidebarCollapsed ? "w-full justify-center" : "w-full justify-start"
              )}
            >
              {sidebarCollapsed ? (
                <IconChevronRight className="h-4 w-4" />
              ) : (
                <>
                  <IconChevronLeft className="h-4 w-4 mr-2" />
                  <span>Collapse</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={cn(
        "transition-all duration-200",
        sidebarCollapsed ? "lg:pl-16" : "lg:pl-64"
      )}>
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-background border-b">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <button 
              className="lg:hidden" 
              onClick={() => setSidebarOpen(true)}
            >
              <IconMenu2 className="h-6 w-6" />
            </button>

            {/* Spacer */}
            <div className="flex-1" />

            <div className="flex items-center space-x-1 sm:space-x-2">
              
              {/* Help - Hidden on mobile */}
              <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
                <IconHelp className="h-5 w-5" />
              </Button>

              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <IconBell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full"></span>
              </Button>

              <div className="h-8 w-px bg-border mx-1 sm:mx-2 hidden sm:block" />

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3"
                  >
                    <Avatar className="h-8 w-8 flex-none">
                      <AvatarImage src={session?.user?.image || undefined} className="object-cover" />
                      <AvatarFallback className="h-8 w-8 flex items-center justify-center">
                        {session?.user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium">{session?.user?.name || 'User'}</p>
                      <p className="text-xs text-muted-foreground">
                        {session?.user?.email || 'Loading...'}
                      </p>
                    </div>
                    <IconChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-64 p-2"
                >
                  <DropdownMenuLabel className="pb-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 flex-none">
                        <AvatarImage
                          src={session?.user?.image || undefined}
                          className="object-cover"
                        />
                        <AvatarFallback className="h-10 w-10 flex items-center justify-center">
                          {session?.user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{session?.user?.name || 'User'}</p>
                        <p className="text-sm text-muted-foreground">
                          {session?.user?.email || 'Loading...'}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="my-2" />
                  <DropdownMenuItem className="cursor-pointer py-2" asChild>
                    <Link href="/profile">
                      <IconUser className="mr-3 h-4 w-4" />
                      <span>View Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer py-2" asChild>
                    <Link href="/settings">
                      <IconSettings className="mr-3 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer py-2" asChild>
                    <Link href="/help">
                      <IconHelp className="mr-3 h-4 w-4" />
                      <span>Help & Support</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-2" />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer py-2 text-destructive focus:text-destructive hover:text-destructive focus:bg-destructive/10 hover:bg-destructive/10"
                  >
                    <IconLogout className="mr-3 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

    </div>
  );
}