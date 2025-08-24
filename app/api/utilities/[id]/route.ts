import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { propertyUtilityBills, properties, utilityProviders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auditService } from "@/lib/audit-service";

// GET - Get single utility bill
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 503 }
      );
    }

    const { id } = await params;
    
    const [bill] = await db
      .select({
        id: propertyUtilityBills.id,
        propertyId: propertyUtilityBills.propertyId,
        providerId: propertyUtilityBills.providerId,
        utilityType: propertyUtilityBills.utilityType,
        billingStartDate: propertyUtilityBills.billingStartDate,
        billingEndDate: propertyUtilityBills.billingEndDate,
        dueDate: propertyUtilityBills.dueDate,
        currentCharges: propertyUtilityBills.currentCharges,
        previousBalance: propertyUtilityBills.previousBalance,
        lateFee: propertyUtilityBills.lateFee,
        otherCharges: propertyUtilityBills.otherCharges,
        totalAmount: propertyUtilityBills.totalAmount,
        amountPaid: propertyUtilityBills.amountPaid,
        status: propertyUtilityBills.status,
        paidDate: propertyUtilityBills.paidDate,
        accountNumber: propertyUtilityBills.accountNumber,
        meterReading: propertyUtilityBills.meterReading,
        usageAmount: propertyUtilityBills.usageAmount,
        usageUnit: propertyUtilityBills.usageUnit,
        billDocument: propertyUtilityBills.billDocument,
        paymentConfirmation: propertyUtilityBills.paymentConfirmation,
        notes: propertyUtilityBills.notes,
        metadata: propertyUtilityBills.metadata,
        createdAt: propertyUtilityBills.createdAt,
        updatedAt: propertyUtilityBills.updatedAt,
        version: propertyUtilityBills.version,
        createdBy: propertyUtilityBills.createdBy,
        updatedBy: propertyUtilityBills.updatedBy,
        // Property relation
        property: {
          id: properties.id,
          name: properties.name,
          address: properties.address,
          city: properties.city,
          state: properties.state,
          zipCode: properties.zipCode,
        },
        // Provider relation
        provider: {
          id: utilityProviders.id,
          name: utilityProviders.name,
          type: utilityProviders.type,
          contactPhone: utilityProviders.contactPhone,
          contactEmail: utilityProviders.contactEmail,
          website: utilityProviders.website,
        }
      })
      .from(propertyUtilityBills)
      .leftJoin(properties, eq(propertyUtilityBills.propertyId, properties.id))
      .leftJoin(utilityProviders, eq(propertyUtilityBills.providerId, utilityProviders.id))
      .where(eq(propertyUtilityBills.id, id));
    
    if (!bill) {
      return NextResponse.json(
        { error: "Utility bill not found" },
        { status: 404 }
      );
    }
    
    // Log the view in audit log
    await auditService.log({
      tableName: 'property_utility_bills',
      recordId: bill.id,
      action: 'VIEW',
      propertyId: bill.propertyId,
      context: 'Utility bill viewed via API',
    }, request);
    
    return NextResponse.json(bill);
  } catch (error) {
    console.error("Error fetching utility bill:", error);
    return NextResponse.json(
      { error: "Failed to fetch utility bill" },
      { status: 500 }
    );
  }
}

