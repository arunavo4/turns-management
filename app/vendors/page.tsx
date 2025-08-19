"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import {
  IconSearch,
  IconPlus,
  IconStar,
  IconPhone,
  IconMail,
  IconMapPin,
  IconTool,
  IconShield,
  IconEye,
  IconEdit,
  IconDots,
  IconUsers,
  IconClock,
  IconCurrencyDollar,
  IconFileText,
  IconLayoutGrid,
  IconList,
} from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  mockVendors, 
  formatCurrency, 
  formatDate,
  Vendor 
} from "@/lib/mock-data";

type ViewMode = "grid" | "table";

export default function VendorsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSpecialty, setFilterSpecialty] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Get all unique specialties
  const allSpecialties = Array.from(
    new Set(mockVendors.flatMap(vendor => vendor.specialties))
  ).sort();

  const filteredVendors = mockVendors.filter((vendor) => {
    const matchesSearch = 
      vendor.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesSpecialty = filterSpecialty === "all" || 
      vendor.specialties.includes(filterSpecialty);
    
    const matchesStatus = filterStatus === "all" || 
      (filterStatus === "active" && vendor.isActive) ||
      (filterStatus === "inactive" && !vendor.isActive);
    
    return matchesSearch && matchesSpecialty && matchesStatus;
  });

  const getPerformanceColor = (rate: number) => {
    if (rate >= 95) return "text-green-600";
    if (rate >= 85) return "text-yellow-600";
    return "text-red-600";
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <IconStar 
        key={i} 
        className={`h-3 w-3 ${i < Math.floor(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
      />
    ));
  };

  const isInsuranceExpiring = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 60; // Alert if expiring within 60 days
  };

  const VendorCard = ({ vendor }: { vendor: Vendor }) => (
    <Card className="group hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="font-semibold">
                  {vendor.companyName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                  {vendor.companyName}
                </h3>
                <p className="text-sm text-muted-foreground">{vendor.contactName}</p>
                <div className="flex items-center gap-1">
                  {getRatingStars(vendor.rating)}
                  <span className="text-sm font-medium ml-1">{vendor.rating}</span>
                  <span className="text-xs text-muted-foreground">
                    ({vendor.completedJobs} jobs)
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={vendor.isActive ? "default" : "secondary"}>
                {vendor.isActive ? "Active" : "Inactive"}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <IconDots className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <IconEye className="mr-2 h-4 w-4" />
                    View Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <IconEdit className="mr-2 h-4 w-4" />
                    Edit Vendor
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <IconFileText className="mr-2 h-4 w-4" />
                    View History
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <IconMail className="mr-2 h-3 w-3" />
              {vendor.email}
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <IconPhone className="mr-2 h-3 w-3" />
              {vendor.phone}
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <IconMapPin className="mr-2 h-3 w-3" />
              {vendor.city}, {vendor.state}
            </div>
          </div>

          {/* Specialties */}
          <div className="space-y-2">
            <div className="flex items-center text-sm font-medium">
              <IconTool className="mr-2 h-3 w-3" />
              Specialties
            </div>
            <div className="flex flex-wrap gap-1">
              {vendor.specialties.map((specialty, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {specialty}
                </Badge>
              ))}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">On-Time Rate</div>
              <div className={`text-sm font-semibold ${getPerformanceColor(vendor.onTimeRate)}`}>
                {vendor.onTimeRate}%
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Avg Cost</div>
              <div className="text-sm font-semibold">
                {formatCurrency(vendor.averageCost)}
              </div>
            </div>
          </div>

          {/* Insurance Status */}
          {isInsuranceExpiring(vendor.insuranceExpiry) && (
            <div className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded text-orange-800">
              <IconShield className="h-4 w-4" />
              <span className="text-xs font-medium">
                Insurance expires {formatDate(vendor.insuranceExpiry)}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Vendors</h1>
            <p className="text-muted-foreground">
              Manage your vendor network and track performance
            </p>
          </div>
          <Button className="flex items-center gap-2">
            <IconPlus className="h-4 w-4" />
            Add Vendor
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
              <IconUsers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockVendors.length}</div>
              <p className="text-xs text-muted-foreground">
                {mockVendors.filter(v => v.isActive).length} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
              <IconStar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(mockVendors.reduce((sum, v) => sum + v.rating, 0) / mockVendors.length).toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all vendors
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg On-Time Rate</CardTitle>
              <IconClock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(mockVendors.reduce((sum, v) => sum + v.onTimeRate, 0) / mockVendors.length)}%
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">↑ 2%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Cost</CardTitle>
              <IconCurrencyDollar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  mockVendors.reduce((sum, v) => sum + v.averageCost, 0) / mockVendors.length
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Per job average
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gap-2">
            <div className="relative flex-1 max-w-sm">
              <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search vendors..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterSpecialty} onValueChange={setFilterSpecialty}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Specialties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specialties</SelectItem>
                {allSpecialties.map((specialty) => (
                  <SelectItem key={specialty} value={specialty}>
                    {specialty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
              <TabsList>
                <TabsTrigger value="grid" className="flex items-center gap-2">
                  <IconLayoutGrid className="h-4 w-4" />
                  Grid
                </TabsTrigger>
                <TabsTrigger value="table" className="flex items-center gap-2">
                  <IconList className="h-4 w-4" />
                  Table
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Vendors Content */}
        <Tabs value={viewMode} className="space-y-4">
          <TabsContent value="grid">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredVendors.map((vendor) => (
                <VendorCard key={vendor.id} vendor={vendor} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="table">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Specialties</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Avg Cost</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVendors.map((vendor) => (
                      <TableRow key={vendor.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {vendor.companyName.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{vendor.companyName}</div>
                              <div className="text-sm text-muted-foreground">
                                {vendor.contactName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {vendor.city}, {vendor.state}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {vendor.specialties.slice(0, 2).map((specialty, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {specialty}
                              </Badge>
                            ))}
                            {vendor.specialties.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{vendor.specialties.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <div className="flex">
                              {getRatingStars(vendor.rating)}
                            </div>
                            <span className="text-sm font-medium ml-1">{vendor.rating}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {vendor.completedJobs} jobs
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">
                              <span className="text-muted-foreground">On-time: </span>
                              <span className={getPerformanceColor(vendor.onTimeRate)}>
                                {vendor.onTimeRate}%
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Last job: {vendor.lastJobDate ? formatDate(vendor.lastJobDate) : 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge variant={vendor.isActive ? "default" : "secondary"}>
                              {vendor.isActive ? "Active" : "Inactive"}
                            </Badge>
                            {isInsuranceExpiring(vendor.insuranceExpiry) && (
                              <div className="flex items-center gap-1 text-orange-600">
                                <IconShield className="h-3 w-3" />
                                <span className="text-xs">Insurance expiring</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(vendor.averageCost)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <IconDots className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <IconEye className="mr-2 h-4 w-4" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <IconEdit className="mr-2 h-4 w-4" />
                                Edit Vendor
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <IconFileText className="mr-2 h-4 w-4" />
                                View History
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Empty State */}
        {filteredVendors.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <IconUsers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No vendors found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search criteria or filters.
              </p>
              <Button>
                <IconPlus className="h-4 w-4 mr-2" />
                Add New Vendor
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}