import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { turns, vendors } from "@/lib/db/schema";
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

    // Get vendor performance metrics
    const vendorMetrics = await db
      .select({
        vendorId: vendors.id,
        vendorName: vendors.companyName,
        vendorEmail: vendors.email,
        vendorPhone: vendors.phone,
        vendorRating: vendors.rating,
        totalTurns: sql<number>`COUNT(${turns.id})`,
        completedTurns: sql<number>`
          COUNT(CASE WHEN ${turns.status} = 'complete' THEN 1 END)
        `,
        inProgressTurns: sql<number>`
          COUNT(CASE WHEN ${turns.status} = 'in_progress' THEN 1 END)
        `,
        changeOrderTurns: sql<number>`
          COUNT(CASE WHEN ${turns.status} = 'change_order' THEN 1 END)
        `,
        totalRevenue: sql<number>`
          COALESCE(SUM(${turns.actualCost}), 0)
        `,
        averageTurnCost: sql<number>`
          AVG(${turns.actualCost})
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
        costVariance: sql<number>`
          AVG(
            CASE 
              WHEN ${turns.estimatedCost} > 0 
              THEN ((${turns.actualCost} - ${turns.estimatedCost}) / ${turns.estimatedCost}) * 100
              ELSE 0
            END
          )
        `,
        onTimeCompletionRate: sql<number>`
          (COUNT(
            CASE 
              WHEN ${turns.turnCompletionDate} IS NOT NULL 
                AND ${turns.turnCompletionDate} <= ${turns.turnDueDate}
              THEN 1 
            END
          ) * 100.0 / NULLIF(COUNT(CASE WHEN ${turns.turnCompletionDate} IS NOT NULL THEN 1 END), 0))
        `,
        lastTurnDate: sql<string>`MAX(${turns.createdAt})`,
      })
      .from(vendors)
      .leftJoin(turns, eq(turns.vendorId, vendors.id))
      .where(dateFilter as any)
      .groupBy(vendors.id, vendors.companyName, vendors.email, vendors.phone, vendors.rating)
      .orderBy(sql`COUNT(${turns.id}) DESC`);

    // Calculate summary statistics
    const totalVendors = vendorMetrics.length;
    const activeVendors = vendorMetrics.filter((v: any) => v.totalTurns > 0).length;
    const totalTurnsAllVendors = vendorMetrics.reduce(
      (sum: number, v: any) => sum + (v.totalTurns || 0),
      0
    );
    const totalRevenueAllVendors = vendorMetrics.reduce(
      (sum: number, v: any) => sum + (v.totalRevenue || 0),
      0
    );

    // Calculate vendor rankings
    const vendorRankings = vendorMetrics
      .filter((v: any) => v.completedTurns > 0)
      .map((v: any) => ({
        id: v.vendorId,
        name: v.vendorName,
        email: v.vendorEmail,
        phone: v.vendorPhone,
        rating: v.vendorRating,
        completedTurns: v.completedTurns,
        totalRevenue: v.totalRevenue,
        averageTurnCost: Math.round(v.averageTurnCost || 0),
        averageDuration: Math.round(v.averageTurnDuration || 0),
        onTimeRate: Math.round(v.onTimeCompletionRate || 0),
        costVariance: Math.round(v.costVariance || 0),
        completionRate: v.totalTurns > 0 
          ? Math.round((v.completedTurns / v.totalTurns) * 100) 
          : 0,
        performanceScore: calculatePerformanceScore(v),
      }))
      .sort((a: any, b: any) => b.performanceScore - a.performanceScore);

    // Get top performers
    const topPerformers = vendorRankings.slice(0, 5);

    // Get vendors needing improvement
    const needsImprovement = vendorRankings
      .filter((v: any) => v.performanceScore < 60)
      .slice(0, 5);

    // Get vendor distribution by rating
    const ratingDistribution = [
      { rating: "5 stars", count: vendorMetrics.filter((v: any) => v.vendorRating === 5).length },
      { rating: "4 stars", count: vendorMetrics.filter((v: any) => v.vendorRating === 4).length },
      { rating: "3 stars", count: vendorMetrics.filter((v: any) => v.vendorRating === 3).length },
      { rating: "2 stars", count: vendorMetrics.filter((v: any) => v.vendorRating === 2).length },
      { rating: "1 star", count: vendorMetrics.filter((v: any) => v.vendorRating === 1).length },
      { rating: "Not rated", count: vendorMetrics.filter((v: any) => !v.vendorRating).length },
    ];

    // Calculate monthly trends for top vendors
    const topVendorIds = topPerformers.slice(0, 3).map((v: any) => v.id);
    const monthlyTrends: Record<string, any> = {};

    if (topVendorIds.length > 0) {
      const trendData = await db
        .select({
          vendorId: turns.vendorId,
          month: sql<string>`TO_CHAR(${turns.createdAt}, 'YYYY-MM')`,
          turnCount: sql<number>`COUNT(${turns.id})`,
          revenue: sql<number>`COALESCE(SUM(${turns.actualCost}), 0)`,
        })
        .from(turns)
        .where(
          and(
            sql`${turns.vendorId} = ANY(${topVendorIds})`,
            dateFilter as any
          )
        )
        .groupBy(turns.vendorId, sql`TO_CHAR(${turns.createdAt}, 'YYYY-MM')`)
        .orderBy(sql`TO_CHAR(${turns.createdAt}, 'YYYY-MM')`);

      trendData.forEach((row: any) => {
        const vendorName = vendorMetrics.find((v: any) => v.vendorId === row.vendorId)?.vendorName || "Unknown";
        if (!monthlyTrends[row.month]) {
          monthlyTrends[row.month] = { month: row.month };
        }
        monthlyTrends[row.month][vendorName] = row.revenue;
      });
    }

    const trendChartData = Object.values(monthlyTrends);

    return NextResponse.json({
      summary: {
        totalVendors,
        activeVendors,
        inactiveVendors: totalVendors - activeVendors,
        totalTurns: totalTurnsAllVendors,
        totalRevenue: totalRevenueAllVendors,
        averageTurnsPerVendor: totalTurnsAllVendors / activeVendors || 0,
        averageRevenuePerVendor: totalRevenueAllVendors / activeVendors || 0,
      },
      topPerformers,
      needsImprovement,
      ratingDistribution,
      trendChartData,
      rankings: vendorRankings,
      details: vendorMetrics.map((v: any) => ({
        id: v.vendorId,
        name: v.vendorName,
        email: v.vendorEmail,
        phone: v.vendorPhone,
        rating: v.vendorRating,
        totalTurns: v.totalTurns,
        completedTurns: v.completedTurns,
        inProgressTurns: v.inProgressTurns,
        cancelledTurns: v.cancelledTurns,
        totalRevenue: v.totalRevenue,
        averageTurnCost: Math.round(v.averageTurnCost || 0),
        averageDuration: Math.round(v.averageTurnDuration || 0),
        onTimeRate: Math.round(v.onTimeCompletionRate || 0),
        costVariance: Math.round(v.costVariance || 0),
        lastTurnDate: v.lastTurnDate,
      })),
    });
  } catch (error) {
    console.error("Error generating vendor performance report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}

function calculatePerformanceScore(vendor: any): number {
  let score = 0;
  
  // Rating (30 points max)
  score += (vendor.vendorRating || 0) * 6;
  
  // On-time completion (30 points max)
  score += (vendor.onTimeCompletionRate || 0) * 0.3;
  
  // Completion rate (20 points max)
  const completionRate = vendor.totalTurns > 0 
    ? (vendor.completedTurns / vendor.totalTurns) * 100 
    : 0;
  score += completionRate * 0.2;
  
  // Cost variance (20 points max - negative variance is good)
  const costVarianceScore = vendor.costVariance <= 0 
    ? 20 
    : Math.max(0, 20 - Math.abs(vendor.costVariance) * 0.5);
  score += costVarianceScore;
  
  return Math.round(Math.min(100, Math.max(0, score)));
}