import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { turns, properties, vendors, turnStages } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { auditService } from "@/lib/audit-service";

// GET - List all turns with related data
export async function GET() {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 503 }
      );
    }

    const query = db
      .select({
        turn: turns,
        property: properties,
        vendor: vendors,
        stage: turnStages,
      })
      .from(turns)
      .leftJoin(properties, eq(turns.propertyId, properties.id))
      .leftJoin(vendors, eq(turns.vendorId, vendors.id))
      .leftJoin(turnStages, eq(turns.stageId, turnStages.id))
      .orderBy(desc(turns.createdAt));
    
    const result = await query;
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching turns:", error);
    return NextResponse.json(
      { error: "Failed to fetch turns" },
      { status: 500 }
    );
  }
}

// POST - Create new turn
export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 503 }
      );
    }

    const body = await request.json();
    
    // Generate turn number
    const turnNumber = `TURN-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    
    const newTurn = await db.insert(turns).values({
      turnNumber,
      propertyId: body.propertyId,
      status: body.status || 'draft',
      priority: body.priority || 'medium',
      stageId: body.stageId,
      moveOutDate: body.moveOutDate ? new Date(body.moveOutDate).getTime() : null,
      turnAssignmentDate: body.turnAssignmentDate ? new Date(body.turnAssignmentDate).getTime() : null,
      turnDueDate: body.turnDueDate ? new Date(body.turnDueDate).getTime() : null,
      vendorId: body.vendorId,
      assignedFlooringVendor: body.assignedFlooringVendor,
      estimatedCost: body.estimatedCost,
      scopeOfWork: body.scopeOfWork,
      powerStatus: body.powerStatus || false,
      waterStatus: body.waterStatus || false,
      gasStatus: body.gasStatus || false,
      trashOutNeeded: body.trashOutNeeded || false,
      appliancesNeeded: body.appliancesNeeded || false,
      notes: body.notes,
    }).returning();
    
    // Log the creation
    await auditService.log({
      tableName: 'turns',
      recordId: newTurn[0].id,
      action: 'CREATE',
      newValues: newTurn[0],
      turnId: newTurn[0].id,
      propertyId: body.propertyId,
      vendorId: body.vendorId,
      context: `Created turn: ${turnNumber}`,
    }, request);
    
    return NextResponse.json(newTurn[0], { status: 201 });
  } catch (error) {
    console.error("Error creating turn:", error);
    return NextResponse.json(
      { error: "Failed to create turn" },
      { status: 500 }
    );
  }
}