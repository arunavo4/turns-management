import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { propertyUtilityBills, properties, utilityProviders } from "@/lib/db/schema";
import { eq, and, gte, lte, desc, count, sum } from "drizzle-orm";
import { auditService } from "@/lib/audit-service";
import { UtilityBillFilters } from "@/types/utility";

// GET - List utility bills with optional filters
export async function GET(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 503 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const filters: UtilityBillFilters = {
      propertyId: searchParams.get("propertyId") || undefined,
      providerId: searchParams.get("providerId") || undefined,
      utilityType: (searchParams.get("utilityType") as any) || undefined,
      status: (searchParams.get("status") as any) || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      overdue: searchParams.get("overdue") === 'true' || undefined,
    };
    const includeStats = searchParams.get("includeStats") === 'true';
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    
    // Build query conditions
    const conditions = [];
    
    if (filters.propertyId) {
      conditions.push(eq(propertyUtilityBills.propertyId, filters.propertyId));
    }
    
    if (filters.providerId) {
      conditions.push(eq(propertyUtilityBills.providerId, filters.providerId));
    }
    
    if (filters.utilityType) {
      conditions.push(eq(propertyUtilityBills.utilityType, filters.utilityType));
    }
    
    if (filters.status) {
      conditions.push(eq(propertyUtilityBills.status, filters.status));
    }
    
    if (filters.startDate) {
      const startTimestamp = new Date(filters.startDate).getTime();
      conditions.push(gte(propertyUtilityBills.billingStartDate, startTimestamp));
    }
    
    if (filters.endDate) {
      const endTimestamp = new Date(filters.endDate).getTime();
      conditions.push(lte(propertyUtilityBills.billingEndDate, endTimestamp));
    }
    
    if (filters.overdue) {
      const now = Date.now();
      conditions.push(
        and(
          lte(propertyUtilityBills.dueDate, now),
          eq(propertyUtilityBills.status, 'unpaid')
        )
      );
    }
    
    // Base query with relations
    let query = db
      .select({
        id: propertyUtilityBills.id,
        propertyId: propertyUtilityBills.propertyId,
        providerId: propertyUtilityBills.providerId,
        utilityType: propertyUtilityBills.utilityType,
        billingStartDate: propertyUtilityBills.billingStartDate,
        billingEndDate: propertyUtilityBills.billingEndDate,
        dueDate: propertyUtilityBills.dueDate,
        currentCharges: propertyUtilityBills.currentCharges,
        previousBalance: propertyUtilityBills.previousBalance,
        lateFee: propertyUtilityBills.lateFee,
        otherCharges: propertyUtilityBills.otherCharges,
        totalAmount: propertyUtilityBills.totalAmount,
        amountPaid: propertyUtilityBills.amountPaid,
        status: propertyUtilityBills.status,
        paidDate: propertyUtilityBills.paidDate,
        accountNumber: propertyUtilityBills.accountNumber,
        meterReading: propertyUtilityBills.meterReading,
        usageAmount: propertyUtilityBills.usageAmount,
        usageUnit: propertyUtilityBills.usageUnit,
        billDocument: propertyUtilityBills.billDocument,
        paymentConfirmation: propertyUtilityBills.paymentConfirmation,
        notes: propertyUtilityBills.notes,
        metadata: propertyUtilityBills.metadata,
        createdAt: propertyUtilityBills.createdAt,
        updatedAt: propertyUtilityBills.updatedAt,
        version: propertyUtilityBills.version,
        createdBy: propertyUtilityBills.createdBy,
        updatedBy: propertyUtilityBills.updatedBy,
        // Property relation
        property: {
          id: properties.id,
          name: properties.name,
          address: properties.address,
          city: properties.city,
          state: properties.state,
          zipCode: properties.zipCode,
        },
        // Provider relation
        provider: {
          id: utilityProviders.id,
          name: utilityProviders.name,
          type: utilityProviders.type,
          contactPhone: utilityProviders.contactPhone,
          contactEmail: utilityProviders.contactEmail,
          website: utilityProviders.website,
        }
      })
      .from(propertyUtilityBills)
      .leftJoin(properties, eq(propertyUtilityBills.propertyId, properties.id))
      .leftJoin(utilityProviders, eq(propertyUtilityBills.providerId, utilityProviders.id))
      .orderBy(desc(propertyUtilityBills.dueDate))
      .limit(limit)
      .offset(offset);
    
    // Apply filters
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const bills = await query;
    
    // Get total count
    let countQuery = db.select({ count: count() }).from(propertyUtilityBills);
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }
    const [{ count: totalCount }] = await countQuery;
    
    // Get stats if requested
    let stats = undefined;
    if (includeStats) {
      // Get basic counts
      const [statsResult] = await db
        .select({
          totalBills: count(),
        })
        .from(propertyUtilityBills);

      // Get unpaid bills count and total
      const [unpaidStats] = await db
        .select({
          count: count(),
          totalAmount: sum(propertyUtilityBills.totalAmount),
        })
        .from(propertyUtilityBills)
        .where(eq(propertyUtilityBills.status, 'unpaid'));

      // Get overdue bills count and total
      const [overdueStats] = await db
        .select({
          count: count(),
          totalAmount: sum(propertyUtilityBills.totalAmount),
        })
        .from(propertyUtilityBills)
        .where(
          and(
            eq(propertyUtilityBills.status, 'unpaid'),
            lte(propertyUtilityBills.dueDate, Date.now())
          )
        );
      
      stats = {
        totalBills: statsResult.totalBills || 0,
        unpaidBills: unpaidStats.count || 0,
        overdueBills: overdueStats.count || 0,
        totalUnpaidAmount: parseFloat(unpaidStats.totalAmount || '0'),
        totalOverdueAmount: parseFloat(overdueStats.totalAmount || '0'),
        avgMonthlyUtilityCost: 0, // Could be calculated based on historical data
      };
    }
    
    return NextResponse.json({
      bills,
      total: totalCount,
      stats
    });
  } catch (error) {
    console.error("Error fetching utility bills:", error);
    return NextResponse.json(
      { error: "Failed to fetch utility bills" },
      { status: 500 }
    );
  }
}

