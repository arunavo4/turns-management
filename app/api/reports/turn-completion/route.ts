import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { turns, properties, vendors, turnStages } from "@/lib/db/schema";
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
    const groupBy = searchParams.get("groupBy") || "month";

    let dateFilter: any = sql`1=1`;
    if (startDate && endDate) {
      const filter = and(
        gte(turns.turnCompletionDate, new Date(startDate).getTime()),
        lte(turns.turnCompletionDate, new Date(endDate).getTime())
      );
      if (filter) {
        dateFilter = filter;
      }
    }

    // Get completed turns with property and vendor details
    const completedTurns = await db
      .select({
        id: turns.id,
        turnNumber: turns.turnNumber,
        status: turns.status,
        turnCompletionDate: turns.turnCompletionDate,
        createdAt: turns.createdAt,
        estimatedCost: turns.estimatedCost,
        actualCost: turns.actualCost,
        propertyName: properties.name,
        propertyAddress: properties.address,
        vendorName: vendors.companyName,
        durationDays: sql<number>`
          CASE 
            WHEN ${turns.turnCompletionDate} IS NOT NULL 
            THEN EXTRACT(DAY FROM TO_TIMESTAMP(${turns.turnCompletionDate}::bigint / 1000) - TO_TIMESTAMP(${turns.createdAt}::bigint / 1000))
            ELSE NULL
          END
        `,
      })
      .from(turns)
      .leftJoin(properties, eq(properties.id, turns.propertyId))
      .leftJoin(vendors, eq(vendors.id, turns.vendorId))
      .where(
        and(
          eq(turns.status, "complete"),
          dateFilter as any
        )
      )
      .orderBy(turns.turnCompletionDate);

    // Calculate summary metrics
    const totalTurns = completedTurns.length;
    const totalEstimatedCost = completedTurns.reduce(
      (sum: number, turn: any) => sum + (turn.estimatedCost || 0),
      0
    );
    const totalActualCost = completedTurns.reduce(
      (sum: number, turn: any) => sum + (turn.actualCost || 0),
      0
    );
    const averageDuration =
      completedTurns.reduce((sum: number, turn: any) => sum + (turn.durationDays || 0), 0) /
      totalTurns || 0;

    // Group by time period
    const groupedData: Record<string, any> = {};
    completedTurns.forEach((turn: any) => {
      if (!turn.turnCompletionDate) return;
      
      const date = new Date(turn.turnCompletionDate);
      let key = "";
      
      if (groupBy === "day") {
        key = date.toISOString().split("T")[0];
      } else if (groupBy === "week") {
        const weekNum = getWeekNumber(date);
        key = `${date.getFullYear()}-W${weekNum}`;
      } else if (groupBy === "month") {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      } else if (groupBy === "quarter") {
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        key = `${date.getFullYear()}-Q${quarter}`;
      } else if (groupBy === "year") {
        key = String(date.getFullYear());
      }

      if (!groupedData[key]) {
        groupedData[key] = {
          period: key,
          count: 0,
          estimatedCost: 0,
          actualCost: 0,
          turns: [],
        };
      }

      groupedData[key].count++;
      groupedData[key].estimatedCost += turn.estimatedCost || 0;
      groupedData[key].actualCost += turn.actualCost || 0;
      groupedData[key].turns.push(turn);
    });

    // Convert to array and sort
    const chartData = Object.values(groupedData).sort((a: any, b: any) =>
      a.period.localeCompare(b.period)
    );

    // Get top vendors by completion count
    const vendorStats: Record<string, any> = {};
    completedTurns.forEach((turn: any) => {
      if (!turn.vendorName) return;
      
      if (!vendorStats[turn.vendorName]) {
        vendorStats[turn.vendorName] = {
          name: turn.vendorName,
          count: 0,
          totalCost: 0,
          averageDuration: 0,
          durations: [],
        };
      }
      
      vendorStats[turn.vendorName].count++;
      vendorStats[turn.vendorName].totalCost += turn.actualCost || 0;
      if (turn.durationDays) {
        vendorStats[turn.vendorName].durations.push(turn.durationDays);
      }
    });

    // Calculate average durations for vendors
    Object.values(vendorStats).forEach((vendor: any) => {
      if (vendor.durations.length > 0) {
        vendor.averageDuration =
          vendor.durations.reduce((sum: number, d: number) => sum + d, 0) /
          vendor.durations.length;
      }
      delete vendor.durations;
    });

    const topVendors = Object.values(vendorStats)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10);

    return NextResponse.json({
      summary: {
        totalTurns,
        totalEstimatedCost,
        totalActualCost,
        costVariance: totalActualCost - totalEstimatedCost,
        costVariancePercent:
          totalEstimatedCost > 0
            ? ((totalActualCost - totalEstimatedCost) / totalEstimatedCost) * 100
            : 0,
        averageDuration: Math.round(averageDuration),
        averageCostPerTurn: totalActualCost / totalTurns || 0,
      },
      chartData,
      topVendors,
      details: completedTurns,
    });
  } catch (error) {
    console.error("Error generating turn completion report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}