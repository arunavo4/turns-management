"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  IconHistory,
  IconUser,
  IconCalendar,
  IconEdit,
  IconPlus,
  IconTrash,
  IconEye,
  IconDownload,
  IconCheck,
  IconX,
  IconUserCheck,
  IconRefresh,
  IconLoader2,
} from "@tabler/icons-react";
import { formatDistanceToNow } from "date-fns";

interface AuditLog {
  id: string;
  tableName: string;
  recordId: string;
  action: string;
  userId: string;
  userEmail: string;
  userRole: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  changedFields?: string[];
  context?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

interface AuditLogViewerProps {
  propertyId: string;
  limit?: number;
}

export default function AuditLogViewer({ propertyId, limit = 50 }: AuditLogViewerProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAuditLogs();
  }, [propertyId]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/audit-logs?propertyId=${propertyId}&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch audit logs");
      }
      
      const data = await response.json();
      setLogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "CREATE":
        return <IconPlus className="h-4 w-4" />;
      case "UPDATE":
        return <IconEdit className="h-4 w-4" />;
      case "DELETE":
        return <IconTrash className="h-4 w-4" />;
      case "VIEW":
        return <IconEye className="h-4 w-4" />;
      case "EXPORT":
        return <IconDownload className="h-4 w-4" />;
      case "APPROVE":
        return <IconCheck className="h-4 w-4" />;
      case "REJECT":
        return <IconX className="h-4 w-4" />;
      case "ASSIGN":
        return <IconUserCheck className="h-4 w-4" />;
      default:
        return <IconHistory className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "CREATE":
        return "bg-green-100 text-green-800 border-green-200";
      case "UPDATE":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "DELETE":
        return "bg-red-100 text-red-800 border-red-200";
      case "VIEW":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "APPROVE":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "REJECT":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-purple-100 text-purple-800 border-purple-200";
    }
  };

  const formatChangedFields = (changedFields?: string[]) => {
    if (!changedFields || changedFields.length === 0) return null;
    
    return (
      <div className="mt-2">
        <span className="text-xs font-medium text-muted-foreground">Changed fields:</span>
        <div className="flex flex-wrap gap-1 mt-1">
          {changedFields.map((field) => (
            <Badge key={field} variant="outline" className="text-xs">
              {field.replace(/_/g, " ")}
            </Badge>
          ))}
        </div>
      </div>
    );
  };

  const formatValueChange = (field: string, oldValue: unknown, newValue: unknown) => {
    if (oldValue === newValue) return null;

    const formatValue = (value: unknown) => {
      if (value === null || value === undefined) return "—";
      if (typeof value === "boolean") return value ? "Yes" : "No";
      if (typeof value === "object") return JSON.stringify(value);
      return String(value);
    };

    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="font-medium">{field.replace(/_/g, " ")}:</span>
        <span className="text-muted-foreground line-through">{formatValue(oldValue)}</span>
        <span className="text-muted-foreground">→</span>
        <span className="text-foreground">{formatValue(newValue)}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconHistory className="h-5 w-5" />
            Audit Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconHistory className="h-5 w-5" />
            Audit Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-600 py-4">
            Error: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <IconHistory className="h-5 w-5" />
            Audit Log
          </CardTitle>
          <button
            onClick={fetchAuditLogs}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            title="Refresh"
          >
            <IconRefresh className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          {logs.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No audit logs available
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log, index) => (
                <div key={log.id}>
                  <div className="flex items-start gap-3 py-3">
                    <div className={`p-2 rounded-lg border ${getActionColor(log.action)}`}>
                      {getActionIcon(log.action)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">
                          {log.userEmail}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {log.userRole?.replace(/_/g, " ")}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      
                      <div className="text-sm">
                        <span className="font-medium">{log.action}</span>
                        {log.context && (
                          <span className="text-muted-foreground ml-2">
                            • {log.context}
                          </span>
                        )}
                      </div>

                      {log.changedFields && log.changedFields.length > 0 && (
                        <div className="mt-2 p-2 bg-muted/30 rounded-md space-y-1">
                          {log.changedFields.map((field) => (
                            <div key={field}>
                              {formatValueChange(
                                field,
                                log.oldValues?.[field],
                                log.newValues?.[field]
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {log.metadata && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          <details>
                            <summary className="cursor-pointer hover:text-foreground">
                              Additional details
                            </summary>
                            <pre className="mt-2 p-2 bg-muted/30 rounded-md overflow-x-auto">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}

                      {log.ipAddress && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          IP: {log.ipAddress}
                        </div>
                      )}
                    </div>
                  </div>
                  {index < logs.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}