"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { UtilityBillForm } from "@/components/utilities/utility-bill-form";
import { UtilityBillCard } from "@/components/utilities/utility-bill-card";
import { PaymentDialog } from "@/components/utilities/payment-dialog";
import {
  IconSearch,
  IconPlus,
  IconLayoutGrid,
  IconList,
  IconLoader2,
  IconFilter,
  IconBolt,
  IconFlame,
  IconDroplet,
  IconTrash,
  IconWifi,
  IconDeviceTv,
  IconCurrencyDollar,
  IconAlertTriangle,
  IconCheck,
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
import { 
  UtilityBill, 
  UtilityProvider, 
  CreateUtilityBillData, 
  UtilityBillsResponse, 
  UtilityStats,
  UtilityType,
  UtilityBillStatus,
  UpdateUtilityBillData 
} from "@/types/utility";
import { Property } from "@/lib/api/properties";
import { toast } from "sonner";

// Fetch functions
const fetchUtilityBills = async (params?: Record<string, string>): Promise<UtilityBillsResponse> => {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.append(key, value);
    });
  }
  searchParams.append('includeStats', 'true');
  
  const response = await fetch(`/api/utilities?${searchParams}`);
  if (!response.ok) throw new Error('Failed to fetch utility bills');
  return response.json();
};

const fetchProperties = async (): Promise<Property[]> => {
  const response = await fetch('/api/properties');
  if (!response.ok) throw new Error('Failed to fetch properties');
  return response.json();
};

const fetchProviders = async (): Promise<{ providers: UtilityProvider[] }> => {
  const response = await fetch('/api/utilities/providers');
  if (!response.ok) throw new Error('Failed to fetch providers');
  return response.json();
};

const createUtilityBill = async (data: CreateUtilityBillData): Promise<UtilityBill> => {
  const response = await fetch('/api/utilities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create utility bill');
  return response.json();
};

