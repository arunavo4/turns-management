"use client";

import DashboardLayout from "@/components/layout/dashboard-layout";
import {
  IconBuilding,
  IconRefresh,
  IconUsers,
  IconCurrencyDollar,
  IconClock,
  IconAlertTriangle,
  IconTrendingUp,
  IconChevronRight,
  IconMapPin,
  IconCalendar,
  IconStar,
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
import { Separator } from "@/components/ui/separator";
import { 
  mockDashboardMetrics, 
  mockTurns, 
  mockProperties,
  getStatusColor,
  getPriorityColor,
  formatCurrency,
  formatDate 
} from "@/lib/mock-data";

export default function Dashboard() {
  // Get recent activity data
  const recentTurns = mockTurns.slice(0, 4);
  const recentProperties = mockProperties.slice(0, 3);

  const getStatusBadge = (status: string) => {
    const colorClass = getStatusColor(status);
    return (
      <Badge variant="secondary" className={colorClass}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colorClass = getPriorityColor(priority);
    return (
      <Badge variant="secondary" className={colorClass}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's your property management overview.
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
              <div className="text-2xl font-bold">{mockDashboardMetrics.activeProperties}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">↑ 2</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Turns</CardTitle>
              <IconRefresh className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockDashboardMetrics.activeTurns}</div>
              <p className="text-xs text-muted-foreground">
                {mockDashboardMetrics.overdueTurns} overdue
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
                {formatCurrency(mockDashboardMetrics.monthlyRevenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">↑ 12%</span> from last month
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
                {mockDashboardMetrics.averageTurnTime} days
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">↓ 0.5</span> days faster
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
                  {recentTurns.map((turn) => (
                    <TableRow key={turn.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-medium">{turn.turnNumber}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(turn.createdAt)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{turn.property.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center">
                            <IconMapPin className="mr-1 h-3 w-3" />
                            {turn.property.city}, {turn.property.state}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getStatusBadge(turn.status)}
                          {getPriorityBadge(turn.priority)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <div>
                          {formatCurrency(turn.actualCost || turn.estimatedCost)}
                        </div>
                        {turn.completionRate !== undefined && (
                          <div className="text-xs text-muted-foreground">
                            {turn.completionRate}% complete
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
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
                  {mockDashboardMetrics.approvalsPending}
                </div>
                <Button className="mt-3 w-full">
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
                    <span className="font-medium">{mockDashboardMetrics.completionRate}%</span>
                  </div>
                  <Progress value={mockDashboardMetrics.completionRate} className="mt-2 h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Turns Completed</span>
                    <span className="font-medium">{mockDashboardMetrics.completedTurnsThisMonth} of 28</span>
                  </div>
                  <Progress value={(mockDashboardMetrics.completedTurnsThisMonth / 28) * 100} className="mt-2 h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span>On-Time Completion</span>
                    <span className="font-medium">96%</span>
                  </div>
                  <Progress value={96} className="mt-2 h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Revenue Goal</span>
                    <span className="font-medium">{formatCurrency(mockDashboardMetrics.monthlyRevenue)} / {formatCurrency(35000)}</span>
                  </div>
                  <Progress value={(mockDashboardMetrics.monthlyRevenue / 35000) * 100} className="mt-2 h-2" />
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
                >
                  <IconRefresh className="h-4 w-4 mr-2" />
                  Create New Turn
                </Button>
                <Button
                  variant="outline"
                  className="justify-start min-h-[40px] hover:scale-[1.02] transition-all duration-200"
                >
                  <IconBuilding className="h-4 w-4 mr-2" />
                  Add Property
                </Button>
                <Button
                  variant="outline"
                  className="justify-start min-h-[40px] hover:scale-[1.02] transition-all duration-200"
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
              <Button variant="outline" className="flex items-center gap-2">
                View All Properties
                <IconChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {recentProperties.map((property) => (
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
                          {property.monthlyRent ? formatCurrency(property.monthlyRent) : 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Manager</span>
                        <span className="font-medium">{property.propertyManager}</span>
                      </div>
                      {property.lastTurnDate && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Last Turn</span>
                          <span className="font-medium">{formatDate(property.lastTurnDate)}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}