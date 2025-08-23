"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Calendar, CheckCircle, Clock, DollarSign, Home, User, XCircle, AlertTriangle, FileText, MapPin } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialties: string[];
  rating: number;
}

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

interface Approver {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface ApprovalHistory {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  comments: string | null;
  approvedAt: string;
  approver: Approver;
}

interface Turn {
  id: string;
  propertyId: string;
  stage: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD";
  assignedVendorId: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  estimatedCost: number;
  actualCost: number | null;
  startDate: string | null;
  endDate: string | null;
  completionDate: string | null;
  notes: string | null;
  inspectionNotes: string | null;
  workOrderNumber: string | null;
  requiresApproval: boolean;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED" | null;
  createdAt: string;
  updatedAt: string;
  property: Property;
  vendor: Vendor | null;
  approvalHistory: ApprovalHistory[];
}

export default function TurnDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [turn, setTurn] = useState<Turn | null>(null);
  const [loading, setLoading] = useState(true);
  const [approvalComment, setApprovalComment] = useState("");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");

  useEffect(() => {
    if (params.id) {
      fetchTurnDetails();
      fetchVendors();
    }
  }, [params.id]);

  const fetchTurnDetails = async () => {
    try {
      const response = await fetch(`/api/turns/${params.id}`);
      if (!response.ok) throw new Error("Failed to fetch turn details");
      const data = await response.json();
      setTurn(data);
      setSelectedVendorId(data.assignedVendorId || "");
    } catch (error) {
      console.error("Error fetching turn:", error);
      toast.error("Failed to load turn details");
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await fetch("/api/vendors");
      if (!response.ok) throw new Error("Failed to fetch vendors");
      const data = await response.json();
      setVendors(data);
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  };

  const handleApproval = async (status: "APPROVED" | "REJECTED") => {
    try {
      const response = await fetch(`/api/approvals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          turnId: turn?.id,
          status,
          comments: approvalComment,
        }),
      });

      if (!response.ok) throw new Error("Failed to submit approval");
      
      toast.success(`Turn ${status.toLowerCase()} successfully`);
      await fetchTurnDetails();
      setApprovalComment("");
    } catch (error) {
      console.error("Error submitting approval:", error);
      toast.error("Failed to submit approval");
    }
  };

  const handleVendorAssignment = async () => {
    if (!selectedVendorId) {
      toast.error("Please select a vendor");
      return;
    }

    try {
      const response = await fetch(`/api/turns/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedVendorId: selectedVendorId,
        }),
      });

      if (!response.ok) throw new Error("Failed to assign vendor");
      
