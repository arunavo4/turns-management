"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { CalendarIcon, Download, FileSpreadsheet, FileText, TrendingUp, TrendingDown, Building2, Users, DollarSign, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [activeReport, setActiveReport] = useState("turn-completion");
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [groupBy, setGroupBy] = useState("month");

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: format(dateRange.from, "yyyy-MM-dd"),
        endDate: format(dateRange.to, "yyyy-MM-dd"),
        ...(activeReport === "turn-completion" && { groupBy }),
      });

      const response = await fetch(`/api/reports/${activeReport}?${params}`);
      if (!response.ok) throw new Error("Failed to fetch report");
      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error("Error fetching report:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeReport, dateRange, groupBy]);

  const exportToExcel = () => {
    if (!reportData) return;

    const wb = XLSX.utils.book_new();
    
    // Add summary sheet
    if (reportData.summary) {
      const summaryData = Object.entries(reportData.summary).map(([key, value]) => ({
        Metric: key.replace(/([A-Z])/g, " $1").trim(),
        Value: value,
      }));
      const ws1 = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, ws1, "Summary");
    }

    // Add details sheet
    if (reportData.details) {
      const ws2 = XLSX.utils.json_to_sheet(reportData.details);
      XLSX.utils.book_append_sheet(wb, ws2, "Details");
    }

    // Add chart data sheet
    if (reportData.chartData) {
      const ws3 = XLSX.utils.json_to_sheet(reportData.chartData);
      XLSX.utils.book_append_sheet(wb, ws3, "Chart Data");
    }

    XLSX.writeFile(wb, `${activeReport}-report-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  const exportToPDF = async () => {
    const element = document.getElementById("report-content");
    if (!element) return;

    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [canvas.width, canvas.height],
    });
    
    pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save(`${activeReport}-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  const renderTurnCompletionReport = () => {
    if (!reportData) return null;

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Turns</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.summary?.totalTurns || 0}</div>
              <p className="text-xs text-muted-foreground">
                Avg Duration: {reportData.summary?.averageDuration || 0} days
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${reportData.summary?.totalActualCost?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Per Turn: ${Math.round(reportData.summary?.averageCostPerTurn || 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cost Variance</CardTitle>
              {reportData.summary?.costVariance > 0 ? (
                <TrendingUp className="h-4 w-4 text-red-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${Math.abs(reportData.summary?.costVariance || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {reportData.summary?.costVariancePercent?.toFixed(1)}% variance
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estimated Cost</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${reportData.summary?.totalEstimatedCost?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Budget tracking
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Completion Trends</CardTitle>
              <CardDescription>Turns completed over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={reportData.chartData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="#8884d8" fill="#8884d8" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cost Analysis</CardTitle>
              <CardDescription>Estimated vs Actual costs</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.chartData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="estimatedCost" fill="#8884d8" name="Estimated" />
                  <Bar dataKey="actualCost" fill="#82ca9d" name="Actual" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Vendors */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Vendors</CardTitle>
            <CardDescription>By completion count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.topVendors?.map((vendor: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{vendor.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {vendor.count} turns • Avg {Math.round(vendor.averageDuration)} days
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${vendor.totalCost.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderPropertyPerformanceReport = () => {
    if (!reportData) return null;

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.summary?.totalProperties || 0}</div>
              <p className="text-xs text-muted-foreground">
                Active: {reportData.summary?.activeProperties || 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Turns</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.summary?.totalTurns || 0}</div>
              <p className="text-xs text-muted-foreground">
                Avg per property: {reportData.summary?.averageTurnsPerProperty?.toFixed(1) || 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${reportData.summary?.totalCost?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Avg per property: ${Math.round(reportData.summary?.averageCostPerProperty || 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive Properties</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.summary?.inactiveProperties || 0}</div>
              <p className="text-xs text-muted-foreground">
                No recent activity
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Properties by City</CardTitle>
              <CardDescription>Turn distribution across cities</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reportData.cityData?.slice(0, 6) || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.city} (${entry.turnCount})`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="turnCount"
                  >
                    {reportData.cityData?.slice(0, 6).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Properties by State</CardTitle>
              <CardDescription>Geographic distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.stateData?.slice(0, 10) || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="state" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="turnCount" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Properties */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Properties</CardTitle>
            <CardDescription>By completed turns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.topProperties?.map((property: any, index: number) => (
                <div key={property.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{property.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {property.address}, {property.city}, {property.state}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{property.completedTurns} turns</p>
                    <p className="text-sm text-muted-foreground">
                      ${property.totalCost.toLocaleString()} • {property.completionRate.toFixed(0)}% rate
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderVendorPerformanceReport = () => {
    if (!reportData) return null;

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.summary?.totalVendors || 0}</div>
              <p className="text-xs text-muted-foreground">
                Active: {reportData.summary?.activeVendors || 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Turns</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.summary?.totalTurns || 0}</div>
              <p className="text-xs text-muted-foreground">
                Avg per vendor: {reportData.summary?.averageTurnsPerVendor?.toFixed(1) || 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${reportData.summary?.totalRevenue?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Avg per vendor: ${Math.round(reportData.summary?.averageRevenuePerVendor || 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive Vendors</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.summary?.inactiveVendors || 0}</div>
              <p className="text-xs text-muted-foreground">
                No assigned turns
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Ratings Distribution</CardTitle>
              <CardDescription>Quality metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.ratingDistribution || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="rating" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
              <CardDescription>Top vendors monthly revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reportData.trendChartData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {Object.keys(reportData.trendChartData?.[0] || {})
                    .filter(key => key !== "month")
                    .map((vendor, index) => (
                      <Line
                        key={vendor}
                        type="monotone"
                        dataKey={vendor}
                        stroke={COLORS[index % COLORS.length]}
                      />
                    ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Performers */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
              <CardDescription>Based on performance score</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.topPerformers?.map((vendor: any, index: number) => (
                  <div key={vendor.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-sm font-medium text-green-700">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{vendor.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Score: {vendor.performanceScore}/100
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{vendor.completedTurns} turns</p>
                      <p className="text-sm text-muted-foreground">
                        {vendor.onTimeRate}% on-time
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Needs Improvement</CardTitle>
              <CardDescription>Vendors requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.needsImprovement?.map((vendor: any, index: number) => (
                  <div key={vendor.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-sm font-medium text-red-700">
                        !
                      </div>
                      <div>
                        <p className="font-medium">{vendor.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Score: {vendor.performanceScore}/100
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-red-600">
                        {vendor.costVariance > 0 ? "+" : ""}{vendor.costVariance}% cost
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {vendor.onTimeRate}% on-time
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderFinancialSummaryReport = () => {
    if (!reportData) return null;

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Actual Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${reportData.overview?.totalActualCost?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Avg per turn: ${reportData.overview?.averageActualCost?.toLocaleString() || 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cost Variance</CardTitle>
              {reportData.overview?.costVariance > 0 ? (
                <TrendingUp className="h-4 w-4 text-red-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${Math.abs(reportData.overview?.costVariance || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {reportData.overview?.costVariancePercent?.toFixed(1)}% variance
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Change Orders</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${reportData.overview?.totalChangeOrders?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Additional costs
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {reportData.approvals?.approvalRate?.toFixed(0) || 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {reportData.approvals?.approved || 0} of {reportData.approvals?.total || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Financial Trends</CardTitle>
              <CardDescription>Estimated vs Actual costs over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reportData.monthlyTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="estimatedCost" stroke="#8884d8" name="Estimated" />
                  <Line type="monotone" dataKey="actualCost" stroke="#82ca9d" name="Actual" />
                  <Line type="monotone" dataKey="changeOrders" stroke="#ffc658" name="Change Orders" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cost by Status</CardTitle>
              <CardDescription>Distribution of costs</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reportData.costByStatus || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.status} ($${entry.totalCost.toLocaleString()})`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="totalCost"
                  >
                    {reportData.costByStatus?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Additional Metrics */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top Cost Centers</CardTitle>
              <CardDescription>Properties with highest costs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.topCostCenters?.map((property: any, index: number) => (
                  <div key={property.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{property.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {property.address}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${property.totalCost.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">
                        {property.turnCount} turns
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Budget Variance Trend</CardTitle>
              <CardDescription>Monthly budget performance</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.budgetVariance || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="variance" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
          <div className="flex items-center space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("justify-start text-left font-normal")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from && dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="flex">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => date && setDateRange({ ...dateRange, from: date })}
                    initialFocus
                  />
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => date && setDateRange({ ...dateRange, to: date })}
                    initialFocus
                  />
                </div>
                <div className="flex justify-end space-x-2 p-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDateRange({
                        from: subDays(new Date(), 30),
                        to: new Date(),
                      });
                    }}
                  >
                    Last 30 days
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDateRange({
                        from: subDays(new Date(), 90),
                        to: new Date(),
                      });
                    }}
                  >
                    Last 90 days
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {activeReport === "turn-completion" && (
              <Select value={groupBy} onValueChange={setGroupBy}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Daily</SelectItem>
                  <SelectItem value="week">Weekly</SelectItem>
                  <SelectItem value="month">Monthly</SelectItem>
                  <SelectItem value="quarter">Quarterly</SelectItem>
                  <SelectItem value="year">Yearly</SelectItem>
                </SelectContent>
              </Select>
            )}

            <Button onClick={exportToExcel} variant="outline">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
            <Button onClick={exportToPDF} variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>

        <Tabs value={activeReport} onValueChange={setActiveReport}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="turn-completion">Turn Completion</TabsTrigger>
            <TabsTrigger value="property-performance">Property Performance</TabsTrigger>
            <TabsTrigger value="vendor-performance">Vendor Performance</TabsTrigger>
            <TabsTrigger value="financial-summary">Financial Summary</TabsTrigger>
          </TabsList>

          <div id="report-content" className="mt-6">
            <TabsContent value="turn-completion">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-muted-foreground">Loading report...</div>
                </div>
              ) : (
                renderTurnCompletionReport()
              )}
            </TabsContent>

            <TabsContent value="property-performance">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-muted-foreground">Loading report...</div>
                </div>
              ) : (
                renderPropertyPerformanceReport()
              )}
            </TabsContent>

            <TabsContent value="vendor-performance">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-muted-foreground">Loading report...</div>
                </div>
              ) : (
                renderVendorPerformanceReport()
              )}
            </TabsContent>

            <TabsContent value="financial-summary">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-muted-foreground">Loading report...</div>
                </div>
              ) : (
                renderFinancialSummaryReport()
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}