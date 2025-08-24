"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { LockBoxCodeInput } from "./lock-box-code-input";
import { LOCK_BOX_LOCATIONS, LockBoxUpdateRequest } from "@/types/lockbox";
import { IconLock, IconLoader2, IconMapPin, IconCalendar } from "@tabler/icons-react";

interface Property {
  id: string;
  name: string;
  primaryLockBoxCode?: string;
  lockBoxLocation?: string;
  lockBoxInstallDate?: number;
  lockBoxNotes?: string;
}

interface LockBoxDialogProps {
  property: Property;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LockBoxDialog({ property, open, onOpenChange }: LockBoxDialogProps) {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<{
    newCode: string;
    location: string;
    installDate: string;
    notes: string;
    reason: string;
    confirmChange: boolean;
  }>({
    newCode: property.primaryLockBoxCode || "",
    location: property.lockBoxLocation || "",
    installDate: property.lockBoxInstallDate 
      ? new Date(property.lockBoxInstallDate).toISOString().split('T')[0] 
      : "",
    notes: property.lockBoxNotes || "",
    reason: "",
    confirmChange: false,
  });

  const updateMutation = useMutation({
    mutationFn: async (updateData: LockBoxUpdateRequest) => {
      const response = await fetch(`/api/properties/${property.id}/lockbox`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('Failed to update lock box information');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties', property.id] });
      queryClient.invalidateQueries({ queryKey: ['lockbox-history', property.id] });
      toast.success("Lock box information updated successfully");
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update lock box information");
    },
  });

  const resetForm = () => {
    setFormData({
      newCode: property.primaryLockBoxCode || "",
      location: property.lockBoxLocation || "",
      installDate: property.lockBoxInstallDate 
        ? new Date(property.lockBoxInstallDate).toISOString().split('T')[0] 
        : "",
      notes: property.lockBoxNotes || "",
      reason: "",
      confirmChange: false,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const hasChanges = 
      formData.newCode !== (property.primaryLockBoxCode || "") ||
      formData.location !== (property.lockBoxLocation || "") ||
      formData.installDate !== (property.lockBoxInstallDate 
        ? new Date(property.lockBoxInstallDate).toISOString().split('T')[0] 
        : "") ||
      formData.notes !== (property.lockBoxNotes || "");

    if (!hasChanges) {
      toast.info("No changes detected");
      return;
    }

    if (!formData.confirmChange) {
      toast.error("Please confirm that you want to make these changes");
      return;
    }

    if (!formData.reason.trim()) {
      toast.error("Please provide a reason for this change");
      return;
    }

    const updateData: LockBoxUpdateRequest = {
      reason: formData.reason,
    };

    if (formData.newCode !== (property.primaryLockBoxCode || "")) {
      updateData.newCode = formData.newCode;
    }

    if (formData.location !== (property.lockBoxLocation || "")) {
      updateData.location = formData.location as any;
    }

    if (formData.installDate && formData.installDate !== (property.lockBoxInstallDate 
      ? new Date(property.lockBoxInstallDate).toISOString().split('T')[0] 
      : "")) {
      updateData.installDate = new Date(formData.installDate).getTime();
    }

    if (formData.notes !== (property.lockBoxNotes || "")) {
      updateData.notes = formData.notes;
    }

    updateMutation.mutate(updateData);
  };

  const codeChanged = formData.newCode !== (property.primaryLockBoxCode || "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconLock className="h-5 w-5" />
            Update Lock Box Information
          </DialogTitle>
          <DialogDescription>
            Update lock box details for {property.name}. All changes are logged for security.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Information */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Current Information</Label>
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              {property.primaryLockBoxCode && (
                <div className="flex items-center gap-2 text-sm">
                  <IconLock className="h-4 w-4" />
                  <span>Code: {'•'.repeat(property.primaryLockBoxCode.length)} characters</span>
                </div>
              )}
              {property.lockBoxLocation && (
                <div className="flex items-center gap-2 text-sm">
                  <IconMapPin className="h-4 w-4" />
                  <span>Location: {property.lockBoxLocation}</span>
                </div>
              )}
              {property.lockBoxInstallDate && (
                <div className="flex items-center gap-2 text-sm">
                  <IconCalendar className="h-4 w-4" />
                  <span>Installed: {new Date(property.lockBoxInstallDate).toLocaleDateString()}</span>
                </div>
              )}
              {!property.primaryLockBoxCode && (
                <p className="text-sm text-muted-foreground">No lock box information on file</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Update Form */}
          <div className="space-y-4">
            <div>
              <LockBoxCodeInput
                label="Lock Box Code"
                value={formData.newCode}
                onChange={(value) => setFormData(prev => ({ ...prev, newCode: value }))}
                placeholder="Enter new lock box code"
              />
              {codeChanged && (
                <Badge variant="outline" className="mt-1 text-xs">
                  Code will be changed
                </Badge>
              )}
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Select
                value={formData.location}
                onValueChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {LOCK_BOX_LOCATIONS.map((loc) => (
                    <SelectItem key={loc.value} value={loc.value}>
                      {loc.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="installDate">Install Date</Label>
              <Input
                id="installDate"
                type="date"
                value={formData.installDate}
                onChange={(e) => setFormData(prev => ({ ...prev, installDate: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes about the lock box..."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="reason">Reason for Change *</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Please explain why this change is being made..."
                rows={2}
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="confirmChange"
                checked={formData.confirmChange}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmChange: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="confirmChange" className="text-sm">
                I confirm these changes and understand they will be logged for security
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateMutation.isPending || !formData.confirmChange || !formData.reason.trim()}
            >
              {updateMutation.isPending ? (
                <>
                  <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Lock Box"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}