// POST - Create new utility bill
export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 503 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.propertyId || !body.utilityType || !body.billingStartDate || 
        !body.billingEndDate || !body.dueDate || !body.currentCharges || !body.totalAmount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Convert dates to timestamps if needed
    const billingStartDate = typeof body.billingStartDate === 'string' 
      ? new Date(body.billingStartDate).getTime() 
      : body.billingStartDate;
    const billingEndDate = typeof body.billingEndDate === 'string' 
      ? new Date(body.billingEndDate).getTime() 
      : body.billingEndDate;
    const dueDate = typeof body.dueDate === 'string' 
      ? new Date(body.dueDate).getTime() 
      : body.dueDate;
    
    const newBill = await db.insert(propertyUtilityBills).values({
      propertyId: body.propertyId,
      providerId: body.providerId || null,
      utilityType: body.utilityType,
      billingStartDate,
      billingEndDate,
      dueDate,
      currentCharges: body.currentCharges.toString(),
      previousBalance: (body.previousBalance || 0).toString(),
      lateFee: (body.lateFee || 0).toString(),
      otherCharges: (body.otherCharges || 0).toString(),
      totalAmount: body.totalAmount.toString(),
      amountPaid: '0',
      status: 'unpaid',
      accountNumber: body.accountNumber || null,
      meterReading: body.meterReading || null,
      usageAmount: body.usageAmount ? body.usageAmount.toString() : null,
      usageUnit: body.usageUnit || null,
      notes: body.notes || null,
      metadata: body.metadata || {},
    }).returning();
    
    // Log the creation in audit log
    await auditService.log({
      tableName: 'property_utility_bills',
      recordId: newBill[0].id,
      action: 'CREATE',
      newValues: newBill[0],
      propertyId: newBill[0].propertyId,
      context: 'Utility bill created via API',
    }, request);
    
    return NextResponse.json(newBill[0], { status: 201 });
  } catch (error) {
    console.error("Error creating utility bill:", error);
    return NextResponse.json(
      { 
        error: "Failed to create utility bill",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}