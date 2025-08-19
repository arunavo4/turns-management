"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import {
  IconSearch,
  IconMapPin,
  IconHome,
  IconBed,
  IconBath,
  IconRuler,
  IconCurrencyDollar,
  IconCalendar,
  IconPlus,
  IconLayoutGrid,
  IconList,
  IconEye,
  IconEdit,
  IconDots,
  IconBuilding,
  IconHome2,
  IconBuildingSkyscraper,
  IconBuildingStore,
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
import { 
  mockProperties, 
  getStatusColor, 
  formatCurrency, 
  formatDate,
  Property 
} from "@/lib/mock-data";

type ViewMode = "grid" | "table";

export default function PropertiesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const filteredProperties = mockProperties.filter((property) => {
    const matchesSearch = property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.city.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || property.status === filterStatus;
    const matchesType = filterType === "all" || property.propertyType === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: string) => {
    const colorClass = getStatusColor(status);
    return (
      <Badge variant="secondary" className={colorClass}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getPropertyTypeIcon = (type: string) => {
    switch (type) {
      case 'apartment':
        return <IconBuilding className="h-4 w-4" />;
      case 'house':
        return <IconHome2 className="h-4 w-4" />;
      case 'condo':
        return <IconBuildingSkyscraper className="h-4 w-4" />;
      case 'commercial':
        return <IconBuildingStore className="h-4 w-4" />;
      default:
        return <IconHome className="h-4 w-4" />;
    }
  };

  const PropertyCard = ({ property }: { property: Property }) => (
    <Card className="group hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                {property.name}
              </h3>
              <div className="flex items-center text-sm text-muted-foreground">
                <IconMapPin className="mr-1 h-3 w-3" />
                {property.address}, {property.city}, {property.state}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(property.status)}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <IconDots className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <IconEye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <IconEdit className="mr-2 h-4 w-4" />
                    Edit Property
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Property Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                {getPropertyTypeIcon(property.propertyType)}
                <span className="ml-2 capitalize">{property.propertyType}</span>
              </div>
              {property.bedrooms && (
                <div className="flex items-center text-sm">
                  <IconBed className="h-4 w-4" />
                  <span className="ml-2">{property.bedrooms} bed</span>
                </div>
              )}
              {property.bathrooms && (
                <div className="flex items-center text-sm">
                  <IconBath className="h-4 w-4" />
                  <span className="ml-2">{property.bathrooms} bath</span>
                </div>
              )}
              <div className="flex items-center text-sm">
                <IconRuler className="h-4 w-4" />
                <span className="ml-2">{property.squareFeet.toLocaleString()} sq ft</span>
              </div>
            </div>
            <div className="space-y-2">
              {property.monthlyRent && (
                <div className="flex items-center text-sm">
                  <IconCurrencyDollar className="h-4 w-4" />
                  <span className="ml-2">{formatCurrency(property.monthlyRent)}/mo</span>
                </div>
              )}
              {property.lastTurnDate && (
                <div className="flex items-center text-sm">
                  <IconCalendar className="h-4 w-4" />
                  <span className="ml-2">Last turn: {formatDate(property.lastTurnDate)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Property Manager */}
          <div className="border-t pt-4">
            <div className="text-sm">
              <span className="text-muted-foreground">Manager: </span>
              <span className="font-medium">{property.propertyManager}</span>
            </div>
            {property.seniorPropertyManager && (
              <div className="text-sm">
                <span className="text-muted-foreground">Senior Manager: </span>
                <span className="font-medium">{property.seniorPropertyManager}</span>
              </div>
            )}
          </div>
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
            <h1 className="text-3xl font-semibold tracking-tight">Properties</h1>
            <p className="text-muted-foreground">
              Manage your property portfolio and track performance
            </p>
          </div>
          <Button className="flex items-center gap-2">
            <IconPlus className="h-4 w-4" />
            Add Property
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
              <IconBuilding className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockProperties.length}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+2</span> added this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Properties</CardTitle>
              <IconHome className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mockProperties.filter(p => p.status === 'active').length}
              </div>
              <p className="text-xs text-muted-foreground">
                {Math.round((mockProperties.filter(p => p.status === 'active').length / mockProperties.length) * 100)}% of portfolio
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <IconCurrencyDollar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  mockProperties
                    .filter(p => p.monthlyRent)
                    .reduce((sum, p) => sum + (p.monthlyRent || 0), 0)
                )}
              </div>
              <p className="text-xs text-muted-foreground">Monthly rental income</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Sq Ft</CardTitle>
              <IconRuler className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(
                  mockProperties.reduce((sum, p) => sum + p.squareFeet, 0) / mockProperties.length
                ).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Square feet per property</p>
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
                placeholder="Search properties..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="vacant">Vacant</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="apartment">Apartment</SelectItem>
                <SelectItem value="house">House</SelectItem>
                <SelectItem value="condo">Condo</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
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

        {/* Properties Content */}
        <Tabs value={viewMode} className="space-y-4">
          <TabsContent value="grid">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="table">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Manager</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead className="text-right">Rent</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProperties.map((property) => (
                      <TableRow key={property.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{property.name}</div>
                            <div className="text-sm text-muted-foreground flex items-center">
                              <IconMapPin className="mr-1 h-3 w-3" />
                              {property.city}, {property.state}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {getPropertyTypeIcon(property.propertyType)}
                            <span className="ml-2 capitalize">{property.propertyType}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(property.status)}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{property.propertyManager}</div>
                            {property.seniorPropertyManager && (
                              <div className="text-sm text-muted-foreground">
                                Sr: {property.seniorPropertyManager}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {property.bedrooms && property.bathrooms ? (
                              <div>{property.bedrooms}bed / {property.bathrooms}bath</div>
                            ) : null}
                            <div className="text-muted-foreground">
                              {property.squareFeet.toLocaleString()} sq ft
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {property.monthlyRent ? formatCurrency(property.monthlyRent) : 'N/A'}
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
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <IconEdit className="mr-2 h-4 w-4" />
                                Edit Property
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

        {filteredProperties.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <IconBuilding className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No properties found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search criteria or filters.
              </p>
              <Button>
                <IconPlus className="h-4 w-4 mr-2" />
                Add New Property
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}