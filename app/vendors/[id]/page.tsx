"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import {
  IconArrowLeft,
  IconEdit,
  IconTrash,
  IconPhone,
  IconMail,
  IconMapPin,
  IconStar,
  IconClock,
  IconCurrencyDollar,
  IconFileText,
  IconShield,
  IconAlertTriangle,
  IconDownload,
  IconPlus,
  IconCalendar,
  IconTool,
  IconBriefcase,
  IconTrendingUp,
  IconLoader2,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { fetchVendor, vendorKeys } from "@/lib/api/vendors";
import { formatCurrency, formatDate } from "@/lib/mock-data";
import { toast } from "sonner";

// Mock data for vendor jobs history
const mockJobs = [
  {
    id: "1",
    turnNumber: "T-2024-001",
    propertyName: "Sunset Apartments #201",
    propertyAddress: "123 Main St",
    completedDate: "2024-01-15",
    amount: 2500,
    rating: 5,
    onTime: true,
    scopeOfWork: "Full renovation including painting, flooring, and repairs",
  },
  {
    id: "2",
    turnNumber: "T-2024-045",
    propertyName: "Oak Grove Residences #105",
    propertyAddress: "456 Oak Ave",
    completedDate: "2024-02-10",
    amount: 1800,
    rating: 4,
    onTime: true,
    scopeOfWork: "Painting and minor repairs",
  },
  {
    id: "3",
    turnNumber: "T-2024-089",
    propertyName: "Riverside Complex #302",
    propertyAddress: "789 River Rd",
    completedDate: "2024-03-05",
    amount: 3200,
    rating: 5,
    onTime: false,
    scopeOfWork: "Complete kitchen renovation and appliance installation",
  },
];

// Mock documents
const mockDocuments = [
  {
    id: "1",
    name: "General Liability Insurance",
    type: "Insurance",
    uploadedDate: "2024-01-01",
    expiryDate: "2025-01-01",
    status: "Active",
  },
  {
    id: "2",
    name: "Business License",
    type: "License",
    uploadedDate: "2023-06-15",
    expiryDate: "2024-06-15",
    status: "Expiring Soon",
  },
  {
    id: "3",
    name: "Workers Compensation Certificate",
    type: "Insurance",
    uploadedDate: "2024-01-01",
    expiryDate: "2025-01-01",
    status: "Active",
  },
  {
    id: "4",
    name: "W-9 Form",
    type: "Tax Document",
    uploadedDate: "2023-01-15",
    expiryDate: null,
    status: "Active",
  },
];

