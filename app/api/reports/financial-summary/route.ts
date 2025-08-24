import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { turns, properties, vendors, approvals } from "@/lib/db/schema";
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

    // Get financial overview
    const financialOverview = await db
      .select({
        totalEstimatedCost: sql<number>`COALESCE(SUM(${turns.estimatedCost}), 0)`,
        totalActualCost: sql<number>`COALESCE(SUM(${turns.actualCost}), 0)`,
        totalChangeOrders: sql<number>`0`,
        averageEstimatedCost: sql<number>`AVG(${turns.estimatedCost})`,
        averageActualCost: sql<number>`AVG(${turns.actualCost})`,
        totalTurns: sql<number>`COUNT(${turns.id})`,
        completedTurns: sql<number>`
          COUNT(CASE WHEN ${turns.status} = 'complete' THEN 1 END)
        `,
        inProgressTurns: sql<number>`
          COUNT(CASE WHEN ${turns.status} = 'in_progress' THEN 1 END)
        `,
        draftTurns: sql<number>`
          COUNT(CASE WHEN ${turns.status} = 'draft' THEN 1 END)
        `,
      })
      .from(turns)
      .where(dateFilter as any);

    const overview = financialOverview[0];

    // Get monthly financial trends
    const monthlyTrends = await db
      .select({
        month: sql<string>`TO_CHAR(TO_TIMESTAMP(${turns.createdAt}::bigint / 1000), 'YYYY-MM')`,
        estimatedCost: sql<number>`COALESCE(SUM(${turns.estimatedCost}), 0)`,
        actualCost: sql<number>`COALESCE(SUM(${turns.actualCost}), 0)`,
        changeOrders: sql<number>`0`,
        turnCount: sql<number>`COUNT(${turns.id})`,
        completedCount: sql<number>`
          COUNT(CASE WHEN ${turns.status} = 'complete' THEN 1 END)
        `,
      })
      .from(turns)
      .where(dateFilter as any)
      .groupBy(sql`TO_CHAR(TO_TIMESTAMP(${turns.createdAt}::bigint / 1000), 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(TO_TIMESTAMP(${turns.createdAt}::bigint / 1000), 'YYYY-MM')`);

    // Get cost breakdown by status
    const costByStatus = await db
      .select({
        status: turns.status,
        totalCost: sql<number>`COALESCE(SUM(${turns.actualCost}), 0)`,
        count: sql<number>`COUNT(${turns.id})`,
      })
      .from(turns)
      .where(dateFilter as any)
      .groupBy(turns.status);

    // Get approval statistics
    const approvalStats = await db
      .select({
        totalApprovals: sql<number>`COUNT(${approvals.id})`,
        pendingApprovals: sql<number>`
          COUNT(CASE WHEN ${approvals.status} = 'pending' THEN 1 END)
        `,
        approvedApprovals: sql<number>`
          COUNT(CASE WHEN ${approvals.status} = 'approved' THEN 1 END)
        `,
        rejectedApprovals: sql<number>`
          COUNT(CASE WHEN ${approvals.status} = 'rejected' THEN 1 END)
        `,
        totalApprovalAmount: sql<number>`
          COALESCE(SUM(CASE WHEN ${approvals.status} = 'approved' THEN ${approvals.amount} END), 0)
        `,
        averageApprovalTime: sql<number>`
          AVG(
            CASE 
              WHEN ${approvals.status} = 'approved' AND ${approvals.approvedAt} IS NOT NULL
              THEN (${approvals.approvedAt}::bigint - ${approvals.createdAt}::bigint) / 3600000
              ELSE NULL
            END
          )
        `,
      })
      .from(approvals);

    const approvalData = approvalStats[0];

    // Get top cost centers (properties with highest costs)
    const topCostCenters = await db
      .select({
        propertyId: properties.id,
        propertyName: properties.name,
        propertyAddress: properties.address,
        totalCost: sql<number>`COALESCE(SUM(${turns.actualCost}), 0)`,
        turnCount: sql<number>`COUNT(${turns.id})`,
        averageCostPerTurn: sql<number>`AVG(${turns.actualCost})`,
      })
      .from(properties)
      .leftJoin(turns, eq(turns.propertyId, properties.id))
      .where(dateFilter as any)
      .groupBy(properties.id, properties.name, properties.address)
      .orderBy(sql`COALESCE(SUM(${turns.actualCost}), 0) DESC`)
      .limit(10);

    // Calculate budget variance by property type/category
    const budgetVariance = await db
      .select({
        month: sql<string>`TO_CHAR(TO_TIMESTAMP(${turns.createdAt}::bigint / 1000), 'YYYY-MM')`,
        estimatedTotal: sql<number>`COALESCE(SUM(${turns.estimatedCost}), 0)`,
        actualTotal: sql<number>`COALESCE(SUM(${turns.actualCost}), 0)`,
        variance: sql<number>`
          COALESCE(SUM(${turns.actualCost}), 0) - COALESCE(SUM(${turns.estimatedCost}), 0)
        `,
        variancePercent: sql<number>`
          CASE 
            WHEN COALESCE(SUM(${turns.estimatedCost}), 0) > 0 
            THEN ((COALESCE(SUM(${turns.actualCost}), 0) - COALESCE(SUM(${turns.estimatedCost}), 0)) / COALESCE(SUM(${turns.estimatedCost}), 0)) * 100
            ELSE 0
          END
        `,
      })
      .from(turns)
      .where(
        and(
          dateFilter as any,
          sql`${turns.status} = 'complete'`
        )
      )
      .groupBy(sql`TO_CHAR(TO_TIMESTAMP(${turns.createdAt}::bigint / 1000), 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(TO_TIMESTAMP(${turns.createdAt}::bigint / 1000), 'YYYY-MM')`);

    // Calculate ROI metrics
    const roi = {
      totalInvestment: overview.totalActualCost,
      totalReturns: overview.completedTurns * 5000, // Assuming $5000 average rental income per completed turn
      roi: overview.totalActualCost > 0 
        ? ((overview.completedTurns * 5000 - overview.totalActualCost) / overview.totalActualCost) * 100 
        : 0,
      paybackPeriod: overview.completedTurns > 0 
        ? overview.totalActualCost / (overview.completedTurns * 5000 / 12) 
        : 0,
    };

    // Get vendor payment summary
    const vendorPayments = await db
      .select({
        vendorId: vendors.id,
        vendorName: vendors.companyName,
        totalPayments: sql<number>`COALESCE(SUM(${turns.actualCost}), 0)`,
        turnCount: sql<number>`COUNT(${turns.id})`,
        averagePayment: sql<number>`AVG(${turns.actualCost})`,
      })
      .from(vendors)
      .leftJoin(turns, eq(turns.vendorId, vendors.id))
      .where(
        and(
          dateFilter as any,
          sql`${turns.status} = 'complete'`
        )
      )
      .groupBy(vendors.id, vendors.companyName)
      .orderBy(sql`COALESCE(SUM(${turns.actualCost}), 0) DESC`)
      .limit(10);

    return NextResponse.json({
      overview: {
        totalEstimatedCost: overview.totalEstimatedCost,
        totalActualCost: overview.totalActualCost,
        totalChangeOrders: overview.totalChangeOrders,
        costVariance: overview.totalActualCost - overview.totalEstimatedCost,
        costVariancePercent: overview.totalEstimatedCost > 0
          ? ((overview.totalActualCost - overview.totalEstimatedCost) / overview.totalEstimatedCost) * 100
          : 0,
        averageEstimatedCost: Math.round(overview.averageEstimatedCost || 0),
        averageActualCost: Math.round(overview.averageActualCost || 0),
        totalTurns: overview.totalTurns,
        completedTurns: overview.completedTurns,
        inProgressTurns: overview.inProgressTurns,
        pendingApprovalTurns: overview.pendingApprovalTurns,
      },
      monthlyTrends: monthlyTrends.map((month: any) => ({
        month: month.month,
        estimatedCost: month.estimatedCost,
        actualCost: month.actualCost,
        changeOrders: month.changeOrders,
        turnCount: month.turnCount,
        completedCount: month.completedCount,
        costPerTurn: month.turnCount > 0 ? month.actualCost / month.turnCount : 0,
      })),
      costByStatus: costByStatus.map((status: any) => ({
        status: status.status,
        totalCost: status.totalCost,
        count: status.count,
        averageCost: status.count > 0 ? status.totalCost / status.count : 0,
      })),
      approvals: {
        total: approvalData.totalApprovals,
        pending: approvalData.pendingApprovals,
        approved: approvalData.approvedApprovals,
        rejected: approvalData.rejectedApprovals,
        totalApprovedAmount: approvalData.totalApprovalAmount,
        averageApprovalTimeHours: Math.round(approvalData.averageApprovalTime || 0),
        approvalRate: approvalData.totalApprovals > 0
          ? (approvalData.approvedApprovals / approvalData.totalApprovals) * 100
          : 0,
      },
      topCostCenters: topCostCenters.map((property: any) => ({
        id: property.propertyId,
        name: property.propertyName,
        address: property.propertyAddress,
        totalCost: property.totalCost,
        turnCount: property.turnCount,
        averageCostPerTurn: Math.round(property.averageCostPerTurn || 0),
      })),
      budgetVariance: budgetVariance.map((month: any) => ({
        month: month.month,
        estimated: month.estimatedTotal,
        actual: month.actualTotal,
        variance: month.variance,
        variancePercent: Math.round(month.variancePercent || 0),
        status: month.variance > 0 ? "over" : month.variance < 0 ? "under" : "on",
      })),
      roi,
      vendorPayments: vendorPayments.map((vendor: any) => ({
        id: vendor.vendorId,
        name: vendor.vendorName,
        totalPayments: vendor.totalPayments,
        turnCount: vendor.turnCount,
        averagePayment: Math.round(vendor.averagePayment || 0),
      })),
    });
  } catch (error) {
    console.error("Error generating financial summary report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}