import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { properties, turns, vendors } from "@/lib/db/schema";

// GET - Get dashboard statistics
export async function GET() {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 503 }
      );
    }

    // Get all records and count them
    const allProperties = await db.select().from(properties);
    const allTurns = await db.select().from(turns);
    const allVendors = await db.select().from(vendors);
    
    // Count active turns
    const activeTurns = allTurns.filter(
      turn => turn.status !== 'completed' && turn.status !== 'cancelled'
    );
    
    // Count approved vendors
    const approvedVendors = allVendors.filter(vendor => vendor.isApproved);

    return NextResponse.json({
      properties: allProperties.length,
      turns: allTurns.length,
      activeTurns: activeTurns.length,
      vendors: allVendors.length,
      approvedVendors: approvedVendors.length,
      reports: 0, // Placeholder for reports count
      users: 0, // Placeholder for users count
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}