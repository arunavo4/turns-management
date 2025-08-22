import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user } from "@/auth-schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userProfile = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!userProfile.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(userProfile[0]);
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession(request);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, image } = body;

    const updatedUser = await db
      .update(user)
      .set({
        name,
        email,
        image,
        updatedAt: new Date(),
      })
      .where(eq(user.id, session.user.id))
      .returning();

    if (!updatedUser.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(updatedUser[0]);
  } catch (error) {
    console.error("Failed to update user profile:", error);
    return NextResponse.json(
      { error: "Failed to update user profile" },
      { status: 500 }
    );
  }
}