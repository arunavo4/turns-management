import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { approvalThresholds } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth-helpers";

// GET /api/approval-thresholds - Get all approval thresholds
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const thresholds = await db
      .select()
      .from(approvalThresholds)
      .orderBy(desc(approvalThresholds.minAmount));

    return NextResponse.json(thresholds);
  } catch (error) {
    console.error("Failed to fetch approval thresholds:", error);
    return NextResponse.json(
      { error: "Failed to fetch approval thresholds" },
      { status: 500 }
    );
  }
}

// POST /api/approval-thresholds - Create a new threshold
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Add role check for admin users only

    const body = await request.json();
    const { name, minAmount, maxAmount, approvalType, requiresSequential } = body;

    if (!name || !minAmount || !approvalType) {
      return NextResponse.json(
        { error: "Name, minimum amount, and approval type are required" },
        { status: 400 }
      );
    }

    const [newThreshold] = await db
      .insert(approvalThresholds)
      .values({
        name,
        minAmount: minAmount.toString(),
        maxAmount: maxAmount ? maxAmount.toString() : null,
        approvalType,
        requiresSequential: requiresSequential || false,
        isActive: true,
      })
      .returning();

    return NextResponse.json(newThreshold, { status: 201 });
  } catch (error) {
    console.error("Failed to create approval threshold:", error);
    return NextResponse.json(
      { error: "Failed to create approval threshold" },
      { status: 500 }
    );
  }
}

// PUT /api/approval-thresholds - Update a threshold
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Add role check for admin users only

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Threshold ID is required" },
        { status: 400 }
      );
    }

    // Convert amounts to strings if present
    if (updateData.minAmount) {
      updateData.minAmount = updateData.minAmount.toString();
    }
    if (updateData.maxAmount) {
      updateData.maxAmount = updateData.maxAmount.toString();
    }

    updateData.updatedAt = new Date();

    const [updatedThreshold] = await db
      .update(approvalThresholds)
      .set(updateData)
      .where(eq(approvalThresholds.id, id))
      .returning();

    if (!updatedThreshold) {
      return NextResponse.json(
        { error: "Threshold not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedThreshold);
  } catch (error) {
    console.error("Failed to update approval threshold:", error);
    return NextResponse.json(
      { error: "Failed to update approval threshold" },
      { status: 500 }
    );
  }
}

// DELETE /api/approval-thresholds/[id] - Delete a threshold
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Add role check for admin users only

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Threshold ID is required" },
        { status: 400 }
      );
    }

    // Soft delete by setting isActive to false
    const [deletedThreshold] = await db
      .update(approvalThresholds)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(approvalThresholds.id, id))
      .returning();

    if (!deletedThreshold) {
      return NextResponse.json(
        { error: "Threshold not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Threshold deleted successfully" });
  } catch (error) {
    console.error("Failed to delete approval threshold:", error);
    return NextResponse.json(
      { error: "Failed to delete approval threshold" },
      { status: 500 }
    );
  }
}