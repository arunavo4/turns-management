import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { turns, turnStages, turnStageHistory } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth-helpers";
import { auditService } from "@/lib/audit-service";

// POST /api/turns/[id]/transition - Transition turn to new stage
export async function POST(
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

    const session = await getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { toStageId, reason } = body;
    const { id } = await params;

    if (!toStageId) {
      return NextResponse.json(
        { error: "Target stage ID is required" },
        { status: 400 }
      );
    }

    // Get current turn with stage
    const [currentTurn] = await db
      .select()
      .from(turns)
      .where(eq(turns.id, id))
      .limit(1);

    if (!currentTurn) {
      return NextResponse.json(
        { error: "Turn not found" },
        { status: 404 }
      );
    }

    // Get target stage
    const [targetStage] = await db
      .select()
      .from(turnStages)
      .where(eq(turnStages.id, toStageId))
      .limit(1);

    if (!targetStage) {
      return NextResponse.json(
        { error: "Target stage not found" },
        { status: 404 }
      );
    }

    // Calculate duration in previous stage
    let durationInStage = null;
    if (currentTurn.stageEnteredAt) {
      durationInStage = Date.now() - Number(currentTurn.stageEnteredAt);
    }

    // Record stage transition history
    if (currentTurn.stageId || toStageId) {
      await db.insert(turnStageHistory).values({
        turnId: id,
        fromStageId: currentTurn.stageId,
        toStageId: toStageId,
        transitionedBy: session.user.email || session.user.id,
        transitionReason: reason,
        durationInStage: durationInStage,
      });
    }

    // Update turn with new stage and auto-status
    const updateData: {
      stageId: string;
      stageEnteredAt: number;
      updatedAt: number;
      status?: string;
    } = {
      stageId: toStageId,
      stageEnteredAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Set auto-status if configured
    if (targetStage.autoStatus) {
      const statusMap: Record<string, string> = {
        'DRAFT': 'draft',
        'PENDING': 'secure_property',
        'IN_PROGRESS': 'in_progress',
        'ON_HOLD': 'change_order',
        'COMPLETED': 'complete'
      };
      
      if (statusMap[targetStage.autoStatus]) {
        updateData.status = statusMap[targetStage.autoStatus];
      }
    }

    // Update turn
    const [updatedTurn] = await db
      .update(turns)
      .set(updateData)
      .where(eq(turns.id, id))
      .returning();

    // Log the transition
    const changedFields = auditService.calculateChangedFields(currentTurn, updatedTurn);
    await auditService.log({
      tableName: 'turns',
      recordId: id,
      action: 'UPDATE',
      oldValues: currentTurn,
      newValues: updatedTurn,
      changedFields,
      turnId: id,
      propertyId: updatedTurn.propertyId,
      vendorId: updatedTurn.vendorId,
      context: `Stage transition: ${currentTurn.stageId ? 'from previous stage' : 'initial'} to ${targetStage.name}`,
    }, request);

    // Check if approval is needed for this stage
    if (targetStage.requiresApproval && updatedTurn.estimatedCost) {
      // Trigger approval workflow
      const approvalResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/approvals`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('cookie') || '',
          },
          body: JSON.stringify({
            turnId: id,
            amount: updatedTurn.estimatedCost,
            notes: `Approval required for stage: ${targetStage.name}`,
          }),
        }
      );

      if (!approvalResponse.ok) {
        console.error('Failed to create approval request for stage transition');
      }
    }

    return NextResponse.json({
      turn: updatedTurn,
      stage: targetStage,
      transitionHistory: {
        fromStageId: currentTurn.stageId,
        toStageId: toStageId,
        durationInPreviousStage: durationInStage,
      },
    });
  } catch (error) {
    console.error("Error transitioning turn stage:", error);
    return NextResponse.json(
      { error: "Failed to transition turn stage" },
      { status: 500 }
    );
  }
}