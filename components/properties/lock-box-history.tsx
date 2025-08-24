"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { IconHistory, IconLoader2, IconRefresh, IconUser, IconCalendar, IconLock } from "@tabler/icons-react";
import { LockBoxHistory } from "@/types/lockbox";

interface LockBoxHistoryProps {
  propertyId: string;
  limit?: number;
  className?: string;
}

export function LockBoxHistoryViewer({ propertyId, limit = 10, className }: LockBoxHistoryProps) {
  const {
    data: history,
    isLoading,
    error,
    refetch,
    isRefetching
  } = useQuery<LockBoxHistory[]>({
    queryKey: ['lockbox-history', propertyId],
    queryFn: async () => {
      const response = await fetch(`/api/properties/${propertyId}/lockbox`);
      if (!response.ok) {
        throw new Error('Failed to fetch lock box history');
      }
      const data = await response.json();
      return limit ? data.slice(0, limit) : data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds for security monitoring
  });

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconHistory className="h-5 w-5" />
            Lock Box History
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
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconHistory className="h-5 w-5" />
            Lock Box History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">Failed to load lock box history</p>
            <Button variant="outline" onClick={() => refetch()}>
              <IconRefresh className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <IconHistory className="h-5 w-5" />
            Lock Box History
            {history && history.length > 0 && (
              <Badge variant="secondary">{history.length} entries</Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <IconRefresh className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!history || history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <IconLock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No lock box history found</p>
            <p className="text-sm">Changes will appear here when lock box information is updated</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((entry, index) => (
              <div key={entry.id}>
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <IconCalendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">
                          {new Date(entry.changeDate).toLocaleString()}
                        </span>
                        {entry.turnId && (
                          <Badge variant="outline" className="text-xs">
                            Turn Related
                          </Badge>
                        )}
                      </div>
                      
                      {entry.changedByUser && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <IconUser className="h-3 w-3" />
                          <span>Changed by: {entry.changedByUser.authUserId}</span>
                          <Badge variant="secondary" className="text-xs">
                            {entry.changedByUser.role}
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right">
                      {entry.oldLockBoxCode && entry.newLockBoxCode && (
                        <div className="text-sm">
                          <div className="text-muted-foreground">Code Changed</div>
                          <div className="font-mono">
                            {'•'.repeat(entry.oldLockBoxCode.length)} → {'•'.repeat(entry.newLockBoxCode.length)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {entry.lockBoxLocation && (
                    <div className="text-sm text-muted-foreground">
                      <strong>Location:</strong> {entry.lockBoxLocation}
                    </div>
                  )}

                  {entry.lockBoxInstallDate && (
                    <div className="text-sm text-muted-foreground">
                      <strong>Install Date:</strong> {new Date(entry.lockBoxInstallDate).toLocaleDateString()}
                    </div>
                  )}

                  {entry.reason && (
                    <div className="text-sm">
                      <strong>Reason:</strong> {entry.reason}
                    </div>
                  )}
                </div>
                
                {index < history.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}

            {limit && history.length === limit && (
              <div className="text-center pt-4">
                <Button variant="outline" size="sm">
                  View Full History
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}