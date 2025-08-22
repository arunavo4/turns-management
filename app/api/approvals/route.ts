import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { approvals, turns, approvalThresholds } from "@/lib/db/schema";
import { eq, and, gte, or, lte, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth-helpers";
import { logActivity } from "@/lib/audit-service";

// GET /api/approvals - Get all approvals or filter by turn/status
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const turnId = searchParams.get("turnId");
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    let query = db.select().from(approvals);

    // Build where conditions
    const conditions = [];
    if (turnId) conditions.push(eq(approvals.turnId, turnId));
    if (status) conditions.push(eq(approvals.status, status as any));
    if (type) conditions.push(eq(approvals.type, type as any));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const result = await query.orderBy(desc(approvals.createdAt));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch approvals:", error);
    return NextResponse.json(
      { error: "Failed to fetch approvals" },
      { status: 500 }
    );
  }
}

// POST /api/approvals - Create a new approval request
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { turnId, amount } = body;

    if (!turnId || !amount) {
      return NextResponse.json(
        { error: "Turn ID and amount are required" },
        { status: 400 }
      );
    }

    // Get the turn details
    const [turn] = await db
      .select()
      .from(turns)
      .where(eq(turns.id, turnId))
      .limit(1);

    if (!turn) {
      return NextResponse.json({ error: "Turn not found" }, { status: 404 });
    }

    // Check approval thresholds
    const thresholds = await db
      .select()
      .from(approvalThresholds)
      .where(
        and(
          eq(approvalThresholds.isActive, true),
          lte(approvalThresholds.minAmount, amount.toString())
        )
      )
      .orderBy(desc(approvalThresholds.minAmount));

    const approvalsToCreate = [];
    
    for (const threshold of thresholds) {
      // Check if maxAmount is null (no upper limit) or if amount is within range
      if (!threshold.maxAmount || parseFloat(amount) <= parseFloat(threshold.maxAmount)) {
        // Check if approval already exists
        const existing = await db
          .select()
          .from(approvals)
          .where(
            and(
              eq(approvals.turnId, turnId),
              eq(approvals.type, threshold.approvalType),
              eq(approvals.status, 'pending')
            )
          )
          .limit(1);

        if (existing.length === 0) {
          approvalsToCreate.push({
            turnId,
            type: threshold.approvalType,
            status: 'pending' as const,
            requestedBy: session.user.id,
            amount: amount.toString(),
            notes: body.notes || null,
          });
        }
      }
    }

    if (approvalsToCreate.length === 0) {
      return NextResponse.json(
        { message: "No approvals needed for this amount" },
        { status: 200 }
      );
    }

    // Create the approval requests
    const newApprovals = await db
      .insert(approvals)
      .values(approvalsToCreate)
      .returning();

    // Update the turn to indicate approval is needed
    const needsDfo = approvalsToCreate.some(a => a.type === 'dfo');
    const needsHo = approvalsToCreate.some(a => a.type === 'ho');

    await db
      .update(turns)
      .set({
        needsDfoApproval: needsDfo,
        needsHoApproval: needsHo,
        updatedAt: Date.now(),
      })
      .where(eq(turns.id, turnId));

    // Log the activity
    await logActivity(
      'approvals',
      'create',
      newApprovals.map(a => a.id).join(','),
      session.user.id,
      null,
      { turnId, amount, count: newApprovals.length }
    );

    return NextResponse.json(newApprovals, { status: 201 });
  } catch (error) {
    console.error("Failed to create approval:", error);
    return NextResponse.json(
      { error: "Failed to create approval" },
      { status: 500 }
    );
  }
}