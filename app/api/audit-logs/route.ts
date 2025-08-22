import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import { eq, desc, and, or } from "drizzle-orm";
import { getSession } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    // Check database connection
    if (!db) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 503 }
      );
    }

    // Get session - but don't require it for now
    const session = await getSession(request);

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
    if (session?.user && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      // Only add userId condition if we have a valid user ID
      if (session.user.id) {
        conditions.push(
          or(
            eq(auditLogs.userId, session.user.id),
            // Add more conditions based on user's access rights
          )
        );
      }
    }

    // Execute query
    let query;
    
    if (conditions.length > 0) {
      query = db
        .select()
        .from(auditLogs)
        .where(and(...conditions))
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit)
        .offset(offset);
    } else {
      query = db
        .select()
        .from(auditLogs)
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit)
        .offset(offset);
    }

    const logs = await query;

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch audit logs",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}