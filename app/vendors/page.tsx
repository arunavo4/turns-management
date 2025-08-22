"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout"
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
  IconLoader2,
  IconTrash,
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
  formatCurrency, 
  formatDate
} from "@/lib/mock-data";
import { fetchVendors, fetchVendor, deleteVendor, vendorKeys, type Vendor } from "@/lib/api/vendors";
import { toast } from "sonner";
import { useRouter } from "next/navigation";


type ViewMode = "grid" | "table";

export default function VendorsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSpecialty, setFilterSpecialty] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Fetch vendors using React Query
  const { data: vendors = [], isLoading, error } = useQuery({
    queryKey: vendorKeys.lists(),
    queryFn: fetchVendors,
  });

  // Delete mutation with optimistic update
  const deleteMutation = useMutation({
    mutationFn: deleteVendor,
    onMutate: async (deletedId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: vendorKeys.lists() });
      
      // Snapshot previous value
      const previousVendors = queryClient.getQueryData<Vendor[]>(vendorKeys.lists());
      
      // Optimistically remove from the list
      queryClient.setQueryData<Vendor[]>(vendorKeys.lists(), (old) => 
        old ? old.filter(v => v.id !== deletedId) : []
      );
      
      return { previousVendors };
    },
    onSuccess: () => {
      toast.success("Vendor deleted successfully");
    },
    onError: (error, _, context) => {
      // Rollback on error
      if (context?.previousVendors) {
        queryClient.setQueryData(vendorKeys.lists(), context.previousVendors);
      }
      toast.error(error instanceof Error ? error.message : "Failed to delete vendor");
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: vendorKeys.all });
    },
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vendor?")) return;
    deleteMutation.mutate(id);
  };

  // Prefetch on hover for instant navigation
  const handleMouseEnter = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: vendorKeys.detail(id),
      queryFn: () => fetchVendor(id),
      staleTime: 30 * 1000, // Keep fresh for 30 seconds
    });
  };

  const handleViewProfile = async (id: string) => {
    // Prefetch vendor details before navigation
    await queryClient.prefetchQuery({
      queryKey: vendorKeys.detail(id),
      queryFn: () => fetchVendor(id),
      staleTime: 10 * 1000, // Consider fresh for 10 seconds
    });
    router.push(`/vendors/${id}`);
  };

  const handleEdit = async (id: string) => {
    // Prefetch vendor details before navigation
    await queryClient.prefetchQuery({
      queryKey: vendorKeys.detail(id),
      queryFn: () => fetchVendor(id),
      staleTime: 10 * 1000, // Consider fresh for 10 seconds
    });
    router.push(`/vendors/${id}/edit`);
  };

  // Get all unique specialties
  const allSpecialties = Array.from(
    new Set(vendors.flatMap(vendor => vendor.specialties || []))
  ).sort();

  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch = 
      vendor.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (vendor.specialties || []).some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesSpecialty = filterSpecialty === "all" || 
      (vendor.specialties || []).includes(filterSpecialty);
    
    const matchesStatus = filterStatus === "all" || 
      (filterStatus === "active" && vendor.isActive) ||
      (filterStatus === "inactive" && !vendor.isActive);
    
    return matchesSearch && matchesSpecialty && matchesStatus;
  });

  const getPerformanceColor = (rate: string | null) => {
    const numRate = parseFloat(rate || "0");
    if (numRate >= 95) return "text-green-600";
    if (numRate >= 85) return "text-yellow-600";
    return "text-red-600";
  };

  const getRatingStars = (rating: string | null) => {
    const numRating = parseFloat(rating || "0");
    return Array.from({ length: 5 }, (_, i) => (
      <IconStar 
        key={i} 
        className={`h-3 w-3 ${i < Math.floor(numRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
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
    <Card 
      className="group hover:shadow-md transition-shadow duration-200"
      onMouseEnter={() => handleMouseEnter(vendor.id)}
    >
      <CardContent className="px-6">
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
                {vendor.rating && (
                  <div className="flex items-center gap-1">
                    {getRatingStars(vendor.rating)}
                    <span className="text-sm font-medium ml-1">{parseFloat(vendor.rating).toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">
                      ({vendor.completedJobs} jobs)
                    </span>
                  </div>
                )}
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
                  <DropdownMenuItem onClick={() => handleViewProfile(vendor.id)}>
                    <IconEye className="mr-2 h-4 w-4" />
                    View Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleEdit(vendor.id)}>
                    <IconEdit className="mr-2 h-4 w-4" />
                    Edit Vendor
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <IconFileText className="mr-2 h-4 w-4" />
                    View History
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-red-600"
                    onClick={() => handleDelete(vendor.id)}
                  >
                    <IconTrash className="mr-2 h-4 w-4" />
                    Delete
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
          {vendor.specialties && vendor.specialties.length > 0 && (
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
          )}

          {/* Performance Metrics */}
          {(vendor.onTimeRate || vendor.averageCost) && (
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              {vendor.onTimeRate && (
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">On-Time Rate</div>
                  <div className={`text-sm font-semibold ${getPerformanceColor(vendor.onTimeRate)}`}>
                    {vendor.onTimeRate}%
                  </div>
                </div>
              )}
              {vendor.averageCost && (
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Avg Cost</div>
                  <div className="text-sm font-semibold">
                    {formatCurrency(parseFloat(vendor.averageCost))}
                  </div>
                </div>
              )}
            </div>
          )}

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

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center text-red-600 p-8">
          Error: {error instanceof Error ? error.message : "An error occurred"}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Vendors</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage your vendor network and track performance
            </p>
          </div>
          <Button 
            className="flex items-center gap-2 w-full sm:w-auto"
            onClick={() => router.push("/vendors/new")}
          >
            <IconPlus className="h-4 w-4" />
            Add Vendor
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
              <IconUsers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vendors.length}</div>
              <p className="text-xs text-muted-foreground">
                {vendors.filter(v => v.isActive).length} active
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
                {vendors.length > 0 ? 
                  (vendors.reduce((sum, v) => sum + parseFloat(v.rating || "0"), 0) / vendors.length).toFixed(1) : 
                  "0.0"}
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
                {vendors.length > 0 ? 
                  Math.round(vendors.reduce((sum, v) => sum + parseFloat(v.onTimeRate || "0"), 0) / vendors.length) : 
                  0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Performance average
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
                {vendors.length > 0 ? 
                  formatCurrency(
                    vendors.reduce((sum, v) => sum + parseFloat(v.averageCost || "0"), 0) / vendors.length
                  ) : 
                  "$0"}
              </div>
              <p className="text-xs text-muted-foreground">
                Per job average
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 sm:max-w-sm">
              <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search vendors..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
            <Select value={filterSpecialty} onValueChange={setFilterSpecialty}>
              <SelectTrigger className="flex-1 sm:w-48">
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
              <SelectTrigger className="flex-1 sm:w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
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
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredVendors.map((vendor) => (
                <VendorCard key={vendor.id} vendor={vendor} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="table">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor</TableHead>
                      <TableHead className="hidden sm:table-cell">Specialties</TableHead>
                      <TableHead className="hidden md:table-cell">Rating</TableHead>
                      <TableHead className="hidden lg:table-cell">Performance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell text-right">Avg Cost</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVendors.map((vendor) => (
                      <TableRow 
                        key={vendor.id}
                        onMouseEnter={() => handleMouseEnter(vendor.id)}
                      >
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
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {(vendor.specialties || []).slice(0, 2).map((specialty, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {specialty}
                              </Badge>
                            ))}
                            {(vendor.specialties || []).length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{vendor.specialties.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {vendor.rating ? (
                            <div>
                              <div className="flex items-center gap-1">
                                <div className="flex">
                                  {getRatingStars(vendor.rating)}
                                </div>
                                <span className="text-sm font-medium ml-1">{parseFloat(vendor.rating).toFixed(1)}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {vendor.completedJobs} jobs
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">No rating</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="space-y-1">
                            {vendor.onTimeRate && (
                              <div className="text-sm">
                                <span className="text-muted-foreground">On-time: </span>
                                <span className={getPerformanceColor(vendor.onTimeRate)}>
                                  {vendor.onTimeRate}%
                                </span>
                              </div>
                            )}
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
                        <TableCell className="hidden md:table-cell text-right font-medium">
                          {vendor.averageCost ? formatCurrency(parseFloat(vendor.averageCost)) : '-'}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <IconDots className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewProfile(vendor.id)}>
                                <IconEye className="mr-2 h-4 w-4" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(vendor.id)}>
                                <IconEdit className="mr-2 h-4 w-4" />
                                Edit Vendor
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <IconFileText className="mr-2 h-4 w-4" />
                                View History
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleDelete(vendor.id)}
                              >
                                <IconTrash className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
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
              <Button onClick={() => router.push("/vendors/new")}>
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