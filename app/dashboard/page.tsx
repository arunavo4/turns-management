"use client";

import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import {
  IconBuilding,
  IconRefresh,
  IconUsers,
  IconCurrencyDollar,
  IconClock,
  IconAlertTriangle,
  IconChevronRight,
  IconMapPin,
  IconLoader2,
} from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

// API function
const fetchDashboardData = async () => {
  const response = await fetch('/api/dashboard/metrics');
  if (!response.ok) throw new Error('Failed to fetch dashboard data');
  return response.json();
};

export default function Dashboard() {
  const router = useRouter();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: fetchDashboardData,
    refetchInterval: 60000, // Refetch every minute
  });

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      in_progress: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
      scope_review: 'bg-purple-100 text-purple-700',
      vendor_assigned: 'bg-indigo-100 text-indigo-700',
    };
    return (
      <Badge variant="secondary" className={statusColors[status] || 'bg-gray-100 text-gray-700'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityColors: Record<string, string> = {
      urgent: 'bg-red-100 text-red-700',
      high: 'bg-orange-100 text-orange-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-green-100 text-green-700',
    };
    return (
      <Badge variant="secondary" className={priorityColors[priority] || 'bg-gray-100 text-gray-700'}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center text-red-600 p-8">
          Error loading dashboard: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </DashboardLayout>
    );
  }

  const { metrics, recentTurns, recentProperties } = data || {
    metrics: {
      activeProperties: 0,
      activeTurns: 0,
      overdueTurns: 0,
      monthlyRevenue: 0,
      averageTurnTime: 0,
      completionRate: 0,
      completedTurnsThisMonth: 0,
      approvalsPending: 0,
      propertyGrowth: 0,
    },
    recentTurns: [],
    recentProperties: [],
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s your property management overview.
          </p>
        </div>

        {/* Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Properties</CardTitle>
              <IconBuilding className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.activeProperties}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.propertyGrowth >= 0 ? (
                  <span className="text-green-600">↑ {metrics.propertyGrowth}</span>
                ) : (
                  <span className="text-red-600">↓ {Math.abs(metrics.propertyGrowth)}</span>
                )} from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Turns</CardTitle>
              <IconRefresh className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.activeTurns}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.overdueTurns > 0 && (
                  <span className="text-red-600">{metrics.overdueTurns} overdue</span>
                )}
                {metrics.overdueTurns === 0 && (
                  <span className="text-green-600">All on track</span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <IconCurrencyDollar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(metrics.monthlyRevenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                From {metrics.completedTurnsThisMonth} completed turns
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Turn Time</CardTitle>
              <IconClock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.averageTurnTime.toFixed(1)} days
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics.completionRate}% completion rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-7">
          {/* Recent Turns Table */}
          <Card className="lg:col-span-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Turns</CardTitle>
                  <CardDescription>
                    Latest turn activities and status updates
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  className="min-h-[36px] px-4 hover:scale-105 transition-transform duration-200 flex items-center gap-2"
                  onClick={() => router.push('/turns')}
                >
                  View All
                  <IconChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Turn</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTurns.map((item: any) => (
                    <TableRow key={item.turn.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-medium">{item.turn.turnNumber}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(item.turn.createdAt), 'MMM d, yyyy')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.property ? (
                          <div>
                            <div className="font-medium">{item.property.name}</div>
                            <div className="text-xs text-muted-foreground flex items-center">
                              <IconMapPin className="mr-1 h-3 w-3" />
                              {item.property.city}, {item.property.state}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getStatusBadge(item.turn.status)}
                          {getPriorityBadge(item.turn.priority)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <div>
                          {formatCurrency(parseFloat(item.turn.actualCost || item.turn.estimatedCost || '0'))}
                        </div>
                        {item.turn.actualCost && (
                          <div className="text-xs text-muted-foreground">Actual</div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {recentTurns.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No recent turns
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Quick Stats & Actions */}
          <div className="lg:col-span-3 space-y-6">
            {/* Pending Approvals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconAlertTriangle className="h-5 w-5 text-orange-500" />
                  Pending Approvals
                </CardTitle>
                <CardDescription>
                  Turns requiring your attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {metrics.approvalsPending}
                </div>
                <Button 
                  className="mt-3 w-full"
                  onClick={() => router.push('/turns?filter=pending_approval')}
                >
                  Review Approvals
                </Button>
              </CardContent>
            </Card>

            {/* Performance Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>
                  Your monthly performance indicators
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Completion Rate</span>
                    <span className="font-medium">{metrics.completionRate}%</span>
                  </div>
                  <Progress value={metrics.completionRate} className="mt-2 h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Turns Completed</span>
                    <span className="font-medium">{metrics.completedTurnsThisMonth} of 28</span>
                  </div>
                  <Progress value={(metrics.completedTurnsThisMonth / 28) * 100} className="mt-2 h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span>On-Time Completion</span>
                    <span className="font-medium">
                      {metrics.overdueTurns === 0 ? '100' : 
                       Math.max(0, 100 - (metrics.overdueTurns / metrics.activeTurns * 100)).toFixed(0)}%
                    </span>
                  </div>
                  <Progress 
                    value={metrics.overdueTurns === 0 ? 100 : 
                           Math.max(0, 100 - (metrics.overdueTurns / metrics.activeTurns * 100))} 
                    className="mt-2 h-2" 
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Revenue Goal</span>
                    <span className="font-medium">
                      {formatCurrency(metrics.monthlyRevenue)} / {formatCurrency(35000)}
                    </span>
                  </div>
                  <Progress value={(metrics.monthlyRevenue / 35000) * 100} className="mt-2 h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and shortcuts</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                <Button
                  variant="outline"
                  className="justify-start min-h-[40px] hover:scale-[1.02] transition-all duration-200"
                  onClick={() => router.push('/turns?action=create')}
                >
                  <IconRefresh className="h-4 w-4 mr-2" />
                  Create New Turn
                </Button>
                <Button
                  variant="outline"
                  className="justify-start min-h-[40px] hover:scale-[1.02] transition-all duration-200"
                  onClick={() => router.push('/properties?action=create')}
                >
                  <IconBuilding className="h-4 w-4 mr-2" />
                  Add Property
                </Button>
                <Button
                  variant="outline"
                  className="justify-start min-h-[40px] hover:scale-[1.02] transition-all duration-200"
                  onClick={() => router.push('/vendors')}
                >
                  <IconUsers className="h-4 w-4 mr-2" />
                  Manage Vendors
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Properties */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Property Activity</CardTitle>
                <CardDescription>
                  Latest property updates and activities
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => router.push('/properties')}
              >
                View All Properties
                <IconChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {recentProperties.map((property: any) => (
                <Card key={property.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium">{property.name}</h4>
                        {getStatusBadge(property.status)}
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center">
                        <IconMapPin className="mr-1 h-3 w-3" />
                        {property.address}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Monthly Rent</span>
                        <span className="font-medium">
                          {property.monthlyRent ? formatCurrency(parseFloat(property.monthlyRent)) : 'N/A'}
                        </span>
                      </div>
                      {property.propertyManagerId && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Manager</span>
                          <span className="font-medium">PM Assigned</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {recentProperties.length === 0 && (
                <div className="col-span-3 text-center text-muted-foreground py-8">
                  No recent property activity
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}