// PUT - Update utility bill
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 503 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    
    // Get existing bill for audit logging
    const [existingBill] = await db
      .select()
      .from(propertyUtilityBills)
      .where(eq(propertyUtilityBills.id, id));
    
    if (!existingBill) {
      return NextResponse.json(
        { error: "Utility bill not found" },
        { status: 404 }
      );
    }
    
    // Build update object
    const updateData: any = {};
    
    if (body.providerId !== undefined) updateData.providerId = body.providerId;
    if (body.utilityType !== undefined) updateData.utilityType = body.utilityType;
    if (body.billingStartDate !== undefined) {
      updateData.billingStartDate = typeof body.billingStartDate === 'string' 
        ? new Date(body.billingStartDate).getTime() 
        : body.billingStartDate;
    }
    if (body.billingEndDate !== undefined) {
      updateData.billingEndDate = typeof body.billingEndDate === 'string' 
        ? new Date(body.billingEndDate).getTime() 
        : body.billingEndDate;
    }
    if (body.dueDate !== undefined) {
      updateData.dueDate = typeof body.dueDate === 'string' 
        ? new Date(body.dueDate).getTime() 
        : body.dueDate;
    }
    if (body.currentCharges !== undefined) updateData.currentCharges = body.currentCharges.toString();
    if (body.previousBalance !== undefined) updateData.previousBalance = body.previousBalance.toString();
    if (body.lateFee !== undefined) updateData.lateFee = body.lateFee.toString();
    if (body.otherCharges !== undefined) updateData.otherCharges = body.otherCharges.toString();
    if (body.totalAmount !== undefined) updateData.totalAmount = body.totalAmount.toString();
    if (body.amountPaid !== undefined) updateData.amountPaid = body.amountPaid.toString();
    if (body.status !== undefined) updateData.status = body.status;
    if (body.paidDate !== undefined) {
      updateData.paidDate = body.paidDate 
        ? (typeof body.paidDate === 'string' ? new Date(body.paidDate).getTime() : body.paidDate)
        : null;
    }
    if (body.accountNumber !== undefined) updateData.accountNumber = body.accountNumber;
    if (body.meterReading !== undefined) updateData.meterReading = body.meterReading;
    if (body.usageAmount !== undefined) updateData.usageAmount = body.usageAmount ? body.usageAmount.toString() : null;
    if (body.usageUnit !== undefined) updateData.usageUnit = body.usageUnit;
    if (body.billDocument !== undefined) updateData.billDocument = body.billDocument;
    if (body.paymentConfirmation !== undefined) updateData.paymentConfirmation = body.paymentConfirmation;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.metadata !== undefined) updateData.metadata = body.metadata;
    
    // Always update the updatedAt timestamp
    updateData.updatedAt = Date.now();
    updateData.version = existingBill.version + 1;
    
    const [updatedBill] = await db
      .update(propertyUtilityBills)
      .set(updateData)
      .where(eq(propertyUtilityBills.id, id))
      .returning();
    
    // Log the update in audit log
    const changedFields = auditService.calculateChangedFields(existingBill, updatedBill);
    await auditService.log({
      tableName: 'property_utility_bills',
      recordId: updatedBill.id,
      action: 'UPDATE',
      oldValues: existingBill,
      newValues: updatedBill,
      changedFields,
      propertyId: updatedBill.propertyId,
      context: 'Utility bill updated via API',
    }, request);
    
    return NextResponse.json(updatedBill);
  } catch (error) {
    console.error("Error updating utility bill:", error);
    return NextResponse.json(
      { 
        error: "Failed to update utility bill",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete utility bill
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 503 }
      );
    }

    const { id } = await params;
    
    // Get existing bill for audit logging
    const [existingBill] = await db
      .select()
      .from(propertyUtilityBills)
      .where(eq(propertyUtilityBills.id, id));
    
    if (!existingBill) {
      return NextResponse.json(
        { error: "Utility bill not found" },
        { status: 404 }
      );
    }
    
    // Delete the bill
    await db
      .delete(propertyUtilityBills)
      .where(eq(propertyUtilityBills.id, id));
    
    // Log the deletion in audit log
    await auditService.log({
      tableName: 'property_utility_bills',
      recordId: existingBill.id,
      action: 'DELETE',
      oldValues: existingBill,
      propertyId: existingBill.propertyId,
      context: 'Utility bill deleted via API',
    }, request);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting utility bill:", error);
    return NextResponse.json(
      { error: "Failed to delete utility bill" },
      { status: 500 }
    );
  }
}