      toast.success("Vendor assigned successfully");
      await fetchTurnDetails();
    } catch (error) {
      console.error("Error assigning vendor:", error);
      toast.error("Failed to assign vendor");
    }
  };

  const canApprove = () => {
    if (!session?.user || !turn) return false;
    const userRole = session.user.role;
    
    // Check if user has approval permissions
    return (
      turn.requiresApproval &&
      turn.approvalStatus === "PENDING" &&
      (userRole === "DFO_APPROVER" || userRole === "HO_APPROVER" || userRole === "ADMIN" || userRole === "SUPER_ADMIN")
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="h-4 w-4" />;
      case "IN_PROGRESS":
        return <Clock className="h-4 w-4" />;
      case "ON_HOLD":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-500";
      case "IN_PROGRESS":
        return "bg-blue-500";
      case "ON_HOLD":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "destructive";
      case "HIGH":
        return "bg-orange-500";
      case "MEDIUM":
        return "bg-yellow-500";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!turn) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Turn not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">Turn Details</h1>
          <Button variant="outline" onClick={() => router.push("/turns")}>
            Back to Turns
          </Button>
        </div>
        <p className="text-muted-foreground">
          Work Order: {turn.workOrderNumber || "N/A"}
        </p>
      </div>

      {/* Status and Priority Badges */}
      <div className="flex gap-2 mb-6">
        <Badge className={getStatusColor(turn.status)}>
          {getStatusIcon(turn.status)}
          <span className="ml-1">{turn.status}</span>
        </Badge>
        <Badge variant={getPriorityColor(turn.priority) as any}>
          {turn.priority} Priority
        </Badge>
        {turn.requiresApproval && (
          <Badge variant={turn.approvalStatus === "APPROVED" ? "default" : turn.approvalStatus === "REJECTED" ? "destructive" : "secondary"}>
            Approval: {turn.approvalStatus || "PENDING"}
          </Badge>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content - 2 columns */}
        <div className="md:col-span-2 space-y-6">
          {/* Property Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Property Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Property Name</p>
                  <p className="text-base">{turn.property.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Address</p>
                  <p className="text-base flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {turn.property.address}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {turn.property.city}, {turn.property.state} {turn.property.zipCode}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Turn Details Tabs */}
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="vendor">Vendor</TabsTrigger>
              <TabsTrigger value="approvals">Approvals</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>Turn Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Stage</p>
                      <p className="text-base">{turn.stage}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Estimated Cost</p>
                      <p className="text-base flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        {turn.estimatedCost.toLocaleString()}
                      </p>
                    </div>
                    {turn.actualCost && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Actual Cost</p>
                        <p className="text-base flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          {turn.actualCost.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {turn.startDate && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                        <p className="text-base flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(turn.startDate), "MMM dd, yyyy")}
                        </p>
                      </div>
                    )}
                    {turn.endDate && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Target End Date</p>
                        <p className="text-base flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(turn.endDate), "MMM dd, yyyy")}
                        </p>
                      </div>
                    )}
                    {turn.completionDate && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Completion Date</p>
                        <p className="text-base flex items-center gap-1">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          {format(new Date(turn.completionDate), "MMM dd, yyyy")}
                        </p>
                      </div>
                    )}
                  </div>

                  {turn.notes && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Notes</p>
                      <div className="p-3 bg-muted rounded-md">
                        <p className="text-sm">{turn.notes}</p>
                      </div>
                    </div>
                  )}

                  {turn.inspectionNotes && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Inspection Notes</p>
                      <div className="p-3 bg-muted rounded-md">
                        <p className="text-sm">{turn.inspectionNotes}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="vendor">
              <Card>
                <CardHeader>
                  <CardTitle>Vendor Assignment</CardTitle>
                  <CardDescription>
                    Assign or update the vendor for this turn
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {turn.vendor ? (
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium">{turn.vendor.name}</p>
                          <Badge variant="secondary">
                            Rating: {turn.vendor.rating}/5
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{turn.vendor.email}</p>
                        <p className="text-sm text-muted-foreground">{turn.vendor.phone}</p>
                        {turn.vendor.specialties.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {turn.vendor.specialties.map((specialty, idx) => (
                              <Badge key={idx} variant="outline">
                                {specialty}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No vendor assigned</p>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Change Vendor</label>
                    <div className="flex gap-2">
                      <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a vendor" />
                        </SelectTrigger>
                        <SelectContent>
                          {vendors.map((vendor) => (
                            <SelectItem key={vendor.id} value={vendor.id}>
                              {vendor.name} - Rating: {vendor.rating}/5
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={handleVendorAssignment}>
                        Assign
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="approvals">
              <Card>
                <CardHeader>
                  <CardTitle>Approval History</CardTitle>
                  <CardDescription>
                    Track approval decisions and comments
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {turn.approvalHistory.length > 0 ? (
                    <div className="space-y-4">
                      {turn.approvalHistory.map((approval) => (
                        <div key={approval.id} className="border-l-2 border-muted pl-4 pb-4">
                          <div className="flex items-center gap-2 mb-1">
                            {approval.status === "APPROVED" ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : approval.status === "REJECTED" ? (
                              <XCircle className="h-4 w-4 text-red-500" />
                            ) : (
                              <Clock className="h-4 w-4 text-yellow-500" />
                            )}
                            <span className="font-medium">{approval.status}</span>
                            <span className="text-sm text-muted-foreground">
                              by {approval.approver.name} ({approval.approver.role})
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(approval.approvedAt), "MMM dd, yyyy 'at' h:mm a")}
                          </p>
                          {approval.comments && (
                            <p className="text-sm mt-2 p-2 bg-muted rounded">
                              {approval.comments}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No approval history</p>
                  )}

                  {canApprove() && (
                    <div className="space-y-4 pt-4 border-t">
                      <div>
                        <label className="text-sm font-medium">Approval Comments</label>
                        <Textarea
                          value={approvalComment}
                          onChange={(e) => setApprovalComment(e.target.value)}
                          placeholder="Add comments for your approval decision..."
                          className="mt-1"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleApproval("APPROVED")}
                          className="flex-1"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleApproval("REJECTED")}
                          variant="destructive"
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push(`/turns/${turn.id}/edit`)}
              >
                <FileText className="h-4 w-4 mr-2" />
                Edit Turn
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push(`/properties/${turn.propertyId}`)}
              >
                <Home className="h-4 w-4 mr-2" />
                View Property
              </Button>
              {turn.vendor && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push(`/vendors/${turn.vendor?.id}`)}
                >
                  <User className="h-4 w-4 mr-2" />
                  View Vendor
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(turn.createdAt), "MMM dd, yyyy")}
                    </p>
                  </div>
                </div>
                {turn.startDate && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Started</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(turn.startDate), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </div>
                )}
                {turn.completionDate && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Completed</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(turn.completionDate), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Last Updated</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(turn.updatedAt), "MMM dd, yyyy")}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}