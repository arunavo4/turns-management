"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  IconLock,
  IconSearch,
  IconLoader2,
  IconMapPin,
  IconCalendar,
  IconUser,
  IconEye,
  IconDownload,
  IconRefresh,
  IconShield,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { LockBoxListItem } from "@/types/lockbox";
import { useDebounce } from "@/hooks/use-debounce";

interface LockBoxHistoryItem {
  id: string;
  propertyId: string;
  propertyName: string;
  address: string;
  changeDate: number;
  changedByUser?: {
    authUserId: string;
    role: string;
  };
  reason?: string;
}

export default function LockBoxManagementPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [onlyWithLockBox, setOnlyWithLockBox] = useState(true);
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Fetch properties with lock box information
  const {
    data: propertiesData,
    isLoading: propertiesLoading,
    refetch: refetchProperties,
    isRefetching: propertiesRefetching,
  } = useQuery({
    queryKey: ['lockbox-properties', debouncedSearch, onlyWithLockBox],
    queryFn: async () => {
      const params = new URLSearchParams({
        search: debouncedSearch,
        withLockBox: onlyWithLockBox.toString(),
        limit: '50',
      });
      
      const response = await fetch(`/api/lockbox/properties?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }
      return response.json();
    },
  });

  // Fetch recent lock box changes
  const {
    data: historyData,
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ['lockbox-recent-history'],
    queryFn: async () => {
      const response = await fetch('/api/lockbox/history?limit=10');
      if (!response.ok) {
        throw new Error('Failed to fetch lock box history');
      }
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleExport = async () => {
    try {
      const response = await fetch('/api/lockbox/properties?limit=1000');
      if (!response.ok) throw new Error('Export failed');
      
      const data = await response.json();
      const csv = [
        ['Property Name', 'Address', 'Location', 'Install Date', 'Last Changed', 'Changed By'].join(','),
        ...data.properties.map((p: LockBoxListItem) => [
          `"${p.propertyName}"`,
          `"${p.address}"`,
          p.location || 'N/A',
          p.installDate ? new Date(p.installDate).toLocaleDateString() : 'N/A',
          p.lastChanged ? new Date(p.lastChanged).toLocaleDateString() : 'N/A',
          p.lastChangedBy || 'N/A'
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lockbox-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      
      toast.success('Report exported successfully');
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  const getLocationDisplay = (location?: string) => {
    const locationMap: Record<string, string> = {
      front: 'Front Door',
      back: 'Back Door',
      left: 'Left Side',
      right: 'Right Side',
      other: 'Other',
    };
    return location ? locationMap[location] || location : 'Not specified';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-2">
              <IconShield className="h-8 w-8" />
              Lock Box Management
            </h1>
            <p className="text-muted-foreground">
              Manage and audit lock box information across all properties
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                refetchProperties();
                refetchHistory();
              }}
              disabled={propertiesRefetching}
            >
              <IconRefresh className={`h-4 w-4 mr-2 ${propertiesRefetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <IconDownload className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by property name, address, or lock box code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant={onlyWithLockBox ? "default" : "outline"}
                onClick={() => setOnlyWithLockBox(!onlyWithLockBox)}
                className="whitespace-nowrap"
              >
                <IconLock className="h-4 w-4 mr-2" />
                {onlyWithLockBox ? "Show All Properties" : "Only With Lock Box"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Properties List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconLock className="h-5 w-5" />
                  Properties
                  {propertiesData && (
                    <Badge variant="secondary">
                      {propertiesData.total} total
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {propertiesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : propertiesData?.properties?.length > 0 ? (
                  <div className="space-y-4">
                    {propertiesData.properties.map((property: LockBoxListItem) => (
                      <div
                        key={property.propertyId}
                        className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h3 className="font-medium">{property.propertyName}</h3>
                            <p className="text-sm text-muted-foreground">{property.address}</p>
                            
                            <div className="flex items-center gap-4 text-xs">
                              {property.location && (
                                <div className="flex items-center gap-1">
                                  <IconMapPin className="h-3 w-3" />
                                  <span>{getLocationDisplay(property.location)}</span>
                                </div>
                              )}
                              {property.installDate && (
                                <div className="flex items-center gap-1">
                                  <IconCalendar className="h-3 w-3" />
                                  <span>Installed: {new Date(property.installDate).toLocaleDateString()}</span>
                                </div>
                              )}
                              {property.lastChanged && (
                                <div className="flex items-center gap-1">
                                  <IconUser className="h-3 w-3" />
                                  <span>Changed: {new Date(property.lastChanged).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {property.currentCode ? (
                              <Badge variant="default" className="bg-green-600">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                No Code
                              </Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => router.push(`/properties/${property.propertyId}`)}
                            >
                              <IconEye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <IconLock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No properties found</p>
                    <p className="text-sm">Try adjusting your search criteria</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Changes */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconCalendar className="h-5 w-5" />
                  Recent Changes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <IconLoader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : historyData?.history?.length > 0 ? (
                  <div className="space-y-3">
                    {historyData.history.slice(0, 8).map((change: LockBoxHistoryItem, index: number) => (
                      <div key={change.id}>
                        <div className="space-y-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-sm">{change.propertyName}</p>
                              <p className="text-xs text-muted-foreground">{change.address}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => router.push(`/properties/${change.propertyId}`)}
                            >
                              <IconEye className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <div className="text-xs text-muted-foreground">
                            <div>
                              {new Date(change.changeDate).toLocaleDateString()} at{' '}
                              {new Date(change.changeDate).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                            {change.changedByUser && (
                              <div>by {change.changedByUser.authUserId}</div>
                            )}
                            {change.reason && (
                              <div className="mt-1 text-xs">"{change.reason}"</div>
                            )}
                          </div>
                        </div>
                        
                        {index < historyData.history.slice(0, 8).length - 1 && (
                          <Separator className="mt-3" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <p className="text-sm">No recent changes</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}