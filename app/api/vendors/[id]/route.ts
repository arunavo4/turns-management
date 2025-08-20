import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { vendors } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET - Get single vendor
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
    const vendor = await db
      .select()
      .from(vendors)
      .where(eq(vendors.id, id))
      .limit(1);

    if (vendor.length === 0) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(vendor[0]);
  } catch (error) {
    console.error("Error fetching vendor:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendor" },
      { status: 500 }
    );
  }
}

// PUT - Update vendor
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

    const body = await request.json();
    const { id } = await params;
    
    // Process the data to handle date fields and remove id field
    const { 
      id: _, 
      insuranceExpiry, 
      createdAt,
      updatedAt: __,
      averageCost,
      onTimeRate,
      completedJobs,
      lastJobDate,
      ...rest 
    } = body;
    
    const updateData: any = {
      ...rest,
      updatedAt: new Date(),
    };
    
    // Convert insuranceExpiry string to Date if provided
    if (insuranceExpiry) {
      updateData.insuranceExpiry = new Date(insuranceExpiry);
    }
    
    // Handle numeric fields that might come as strings from the form
    if (averageCost !== undefined) {
      updateData.averageCost = averageCost ? String(averageCost) : null;
    }
    
    if (onTimeRate !== undefined) {
      updateData.onTimeRate = onTimeRate ? String(onTimeRate) : null;
    }
    
    if (completedJobs !== undefined) {
      updateData.completedJobs = parseInt(completedJobs) || 0;
    }
    
    // Convert lastJobDate string to Date if provided
    if (lastJobDate) {
      updateData.lastJobDate = new Date(lastJobDate);
    }
    
    const updatedVendor = await db
      .update(vendors)
      .set(updateData)
      .where(eq(vendors.id, id))
      .returning();

    if (updatedVendor.length === 0) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedVendor[0]);
  } catch (error) {
    console.error("Error updating vendor:", error);
    return NextResponse.json(
      { error: "Failed to update vendor" },
      { status: 500 }
    );
  }
}

// DELETE - Delete vendor
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
    const deletedVendor = await db
      .delete(vendors)
      .where(eq(vendors.id, id))
      .returning();

    if (deletedVendor.length === 0) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting vendor:", error);
    return NextResponse.json(
      { error: "Failed to delete vendor" },
      { status: 500 }
    );
  }
}