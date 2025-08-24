import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { properties, turns, vendors } from "@/lib/db/schema";

export async function GET(request: Request) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d';
    
    // Calculate date range
    const now = new Date();
    const endTime = now.getTime();
    let startTime: number;
    
    switch (timeRange) {
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime();
        break;
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).getTime();
        break;
      case '90d':
        startTime = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).getTime();
        break;
      case '1y':
        startTime = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).getTime();
        break;
      default:
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).getTime();
    }

    // Fetch all data within the time range
    const allTurns = await db.select().from(turns);
    const allProperties = await db.select().from(properties);
    const allVendors = await db.select().from(vendors);

    // Filter turns by time range
    const turnsInRange = allTurns.filter((t: any) => 
      t.createdAt >= startTime && t.createdAt <= endTime
    );

    // Calculate key metrics
    const totalRevenue = turnsInRange
      .filter((t: any) => t.status === 'completed')
      .reduce((sum: number, turn: any) => {
        const cost = turn.actualCost ? parseFloat(turn.actualCost) : 0;
        return sum + cost;
      }, 0);

    const completedTurns = turnsInRange.filter((t: any) => t.status === 'completed').length;
    const avgCostPerTurn = completedTurns > 0 ? totalRevenue / completedTurns : 0;
    
    const totalTurns = turnsInRange.length;
    const completionRate = totalTurns > 0 
      ? Math.round((completedTurns / totalTurns) * 100)
      : 0;

    // Calculate previous period metrics for comparison
    const previousPeriodDuration = endTime - startTime;
    const previousStartTime = startTime - previousPeriodDuration;
    const previousEndTime = startTime;
    
    const previousTurns = allTurns.filter((t: any) => 
      t.createdAt >= previousStartTime && t.createdAt < previousEndTime
    );
    
    const previousRevenue = previousTurns
      .filter((t: any) => t.status === 'completed')
      .reduce((sum: number, turn: any) => {
        const cost = turn.actualCost ? parseFloat(turn.actualCost) : 0;
        return sum + cost;
      }, 0);
    
    const previousCompleted = previousTurns.filter((t: any) => t.status === 'completed').length;
    
    // Calculate trends
    const revenueTrend = previousRevenue > 0 
      ? Math.round(((totalRevenue - previousRevenue) / previousRevenue) * 100)
      : 0;
    
    const completedTrend = previousCompleted > 0
      ? Math.round(((completedTurns - previousCompleted) / previousCompleted) * 100)
      : 0;

    // Generate monthly revenue data (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1).getTime();
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0).getTime();
      
      const monthTurns = allTurns.filter((t: any) => 
        t.createdAt >= monthStart && t.createdAt <= monthEnd
      );
      
      const monthRevenue = monthTurns
        .filter((t: any) => t.status === 'completed')
        .reduce((sum: number, turn: any) => {
          const cost = turn.actualCost ? parseFloat(turn.actualCost) : 0;
          return sum + cost;
        }, 0);
      
      const monthCompleted = monthTurns.filter((t: any) => t.status === 'completed').length;
      const avgCost = monthCompleted > 0 ? monthRevenue / monthCompleted : 0;
      
      monthlyData.push({
        month: new Date(monthStart).toLocaleString('en', { month: 'short' }),
        revenue: monthRevenue,
        turns: monthCompleted,
        avgCost: avgCost
      });
    }

    // Turn status distribution
    const statusDistribution = [
      { 
        name: 'Completed', 
        value: turnsInRange.filter((t: any) => t.status === 'completed').length,
        color: '#22c55e'
      },
      { 
        name: 'In Progress', 
        value: turnsInRange.filter((t: any) => 
          t.status === 'in_progress' || 
          t.status === 'vendor_assigned' || 
          t.status === 'scope_review'
        ).length,
        color: '#f97316'
      },
      { 
        name: 'Pending', 
        value: turnsInRange.filter((t: any) => t.status === 'draft').length,
        color: '#eab308'
      },
      { 
        name: 'Cancelled', 
        value: turnsInRange.filter((t: any) => t.status === 'cancelled').length,
        color: '#ef4444'
      },
    ];

    // Vendor performance (calculate from actual turn data)
    const vendorPerformance = allVendors.map((vendor: any) => {
      const vendorTurns = turnsInRange.filter((t: any) => t.vendorId === vendor.id);
      const completedVendorTurns = vendorTurns.filter((t: any) => t.status === 'completed');
      
      // Calculate on-time rate
      const onTimeTurns = completedVendorTurns.filter((t: any) => {
        if (!t.turnDueDate) return true; // No due date means on time
        return t.updatedAt <= t.turnDueDate;
      });
      
      const onTimeRate = completedVendorTurns.length > 0
        ? Math.round((onTimeTurns.length / completedVendorTurns.length) * 100)
        : 100;
      
      const totalRevenue = completedVendorTurns.reduce((sum: number, turn: any) => {
        const cost = turn.actualCost ? parseFloat(turn.actualCost) : 0;
        return sum + cost;
      }, 0);
      
      const avgCost = completedVendorTurns.length > 0 
        ? totalRevenue / completedVendorTurns.length
        : 0;
      
      return {
        id: vendor.id,
        name: vendor.companyName,
        rating: vendor.rating || 4.5,
        onTimeRate,
        jobs: completedVendorTurns.length,
        avgCost,
        totalRevenue
      };
    }).filter((v: any) => v.jobs > 0) // Only include vendors with completed jobs
      .sort((a: any, b: any) => (b.rating * b.onTimeRate) - (a.rating * a.onTimeRate))
      .slice(0, 10);

    // Property type analysis
    const propertyTypes = ['apartment', 'house', 'condo', 'townhouse', 'commercial'];
    const propertyTypeData = propertyTypes.map((type: string) => {
      const typeProperties = allProperties.filter((p: any) => 
        p.propertyType?.toLowerCase() === type
      );
      
      const typePropertyIds = typeProperties.map((p: any) => p.id);
      const typeTurns = turnsInRange.filter((t: any) => 
        typePropertyIds.includes(t.propertyId)
      );
      
      const typeRevenue = typeTurns
        .filter((t: any) => t.status === 'completed')
        .reduce((sum: number, turn: any) => {
          const cost = turn.actualCost ? parseFloat(turn.actualCost) : 0;
          return sum + cost;
        }, 0);
      
      return {
        type: type.charAt(0).toUpperCase() + type.slice(1),
        count: typeProperties.length,
        revenue: typeRevenue,
        turns: typeTurns.length
      };
    }).filter((t: any) => t.count > 0);

    // Weekly turn trends (last 4 weeks)
    const weeklyTrends = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000).getTime();
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000).getTime();
      
      const weekTurns = allTurns.filter((t: any) => 
        t.createdAt >= weekStart && t.createdAt < weekEnd
      );
      
      const completed = weekTurns.filter((t: any) => 
        t.status === 'completed' && t.updatedAt >= weekStart && t.updatedAt < weekEnd
      ).length;
      
      const started = weekTurns.filter((t: any) => 
        t.createdAt >= weekStart && t.createdAt < weekEnd
      ).length;
      
      const overdue = weekTurns.filter((t: any) => {
        if (!t.turnDueDate || t.status === 'completed' || t.status === 'cancelled') return false;
        return t.turnDueDate < weekEnd && t.turnDueDate >= weekStart;
      }).length;
      
      weeklyTrends.push({
        week: `W${4 - i}`,
        completed,
        started,
        overdue
      });
    }

    // Top performing vendors
    const topVendors = vendorPerformance.slice(0, 5);

    // Insurance expiration alerts
    const expirationAlerts = allVendors
      .filter((vendor: any) => {
        if (!vendor.insuranceExpiry) return false;
        const expiryTime = vendor.insuranceExpiry;
        const daysUntilExpiry = Math.ceil((expiryTime - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 90 && daysUntilExpiry > 0;
      })
      .map((vendor: any) => ({
        id: vendor.id,
        companyName: vendor.companyName,
        insuranceExpiry: vendor.insuranceExpiry,
        daysUntilExpiry: Math.ceil((vendor.insuranceExpiry! - now.getTime()) / (1000 * 60 * 60 * 24))
      }))
      .sort((a: any, b: any) => a.daysUntilExpiry - b.daysUntilExpiry)
      .slice(0, 5);

    // Average turn time calculation
    const completedTurnsWithTime = turnsInRange.filter((t: any) => 
      t.status === 'completed' && t.createdAt && t.updatedAt
    );
    
    let avgTurnTime = 0;
    if (completedTurnsWithTime.length > 0) {
      const totalDays = completedTurnsWithTime.reduce((sum: number, turn: any) => {
        const days = Math.ceil((turn.updatedAt - turn.createdAt) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0);
      avgTurnTime = totalDays / completedTurnsWithTime.length;
    }

    // Cost reduction trend
    const avgCostPrevious = previousCompleted > 0 ? previousRevenue / previousCompleted : 0;
    const costTrend = avgCostPrevious > 0
      ? Math.round(((avgCostPerTurn - avgCostPrevious) / avgCostPrevious) * 100)
      : 0;

    return NextResponse.json({
      metrics: {
        totalRevenue,
        completedTurns,
        avgCostPerTurn,
        completionRate,
        revenueTrend,
        completedTrend,
        costTrend,
        avgTurnTime
      },
      monthlyData,
      statusDistribution,
      vendorPerformance,
      propertyTypeData,
      weeklyTrends,
      topVendors,
      expirationAlerts
    });
  } catch (error) {
    console.error("Error fetching reports data:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports data" },
      { status: 500 }
    );
  }
}