import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import { eq, desc, and, or } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const propertyId = searchParams.get("propertyId");
    const turnId = searchParams.get("turnId");
    const vendorId = searchParams.get("vendorId");
    const tableName = searchParams.get("tableName");
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build query conditions
    const conditions = [];
    
    if (propertyId) {
      conditions.push(eq(auditLogs.propertyId, propertyId));
    }
    
    if (turnId) {
      conditions.push(eq(auditLogs.turnId, turnId));
    }
    
    if (vendorId) {
      conditions.push(eq(auditLogs.vendorId, vendorId));
    }
    
    if (tableName) {
      conditions.push(eq(auditLogs.tableName, tableName));
    }
    
    if (userId) {
      conditions.push(eq(auditLogs.userId, userId));
    }

    // For non-admin users, only show their own audit logs or logs related to their properties
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      conditions.push(
        or(
          eq(auditLogs.userId, session.user.id),
          // Add more conditions based on user's access rights
        )
      );
    }

    // Execute query
    const query = db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);

    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    const logs = await query;

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}