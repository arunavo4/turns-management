import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { properties } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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
      name: body.name,
      address: body.address,
      city: body.city,
      state: body.state,
      zipCode: body.zipCode,
      type: body.type || 'single_family',
      status: body.status || 'active',
      bedrooms: body.bedrooms,
      bathrooms: body.bathrooms,
      squareFeet: body.squareFeet,
      yearBuilt: body.yearBuilt,
      monthlyRent: body.monthlyRent,
      propertyManagerId: body.propertyManagerId,
      seniorPropertyManagerId: body.seniorPropertyManagerId,
      isCore: body.isCore !== undefined ? body.isCore : true,
      utilities: body.utilities || { power: false, water: false, gas: false },
      notes: body.notes,
    }).returning();
    
    return NextResponse.json(newProperty[0], { status: 201 });
  } catch (error) {
    console.error("Error creating property:", error);
    return NextResponse.json(
      { error: "Failed to create property" },
      { status: 500 }
    );
  }
}