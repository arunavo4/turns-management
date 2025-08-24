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
import { UtilityBill, UtilityBillStatus } from "@/types/utility";
import { formatCurrency } from "@/lib/mock-data";

interface PaymentData {
  amountPaid: number;
  paidDate: string;
  status: UtilityBillStatus;
  paymentConfirmation?: string;
  notes?: string;
}

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PaymentData) => void;
  bill: UtilityBill | null;
  isLoading?: boolean;
}

export function PaymentDialog({
  open,
  onOpenChange,
  onSubmit,
  bill,
  isLoading = false,
}: PaymentDialogProps) {
  const [paymentType, setPaymentType] = useState<'full' | 'partial'>('full');

  const form = useForm<PaymentData>({
    defaultValues: {
      amountPaid: bill ? parseFloat(bill.totalAmount.toString()) : 0,
      paidDate: new Date().toISOString().split('T')[0],
      status: 'paid' as UtilityBillStatus,
      paymentConfirmation: "",
      notes: "",
    },
  });

  // Reset form when bill changes
  useState(() => {
    if (bill) {
      const totalAmount = parseFloat(bill.totalAmount.toString());
      const alreadyPaid = parseFloat(bill.amountPaid.toString());
      const remainingAmount = totalAmount - alreadyPaid;

      form.reset({
        amountPaid: paymentType === 'full' ? remainingAmount : 0,
        paidDate: new Date().toISOString().split('T')[0],
        status: 'paid',
        paymentConfirmation: "",
        notes: "",
      });
    }
  });

  const handlePaymentTypeChange = (type: 'full' | 'partial') => {
    setPaymentType(type);
    if (bill) {
      const totalAmount = parseFloat(bill.totalAmount.toString());
      const alreadyPaid = parseFloat(bill.amountPaid.toString());
      const remainingAmount = totalAmount - alreadyPaid;

      form.setValue('amountPaid', type === 'full' ? remainingAmount : 0);
      form.setValue('status', type === 'full' ? 'paid' : 'partial');
    }
  };

  const handleSubmit = (data: PaymentData) => {
    if (bill) {
      const totalAmount = parseFloat(bill.totalAmount.toString());
      const alreadyPaid = parseFloat(bill.amountPaid.toString());
      const newTotalPaid = alreadyPaid + data.amountPaid;

      // Determine status based on payment amount
      let status: UtilityBillStatus = 'paid';
      if (newTotalPaid < totalAmount) {
        status = 'partial';
      } else if (newTotalPaid >= totalAmount) {
        status = 'paid';
      }

      onSubmit({
        ...data,
        status,
      });
    }
  };

  if (!bill) return null;

  const totalAmount = parseFloat(bill.totalAmount.toString());
  const alreadyPaid = parseFloat(bill.amountPaid.toString());
  const remainingAmount = totalAmount - alreadyPaid;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record a payment for this utility bill.
          </DialogDescription>
        </DialogHeader>

        {/* Bill Summary */}
        <div className="bg-muted p-4 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span className="font-medium">Total Amount:</span>
            <span>{formatCurrency(totalAmount)}</span>
          </div>
          {alreadyPaid > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Already Paid:</span>
              <span>{formatCurrency(alreadyPaid)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold border-t pt-2">
            <span>Remaining:</span>
            <span>{formatCurrency(remainingAmount)}</span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Payment Type Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Payment Type</label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={paymentType === 'full' ? 'default' : 'outline'}
                  onClick={() => handlePaymentTypeChange('full')}
                  className="flex-1"
                >
                  Full Payment ({formatCurrency(remainingAmount)})
                </Button>
                <Button
                  type="button"
                  variant={paymentType === 'partial' ? 'default' : 'outline'}
                  onClick={() => handlePaymentTypeChange('partial')}
                  className="flex-1"
                >
                  Partial Payment
                </Button>
              </div>
            </div>

            {/* Payment Amount */}
            <FormField
              control={form.control}
              name="amountPaid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max={remainingAmount}
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payment Date */}
            <FormField
              control={form.control}
              name="paidDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payment Status (Auto-determined) */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="partial">Partial Payment</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payment Confirmation */}
            <FormField
              control={form.control}
              name="paymentConfirmation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Confirmation (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Transaction ID, check number, etc."
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payment Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional notes about this payment..."
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
                {isLoading ? "Recording..." : "Record Payment"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}