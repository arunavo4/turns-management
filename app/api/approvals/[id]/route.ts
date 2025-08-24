import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { approvals, turns, user, properties } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth-helpers";
import { logActivity } from "@/lib/audit-service";
import { sendApprovalDecisionNotification } from "@/lib/email/notifications";

// GET /api/approvals/[id] - Get a specific approval
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const [approval] = await db
      .select()
      .from(approvals)
      .where(eq(approvals.id, id))
      .limit(1);

    if (!approval) {
      return NextResponse.json({ error: "Approval not found" }, { status: 404 });
    }

    return NextResponse.json(approval);
  } catch (error) {
    console.error("Failed to fetch approval:", error);
    return NextResponse.json(
      { error: "Failed to fetch approval" },
      { status: 500 }
    );
  }
}

// PUT /api/approvals/[id] - Update approval (approve/reject)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, rejectionReason } = body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    if (action === 'reject' && !rejectionReason) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 }
      );
    }

    // Get the current approval
    const [currentApproval] = await db
      .select()
      .from(approvals)
      .where(eq(approvals.id, id))
      .limit(1);

    if (!currentApproval) {
      return NextResponse.json({ error: "Approval not found" }, { status: 404 });
    }

    if (currentApproval.status !== 'pending') {
      return NextResponse.json(
        { error: "Approval has already been processed" },
        { status: 400 }
      );
    }

    // Check user permissions (you might want to add role-based checks here)
    // For now, we'll allow any authenticated user to approve/reject

    const now = new Date();
    const updateData: {
      status: string;
      updatedAt: Date;
      approvedBy?: string | null;
      approvedAt?: Date;
      rejectedBy?: string | null;
      rejectedAt?: Date;
      rejectionReason?: string;
    } = {
      status: action === 'approve' ? 'approved' : 'rejected',
      updatedAt: now,
    };

    if (action === 'approve') {
      updateData.approvedBy = session.user.id;
      updateData.approvedAt = now;
    } else {
      updateData.rejectedBy = session.user.id;
      updateData.rejectedAt = now;
      updateData.rejectionReason = rejectionReason;
    }

    // Update the approval
    const [updatedApproval] = await db
      .update(approvals)
      .set(updateData)
      .where(eq(approvals.id, id))
      .returning();

    // Update the turn approval status
    const turnUpdateData: {
      updatedAt: number;
      dfoApprovedBy?: string | null;
      dfoApprovedAt?: number;
      needsDfoApproval?: boolean;
      hoApprovedBy?: string | null;
      hoApprovedAt?: number;
      needsHoApproval?: boolean;
      rejectionReason?: string;
    } = {
      updatedAt: Date.now(),
    };

    if (currentApproval.type === 'dfo') {
      if (action === 'approve') {
        turnUpdateData.dfoApprovedBy = session.user.id;
        turnUpdateData.dfoApprovedAt = Date.now();
        turnUpdateData.needsDfoApproval = false;
      } else {
        turnUpdateData.rejectionReason = rejectionReason;
      }
    } else if (currentApproval.type === 'ho') {
      if (action === 'approve') {
        turnUpdateData.hoApprovedBy = session.user.id;
        turnUpdateData.hoApprovedAt = Date.now();
        turnUpdateData.needsHoApproval = false;
      } else {
        turnUpdateData.rejectionReason = rejectionReason;
      }
    }

    await db
      .update(turns)
      .set(turnUpdateData)
      .where(eq(turns.id, currentApproval.turnId));

    // Log the activity
    await logActivity(
      'approvals',
      action === 'approve' ? 'approve' : 'reject',
      id,
      session.user.id,
      currentApproval,
      updatedApproval
    );

    // Send email notification
    try {
      // Get turn with property details
      const [turnWithProperty] = await db
        .select({
          turn: turns,
          property: properties,
        })
        .from(turns)
        .innerJoin(properties, eq(turns.propertyId, properties.id))
        .where(eq(turns.id, currentApproval.turnId))
        .limit(1);

      // Get the original requester
      const [requester] = await db
        .select()
        .from(user)
        .where(eq(user.id, currentApproval.requestedBy))
        .limit(1);

      if (requester && turnWithProperty) {
        await sendApprovalDecisionNotification({
          turnId: currentApproval.turnId,
          propertyAddress: `${turnWithProperty.property.address}, ${turnWithProperty.property.city}, ${turnWithProperty.property.state} ${turnWithProperty.property.zipCode}`,
          estimatedCost: parseFloat(currentApproval.amount || '0'),
          priority: turnWithProperty.turn.priority || 'MEDIUM',
          recipientEmail: requester.email,
          recipientName: requester.name || requester.email,
          decision: action === 'approve' ? 'APPROVED' : 'REJECTED',
          approverName: session.user.name || session.user.email || 'Approver',
          comments: action === 'reject' ? rejectionReason : undefined,
        });
      }
    } catch (emailError) {
      console.error('Failed to send approval decision email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json(updatedApproval);
  } catch (error) {
    console.error("Failed to update approval:", error);
    return NextResponse.json(
      { error: "Failed to update approval" },
      { status: 500 }
    );
  }
}

// DELETE /api/approvals/[id] - Cancel an approval request
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the approval
    const [approval] = await db
      .select()
      .from(approvals)
      .where(eq(approvals.id, id))
      .limit(1);

    if (!approval) {
      return NextResponse.json({ error: "Approval not found" }, { status: 404 });
    }

    if (approval.status !== 'pending') {
      return NextResponse.json(
        { error: "Cannot cancel a processed approval" },
        { status: 400 }
      );
    }

    // Update status to cancelled
    const [cancelledApproval] = await db
      .update(approvals)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(eq(approvals.id, id))
      .returning();

    // Check if there are other pending approvals for this turn
    const pendingApprovals = await db
      .select()
      .from(approvals)
      .where(
        and(
          eq(approvals.turnId, approval.turnId),
          eq(approvals.status, 'pending')
        )
      );

    // Update turn approval flags if no more pending approvals
    if (pendingApprovals.length === 0) {
      await db
        .update(turns)
        .set({
          needsDfoApproval: false,
          needsHoApproval: false,
          updatedAt: Date.now(),
        })
        .where(eq(turns.id, approval.turnId));
    }

    // Log the activity
    await logActivity(
      'approvals',
      'cancel',
      id,
      session.user.id,
      approval,
      cancelledApproval
    );

    return NextResponse.json({ message: "Approval cancelled successfully" });
  } catch (error) {
    console.error("Failed to cancel approval:", error);
    return NextResponse.json(
      { error: "Failed to cancel approval" },
      { status: 500 }
    );
  }
}