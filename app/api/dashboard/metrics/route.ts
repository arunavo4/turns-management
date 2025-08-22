import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { properties, turns, vendors, turnHistory } from "@/lib/db/schema";
import { eq, and, sql, gte, lte, desc } from "drizzle-orm";

export async function GET() {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 503 }
      );
    }

    // Get current date info
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getTime();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).getTime();

    // Fetch all properties
    const allProperties = await db.select().from(properties);
    const activeProperties = allProperties.filter(p => p.status === 'active').length;
    const lastMonthProperties = allProperties.filter(p => 
      p.createdAt && p.createdAt >= startOfLastMonth && p.createdAt <= endOfLastMonth
    ).length;

    // Fetch all turns
    const allTurns = await db.select().from(turns);
    const activeTurns = allTurns.filter(t => 
      t.status !== 'completed' && t.status !== 'cancelled'
    ).length;
    
    // Calculate overdue turns
    const overdueTurns = allTurns.filter(t => {
      if (!t.turnDueDate || t.status === 'completed' || t.status === 'cancelled') return false;
      return t.turnDueDate < Date.now();
    }).length;

    // Calculate completed turns this month
    const completedTurnsThisMonth = allTurns.filter(t => 
      t.status === 'completed' && 
      t.updatedAt >= startOfMonth && 
      t.updatedAt <= endOfMonth
    ).length;

    // Calculate monthly revenue (sum of actual costs for completed turns this month)
    const monthlyRevenue = allTurns
      .filter(t => 
        t.status === 'completed' && 
        t.updatedAt >= startOfMonth && 
        t.updatedAt <= endOfMonth
      )
      .reduce((sum, turn) => {
        const cost = turn.actualCost ? parseFloat(turn.actualCost) : 0;
        return sum + cost;
      }, 0);

    // Calculate average turn time (in days)
    const completedTurns = allTurns.filter(t => t.status === 'completed');
    let averageTurnTime = 0;
    if (completedTurns.length > 0) {
      const totalDays = completedTurns.reduce((sum, turn) => {
        if (turn.createdAt && turn.updatedAt) {
          const days = Math.ceil((turn.updatedAt - turn.createdAt) / (1000 * 60 * 60 * 24));
          return sum + days;
        }
        return sum;
      }, 0);
      averageTurnTime = totalDays / completedTurns.length;
    }

    // Calculate completion rate
    const totalTurnsThisMonth = allTurns.filter(t => 
      t.createdAt >= startOfMonth && t.createdAt <= endOfMonth
    ).length;
    const completionRate = totalTurnsThisMonth > 0 
      ? Math.round((completedTurnsThisMonth / totalTurnsThisMonth) * 100)
      : 0;

    // Get pending approvals (turns with high cost that need approval)
    const approvalsPending = allTurns.filter(t => {
      const cost = t.estimatedCost ? parseFloat(t.estimatedCost) : 0;
      return cost > 3000 && t.status === 'scope_review';
    }).length;

    // Fetch recent turns with property and vendor info
    const recentTurnsData = await db
      .select({
        turn: turns,
        property: properties,
        vendor: vendors,
      })
      .from(turns)
      .leftJoin(properties, eq(turns.propertyId, properties.id))
      .leftJoin(vendors, eq(turns.vendorId, vendors.id))
      .orderBy(desc(turns.createdAt))
      .limit(5);

    // Fetch recent properties
    const recentProperties = await db
      .select()
      .from(properties)
      .orderBy(desc(properties.createdAt))
      .limit(3);

    // Calculate monthly targets based on historical data
    const lastThreeMonths = new Date(now.getFullYear(), now.getMonth() - 3, 1).getTime();
    const historicalTurns = allTurns.filter(t => 
      t.createdAt >= lastThreeMonths && t.createdAt < startOfMonth
    );
    
    // Average turns per month from last 3 months (or default to current active properties * 0.3)
    const monthlyTurnTarget = historicalTurns.length > 0 
      ? Math.round(historicalTurns.length / 3)
      : Math.max(10, Math.round(activeProperties * 0.3));
    
    // Calculate revenue target based on historical average + 10% growth
    const historicalRevenue = allTurns
      .filter(t => 
        t.status === 'completed' && 
        t.updatedAt >= lastThreeMonths && 
        t.updatedAt < startOfMonth
      )
      .reduce((sum, turn) => {
        const cost = turn.actualCost ? parseFloat(turn.actualCost) : 0;
        return sum + cost;
      }, 0);
    
    const monthlyRevenueTarget = historicalRevenue > 0
      ? Math.round((historicalRevenue / 3) * 1.1) // 10% growth target
      : 50000; // Default target for new systems

    return NextResponse.json({
      metrics: {
        activeProperties,
        activeTurns,
        overdueTurns,
        monthlyRevenue,
        averageTurnTime,
        completionRate,
        completedTurnsThisMonth,
        approvalsPending,
        propertyGrowth: activeProperties - lastMonthProperties,
        monthlyTurnTarget,
        monthlyRevenueTarget,
      },
      recentTurns: recentTurnsData,
      recentProperties,
    });
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard metrics" },
      { status: 500 }
    );
  }
}