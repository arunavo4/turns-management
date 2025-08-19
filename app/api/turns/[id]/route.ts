import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { turns, turnHistory } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET - Get single turn
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
    const turn = await db
      .select()
      .from(turns)
      .where(eq(turns.id, id))
      .limit(1);

    if (turn.length === 0) {
      return NextResponse.json(
        { error: "Turn not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(turn[0]);
  } catch (error) {
    console.error("Error fetching turn:", error);
    return NextResponse.json(
      { error: "Failed to fetch turn" },
      { status: 500 }
    );
  }
}

// PUT - Update turn
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
    
    // Get current turn for history tracking
    const currentTurn = await db
      .select()
      .from(turns)
      .where(eq(turns.id, id))
      .limit(1);

    if (currentTurn.length === 0) {
      return NextResponse.json(
        { error: "Turn not found" },
        { status: 404 }
      );
    }

    // Update the turn
    const updatedTurn = await db
      .update(turns)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(turns.id, id))
      .returning();

    // Track status change in history
    if (body.status && body.status !== currentTurn[0].status) {
      await db.insert(turnHistory).values({
        turnId: id,
        action: 'status_change',
        previousStatus: currentTurn[0].status,
        newStatus: body.status,
        changedBy: body.changedBy,
        comment: body.comment || `Status changed from ${currentTurn[0].status} to ${body.status}`,
        changedData: body,
      });
    }

    // Track stage change in history
    if (body.stageId && body.stageId !== currentTurn[0].stageId) {
      await db.insert(turnHistory).values({
        turnId: id,
        action: 'stage_change',
        previousStageId: currentTurn[0].stageId,
        newStageId: body.stageId,
        changedBy: body.changedBy,
        comment: body.comment || 'Stage updated',
        changedData: body,
      });
    }

    return NextResponse.json(updatedTurn[0]);
  } catch (error) {
    console.error("Error updating turn:", error);
    return NextResponse.json(
      { error: "Failed to update turn" },
      { status: 500 }
    );
  }
}

// DELETE - Delete turn
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
    const deletedTurn = await db
      .delete(turns)
      .where(eq(turns.id, id))
      .returning();

    if (deletedTurn.length === 0) {
      return NextResponse.json(
        { error: "Turn not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting turn:", error);
    return NextResponse.json(
      { error: "Failed to delete turn" },
      { status: 500 }
    );
  }
}