"use client";

import { UtilityBill } from "@/types/utility";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  IconBolt,
  IconFlame,
  IconDroplet,
  IconTrash,
  IconWifi,
  IconDeviceTv,
  IconDots,
  IconEye,
  IconEdit,
  IconReceipt,
  IconMapPin,
  IconCalendar,
  IconCurrencyDollar,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { formatCurrency } from "@/lib/mock-data";

interface UtilityBillCardProps {
  bill: UtilityBill;
  onView?: (bill: UtilityBill) => void;
  onEdit?: (bill: UtilityBill) => void;
  onDelete?: (bill: UtilityBill) => void;
  onMarkAsPaid?: (bill: UtilityBill) => void;
}

export function UtilityBillCard({
  bill,
  onView,
  onEdit,
  onDelete,
  onMarkAsPaid,
}: UtilityBillCardProps) {
  const getUtilityIcon = (type: string) => {
    switch (type) {
      case 'power':
        return <IconBolt className="h-5 w-5" />;
      case 'gas':
        return <IconFlame className="h-5 w-5" />;
      case 'water':
        return <IconDroplet className="h-5 w-5" />;
      case 'sewer':
        return <IconDroplet className="h-5 w-5" />;
      case 'trash':
        return <IconTrash className="h-5 w-5" />;
      case 'internet':
        return <IconWifi className="h-5 w-5" />;
      case 'cable':
        return <IconDeviceTv className="h-5 w-5" />;
      default:
        return <IconReceipt className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'unpaid':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'disputed':
        return 'bg-purple-100 text-purple-800';
      case 'partial':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isOverdue = bill.status === 'unpaid' && bill.dueDate < Date.now();
  const dueInDays = Math.ceil((bill.dueDate - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <Card className={`hover:shadow-lg transition-shadow ${
      isOverdue ? 'border-l-4 border-l-red-500' : 
      bill.status === 'paid' ? 'border-l-4 border-l-green-500' : 
      'border-l-4 border-l-yellow-500'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              {getUtilityIcon(bill.utilityType)}
            </div>
            <div>
              <CardTitle className="text-lg capitalize">
                {bill.utilityType === 'power' ? 'Electricity' : bill.utilityType}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {bill.property?.name || 'Property'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(bill.status)}>
              {bill.status.toUpperCase()}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <IconDots className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {onView && (
                  <DropdownMenuItem onClick={() => onView(bill)}>
                    <IconEye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(bill)}>
                    <IconEdit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onMarkAsPaid && bill.status === 'unpaid' && (
                  <DropdownMenuItem onClick={() => onMarkAsPaid(bill)}>
                    <IconCurrencyDollar className="mr-2 h-4 w-4" />
                    Mark as Paid
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    className="text-red-600"
                    onClick={() => onDelete(bill)}
                  >
                    <IconTrash className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Property Info */}
        {bill.property && (
          <div className="flex items-center text-sm text-muted-foreground">
            <IconMapPin className="mr-2 h-4 w-4" />
            <span>{bill.property.address}, {bill.property.city}, {bill.property.state}</span>
          </div>
        )}

        {/* Provider Info */}
        {bill.provider && (
          <div className="text-sm">
            <span className="font-medium">Provider: </span>
            {bill.provider.name}
          </div>
        )}

        {/* Account Number */}
        {bill.accountNumber && (
          <div className="text-sm">
            <span className="font-medium">Account: </span>
            {bill.accountNumber}
          </div>
        )}

        {/* Billing Period */}
        <div className="flex items-center text-sm">
          <IconCalendar className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>
            {formatDate(bill.billingStartDate)} - {formatDate(bill.billingEndDate)}
          </span>
        </div>

        {/* Usage Information */}
        {bill.usageAmount && bill.usageUnit && (
          <div className="text-sm">
            <span className="font-medium">Usage: </span>
            {bill.usageAmount.toLocaleString()} {bill.usageUnit}
          </div>
        )}

        {/* Amount Breakdown */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Current Charges:</span>
            <span>{formatCurrency(parseFloat(bill.currentCharges.toString()))}</span>
          </div>
          {parseFloat(bill.previousBalance.toString()) > 0 && (
            <div className="flex justify-between text-sm">
              <span>Previous Balance:</span>
              <span>{formatCurrency(parseFloat(bill.previousBalance.toString()))}</span>
            </div>
          )}
          {parseFloat(bill.lateFee.toString()) > 0 && (
            <div className="flex justify-between text-sm text-red-600">
              <span>Late Fee:</span>
              <span>{formatCurrency(parseFloat(bill.lateFee.toString()))}</span>
            </div>
          )}
          {parseFloat(bill.otherCharges.toString()) > 0 && (
            <div className="flex justify-between text-sm">
              <span>Other Charges:</span>
              <span>{formatCurrency(parseFloat(bill.otherCharges.toString()))}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-lg pt-2 border-t">
            <span>Total Amount:</span>
            <span>{formatCurrency(parseFloat(bill.totalAmount.toString()))}</span>
          </div>
        </div>

        {/* Due Date Warning */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center text-sm">
            <IconCalendar className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Due: {formatDate(bill.dueDate)}</span>
          </div>
          {isOverdue && (
            <div className="flex items-center text-sm text-red-600 font-medium">
              <IconAlertTriangle className="mr-1 h-4 w-4" />
              Overdue
            </div>
          )}
          {!isOverdue && bill.status === 'unpaid' && dueInDays <= 7 && dueInDays > 0 && (
            <div className="flex items-center text-sm text-orange-600 font-medium">
              <IconAlertTriangle className="mr-1 h-4 w-4" />
              Due in {dueInDays} day{dueInDays !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Amount Paid (if partial payment) */}
        {parseFloat(bill.amountPaid.toString()) > 0 && (
          <div className="flex justify-between text-sm text-green-600 bg-green-50 p-2 rounded">
            <span>Amount Paid:</span>
            <span>{formatCurrency(parseFloat(bill.amountPaid.toString()))}</span>
          </div>
        )}

        {/* Notes */}
        {bill.notes && (
          <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
            <span className="font-medium">Notes: </span>
            {bill.notes}
          </div>
        )}
      </CardContent>
    </Card>
  );
}