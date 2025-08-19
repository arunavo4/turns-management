"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
    badge: "47" 
  },
  { 
    name: "Turns", 
    href: "/turns", 
    icon: IconRefresh, 
    badge: "12" 
  },
  { 
    name: "Vendors", 
    href: "/vendors", 
    icon: IconUsers, 
    badge: null 
  },
  { 
    name: "Reports", 
    href: "/reports", 
    icon: IconChartBar, 
    badge: null 
  },
  { 
    name: "Settings", 
    href: "/settings", 
    icon: IconSettings, 
    badge: null 
  },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSignOut = () => {
    // Mock sign out function
    console.log("Sign out clicked");
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
                      {item.badge && (
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
                      {item.badge && (
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
                  <AvatarImage src="/avatar.jpg" className="object-cover" />
                  <AvatarFallback className="h-8 w-8 flex items-center justify-center">
                    SJ
                  </AvatarFallback>
                </Avatar>
              </div>
            ) : (
              <div className="flex items-center">
                <Avatar className="h-10 w-10 flex-none">
                  <AvatarImage src="/avatar.jpg" className="object-cover" />
                  <AvatarFallback className="h-10 w-10 flex items-center justify-center">
                    SJ
                  </AvatarFallback>
                </Avatar>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium">Sarah Johnson</p>
                  <p className="text-xs text-muted-foreground">Property Manager</p>
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

            {/* Search */}
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search properties, turns, vendors..."
                  className="pl-10 bg-muted/50 h-11 w-full"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Help */}
              <Button variant="ghost" size="icon">
                <IconHelp className="h-5 w-5" />
              </Button>

              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <IconBell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full"></span>
              </Button>

              <div className="h-8 w-px bg-border mx-2" />

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-2"
                  >
                    <Avatar className="h-8 w-8 flex-none">
                      <AvatarImage src="/avatar.jpg" className="object-cover" />
                      <AvatarFallback className="h-8 w-8 flex items-center justify-center">
                        SJ
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium">Sarah Johnson</p>
                      <p className="text-xs text-muted-foreground">
                        Property Manager
                      </p>
                    </div>
                    <IconChevronDown className="h-4 w-4 text-muted-foreground" />
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
                          src="/avatar.jpg"
                          className="object-cover"
                        />
                        <AvatarFallback className="h-10 w-10 flex items-center justify-center">
                          SJ
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">Sarah Johnson</p>
                        <p className="text-sm text-muted-foreground">
                          sarah.johnson@company.com
                        </p>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="my-2" />
                  <DropdownMenuItem className="cursor-pointer py-2">
                    <IconUser className="mr-3 h-4 w-4" />
                    <span>View Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer py-2">
                    <IconSettings className="mr-3 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer py-2">
                    <IconHelp className="mr-3 h-4 w-4" />
                    <span>Help & Support</span>
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
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}