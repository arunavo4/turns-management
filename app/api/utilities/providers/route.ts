import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { utilityProviders } from "@/lib/db/schema";
import { eq, like, and } from "drizzle-orm";
import { auditService } from "@/lib/audit-service";

// GET - List all utility providers
export async function GET(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 503 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type");
    const isActive = searchParams.get("isActive");
    const search = searchParams.get("search");
    
    let query = db.select().from(utilityProviders);
    const conditions = [];
    
    // Filter by type
    if (type) {
      conditions.push(eq(utilityProviders.type, type));
    }
    
    // Filter by active status
    if (isActive !== null) {
      conditions.push(eq(utilityProviders.isActive, isActive === 'true'));
    }
    
    // Search by name
    if (search) {
      conditions.push(like(utilityProviders.name, `%${search}%`));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const result = await query;
    
    return NextResponse.json({
      providers: result,
      total: result.length
    });
  } catch (error) {
    console.error("Error fetching utility providers:", error);
    return NextResponse.json(
      { error: "Failed to fetch utility providers" },
      { status: 500 }
    );
  }
}

// POST - Create new utility provider
export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 503 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.type) {
      return NextResponse.json(
        { error: "Name and type are required" },
        { status: 400 }
      );
    }
    
    const newProvider = await db.insert(utilityProviders).values({
      name: body.name,
      type: body.type,
      contactPhone: body.contactPhone || null,
      contactEmail: body.contactEmail || null,
      website: body.website || null,
      isActive: body.isActive !== undefined ? body.isActive : true,
    }).returning();
    
    // Log the creation in audit log
    await auditService.log({
      tableName: 'utility_providers',
      recordId: newProvider[0].id,
      action: 'CREATE',
      newValues: newProvider[0],
      context: 'Utility provider created via API',
    }, request);
    
    return NextResponse.json(newProvider[0], { status: 201 });
  } catch (error) {
    console.error("Error creating utility provider:", error);
    return NextResponse.json(
      { 
        error: "Failed to create utility provider",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}