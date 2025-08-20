"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  IconHistory,
  IconSearch,
  IconFilter,
  IconDownload,
  IconRefresh,
  IconLoader2,
  IconEdit,
  IconPlus,
  IconTrash,
  IconEye,
  IconCheck,
  IconX,
  IconUserCheck,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import { formatDistanceToNow, format } from "date-fns";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";

interface AuditLog {
  id: string;
  tableName: string;
  recordId: string;
  action: string;
  userId: string;
  userEmail: string;
  userRole: string;
  oldValues?: any;
  newValues?: any;
  changedFields?: string[];
  context?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
  propertyId?: string;
  turnId?: string;
  vendorId?: string;
  createdAt: string;
}

export default function AuditLogsPage() {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTable, setFilterTable] = useState("all");
  const [filterAction, setFilterAction] = useState("all");
  const [filterUser, setFilterUser] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const logsPerPage = 50;

  useEffect(() => {
    fetchAuditLogs();
  }, [currentPage, filterTable, filterAction, filterUser]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("limit", logsPerPage.toString());
      params.append("offset", ((currentPage - 1) * logsPerPage).toString());
      
      if (filterTable !== "all") params.append("tableName", filterTable);
      if (filterUser !== "all") params.append("userId", filterUser);

      const response = await fetch(`/api/audit-logs?${params}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch audit logs");
      }
      
      const data = await response.json();
      setLogs(data);
      
      // Simple pagination calculation (would need backend support for total count)
      setTotalPages(data.length === logsPerPage ? currentPage + 1 : currentPage);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to fetch audit logs");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ["Date", "User", "Role", "Action", "Table", "Record ID", "Changes", "IP Address"];
    const csvContent = [
      headers.join(","),
      ...logs.map(log => [
        format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss"),
        log.userEmail,
        log.userRole,
        log.action,
        log.tableName,
        log.recordId,
        log.changedFields?.join("; ") || "",
        log.ipAddress || "",
      ].map(field => `"${field}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `audit-logs-${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Audit logs exported successfully");
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "CREATE": return <IconPlus className="h-4 w-4" />;
      case "UPDATE": return <IconEdit className="h-4 w-4" />;
      case "DELETE": return <IconTrash className="h-4 w-4" />;
      case "VIEW": return <IconEye className="h-4 w-4" />;
      case "APPROVE": return <IconCheck className="h-4 w-4" />;
      case "REJECT": return <IconX className="h-4 w-4" />;
      case "ASSIGN": return <IconUserCheck className="h-4 w-4" />;
      default: return <IconHistory className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "CREATE": return "bg-green-100 text-green-800";
      case "UPDATE": return "bg-blue-100 text-blue-800";
      case "DELETE": return "bg-red-100 text-red-800";
      case "VIEW": return "bg-gray-100 text-gray-800";
      case "APPROVE": return "bg-emerald-100 text-emerald-800";
      case "REJECT": return "bg-orange-100 text-orange-800";
      default: return "bg-purple-100 text-purple-800";
    }
  };

  const getTableColor = (table: string) => {
    switch (table) {
      case "properties": return "bg-indigo-100 text-indigo-800";
      case "turns": return "bg-cyan-100 text-cyan-800";
      case "vendors": return "bg-amber-100 text-amber-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredLogs = logs.filter(log => {
    if (searchTerm && !log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !log.context?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !log.recordId.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filterAction !== "all" && log.action !== filterAction) return false;
    return true;
  });

  const isAdmin = session?.user?.role === "SUPER_ADMIN" || session?.user?.role === "ADMIN";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-2">
              <IconHistory className="h-8 w-8" />
              Audit Logs
            </h1>
            <p className="text-muted-foreground">
              {isAdmin ? "View all system activity and changes" : "View your activity history"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchAuditLogs} variant="outline" size="icon">
              <IconRefresh className="h-4 w-4" />
            </Button>
            <Button onClick={exportToCSV} variant="outline">
              <IconDownload className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconFilter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by user, context, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={filterTable} onValueChange={setFilterTable}>
                <SelectTrigger>
                  <SelectValue placeholder="All Tables" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tables</SelectItem>
                  <SelectItem value="properties">Properties</SelectItem>
                  <SelectItem value="turns">Turns</SelectItem>
                  <SelectItem value="vendors">Vendors</SelectItem>
                  <SelectItem value="users">Users</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger>
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="CREATE">Create</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                  <SelectItem value="VIEW">View</SelectItem>
                  <SelectItem value="APPROVE">Approve</SelectItem>
                  <SelectItem value="REJECT">Reject</SelectItem>
                  <SelectItem value="ASSIGN">Assign</SelectItem>
                </SelectContent>
              </Select>

              {isAdmin && (
                <Select value={filterUser} onValueChange={setFilterUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {/* Would populate with actual users */}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Audit Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No audit logs found
              </div>
            ) : (
              <>
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px]">Time</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Table</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead className="text-right">Changes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-sm">
                            <div>
                              <div>{format(new Date(log.createdAt), "MMM d, yyyy")}</div>
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(log.createdAt), "HH:mm:ss")}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{log.userEmail}</div>
                              <Badge variant="outline" className="text-xs mt-1">
                                {log.userRole?.replace(/_/g, " ")}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getActionColor(log.action)} gap-1`}>
                              {getActionIcon(log.action)}
                              {log.action}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getTableColor(log.tableName)}>
                              {log.tableName}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs">
                              {log.context && (
                                <p className="text-sm truncate">{log.context}</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                ID: {log.recordId.slice(0, 8)}...
                              </p>
                              {log.ipAddress && (
                                <p className="text-xs text-muted-foreground">
                                  IP: {log.ipAddress}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {log.changedFields && log.changedFields.length > 0 ? (
                              <div className="flex flex-wrap gap-1 justify-end">
                                {log.changedFields.slice(0, 3).map((field) => (
                                  <Badge key={field} variant="secondary" className="text-xs">
                                    {field.replace(/_/g, " ")}
                                  </Badge>
                                ))}
                                {log.changedFields.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{log.changedFields.length - 3}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * logsPerPage) + 1} to{" "}
                    {Math.min(currentPage * logsPerPage, filteredLogs.length)} entries
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <IconChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => p + 1)}
                      disabled={logs.length < logsPerPage}
                    >
                      Next
                      <IconChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}