const updateUtilityBill = async ({ id, data }: { id: string; data: UpdateUtilityBillData }): Promise<UtilityBill> => {
  const response = await fetch(`/api/utilities/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update utility bill');
  return response.json();
};

const deleteUtilityBill = async (id: string): Promise<void> => {
  const response = await fetch(`/api/utilities/${id}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to delete utility bill');
};

export default function UtilitiesPage() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [utilityTypeFilter, setUtilityTypeFilter] = useState("all");
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  
  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<UtilityBill | null>(null);
  const [paymentBill, setPaymentBill] = useState<UtilityBill | null>(null);

  // Build query parameters for filtering
  const queryParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (propertyFilter !== "all") params.propertyId = propertyFilter;
    if (statusFilter !== "all") params.status = statusFilter;
    if (utilityTypeFilter !== "all") params.utilityType = utilityTypeFilter;
    if (showOverdueOnly) params.overdue = 'true';
    return params;
  }, [propertyFilter, statusFilter, utilityTypeFilter, showOverdueOnly]);

  // Fetch data using React Query
  const { data: billsData, isLoading: billsLoading, error: billsError } = useQuery({
    queryKey: ['utility-bills', queryParams],
    queryFn: () => fetchUtilityBills(queryParams),
  });

  const { data: properties = [] } = useQuery({
    queryKey: ['properties'],
    queryFn: fetchProperties,
  });

  const { data: providersData } = useQuery({
    queryKey: ['utility-providers'],
    queryFn: fetchProviders,
  });

  const bills = billsData?.bills || [];
  const stats = billsData?.stats;
  const providers = providersData?.providers || [];

  // Filter bills by search term
  const filteredBills = useMemo(() => {
    if (!searchTerm.trim()) return bills;
    
    const term = searchTerm.toLowerCase();
    return bills.filter((bill) => 
      bill.property?.name.toLowerCase().includes(term) ||
      bill.property?.address.toLowerCase().includes(term) ||
      bill.provider?.name.toLowerCase().includes(term) ||
      bill.utilityType.toLowerCase().includes(term) ||
      bill.accountNumber?.toLowerCase().includes(term)
    );
  }, [bills, searchTerm]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: createUtilityBill,
    onSuccess: () => {
      toast.success("Utility bill created successfully");
      queryClient.invalidateQueries({ queryKey: ['utility-bills'] });
      setIsFormOpen(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create utility bill");
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateUtilityBill,
    onSuccess: () => {
      toast.success("Utility bill updated successfully");
      queryClient.invalidateQueries({ queryKey: ['utility-bills'] });
      setEditingBill(null);
      setIsFormOpen(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update utility bill");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUtilityBill,
    onSuccess: () => {
      toast.success("Utility bill deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['utility-bills'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete utility bill");
    },
  });

  const paymentMutation = useMutation({
    mutationFn: updateUtilityBill,
    onSuccess: () => {
      toast.success("Payment recorded successfully");
      queryClient.invalidateQueries({ queryKey: ['utility-bills'] });
      setPaymentBill(null);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to record payment");
    },
  });

  // Handlers
  const handleCreate = (data: CreateUtilityBillData) => {
    createMutation.mutate(data);
  };

  const handleEdit = (bill: UtilityBill) => {
    setEditingBill(bill);
    setIsFormOpen(true);
  };

  const handleUpdate = (data: CreateUtilityBillData) => {
    if (editingBill) {
      updateMutation.mutate({ 
        id: editingBill.id, 
        data: data as UpdateUtilityBillData 
      });
    }
  };

  const handleDelete = async (bill: UtilityBill) => {
    if (!confirm("Are you sure you want to delete this utility bill?")) return;
    deleteMutation.mutate(bill.id);
  };

  const handleMarkAsPaid = (bill: UtilityBill) => {
    setPaymentBill(bill);
  };

  const handlePayment = (data: any) => {
    if (paymentBill) {
      const totalPaid = parseFloat(paymentBill.amountPaid.toString()) + data.amountPaid;
      paymentMutation.mutate({
        id: paymentBill.id,
        data: {
          amountPaid: totalPaid,
          paidDate: data.paidDate,
          status: data.status,
          paymentConfirmation: data.paymentConfirmation,
          notes: data.notes ? `${paymentBill.notes || ''}\n\nPayment: ${data.notes}`.trim() : paymentBill.notes || undefined,
        }
      });
    }
  };

  const getUtilityIcon = (type: UtilityType) => {
    switch (type) {
      case 'power': return <IconBolt className="h-5 w-5" />;
      case 'gas': return <IconFlame className="h-5 w-5" />;
      case 'water': return <IconDroplet className="h-5 w-5" />;
      case 'sewer': return <IconDroplet className="h-5 w-5" />;
      case 'trash': return <IconTrash className="h-5 w-5" />;
      case 'internet': return <IconWifi className="h-5 w-5" />;
      case 'cable': return <IconDeviceTv className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: UtilityBillStatus) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'unpaid': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'disputed': return 'bg-purple-100 text-purple-800';
      case 'partial': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (billsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (billsError) {
    return (
      <DashboardLayout>
        <div className="text-center text-red-600 p-8">
          Error: {billsError instanceof Error ? billsError.message : "An error occurred"}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Utilities</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage utility bills and payments
            </p>
          </div>
          <Button 
            className="flex items-center gap-2 w-full sm:w-auto"
            onClick={() => {
              setEditingBill(null);
              setIsFormOpen(true);
            }}
          >
            <IconPlus className="h-4 w-4" />
            Add Utility Bill
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bills</CardTitle>
                <IconCurrencyDollar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalBills}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unpaid</CardTitle>
                <IconAlertTriangle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.unpaidBills}</div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(stats.totalUnpaidAmount)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                <IconAlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.overdueBills}</div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(stats.totalOverdueAmount)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Paid</CardTitle>
                <IconCheck className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalBills - stats.unpaidBills}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Monthly</CardTitle>
                <IconCurrencyDollar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.avgMonthlyUtilityCost)}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and View Toggle */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4">
              <div className="flex-1">
                <div className="relative">
                  <IconSearch className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by property, provider, account number..."
                    className="pl-9 pr-12"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      className="absolute right-2 top-2.5 text-xs text-muted-foreground hover:text-foreground px-2 py-0.5 hover:bg-accent rounded"
                      onClick={() => setSearchTerm("")}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <Select value={propertyFilter} onValueChange={setPropertyFilter}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="All Properties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Properties</SelectItem>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={utilityTypeFilter} onValueChange={setUtilityTypeFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="power">Electricity</SelectItem>
                    <SelectItem value="gas">Gas</SelectItem>
                    <SelectItem value="water">Water</SelectItem>
                    <SelectItem value="sewer">Sewer</SelectItem>
                    <SelectItem value="trash">Trash</SelectItem>
                    <SelectItem value="internet">Internet</SelectItem>
                    <SelectItem value="cable">Cable</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="disputed">Disputed</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-2 sm:ml-auto">
                  <Button
                    variant={showOverdueOnly ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowOverdueOnly(!showOverdueOnly)}
                  >
                    <IconFilter className="h-4 w-4 mr-2" />
                    Overdue Only
                  </Button>
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
            </div>
          </CardContent>
        </Card>

        {/* Bills Display */}
        {viewMode === "grid" ? (
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBills.map((bill) => (
              <UtilityBillCard
                key={bill.id}
                bill={bill}
                onView={() => {/* Could open a detail modal */}}
                onEdit={() => handleEdit(bill)}
                onDelete={() => handleDelete(bill)}
                onMarkAsPaid={() => handleMarkAsPaid(bill)}
              />
            ))}
          </div>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utility</TableHead>
                    <TableHead className="hidden sm:table-cell">Property</TableHead>
                    <TableHead className="hidden md:table-cell">Provider</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBills.map((bill) => {
                    const isOverdue = bill.status === 'unpaid' && bill.dueDate < Date.now();
                    return (
                      <TableRow key={bill.id} className={isOverdue ? 'bg-red-50' : ''}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {getUtilityIcon(bill.utilityType)}
                            <span className="capitalize">
                              {bill.utilityType === 'power' ? 'Electricity' : bill.utilityType}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div>
                            <div className="font-medium">{bill.property?.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {bill.property?.address}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {bill.provider?.name || 'No Provider'}
                        </TableCell>
                        <TableCell>
                          <div className={isOverdue ? 'text-red-600 font-medium' : ''}>
                            {formatDate(bill.dueDate)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {formatCurrency(parseFloat(bill.totalAmount.toString()))}
                          </div>
                          {parseFloat(bill.amountPaid.toString()) > 0 && (
                            <div className="text-xs text-green-600">
                              {formatCurrency(parseFloat(bill.amountPaid.toString()))} paid
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(bill.status)}>
                            {bill.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <IconFilter className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleEdit(bill)}>
                                Edit
                              </DropdownMenuItem>
                              {bill.status === 'unpaid' && (
                                <DropdownMenuItem onClick={() => handleMarkAsPaid(bill)}>
                                  Mark as Paid
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleDelete(bill)}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}

        {/* No bills message */}
        {filteredBills.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <IconCurrencyDollar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No utility bills found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || propertyFilter !== "all" || statusFilter !== "all" || utilityTypeFilter !== "all"
                  ? "Try adjusting your search criteria or filters."
                  : "Get started by adding your first utility bill."
                }
              </p>
              {!(searchTerm || propertyFilter !== "all" || statusFilter !== "all" || utilityTypeFilter !== "all") && (
                <Button onClick={() => setIsFormOpen(true)}>
                  <IconPlus className="h-4 w-4 mr-2" />
                  Add First Bill
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Dialogs */}
        <UtilityBillForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={editingBill ? handleUpdate : handleCreate}
          initialData={editingBill || undefined}
          properties={properties}
          providers={providers}
          isEditing={!!editingBill}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />

        <PaymentDialog
          open={!!paymentBill}
          onOpenChange={(open) => !open && setPaymentBill(null)}
          onSubmit={handlePayment}
          bill={paymentBill}
          isLoading={paymentMutation.isPending}
        />
      </div>
    </DashboardLayout>
  );
}