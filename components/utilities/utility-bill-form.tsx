"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CreateUtilityBillData, UtilityType, UtilityBill, UtilityProvider } from "@/types/utility";
import { Property } from "@/lib/api/properties";

interface UtilityBillFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateUtilityBillData) => void;
  initialData?: Partial<UtilityBill>;
  properties: Property[];
  providers: UtilityProvider[];
  isEditing?: boolean;
  isLoading?: boolean;
}

export function UtilityBillForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  properties,
  providers,
  isEditing = false,
  isLoading = false,
}: UtilityBillFormProps) {
  const form = useForm<CreateUtilityBillData>({
    defaultValues: {
      propertyId: initialData?.propertyId || "",
      providerId: initialData?.providerId || "",
      utilityType: initialData?.utilityType || "power",
      billingStartDate: initialData?.billingStartDate 
        ? new Date(initialData.billingStartDate).toISOString().split('T')[0]
        : "",
      billingEndDate: initialData?.billingEndDate 
        ? new Date(initialData.billingEndDate).toISOString().split('T')[0]
        : "",
      dueDate: initialData?.dueDate 
        ? new Date(initialData.dueDate).toISOString().split('T')[0]
        : "",
      currentCharges: initialData?.currentCharges || 0,
      previousBalance: initialData?.previousBalance || 0,
      lateFee: initialData?.lateFee || 0,
      otherCharges: initialData?.otherCharges || 0,
      totalAmount: initialData?.totalAmount || 0,
      accountNumber: initialData?.accountNumber || "",
      meterReading: initialData?.meterReading || "",
      usageAmount: initialData?.usageAmount || 0,
      usageUnit: initialData?.usageUnit || "",
      notes: initialData?.notes || "",
    },
  });

  // Calculate total amount when individual charges change
  const watchedFields = form.watch(['currentCharges', 'previousBalance', 'lateFee', 'otherCharges']);
  const [currentCharges, previousBalance, lateFee, otherCharges] = watchedFields;
  
  useState(() => {
    const total = (currentCharges || 0) + (previousBalance || 0) + (lateFee || 0) + (otherCharges || 0);
    form.setValue('totalAmount', total);
  });

  const utilityTypes: { value: UtilityType; label: string }[] = [
    { value: 'power', label: 'Electricity' },
    { value: 'gas', label: 'Gas' },
    { value: 'water', label: 'Water' },
    { value: 'sewer', label: 'Sewer' },
    { value: 'trash', label: 'Trash' },
    { value: 'internet', label: 'Internet' },
    { value: 'cable', label: 'Cable TV' },
  ];

  const handleSubmit = (data: CreateUtilityBillData) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Utility Bill" : "Add New Utility Bill"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update the utility bill information below."
              : "Create a new utility bill for a property."
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Property Selection */}
              <FormField
                control={form.control}
                name="propertyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select property" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {properties.map((property) => (
                          <SelectItem key={property.id} value={property.id}>
                            {property.name} - {property.address}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Provider Selection */}
              <FormField
                control={form.control}
                name="providerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">No Provider</SelectItem>
                        {providers.map((provider) => (
                          <SelectItem key={provider.id} value={provider.id}>
                            {provider.name} ({provider.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Utility Type */}
              <FormField
                control={form.control}
                name="utilityType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Utility Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select utility type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {utilityTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Account Number */}
              <FormField
                control={form.control}
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter account number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Billing Dates */}
            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="billingStartDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="billingEndDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Charges */}
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="currentCharges"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Charges</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="previousBalance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Previous Balance</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lateFee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Late Fee</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="otherCharges"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Other Charges</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Total Amount (Auto-calculated) */}
            <FormField
              control={form.control}
              name="totalAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Amount</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      {...field}
                      readOnly
                      className="bg-muted"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Usage Information */}
            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="usageAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usage Amount</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.001" 
                        placeholder="0.000" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="usageUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usage Unit</FormLabel>
                    <FormControl>
                      <Input placeholder="kWh, therms, gallons" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="meterReading"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meter Reading</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter meter reading" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional notes about this utility bill..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex gap-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? "Saving..." : (isEditing ? "Update Bill" : "Create Bill")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}