export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = params.id as string;

  // Fetch vendor details
  const { data: vendor, isLoading, error } = useQuery({
    queryKey: vendorKeys.detail(vendorId),
    queryFn: () => fetchVendor(vendorId),
  });

  const handleEdit = () => {
    router.push(`/vendors/${vendorId}/edit`);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this vendor?")) return;
    
    try {
      const response = await fetch(`/api/vendors/${vendorId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete vendor");
      }

      toast.success("Vendor deleted successfully");
      router.push("/vendors");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete vendor");
    }
  };

  const getRatingStars = (rating: string | null) => {
    const numRating = parseFloat(rating || "0");
    return Array.from({ length: 5 }, (_, i) => (
      <IconStar 
        key={i} 
        className={`h-4 w-4 ${i < Math.floor(numRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
      />
    ));
  };

  const getPerformanceColor = (rate: string | null) => {
    const numRate = parseFloat(rate || "0");
    if (numRate >= 95) return "text-green-600";
    if (numRate >= 85) return "text-yellow-600";
    return "text-red-600";
  };

  const getDocumentStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Expiring Soon":
        return "bg-yellow-100 text-yellow-800";
      case "Expired":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !vendor) {
    return (
      <DashboardLayout>
        <div className="text-center text-red-600 p-8">
          Error: {error instanceof Error ? error.message : "Vendor not found"}
        </div>
      </DashboardLayout>
    );
  }

  const isInsuranceExpiring = vendor.insuranceExpiry && 
    new Date(vendor.insuranceExpiry) <= new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/vendors")}
            >
              <IconArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                {vendor.companyName}
              </h1>
              <p className="text-muted-foreground">Vendor Profile</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleEdit} className="flex items-center gap-2">
              <IconEdit className="h-4 w-4" />
              Edit
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              className="flex items-center gap-2"
            >
              <IconTrash className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* Alert if insurance is expiring */}
        {isInsuranceExpiring && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="flex items-center gap-2 p-4">
              <IconAlertTriangle className="h-5 w-5 text-orange-600" />
              <span className="text-orange-800 font-medium">
                Insurance expires on {formatDate(vendor.insuranceExpiry)}
              </span>
            </CardContent>
          </Card>
        )}

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rating</CardTitle>
              <IconStar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="flex">{getRatingStars(vendor.rating)}</div>
                <span className="text-2xl font-bold">
                  {vendor.rating ? parseFloat(vendor.rating).toFixed(1) : "N/A"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Based on {vendor.completedJobs} jobs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On-Time Rate</CardTitle>
              <IconClock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getPerformanceColor(vendor.onTimeRate)}`}>
                {vendor.onTimeRate || "0"}%
              </div>
              <Progress 
                value={parseFloat(vendor.onTimeRate || "0")} 
                className="mt-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Cost</CardTitle>
              <IconCurrencyDollar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {vendor.averageCost ? formatCurrency(parseFloat(vendor.averageCost)) : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">
                Per job average
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <IconShield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Badge variant={vendor.isActive ? "default" : "secondary"}>
                  {vendor.isActive ? "Active" : "Inactive"}
                </Badge>
                {vendor.isApproved && (
                  <Badge variant="outline" className="ml-2">
                    Approved
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Information Tabs */}
        <Tabs defaultValue="details" className="space-y-4">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="jobs">Job History</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>
                        {vendor.companyName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{vendor.contactName}</p>
                      <p className="text-sm text-muted-foreground">Primary Contact</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <IconMail className="mr-3 h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${vendor.email}`} className="text-primary hover:underline">
                        {vendor.email}
                      </a>
                    </div>
                    <div className="flex items-center text-sm">
                      <IconPhone className="mr-3 h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${vendor.phone}`} className="text-primary hover:underline">
                        {vendor.phone}
                      </a>
                    </div>
                    <div className="flex items-start text-sm">
                      <IconMapPin className="mr-3 h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p>{vendor.address}</p>
                        <p>{vendor.city}, {vendor.state} {vendor.zipCode}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Specialties & Services */}
              <Card>
                <CardHeader>
                  <CardTitle>Specialties & Services</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {vendor.specialties && vendor.specialties.length > 0 ? (
                      <>
                        <div className="flex flex-wrap gap-2">
                          {vendor.specialties.map((specialty, index) => (
                            <Badge key={index} variant="secondary">
                              <IconTool className="mr-1 h-3 w-3" />
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                        <div className="pt-4 border-t">
                          <p className="text-sm font-medium mb-2">Last Job</p>
                          <p className="text-sm text-muted-foreground">
                            {vendor.lastJobDate ? formatDate(vendor.lastJobDate) : "No jobs yet"}
                          </p>
                        </div>
                      </>
                    ) : (
                      <p className="text-muted-foreground">No specialties listed</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Insurance & Compliance */}
              <Card>
                <CardHeader>
                  <CardTitle>Insurance & Compliance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Insurance Status</span>
                      <Badge className={isInsuranceExpiring ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800"}>
                        {isInsuranceExpiring ? "Expiring Soon" : "Active"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Expiry Date</span>
                      <span className="text-sm font-medium">{formatDate(vendor.insuranceExpiry)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Approved Status</span>
                      <Badge variant={vendor.isApproved ? "default" : "secondary"}>
                        {vendor.isApproved ? "Approved" : "Pending"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {vendor.notes || "No notes available"}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="jobs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Job History</CardTitle>
                <CardDescription>
                  Complete history of all jobs performed by this vendor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Turn #</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>On Time</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockJobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">{job.turnNumber}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{job.propertyName}</p>
                            <p className="text-sm text-muted-foreground">{job.propertyAddress}</p>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(job.completedDate)}</TableCell>
                        <TableCell>{formatCurrency(job.amount)}</TableCell>
                        <TableCell>
                          <div className="flex">{getRatingStars(job.rating.toString())}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={job.onTime ? "default" : "secondary"}>
                            {job.onTime ? "Yes" : "No"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Documents</CardTitle>
                    <CardDescription>
                      Manage vendor licenses, insurance, and compliance documents
                    </CardDescription>
                  </div>
                  <Button className="flex items-center gap-2">
                    <IconPlus className="h-4 w-4" />
                    Upload Document
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockDocuments.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <IconFileText className="h-4 w-4 text-muted-foreground" />
                            {doc.name}
                          </div>
                        </TableCell>
                        <TableCell>{doc.type}</TableCell>
                        <TableCell>{formatDate(doc.uploadedDate)}</TableCell>
                        <TableCell>
                          {doc.expiryDate ? formatDate(doc.expiryDate) : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge className={getDocumentStatusColor(doc.status)}>
                            {doc.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <IconDownload className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">On-Time Completion</span>
                      <span className={`font-bold ${getPerformanceColor(vendor.onTimeRate)}`}>
                        {vendor.onTimeRate || "0"}%
                      </span>
                    </div>
                    <Progress value={parseFloat(vendor.onTimeRate || "0")} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Customer Satisfaction</span>
                      <span className="font-bold">
                        {vendor.rating ? `${parseFloat(vendor.rating).toFixed(1)}/5.0` : "N/A"}
                      </span>
                    </div>
                    <Progress value={(parseFloat(vendor.rating || "0") / 5) * 100} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Jobs Completed</span>
                      <span className="font-bold">{vendor.completedJobs}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Financial Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Average Job Cost</span>
                      <span className="font-medium">
                        {vendor.averageCost ? formatCurrency(parseFloat(vendor.averageCost)) : "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Revenue</span>
                      <span className="font-medium">
                        {formatCurrency(vendor.completedJobs * parseFloat(vendor.averageCost || "0"))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Last Payment</span>
                      <span className="font-medium">
                        {vendor.lastJobDate ? formatDate(vendor.lastJobDate) : "N/A"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>
                  Track vendor performance over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <IconTrendingUp className="h-8 w-8 mr-2" />
                  Performance chart will be displayed here
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}