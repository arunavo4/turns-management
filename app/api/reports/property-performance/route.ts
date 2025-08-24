import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { turns, properties } from "@/lib/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let dateFilter: any = sql`1=1`;
    if (startDate && endDate) {
      const filter = and(
        gte(turns.createdAt, new Date(startDate).getTime()),
        lte(turns.createdAt, new Date(endDate).getTime())
      );
      if (filter) {
        dateFilter = filter;
      }
    }

    // Get property performance metrics
    const propertyMetrics = await db
      .select({
        propertyId: properties.id,
        propertyName: properties.name,
        propertyAddress: properties.address,
        propertyCity: properties.city,
        propertyState: properties.state,
        totalTurns: sql<number>`COUNT(${turns.id})`,
        completedTurns: sql<number>`
          COUNT(CASE WHEN ${turns.status} = 'complete' THEN 1 END)
        `,
        inProgressTurns: sql<number>`
          COUNT(CASE WHEN ${turns.status} = 'in_progress' THEN 1 END)
        `,
        totalEstimatedCost: sql<number>`
          COALESCE(SUM(${turns.estimatedCost}), 0)
        `,
        totalActualCost: sql<number>`
          COALESCE(SUM(${turns.actualCost}), 0)
        `,
        averageTurnDuration: sql<number>`
          AVG(
            CASE 
              WHEN ${turns.turnCompletionDate} IS NOT NULL 
              THEN EXTRACT(DAY FROM TO_TIMESTAMP(${turns.turnCompletionDate}::bigint / 1000) - TO_TIMESTAMP(${turns.createdAt}::bigint / 1000))
              ELSE NULL
            END
          )
        `,
        lastTurnDate: sql<string>`MAX(${turns.createdAt})`,
      })
      .from(properties)
      .leftJoin(turns, eq(turns.propertyId, properties.id))
      .where(dateFilter as any)
      .groupBy(properties.id, properties.name, properties.address, properties.city, properties.state)
      .orderBy(sql`COUNT(${turns.id}) DESC`);

    // Calculate summary statistics
    const totalProperties = propertyMetrics.length;
    const activeProperties = propertyMetrics.filter((p: any) => p.totalTurns > 0).length;
    const totalTurnsAllProperties = propertyMetrics.reduce(
      (sum: number, p: any) => sum + (p.totalTurns || 0),
      0
    );
    const totalCostAllProperties = propertyMetrics.reduce(
      (sum: number, p: any) => sum + (p.totalActualCost || 0),
      0
    );

    // Get properties by city
    const cityStats: Record<string, any> = {};
    propertyMetrics.forEach((property: any) => {
      const city = property.propertyCity || "Unknown";
      
      if (!cityStats[city]) {
        cityStats[city] = {
          city,
          propertyCount: 0,
          turnCount: 0,
          totalCost: 0,
        };
      }
      
      cityStats[city].propertyCount++;
      cityStats[city].turnCount += property.totalTurns || 0;
      cityStats[city].totalCost += property.totalActualCost || 0;
    });

    const cityData = Object.values(cityStats).sort(
      (a: any, b: any) => b.turnCount - a.turnCount
    );

    // Get properties by state
    const stateStats: Record<string, any> = {};
    propertyMetrics.forEach((property: any) => {
      const state = property.propertyState || "Unknown";
      
      if (!stateStats[state]) {
        stateStats[state] = {
          state,
          propertyCount: 0,
          turnCount: 0,
          totalCost: 0,
        };
      }
      
      stateStats[state].propertyCount++;
      stateStats[state].turnCount += property.totalTurns || 0;
      stateStats[state].totalCost += property.totalActualCost || 0;
    });

    const stateData = Object.values(stateStats).sort(
      (a: any, b: any) => b.turnCount - a.turnCount
    );

    // Get top performing properties (most turns completed)
    const topProperties = propertyMetrics
      .filter((p: any) => p.completedTurns > 0)
      .sort((a: any, b: any) => b.completedTurns - a.completedTurns)
      .slice(0, 10)
      .map((p: any) => ({
        id: p.propertyId,
        name: p.propertyName,
        address: p.propertyAddress,
        city: p.propertyCity,
        state: p.propertyState,
        completedTurns: p.completedTurns,
        totalCost: p.totalActualCost,
        averageDuration: Math.round(p.averageTurnDuration || 0),
        completionRate: p.totalTurns > 0 
          ? (p.completedTurns / p.totalTurns) * 100 
          : 0,
      }));

    // Get properties with issues (high cost variance or long durations)
    const problemProperties = propertyMetrics
      .filter((p: any) => {
        const costVariance = p.totalActualCost - p.totalEstimatedCost;
        const costVariancePercent = p.totalEstimatedCost > 0 
          ? (costVariance / p.totalEstimatedCost) * 100 
          : 0;
        return costVariancePercent > 20 || p.averageTurnDuration > 30;
      })
      .slice(0, 10)
      .map((p: any) => ({
        id: p.propertyId,
        name: p.propertyName,
        address: p.propertyAddress,
        issue: p.averageTurnDuration > 30 
          ? "Long turn duration" 
          : "High cost variance",
        costVariance: p.totalActualCost - p.totalEstimatedCost,
        averageDuration: Math.round(p.averageTurnDuration || 0),
      }));

    return NextResponse.json({
      summary: {
        totalProperties,
        activeProperties,
        inactiveProperties: totalProperties - activeProperties,
        totalTurns: totalTurnsAllProperties,
        totalCost: totalCostAllProperties,
        averageTurnsPerProperty: totalTurnsAllProperties / activeProperties || 0,
        averageCostPerProperty: totalCostAllProperties / activeProperties || 0,
      },
      cityData,
      stateData,
      topProperties,
      problemProperties,
      details: propertyMetrics.map((p: any) => ({
        id: p.propertyId,
        name: p.propertyName,
        address: p.propertyAddress,
        city: p.propertyCity,
        state: p.propertyState,
        totalTurns: p.totalTurns,
        completedTurns: p.completedTurns,
        inProgressTurns: p.inProgressTurns,
        totalCost: p.totalActualCost,
        averageDuration: Math.round(p.averageTurnDuration || 0),
        lastTurnDate: p.lastTurnDate,
      })),
    });
  } catch (error) {
    console.error("Error generating property performance report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}