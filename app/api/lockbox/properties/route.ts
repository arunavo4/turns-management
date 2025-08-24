import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { properties, lockBoxHistory, users } from "@/lib/db/schema";
import { eq, desc, sql, isNotNull } from "drizzle-orm";
import { auditService } from "@/lib/audit-service";
import { getSession } from "@/lib/auth-helpers";

// GET - Get all properties with lock box information
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
    const onlyWithLockBox = searchParams.get('withLockBox') === 'true';
    
    // Log access for security audit
    await auditService.log({
      tableName: 'properties',
      recordId: 'LOCKBOX_LIST',
      action: 'VIEW',
      context: 'Properties with lock box information viewed',
      metadata: { search, limit, offset, onlyWithLockBox }
    }, request);

    // Base query for properties with lock box info
    let propertiesQuery = db
      .select({
        propertyId: properties.id,
        propertyName: properties.name,
        address: properties.address,
        city: properties.city,
        state: properties.state,
        zipCode: properties.zipCode,
        status: properties.status,
        currentCode: properties.primaryLockBoxCode,
        location: properties.lockBoxLocation,
        installDate: properties.lockBoxInstallDate,
        notes: properties.lockBoxNotes,
      })
      .from(properties)
      .orderBy(properties.name)
      .limit(limit)
      .offset(offset);

    // Filter by properties that have lock box codes if requested
    if (onlyWithLockBox) {
      propertiesQuery = propertiesQuery.where(isNotNull(properties.primaryLockBoxCode));
    }

    // Apply search filter if provided
    if (search) {
      propertiesQuery = propertiesQuery.where(
        sql`${properties.name} ILIKE ${`%${search}%`} OR ${properties.address} ILIKE ${`%${search}%`} OR ${properties.primaryLockBoxCode} ILIKE ${`%${search}%`}`
      );
    }

    const propertiesResult = await propertiesQuery;

    // Get the most recent lock box change for each property
    const propertyIds = propertiesResult.map((p: { propertyId: string }) => p.propertyId);
    
    let recentChanges: Array<{
      propertyId: string;
      changeDate: number;
      changedBy: string | null;
      reason: string | null;
      changedByUser: {
        id: string;
        authUserId: string;
        role: string;
      } | null;
    }> = [];
    if (propertyIds.length > 0) {
      // Subquery to get the most recent change date for each property
      const recentChangesSubquery = db
        .select({
          propertyId: lockBoxHistory.propertyId,
          maxChangeDate: sql<number>`MAX(${lockBoxHistory.changeDate})`.as('maxChangeDate')
        })
        .from(lockBoxHistory)
        .where(sql`${lockBoxHistory.propertyId} = ANY(${propertyIds})`)
        .groupBy(lockBoxHistory.propertyId)
        .as('recent');

      // Get full details for the most recent changes
      recentChanges = await db
        .select({
          propertyId: lockBoxHistory.propertyId,
          changeDate: lockBoxHistory.changeDate,
          changedBy: lockBoxHistory.changedBy,
          reason: lockBoxHistory.reason,
          changedByUser: {
            id: users.id,
            authUserId: users.authUserId,
            role: users.role
          }
        })
        .from(lockBoxHistory)
        .innerJoin(recentChangesSubquery, eq(lockBoxHistory.propertyId, recentChangesSubquery.propertyId))
        .leftJoin(users, eq(lockBoxHistory.changedBy, users.id))
        .where(eq(lockBoxHistory.changeDate, recentChangesSubquery.maxChangeDate));
    }

    // Combine property data with recent change info
    const propertiesWithHistory = propertiesResult.map((property: any) => {
      const recentChange = recentChanges.find(change => change.propertyId === property.propertyId);
      return {
        ...property,
        lastChanged: recentChange?.changeDate,
        lastChangedBy: recentChange?.changedByUser?.authUserId,
        lastChangeReason: recentChange?.reason
      };
    });

    // Get total count for pagination
    let countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(properties);

    if (onlyWithLockBox) {
      countQuery = countQuery.where(isNotNull(properties.primaryLockBoxCode));
    }

    if (search) {
      countQuery = countQuery.where(
        sql`${properties.name} ILIKE ${`%${search}%`} OR ${properties.address} ILIKE ${`%${search}%`} OR ${properties.primaryLockBoxCode} ILIKE ${`%${search}%`}`
      );
    }

    const [{ count }] = await countQuery;

    return NextResponse.json({
      properties: propertiesWithHistory,
      total: count,
      limit,
      offset
    });
  } catch (error) {
    console.error("Error fetching properties with lock box info:", error);
    return NextResponse.json(
      { error: "Failed to fetch properties with lock box information" },
      { status: 500 }
    );
  }
}