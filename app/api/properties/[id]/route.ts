import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { properties } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auditService } from "@/lib/audit-service";

// GET - Get single property
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
    const property = await db
      .select()
      .from(properties)
      .where(eq(properties.id, id))
      .limit(1);

    if (property.length === 0) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(property[0]);
  } catch (error) {
    console.error("Error fetching property:", error);
    return NextResponse.json(
      { error: "Failed to fetch property" },
      { status: 500 }
    );
  }
}

// PUT - Update property
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
    
    // Get current property data for audit log
    const currentProperty = await db
      .select()
      .from(properties)
      .where(eq(properties.id, id))
      .limit(1);
    
    if (currentProperty.length === 0) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }
    
    const updatedProperty = await db
      .update(properties)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(properties.id, id))
      .returning();

    if (updatedProperty.length === 0) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    // Log the update in audit log
    await auditService.logUpdate(
      'properties',
      id,
      currentProperty[0],
      updatedProperty[0],
      'Property updated via API'
    );

    return NextResponse.json(updatedProperty[0]);
  } catch (error) {
    console.error("Error updating property:", error);
    return NextResponse.json(
      { error: "Failed to update property" },
      { status: 500 }
    );
  }
}

// DELETE - Delete property
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
    
    // Get property data before deletion for audit log
    const propertyToDelete = await db
      .select()
      .from(properties)
      .where(eq(properties.id, id))
      .limit(1);
    
    if (propertyToDelete.length === 0) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }
    
    const deletedProperty = await db
      .delete(properties)
      .where(eq(properties.id, id))
      .returning();

    // Log the deletion in audit log
    await auditService.logDelete(
      'properties',
      id,
      propertyToDelete[0],
      'Property deleted via API'
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting property:", error);
    return NextResponse.json(
      { error: "Failed to delete property" },
      { status: 500 }
    );
  }
}