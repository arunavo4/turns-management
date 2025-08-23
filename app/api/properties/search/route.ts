import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { properties } from "@/lib/db/schema";
import { sql, and, or, ilike, eq, desc, asc } from "drizzle-orm";
import { getSession } from "@/lib/auth-helpers";

interface SearchParams {
  q?: string;
  page?: string;
  limit?: string;
  status?: string;
  type?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params: SearchParams = {
      q: searchParams.get("q") || "",
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "50",
      status: searchParams.get("status") || undefined,
      type: searchParams.get("type") || undefined,
      sortBy: searchParams.get("sortBy") || "name",
      sortOrder: (searchParams.get("sortOrder") as 'asc' | 'desc') || "asc",
    };

    const page = Math.max(1, parseInt(params.page));
    const limit = Math.min(100, Math.max(1, parseInt(params.limit))); // Cap at 100
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];

    // Search condition - using ILIKE for now, can be upgraded to full-text search
    if (params.q && params.q.length >= 2) {
      const searchTerm = `%${params.q}%`;
      conditions.push(
        or(
          ilike(properties.name, searchTerm),
          ilike(properties.address, searchTerm),
          ilike(properties.city, searchTerm),
          ilike(properties.unitNumber, searchTerm)
        )
      );
    }

    // Status filter
    if (params.status && params.status !== 'all') {
      conditions.push(eq(properties.status, params.status));
    }

    // Type filter
    if (params.type && params.type !== 'all') {
      conditions.push(eq(properties.type, params.type));
    }

    // Build the query
    let query = db.select().from(properties);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    // Add sorting
    const sortColumn = params.sortBy === 'address' ? properties.address :
                      params.sortBy === 'city' ? properties.city :
                      params.sortBy === 'rent' ? properties.rent :
                      params.sortBy === 'createdAt' ? properties.createdAt :
                      properties.name;

    query = (params.sortOrder === 'desc' 
      ? query.orderBy(desc(sortColumn))
      : query.orderBy(asc(sortColumn))) as any;

    // Execute paginated query
    const results = await query.limit(limit).offset(offset);

    // Get total count for pagination
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(properties);
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions)) as any;
    }
    const [{ count }] = await countQuery;

    // Calculate pagination metadata
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      data: results,
      pagination: {
        page,
        limit,
        total: count,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
      filters: {
        search: params.q,
        status: params.status,
        type: params.type,
      },
    });
  } catch (error) {
    console.error("Property search failed:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}