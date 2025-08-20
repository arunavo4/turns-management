"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  IconArrowLeft,
  IconEdit,
  IconTrash,
  IconHome,
  IconMapPin,
  IconBed,
  IconBath,
  IconRuler,
  IconCalendar,
  IconCurrencyDollar,
  IconUser,
  IconUsers,
  IconShield,
  IconBolt,
  IconDroplet,
  IconFlame,
  IconLoader2,
} from "@tabler/icons-react";
import { formatCurrency } from "@/lib/mock-data";
import { fetchProperty, deleteProperty, propertyKeys } from "@/lib/api/properties";
import { toast } from "sonner";
import AuditLogViewer from "@/components/properties/audit-log-viewer";


export default function PropertyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const propertyId = params.id as string;

  // Fetch property using React Query
  const { data: property, isLoading, error } = useQuery({
    queryKey: propertyKeys.detail(propertyId),
    queryFn: () => fetchProperty(propertyId),
    enabled: !!propertyId,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteProperty,
    onSuccess: () => {
      // Invalidate queries and navigate
      queryClient.invalidateQueries({ queryKey: propertyKeys.all });
      toast.success("Property deleted successfully");
      router.push("/properties");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete property");
    },
  });

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this property?")) return;
    deleteMutation.mutate(propertyId);
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

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !property) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h2 className="text-2xl font-semibold mb-2">Property Not Found</h2>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : "The requested property could not be found."}
          </p>
          <Button onClick={() => router.push("/properties")}>
            Back to Properties
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/properties")}
            >
              <IconArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">{property.name}</h1>
              <p className="text-muted-foreground">
                Property ID: {property.propertyId || property.id.slice(0, 8)}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => router.push(`/properties/${params.id}/edit`)}
            >
              <IconEdit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <IconTrash className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Status and Flags */}
        <div className="flex flex-wrap gap-2">
          <Badge className={getStatusColor(property.status)}>
            {property.status.replace("_", " ").toUpperCase()}
          </Badge>
          {property.isCore && (
            <Badge variant="default" className="bg-green-600">Core Property</Badge>
          )}
          {property.inDisposition && (
            <Badge variant="destructive">In Disposition</Badge>
          )}
          {property.section8 && (
            <Badge variant="secondary">Section 8</Badge>
          )}
          {property.insurance && (
            <Badge variant="secondary">Insured</Badge>
          )}
          {property.ownership && (
            <Badge variant="secondary">Owned</Badge>
          )}
          {property.squatters && (
            <Badge variant="destructive">Squatters Present</Badge>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconHome className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Property Type</p>
                <p className="font-medium capitalize">{property.type.replace("_", " ")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Owner</p>
                <p className="font-medium">{property.owner || "Not specified"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Year Built</p>
                <p className="font-medium">{property.yearBuilt}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Market</p>
                <p className="font-medium">{property.market || "Not specified"}</p>
              </div>
              {property.statusYardi && (
                <div>
                  <p className="text-sm text-muted-foreground">Yardi Status</p>
                  <p className="font-medium">{property.statusYardi}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconMapPin className="h-5 w-5" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{property.address}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">City, State ZIP</p>
                <p className="font-medium">
                  {property.city}, {property.state} {property.zipCode}
                </p>
              </div>
              {property.county && (
                <div>
                  <p className="text-sm text-muted-foreground">County</p>
                  <p className="font-medium">{property.county}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Property Details */}
          <Card>
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <IconBed className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Bedrooms</p>
                    <p className="font-medium">{property.bedrooms}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <IconBath className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Bathrooms</p>
                    <p className="font-medium">{property.bathrooms || 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <IconRuler className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Square Feet</p>
                    <p className="font-medium">{property.squareFeet.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <IconCurrencyDollar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Rent</p>
                    <p className="font-medium">{formatCurrency(parseFloat(property.monthlyRent))}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Utilities */}
          <Card>
            <CardHeader>
              <CardTitle>Utilities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IconBolt className="h-4 w-4 text-muted-foreground" />
                    <span>Power</span>
                  </div>
                  <Badge variant={property.utilities?.power ? "default" : "secondary"}>
                    {property.utilities?.power ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IconDroplet className="h-4 w-4 text-muted-foreground" />
                    <span>Water</span>
                  </div>
                  <Badge variant={property.utilities?.water ? "default" : "secondary"}>
                    {property.utilities?.water ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IconFlame className="h-4 w-4 text-muted-foreground" />
                    <span>Gas</span>
                  </div>
                  <Badge variant={property.utilities?.gas ? "default" : "secondary"}>
                    {property.utilities?.gas ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dates and Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconCalendar className="h-5 w-5" />
              Important Dates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {property.moveInDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Move In Date</p>
                  <p className="font-medium">
                    {new Date(property.moveInDate).toLocaleDateString()}
                  </p>
                </div>
              )}
              {property.moveOutDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Move Out Date</p>
                  <p className="font-medium">
                    {new Date(property.moveOutDate).toLocaleDateString()}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">
                  {new Date(property.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">
                  {new Date(property.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {property.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{property.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Audit Log */}
        <AuditLogViewer propertyId={propertyId} limit={10} />
      </div>
    </DashboardLayout>
  );
}