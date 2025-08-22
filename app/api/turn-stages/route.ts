import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { turnStages } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

// GET - List all turn stages
export async function GET() {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 503 }
      );
    }

    const stages = await db
      .select()
      .from(turnStages)
      .orderBy(desc(turnStages.sequence));
    
    return NextResponse.json(stages);
  } catch (error) {
    console.error("Error fetching turn stages:", error);
    return NextResponse.json(
      { error: "Failed to fetch turn stages" },
      { status: 500 }
    );
  }
}

// POST - Create new turn stage
export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 503 }
      );
    }

    const body = await request.json();
    
    const newStage = await db.insert(turnStages).values({
      key: body.key,
      name: body.name,
      sequence: body.sequence,
      color: body.color || '#6B7280',
      icon: body.icon,
      description: body.description,
      isActive: body.isActive !== undefined ? body.isActive : true,
      isDefault: body.isDefault || false,
      isFinal: body.isFinal || false,
      requiresApproval: body.requiresApproval || false,
      requiresVendor: body.requiresVendor || false,
      requiresAmount: body.requiresAmount || false,
      requiresLockBox: body.requiresLockBox || false,
    }).returning();
    
    return NextResponse.json(newStage[0], { status: 201 });
  } catch (error) {
    console.error("Error creating turn stage:", error);
    return NextResponse.json(
      { error: "Failed to create turn stage" },
      { status: 500 }
    );
  }
}