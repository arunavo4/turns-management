import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { properties } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auditService } from "@/lib/audit-service";

// GET - List all properties
export async function GET(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 503 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    
    let query = db.select().from(properties);
    
    // Filter by property manager if userId provided
    if (userId) {
      query = query.where(eq(properties.propertyManagerId, userId));
    }
    
    const result = await query;
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching properties:", error);
    return NextResponse.json(
      { error: "Failed to fetch properties" },
      { status: 500 }
    );
  }
}

// POST - Create new property
export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 503 }
      );
    }

    const body = await request.json();
    
    // Helper function to convert empty strings to null for UUID fields
    const uuidOrNull = (value: string | undefined | null) => {
      return value && value.trim() !== '' ? value : null;
    };
    
    // Generate a unique property ID if not provided
    const propertyId = body.propertyId || `PROP-${Date.now()}`;
    
    const newProperty = await db.insert(properties).values({
      propertyId: propertyId,
      name: body.name,
      address: body.address,
      city: body.city,
      state: body.state,
      zipCode: body.zipCode,
      county: body.county || null,
      type: body.propertyType || body.type || 'single_family',
      status: body.status || 'active',
      bedrooms: body.bedrooms || 0,
      bathrooms: body.bathrooms || 0,
      squareFeet: body.squareFeet || 0,
      yearBuilt: body.yearBuilt || new Date().getFullYear(),
      monthlyRent: body.monthlyRent || '0',
      market: body.market || null,
      owner: body.owner || null,
      propertyManagerId: uuidOrNull(body.propertyManagerId),
      seniorPropertyManagerId: uuidOrNull(body.seniorPropertyManagerId),
      renovationTechnicianId: uuidOrNull(body.renovationTechnicianId),
      propertyUpdatorId: uuidOrNull(body.propertyUpdatorId),
      statusYardi: body.statusYardi || null,
      isCore: body.isCore !== undefined ? body.isCore : true,
      inDisposition: body.inDisposition || false,
      section8: body.section8 || false,
      insurance: body.insurance !== undefined ? body.insurance : true,
      squatters: body.squatters || false,
      ownership: body.ownership !== undefined ? body.ownership : true,
      moveInDate: body.moveInDate ? new Date(body.moveInDate) : null,
      moveOutDate: body.moveOutDate ? new Date(body.moveOutDate) : null,
      utilities: body.utilities || { power: false, water: false, gas: false },
      images: body.images || [],
      notes: body.notes || null,
      color: body.color || (body.isCore ? 7 : 11),
    }).returning();
    
    // Log the creation in audit log
    await auditService.log({
      tableName: 'properties',
      recordId: newProperty[0].id,
      action: 'CREATE',
      newValues: newProperty[0],
      propertyId: newProperty[0].id,
      context: 'Property created via API',
    }, request);
    
    return NextResponse.json(newProperty[0], { status: 201 });
  } catch (error) {
    console.error("Error creating property:", error);
    return NextResponse.json(
      { 
        error: "Failed to create property",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}