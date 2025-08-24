import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { properties, lockBoxHistory, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { auditService } from "@/lib/audit-service";
import { getSession } from "@/lib/auth-helpers";
import { LockBoxUpdateRequest } from "@/types/lockbox";

// GET - Get lock box history for a property
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
    
    // Log view action for security audit
    await auditService.log({
      tableName: 'lock_box_history',
      recordId: id,
      action: 'VIEW',
      propertyId: id,
      context: 'Lock box history viewed',
    }, request);

    // Get lock box history with user information
    const history = await db
      .select({
        id: lockBoxHistory.id,
        propertyId: lockBoxHistory.propertyId,
        turnId: lockBoxHistory.turnId,
        lockBoxInstallDate: lockBoxHistory.lockBoxInstallDate,
        lockBoxLocation: lockBoxHistory.lockBoxLocation,
        oldLockBoxCode: lockBoxHistory.oldLockBoxCode,
        newLockBoxCode: lockBoxHistory.newLockBoxCode,
        changeDate: lockBoxHistory.changeDate,
        changedBy: lockBoxHistory.changedBy,
        reason: lockBoxHistory.reason,
        createdAt: lockBoxHistory.createdAt,
        updatedAt: lockBoxHistory.updatedAt,
        changedByUser: {
          id: users.id,
          authUserId: users.authUserId,
          role: users.role
        }
      })
      .from(lockBoxHistory)
      .leftJoin(users, eq(lockBoxHistory.changedBy, users.id))
      .where(eq(lockBoxHistory.propertyId, id))
      .orderBy(desc(lockBoxHistory.changeDate));

    return NextResponse.json(history);
  } catch (error) {
    console.error("Error fetching lock box history:", error);
    return NextResponse.json(
      { error: "Failed to fetch lock box history" },
      { status: 500 }
    );
  }
}

// POST - Update lock box information
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

    const session = await getSession(request as any);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body: LockBoxUpdateRequest = await request.json();
    const { id } = await params;
    
    // Get current property data
    const currentProperty = await db
      .select()
      .from(properties)
      .where(eq(properties.id, id))
      .limit(1);
    
    if (currentProperty.length === 0) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    const property = currentProperty[0];
    const updateData: Partial<typeof properties.$inferInsert> = {
      updatedAt: Date.now()
    };

    // Track what changed for history
    const historyEntry: Partial<typeof lockBoxHistory.$inferInsert> = {
      propertyId: id,
      changeDate: Date.now(),
      changedBy: session.user.id,
      reason: body.reason
    };

    // Handle code change
    if (body.newCode !== undefined) {
      historyEntry.oldLockBoxCode = property.primaryLockBoxCode;
      historyEntry.newLockBoxCode = body.newCode;
      updateData.primaryLockBoxCode = body.newCode;
    }

    // Handle location change
    if (body.location !== undefined) {
      historyEntry.lockBoxLocation = body.location;
      updateData.lockBoxLocation = body.location;
    }

    // Handle install date change
    if (body.installDate !== undefined) {
      historyEntry.lockBoxInstallDate = body.installDate;
      updateData.lockBoxInstallDate = body.installDate;
    }

    // Handle notes change
    if (body.notes !== undefined) {
      updateData.lockBoxNotes = body.notes;
    }

    // Update property in database
    const updatedProperty = await db
      .update(properties)
      .set(updateData)
      .where(eq(properties.id, id))
      .returning();

    if (updatedProperty.length === 0) {
      return NextResponse.json(
        { error: "Failed to update property" },
        { status: 500 }
      );
    }

    // Create history entry if there were significant changes
    if (historyEntry.oldLockBoxCode || historyEntry.newLockBoxCode || historyEntry.lockBoxLocation) {
      await db.insert(lockBoxHistory).values(historyEntry);
    }

    // Log the update in audit log
    const changedFields = auditService.calculateChangedFields(property, updatedProperty[0]);
    await auditService.log({
      tableName: 'properties',
      recordId: id,
      action: 'UPDATE',
      oldValues: property,
      newValues: updatedProperty[0],
      changedFields,
      propertyId: id,
      context: 'Lock box information updated',
      metadata: {
        lockBoxUpdate: true,
        reason: body.reason
      }
    }, request);

    return NextResponse.json({
      success: true,
      property: updatedProperty[0]
    });
  } catch (error) {
    console.error("Error updating lock box:", error);
    return NextResponse.json(
      { error: "Failed to update lock box information" },
      { status: 500 }
    );
  }
}