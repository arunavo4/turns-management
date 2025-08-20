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
    
    const newProperty = await db.insert(properties).values({
      propertyId: body.propertyId,
      name: body.name,
      address: body.address,
      city: body.city,
      state: body.state,
      zipCode: body.zipCode,
      county: body.county,
      type: body.propertyType || body.type || 'single_family',
      status: body.status || 'active',
      bedrooms: body.bedrooms,
      bathrooms: body.bathrooms,
      squareFeet: body.squareFeet,
      yearBuilt: body.yearBuilt,
      monthlyRent: body.monthlyRent,
      market: body.market,
      owner: body.owner,
      propertyManagerId: body.propertyManagerId,
      seniorPropertyManagerId: body.seniorPropertyManagerId,
      renovationTechnicianId: body.renovationTechnicianId,
      propertyUpdatorId: body.propertyUpdatorId,
      statusYardi: body.statusYardi,
      isCore: body.isCore !== undefined ? body.isCore : true,
      inDisposition: body.inDisposition || false,
      section8: body.section8 || false,
      insurance: body.insurance !== undefined ? body.insurance : true,
      squatters: body.squatters || false,
      ownership: body.ownership !== undefined ? body.ownership : true,
      moveInDate: body.moveInDate,
      moveOutDate: body.moveOutDate,
      utilities: body.utilities || { power: false, water: false, gas: false },
      images: body.images || [],
      notes: body.notes,
      color: body.color || (body.isCore ? 7 : 11),
    }).returning();
    
    // Log the creation in audit log
    await auditService.logCreate(
      'properties',
      newProperty[0].id,
      newProperty[0],
      'Property created via API'
    );
    
    return NextResponse.json(newProperty[0], { status: 201 });
  } catch (error) {
    console.error("Error creating property:", error);
    return NextResponse.json(
      { error: "Failed to create property" },
      { status: 500 }
    );
  }
}