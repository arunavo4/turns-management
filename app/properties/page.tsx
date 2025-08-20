"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import {
  IconSearch,
  IconMapPin,
  IconHome,
  IconBed,
  IconBath,
  IconRuler,
  IconCurrencyDollar,
  IconPlus,
  IconLayoutGrid,
  IconList,
  IconEye,
  IconEdit,
  IconTrash,
  IconDots,
  IconBuilding,
  IconHome2,
  IconBuildingSkyscraper,
  IconBuildingStore,
  IconLoader2,
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/mock-data";
import { useRouter } from "next/navigation";

interface Property {
  id: string;
  propertyId?: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  county?: string;
  type: string;
  status: string;
  bedrooms: number;
  bathrooms: string;
  squareFeet: number;
  yearBuilt?: number;
  monthlyRent: string;
  market?: string;
  owner?: string;
  isCore: boolean;
  inDisposition?: boolean;
  section8?: boolean;
  insurance?: boolean;
  squatters?: boolean;
  ownership?: boolean;
  color?: number;
  createdAt: string;
  updatedAt: string;
}

export default function PropertiesPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Fetch properties from API
  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/properties");
      if (!response.ok) {
        throw new Error("Failed to fetch properties");
      }
      const data = await response.json();
      setProperties(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (id: string) => {
    router.push(`/properties/${id}`);
  };

  const handleEdit = (id: string) => {
    router.push(`/properties/${id}/edit`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this property?")) return;

    try {
      const response = await fetch(`/api/properties/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete property");
      }

      // Refresh properties list
      fetchProperties();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete property");
    }
  };

  // Filter properties based on search and filters
  const filteredProperties = properties.filter((property) => {
    const matchesSearch = property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || property.status === statusFilter;
    const matchesType = typeFilter === "all" || property.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getPropertyIcon = (type: string) => {
    switch (type) {
      case "single_family":
        return <IconHome2 className="h-5 w-5" />;
      case "apartment":
        return <IconBuilding className="h-5 w-5" />;
      case "condo":
        return <IconBuildingSkyscraper className="h-5 w-5" />;
      case "commercial":
        return <IconBuildingStore className="h-5 w-5" />;
      default:
        return <IconHome className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "occupied":
        return "bg-blue-100 text-blue-800";
      case "vacant":
        return "bg-yellow-100 text-yellow-800";
      case "maintenance":
        return "bg-orange-100 text-orange-800";
      case "pending_turn":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
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
          Error: {error}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Properties</h1>
            <p className="text-muted-foreground">
              Manage your property portfolio
            </p>
          </div>
          <Button 
            className="flex items-center gap-2"
            onClick={() => router.push("/properties/new")}
          >
            <IconPlus className="h-4 w-4" />
            Add Property
          </Button>
        </div>

        {/* Filters and View Toggle */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <IconSearch className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search properties..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                  <SelectItem value="vacant">Vacant</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="pending_turn">Pending Turn</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="single_family">Single Family</SelectItem>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="condo">Condo</SelectItem>
                  <SelectItem value="townhouse">Townhouse</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                >
                  <IconLayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                >
                  <IconList className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Properties Display */}
        {viewMode === "grid" ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProperties.map((property) => (
              <Card 
                key={property.id} 
                className={`hover:shadow-lg transition-shadow ${
                  property.isCore 
                    ? 'border-l-4 border-l-green-500' 
                    : 'border-l-4 border-l-orange-500'
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getPropertyIcon(property.type)}
                      <CardTitle className="text-lg">{property.name}</CardTitle>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <IconDots className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleViewDetails(property.id)}>
                          <IconEye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(property.id)}>
                          <IconEdit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleDelete(property.id)}
                        >
                          <IconTrash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <Badge className={getStatusColor(property.status)}>
                    {property.status.replace("_", " ").toUpperCase()}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <IconMapPin className="mr-1 h-3 w-3" />
                    {property.address}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {property.city}, {property.state} {property.zipCode}
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="flex items-center text-sm">
                      <IconBed className="mr-1 h-3 w-3 text-muted-foreground" />
                      {property.bedrooms} Beds
                    </div>
                    <div className="flex items-center text-sm">
                      <IconBath className="mr-1 h-3 w-3 text-muted-foreground" />
                      {property.bathrooms} Baths
                    </div>
                    <div className="flex items-center text-sm">
                      <IconRuler className="mr-1 h-3 w-3 text-muted-foreground" />
                      {property.squareFeet} sqft
                    </div>
                    <div className="flex items-center text-sm">
                      <IconCurrencyDollar className="mr-1 h-3 w-3 text-muted-foreground" />
                      {formatCurrency(parseFloat(property.monthlyRent))}/mo
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {property.isCore && (
                      <Badge variant="secondary" className="text-xs">Core</Badge>
                    )}
                    {property.section8 && (
                      <Badge variant="outline" className="text-xs">Section 8</Badge>
                    )}
                    {property.insurance && (
                      <Badge variant="outline" className="text-xs">Insured</Badge>
                    )}
                    {property.squatters && (
                      <Badge variant="destructive" className="text-xs">Squatters</Badge>
                    )}
                    {property.inDisposition && (
                      <Badge variant="destructive" className="text-xs">In Disposition</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Beds/Baths</TableHead>
                  <TableHead>Rent</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProperties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {getPropertyIcon(property.type)}
                        {property.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{property.address}</div>
                        <div className="text-sm text-muted-foreground">
                          {property.city}, {property.state} {property.zipCode}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{property.type.replace("_", " ")}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(property.status)}>
                        {property.status.replace("_", " ").toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{property.bedrooms}/{property.bathrooms}</TableCell>
                    <TableCell>{formatCurrency(parseFloat(property.monthlyRent))}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <IconDots className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleViewDetails(property.id)}>
                            <IconEye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(property.id)}>
                            <IconEdit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDelete(property.id)}
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
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}