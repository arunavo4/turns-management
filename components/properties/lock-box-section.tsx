"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  IconLock,
  IconEdit,
  IconHistory,
  IconMapPin,
  IconCalendar,
  IconFileText,
  IconEye,
  IconEyeOff,
  IconCopy,
  IconCheck,
} from "@tabler/icons-react";
import { LockBoxDialog } from "./lock-box-dialog";
import { LockBoxHistoryViewer } from "./lock-box-history";
import { cn } from "@/lib/utils";

interface Property {
  id: string;
  name: string;
  primaryLockBoxCode?: string;
  lockBoxLocation?: string;
  lockBoxInstallDate?: number;
  lockBoxNotes?: string;
}

interface LockBoxSectionProps {
  property: Property;
  className?: string;
}

export function LockBoxSection({ property, className }: LockBoxSectionProps) {
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [codeVisible, setCodeVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const hasLockBox = !!property.primaryLockBoxCode;

  const handleCopyCode = async () => {
    if (property.primaryLockBoxCode) {
      try {
        await navigator.clipboard.writeText(property.primaryLockBoxCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy code:', err);
      }
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
    <div className={cn("space-y-6", className)}>
      {/* Main Lock Box Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <IconLock className="h-5 w-5" />
              Lock Box Information
              {hasLockBox && (
                <Badge variant="default" className="bg-green-600">
                  Active
                </Badge>
              )}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
              >
                <IconHistory className="h-4 w-4 mr-2" />
                {showHistory ? 'Hide History' : 'View History'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUpdateDialog(true)}
              >
                <IconEdit className="h-4 w-4 mr-2" />
                Update
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {hasLockBox ? (
            <div className="space-y-4">
              {/* Lock Box Code */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Lock Box Code</label>
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="text-xs">
                      {property.primaryLockBoxCode!.length} characters
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={handleCopyCode}
                    >
                      {copied ? (
                        <IconCheck className="h-3 w-3 text-green-600" />
                      ) : (
                        <IconCopy className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setCodeVisible(!codeVisible)}
                    >
                      {codeVisible ? (
                        <IconEyeOff className="h-3 w-3" />
                      ) : (
                        <IconEye className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg font-mono text-lg tracking-wider">
                  {codeVisible 
                    ? property.primaryLockBoxCode
                    : '•'.repeat(property.primaryLockBoxCode!.length)
                  }
                </div>
                {!codeVisible && (
                  <p className="text-xs text-muted-foreground">
                    Click the eye icon to reveal the code
                  </p>
                )}
              </div>

              <Separator />

              {/* Additional Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <IconMapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Location</span>
                  </div>
                  <p className="text-sm pl-6">
                    {getLocationDisplay(property.lockBoxLocation)}
                  </p>
                </div>

                {property.lockBoxInstallDate && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <IconCalendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Install Date</span>
                    </div>
                    <p className="text-sm pl-6">
                      {new Date(property.lockBoxInstallDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {property.lockBoxNotes && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <IconFileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Notes</span>
                    </div>
                    <p className="text-sm pl-6 whitespace-pre-wrap">
                      {property.lockBoxNotes}
                    </p>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <IconLock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No lock box information</p>
              <p className="text-sm">Click "Update" to add lock box details</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* History Section */}
      {showHistory && (
        <LockBoxHistoryViewer
          propertyId={property.id}
          limit={5}
          className="border-l-4 border-l-blue-500"
        />
      )}

      {/* Update Dialog */}
      <LockBoxDialog
        property={property}
        open={showUpdateDialog}
        onOpenChange={setShowUpdateDialog}
      />
    </div>
  );
}