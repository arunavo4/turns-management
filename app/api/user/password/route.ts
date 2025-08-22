import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { account } from "@/auth-schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth-helpers";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current and new passwords are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Get user's account with password
    const userAccount = await db
      .select()
      .from(account)
      .where(
        and(
          eq(account.userId, session.user.id),
          eq(account.providerId, "credential")
        )
      )
      .limit(1);

    if (!userAccount.length) {
      return NextResponse.json(
        { error: "Password account not found" },
        { status: 404 }
      );
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, userAccount[0].password || "");
    
    if (!isValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db
      .update(account)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(account.userId, session.user.id),
          eq(account.providerId, "credential")
        )
      );

    return NextResponse.json({ 
      message: "Password updated successfully" 
    });
  } catch (error) {
    console.error("Failed to update password:", error);
    return NextResponse.json(
      { error: "Failed to update password" },
      { status: 500 }
    );
  }
}