import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { properties, lockBoxHistory, users } from "@/lib/db/schema";
import { eq, desc, like, sql } from "drizzle-orm";
import { auditService } from "@/lib/audit-service";
import { getSession } from "@/lib/auth-helpers";

// GET - Get all lock box history with optional filtering
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Log access for security audit
    await auditService.log({
      tableName: 'lock_box_history',
      recordId: 'ALL',
      action: 'VIEW',
      context: 'Lock box history list viewed',
      metadata: { search, limit, offset }
    }, request);

    let query = db
      .select({
        id: lockBoxHistory.id,
        propertyId: lockBoxHistory.propertyId,
        propertyName: properties.name,
        address: properties.address,
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
      .leftJoin(properties, eq(lockBoxHistory.propertyId, properties.id))
      .leftJoin(users, eq(lockBoxHistory.changedBy, users.id))
      .orderBy(desc(lockBoxHistory.changeDate))
      .limit(limit)
      .offset(offset);

    // Apply search filter if provided
    if (search) {
      query = query.where(
        sql`${properties.name} ILIKE ${`%${search}%`} OR ${properties.address} ILIKE ${`%${search}%`} OR ${lockBoxHistory.newLockBoxCode} ILIKE ${`%${search}%`}`
      );
    }

    const history = await query;

    // Get total count for pagination
    let countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(lockBoxHistory)
      .leftJoin(properties, eq(lockBoxHistory.propertyId, properties.id));

    if (search) {
      countQuery = countQuery.where(
        sql`${properties.name} ILIKE ${`%${search}%`} OR ${properties.address} ILIKE ${`%${search}%`} OR ${lockBoxHistory.newLockBoxCode} ILIKE ${`%${search}%`}`
      );
    }

    const [{ count }] = await countQuery;

    return NextResponse.json({
      history,
      total: count,
      limit,
      offset
    });
  } catch (error) {
    console.error("Error fetching lock box history:", error);
    return NextResponse.json(
      { error: "Failed to fetch lock box history" },
      { status: 500 }
    );
  }
}