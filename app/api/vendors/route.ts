import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { vendors } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auditService } from "@/lib/audit-service";

// GET - List all vendors
export async function GET(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 503 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const isApproved = searchParams.get("approved");
    const isActive = searchParams.get("active");
    
    let query = db.select().from(vendors);
    
    // Filter by approval status
    if (isApproved !== null) {
      query = query.where(eq(vendors.isApproved, isApproved === 'true'));
    }
    
    // Filter by active status
    if (isActive !== null) {
      query = query.where(eq(vendors.isActive, isActive === 'true'));
    }
    
    const result = await query;
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendors" },
      { status: 500 }
    );
  }
}

// POST - Create new vendor
export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 503 }
      );
    }

    const body = await request.json();
    
    const newVendor = await db.insert(vendors).values({
      companyName: body.companyName,
      contactName: body.contactName,
      email: body.email,
      phone: body.phone,
      address: body.address,
      city: body.city,
      state: body.state,
      zipCode: body.zipCode,
      specialties: body.specialties || [],
      insuranceExpiry: body.insuranceExpiry ? new Date(body.insuranceExpiry) : null,
      licenseNumber: body.licenseNumber,
      rating: body.rating,
      isApproved: body.isApproved || false,
      isActive: body.isActive !== undefined ? body.isActive : true,
      performanceMetrics: body.performanceMetrics || {
        completedTurns: 0,
        avgCompletionTime: 0,
        avgRating: 0,
        onTimeRate: 0
      },
    }).returning();
    
    // Log the creation
    await auditService.log({
      tableName: 'vendors',
      recordId: newVendor[0].id,
      action: 'CREATE',
      newValues: newVendor[0],
      vendorId: newVendor[0].id,
      context: `Created vendor: ${newVendor[0].companyName}`,
    }, request);
    
    return NextResponse.json(newVendor[0], { status: 201 });
  } catch (error) {
    console.error("Error creating vendor:", error);
    return NextResponse.json(
      { error: "Failed to create vendor" },
      { status: 500 }
    );
  }
}