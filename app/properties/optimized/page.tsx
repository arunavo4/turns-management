"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/dashboard-layout";
import {
  IconSearch,
  IconPlus,
  IconLayoutGrid,
  IconList,
  IconLoader2,
  IconChevronLeft,
  IconChevronRight,
  IconFilter,
  IconX,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useServerSearch } from "@/hooks/use-server-search";
import { formatCurrency } from "@/lib/mock-data";
import type { Property } from "@/lib/api/properties";

export default function OptimizedPropertiesPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const {
    results: properties,
    pagination,
    isLoading,
    isFetching,
    searchTerm,
    setSearchTerm,
    filters,
    updateFilter,
    resetFilters,
    page,
    goToPage,
    nextPage,
    prevPage,
    totalResults,
    isEmpty,
  } = useServerSearch<Property>({
    endpoint: "/api/properties/search",
    queryKey: "properties-search",
    initialParams: {
      limit: 24, // Good for grid view (divisible by 2, 3, 4)
    },
  });

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const { totalPages } = pagination;
    const pages: (number | string)[] = [];
    
    if (totalPages <= 7) {
      // Show all pages if 7 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first, last, and pages around current
      pages.push(1);
      
      if (page > 3) pages.push("...");
      
      for (let i = Math.max(2, page - 1); i <= Math.min(page + 1, totalPages - 1); i++) {
        pages.push(i);
      }
      
      if (page < totalPages - 2) pages.push("...");
      
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Properties</h1>
            <p className="text-muted-foreground">
              {totalResults > 0 ? (
                <>
                  Showing {((page - 1) * pagination.limit) + 1}-
                  {Math.min(page * pagination.limit, totalResults)} of {totalResults} properties
                </>
              ) : (
                "Manage your property portfolio"
              )}
            </p>
          </div>
          <Button onClick={() => router.push("/properties/new")}>
            <IconPlus className="h-4 w-4 mr-2" />
            Add Property
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              {/* Search Input */}
              <div className="relative flex-1">
                <IconSearch className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search properties (server-side)..."
                  className="pl-9 pr-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    className="absolute right-2 top-2.5 text-xs text-muted-foreground hover:text-foreground px-2 py-0.5 hover:bg-accent rounded"
                    onClick={() => setSearchTerm("")}
                  >
                    <IconX className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                <Select value={filters.status} onValueChange={(value) => updateFilter("status", value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="vacant">Vacant</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.type} onValueChange={(value) => updateFilter("type", value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="single_family">Single Family</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="condo">Condo</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.sortBy} onValueChange={(value) => updateFilter("sortBy", value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="address">Address</SelectItem>
                    <SelectItem value="city">City</SelectItem>
                    <SelectItem value="rent">Rent</SelectItem>
                    <SelectItem value="createdAt">Date Added</SelectItem>
                  </SelectContent>
                </Select>

                {(filters.status !== "all" || filters.type !== "all" || searchTerm) && (
                  <Button variant="ghost" size="sm" onClick={resetFilters}>
                    <IconFilter className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}

                {/* View Mode Toggle */}
                <div className="flex gap-1 border rounded-md p-1">
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                  >
                    <IconLayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    <IconList className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && isEmpty && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">
                {searchTerm ? `No properties found for "${searchTerm}"` : "No properties found"}
              </p>
              <Button variant="outline" onClick={resetFilters}>
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Results Grid/List */}
        {!isLoading && !isEmpty && (
          <>
            {viewMode === "grid" ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {properties.map((property) => (
                  <Card
                    key={property.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => router.push(`/properties/${property.id}`)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg line-clamp-1">
                          {property.name}
                        </CardTitle>
                        <Badge variant={
                          property.status === "vacant" ? "default" :
                          property.status === "occupied" ? "secondary" :
                          "outline"
                        }>
                          {property.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {property.address}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          {property.city}, {property.state}
                        </span>
                        <span className="font-semibold">
                          {formatCurrency(parseFloat(property.monthlyRent) || 0)}/mo
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b">
                        <tr>
                          <th className="text-left p-4">Name</th>
                          <th className="text-left p-4">Address</th>
                          <th className="text-left p-4">Status</th>
                          <th className="text-left p-4">Type</th>
                          <th className="text-right p-4">Rent</th>
                        </tr>
                      </thead>
                      <tbody>
                        {properties.map((property) => (
                          <tr
                            key={property.id}
                            className="border-b hover:bg-muted/50 cursor-pointer"
                            onClick={() => router.push(`/properties/${property.id}`)}
                          >
                            <td className="p-4 font-medium">{property.name}</td>
                            <td className="p-4 text-sm text-muted-foreground">
                              {property.address}
                            </td>
                            <td className="p-4">
                              <Badge variant={
                                property.status === "vacant" ? "default" :
                                property.status === "occupied" ? "secondary" :
                                "outline"
                              }>
                                {property.status}
                              </Badge>
                            </td>
                            <td className="p-4 text-sm">{property.type}</td>
                            <td className="p-4 text-right font-semibold">
                              {formatCurrency(parseFloat(property.monthlyRent) || 0)}/mo
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <Card>
                <CardContent className="flex items-center justify-between p-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevPage}
                    disabled={!pagination.hasPrevPage}
                  >
                    <IconChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>

                  <div className="flex gap-1">
                    {getPageNumbers().map((pageNum, idx) => (
                      pageNum === "..." ? (
                        <span key={`ellipsis-${idx}`} className="px-2 py-1">...</span>
                      ) : (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => goToPage(pageNum as number)}
                          className="min-w-[2rem]"
                        >
                          {pageNum}
                        </Button>
                      )
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={nextPage}
                    disabled={!pagination.hasNextPage}
                  >
                    Next
                    <IconChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Loading overlay for pagination */}
        {isFetching && !isLoading && (
          <div className="fixed bottom-4 right-4 bg-background border rounded-lg shadow-lg p-3 flex items-center gap-2">
            <IconLoader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading...</span>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}