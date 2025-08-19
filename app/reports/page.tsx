"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import {
  IconDownload,
  IconTrendingUp,
  IconTrendingDown,
  IconCurrencyDollar,
  IconClock,
  IconBuilding,
  IconRefresh,
  IconChartBar,
  IconStar,
  IconAlertTriangle,
} from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  LineChart,
  Line,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { 
  mockDashboardMetrics, 
  mockVendors,
  formatCurrency,
  formatDate 
} from "@/lib/mock-data";

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState("30d");

  // Generate sample data for charts
  const monthlyRevenueData = [
    { month: 'Jan', revenue: 28400, turns: 22, avgCost: 1290 },
    { month: 'Feb', revenue: 32100, turns: 26, avgCost: 1235 },
    { month: 'Mar', revenue: 29800, turns: 24, avgCost: 1242 },
    { month: 'Apr', revenue: 35600, turns: 28, avgCost: 1271 },
    { month: 'May', revenue: 31200, turns: 25, avgCost: 1248 },
    { month: 'Jun', revenue: 34800, turns: 29, avgCost: 1200 },
  ];

  const turnStatusData = [
    { name: 'Completed', value: 145, color: '#22c55e' },
    { name: 'In Progress', value: 12, color: '#f97316' },
    { name: 'Pending', value: 8, color: '#eab308' },
    { name: 'Overdue', value: 3, color: '#ef4444' },
  ];

  const vendorPerformanceData = mockVendors.map(vendor => ({
    name: vendor.companyName.split(' ')[0], // First word for brevity
    rating: vendor.rating,
    onTimeRate: vendor.onTimeRate,
    jobs: vendor.completedJobs,
    avgCost: vendor.averageCost,
  })).slice(0, 5);

  const propertyTypeData = [
    { type: 'Apartment', count: 18, revenue: 38400 },
    { type: 'House', count: 15, revenue: 45600 },
    { type: 'Condo', count: 12, revenue: 27600 },
    { type: 'Commercial', count: 2, revenue: 12800 },
  ];

  const turnTrendData = [
    { week: 'W1', completed: 6, started: 8, overdue: 1 },
    { week: 'W2', completed: 7, started: 6, overdue: 0 },
    { week: 'W3', completed: 8, started: 9, overdue: 2 },
    { week: 'W4', completed: 5, started: 7, overdue: 1 },
  ];

  const topPerformingVendors = mockVendors
    .sort((a, b) => (b.rating * b.onTimeRate) - (a.rating * a.onTimeRate))
    .slice(0, 5);

  const upcomingExpirations = mockVendors
    .filter(vendor => {
      const expiry = new Date(vendor.insuranceExpiry);
      const now = new Date();
      const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 90 && daysUntilExpiry > 0;
    })
    .sort((a, b) => new Date(a.insuranceExpiry).getTime() - new Date(b.insuranceExpiry).getTime())
    .slice(0, 5);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Reports & Analytics</h1>
            <p className="text-muted-foreground">
              Analyze performance, trends, and insights across your property portfolio
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 3 months</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="flex items-center gap-2">
              <IconDownload className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <IconCurrencyDollar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(mockDashboardMetrics.totalRevenue)}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <IconTrendingUp className="mr-1 h-3 w-3 text-green-500" />
                <span className="text-green-600">↑ 12%</span>
                <span className="ml-1">from last period</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Turns Completed</CardTitle>
              <IconRefresh className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockDashboardMetrics.completedTurnsThisMonth}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <IconTrendingUp className="mr-1 h-3 w-3 text-green-500" />
                <span className="text-green-600">↑ 8%</span>
                <span className="ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Cost Per Turn</CardTitle>
              <IconChartBar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(mockDashboardMetrics.avgCostPerTurn)}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <IconTrendingDown className="mr-1 h-3 w-3 text-red-500" />
                <span className="text-red-600">↓ 3%</span>
                <span className="ml-1">cost reduction</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <IconClock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockDashboardMetrics.completionRate}%</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <IconTrendingUp className="mr-1 h-3 w-3 text-green-500" />
                <span className="text-green-600">↑ 2%</span>
                <span className="ml-1">improvement</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Revenue Trend */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>
                Monthly revenue and turn completion over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="month" 
                      className="text-xs fill-muted-foreground"
                    />
                    <YAxis 
                      yAxisId="revenue"
                      orientation="left"
                      className="text-xs fill-muted-foreground"
                      tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
                    />
                    <YAxis 
                      yAxisId="turns"
                      orientation="right"
                      className="text-xs fill-muted-foreground"
                    />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'revenue' ? formatCurrency(value as number) : value,
                        name === 'revenue' ? 'Revenue' : 'Turns'
                      ]}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Area
                      yAxisId="revenue"
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.1}
                      strokeWidth={2}
                    />
                    <Line
                      yAxisId="turns"
                      type="monotone"
                      dataKey="turns"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ fill: '#f59e0b', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Turn Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Turn Status Distribution</CardTitle>
              <CardDescription>
                Current status of all turns in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={turnStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {turnStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Turns']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {turnStatusData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm">{item.name}</span>
                    </div>
                    <span className="font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Vendor Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Vendor Performance</CardTitle>
              <CardDescription>
                Top vendors by rating and on-time delivery
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={vendorPerformanceData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      type="number" 
                      className="text-xs fill-muted-foreground"
                      domain={[80, 100]}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      className="text-xs fill-muted-foreground"
                    />
                    <Tooltip 
                      formatter={(value, name) => [
                        `${value}${name === 'onTimeRate' ? '%' : ''}`,
                        name === 'onTimeRate' ? 'On-Time Rate' : 'Rating'
                      ]}
                    />
                    <Bar dataKey="onTimeRate" fill="#22c55e" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Top Performing Vendors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconStar className="h-5 w-5 text-yellow-500" />
                Top Performing Vendors
              </CardTitle>
              <CardDescription>
                Based on rating and on-time delivery
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topPerformingVendors.map((vendor, index) => (
                  <div key={vendor.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-medium">{vendor.companyName}</div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Rating: {vendor.rating}</span>
                        <span>On-time: {vendor.onTimeRate}%</span>
                      </div>
                    </div>
                    <Badge variant={index === 0 ? "default" : "secondary"}>
                      #{index + 1}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Property Type Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconBuilding className="h-5 w-5" />
                Property Type Performance
              </CardTitle>
              <CardDescription>
                Revenue and turn count by property type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {propertyTypeData.map((type) => (
                  <div key={type.type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{type.type}</span>
                      <span className="text-sm text-muted-foreground">
                        {type.count} properties
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>Revenue</span>
                        <span className="font-medium">{formatCurrency(type.revenue)}</span>
                      </div>
                      <Progress 
                        value={(type.revenue / 50000) * 100} 
                        className="h-2" 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Insurance Expiration Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconAlertTriangle className="h-5 w-5 text-orange-500" />
                Insurance Expiration Alerts
              </CardTitle>
              <CardDescription>
                Vendors with expiring insurance (next 90 days)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingExpirations.length > 0 ? (
                <div className="space-y-3">
                  {upcomingExpirations.map((vendor) => {
                    const daysUntilExpiry = Math.ceil(
                      (new Date(vendor.insuranceExpiry).getTime() - new Date().getTime()) / 
                      (1000 * 60 * 60 * 24)
                    );
                    
                    return (
                      <div key={vendor.id} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded">
                        <div className="space-y-1">
                          <div className="font-medium text-sm">{vendor.companyName}</div>
                          <div className="text-xs text-muted-foreground">
                            Expires: {formatDate(vendor.insuranceExpiry)}
                          </div>
                        </div>
                        <Badge 
                          variant={daysUntilExpiry <= 30 ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {daysUntilExpiry} days
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-6">
                  <IconAlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No upcoming expirations</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Turn Trend Analysis</CardTitle>
            <CardDescription>
              Weekly turn completion and start trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={turnTrendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="week" 
                    className="text-xs fill-muted-foreground"
                  />
                  <YAxis 
                    className="text-xs fill-muted-foreground"
                  />
                  <Tooltip />
                  <Bar dataKey="completed" fill="#22c55e" name="Completed" />
                  <Bar dataKey="started" fill="#3b82f6" name="Started" />
                  <Bar dataKey="overdue" fill="#ef4444" name="Overdue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}