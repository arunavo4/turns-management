"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  IconLoader2,
  IconMinus,
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
import { format } from "date-fns";
import { toast } from "sonner";

// API fetch function
const fetchReportsData = async (timeRange: string) => {
  const response = await fetch(`/api/reports?timeRange=${timeRange}`);
  if (!response.ok) throw new Error('Failed to fetch reports data');
  return response.json();
};

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState("30d");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['reports', timeRange],
    queryFn: () => fetchReportsData(timeRange),
    refetchInterval: 60000, // Refetch every minute
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), 'MMM d, yyyy');
  };

  const exportToCSV = () => {
    if (!data) return;

    const headers = ["Metric", "Value", "Trend"];
    const csvContent = [
      headers.join(","),
      ["Total Revenue", data.metrics.totalRevenue, `${data.metrics.revenueTrend}%`].join(","),
      ["Completed Turns", data.metrics.completedTurns, `${data.metrics.completedTrend}%`].join(","),
      ["Avg Cost Per Turn", data.metrics.avgCostPerTurn, `${data.metrics.costTrend}%`].join(","),
      ["Completion Rate", `${data.metrics.completionRate}%`, ""].join(","),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `reports-${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Report exported successfully");
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
          Error loading reports: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </DashboardLayout>
    );
  }

  const {
    metrics,
    monthlyData,
    statusDistribution,
    vendorPerformance,
    propertyTypeData,
    weeklyTrends,
    topVendors,
    expirationAlerts
  } = data || {
    metrics: {
      totalRevenue: 0,
      completedTurns: 0,
      avgCostPerTurn: 0,
      completionRate: 0,
      revenueTrend: 0,
      completedTrend: 0,
      costTrend: 0,
      avgTurnTime: 0
    },
    monthlyData: [],
    statusDistribution: [],
    vendorPerformance: [],
    propertyTypeData: [],
    weeklyTrends: [],
    topVendors: [],
    expirationAlerts: []
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <IconTrendingUp className="mr-1 h-3 w-3 text-green-500" />;
    if (trend < 0) return <IconTrendingDown className="mr-1 h-3 w-3 text-red-500" />;
    return <IconMinus className="mr-1 h-3 w-3 text-gray-500" />;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return "text-green-600";
    if (trend < 0) return "text-red-600";
    return "text-gray-600";
  };

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
            <Button 
              variant="outline" 
              onClick={() => refetch()}
              size="icon"
            >
              <IconRefresh className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={exportToCSV}
            >
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
              <div className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {getTrendIcon(metrics.revenueTrend)}
                <span className={getTrendColor(metrics.revenueTrend)}>
                  {metrics.revenueTrend > 0 ? '↑' : metrics.revenueTrend < 0 ? '↓' : ''} {Math.abs(metrics.revenueTrend)}%
                </span>
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
              <div className="text-2xl font-bold">{metrics.completedTurns}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {getTrendIcon(metrics.completedTrend)}
                <span className={getTrendColor(metrics.completedTrend)}>
                  {metrics.completedTrend > 0 ? '↑' : metrics.completedTrend < 0 ? '↓' : ''} {Math.abs(metrics.completedTrend)}%
                </span>
                <span className="ml-1">from last period</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Cost Per Turn</CardTitle>
              <IconChartBar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.avgCostPerTurn)}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {getTrendIcon(-metrics.costTrend)} {/* Negative because lower cost is better */}
                <span className={metrics.costTrend < 0 ? "text-green-600" : metrics.costTrend > 0 ? "text-red-600" : "text-gray-600"}>
                  {metrics.costTrend < 0 ? '↓' : metrics.costTrend > 0 ? '↑' : ''} {Math.abs(metrics.costTrend)}%
                </span>
                <span className="ml-1">cost {metrics.costTrend < 0 ? 'reduction' : 'increase'}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <IconClock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.completionRate}%</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <span>Avg turn time: {metrics.avgTurnTime > 0 ? `${metrics.avgTurnTime.toFixed(1)} days` : 'N/A'}</span>
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
              {monthlyData.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData}>
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
                        formatter={(value: any, name: any) => [
                          name === 'revenue' ? formatCurrency(value) : value,
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
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  No data available for the selected period
                </div>
              )}
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
              {statusDistribution.filter(s => s.value > 0).length > 0 ? (
                <>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusDistribution.filter(s => s.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {statusDistribution.filter(s => s.value > 0).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [value, 'Turns']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                    {statusDistribution.map((item, index) => (
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
                </>
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  No turn data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vendor Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Vendor Performance</CardTitle>
              <CardDescription>
                Top vendors by on-time delivery rate
              </CardDescription>
            </CardHeader>
            <CardContent>
              {vendorPerformance.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={vendorPerformance.slice(0, 5)} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        type="number" 
                        className="text-xs fill-muted-foreground"
                        domain={[0, 100]}
                      />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        className="text-xs fill-muted-foreground"
                        width={100}
                      />
                      <Tooltip 
                        formatter={(value: any, name: any) => [
                          `${value}%`,
                          'On-Time Rate'
                        ]}
                      />
                      <Bar dataKey="onTimeRate" fill="#22c55e" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  No vendor performance data available
                </div>
              )}
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
              {topVendors.length > 0 ? (
                <div className="space-y-4">
                  {topVendors.map((vendor: any, index: number) => (
                    <div key={vendor.id} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="font-medium">{vendor.name}</div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Rating: {vendor.rating.toFixed(1)}</span>
                          <span>On-time: {vendor.onTimeRate}%</span>
                        </div>
                      </div>
                      <Badge variant={index === 0 ? "default" : "secondary"}>
                        #{index + 1}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-6">
                  No vendor data available
                </div>
              )}
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
              {propertyTypeData.length > 0 ? (
                <div className="space-y-4">
                  {propertyTypeData.map((type: any) => (
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
                          value={Math.min((type.revenue / 50000) * 100, 100)} 
                          className="h-2" 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-6">
                  No property type data available
                </div>
              )}
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
              {expirationAlerts.length > 0 ? (
                <div className="space-y-3">
                  {expirationAlerts.map((vendor: any) => (
                    <div key={vendor.id} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded">
                      <div className="space-y-1">
                        <div className="font-medium text-sm">{vendor.companyName}</div>
                        <div className="text-xs text-muted-foreground">
                          Expires: {formatDate(vendor.insuranceExpiry)}
                        </div>
                      </div>
                      <Badge 
                        variant={vendor.daysUntilExpiry <= 30 ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {vendor.daysUntilExpiry} days
                      </Badge>
                    </div>
                  ))}
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

        {/* Weekly Turn Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Turn Trend Analysis</CardTitle>
            <CardDescription>
              Weekly turn completion and start trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            {weeklyTrends.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyTrends}>
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
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No weekly trend data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}