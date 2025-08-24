import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { turnStages } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

// GET /api/turn-stages - Get all active stages
export async function GET(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 503 }
      );
    }

    const stages = await db
      .select()
      .from(turnStages)
      .orderBy(asc(turnStages.sequence));

    return NextResponse.json(stages);
  } catch (error) {
    console.error("Error fetching turn stages:", error);
    return NextResponse.json(
      { error: "Failed to fetch turn stages" },
      { status: 500 }
    );
  }
}
