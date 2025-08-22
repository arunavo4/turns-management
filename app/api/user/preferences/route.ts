import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userPreferences } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get preferences from database
    const prefs = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, session.user.id))
      .limit(1);

    if (prefs.length === 0) {
      // Create default preferences
      const newPrefs = await db
        .insert(userPreferences)
        .values({
          userId: session.user.id,
        })
        .returning();
      
      return NextResponse.json({
        notifications: {
          email: newPrefs[0].emailNotifications,
          turnApprovals: newPrefs[0].turnApprovals,
          overdueTurns: newPrefs[0].overdueTurns,
          vendorUpdates: newPrefs[0].vendorUpdates,
          weeklyReports: newPrefs[0].weeklyReports,
        },
        display: {
          theme: newPrefs[0].theme,
          language: newPrefs[0].language,
          timezone: newPrefs[0].timezone,
          dateFormat: newPrefs[0].dateFormat,
        },
        security: {
          sessionTimeout: newPrefs[0].sessionTimeout,
          twoFactorEnabled: newPrefs[0].twoFactorEnabled,
        },
      });
    }

    return NextResponse.json({
      notifications: {
        email: prefs[0].emailNotifications,
        turnApprovals: prefs[0].turnApprovals,
        overdueTurns: prefs[0].overdueTurns,
        vendorUpdates: prefs[0].vendorUpdates,
        weeklyReports: prefs[0].weeklyReports,
      },
      display: {
        theme: prefs[0].theme,
        language: prefs[0].language,
        timezone: prefs[0].timezone,
        dateFormat: prefs[0].dateFormat,
      },
      security: {
        sessionTimeout: prefs[0].sessionTimeout,
        twoFactorEnabled: prefs[0].twoFactorEnabled,
      },
    });
  } catch (error) {
    console.error("Failed to fetch user preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch user preferences" },
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

    // Map the incoming preferences to database columns
    const updateData: any = {};
    
    if (body.notifications) {
      updateData.emailNotifications = body.notifications.email;
      updateData.turnApprovals = body.notifications.turnApprovals;
      updateData.overdueTurns = body.notifications.overdueTurns;
      updateData.vendorUpdates = body.notifications.vendorUpdates;
      updateData.weeklyReports = body.notifications.weeklyReports;
    }
    
    if (body.display) {
      updateData.theme = body.display.theme;
      updateData.language = body.display.language;
      updateData.timezone = body.display.timezone;
      updateData.dateFormat = body.display.dateFormat;
    }
    
    if (body.security) {
      updateData.sessionTimeout = body.security.sessionTimeout;
      updateData.twoFactorEnabled = body.security.twoFactorEnabled;
    }

    updateData.updatedAt = new Date();

    // Check if preferences exist
    const existing = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, session.user.id))
      .limit(1);

    let result;
    if (existing.length === 0) {
      // Create new preferences
      result = await db
        .insert(userPreferences)
        .values({
          userId: session.user.id,
          ...updateData,
        })
        .returning();
    } else {
      // Update existing preferences
      result = await db
        .update(userPreferences)
        .set(updateData)
        .where(eq(userPreferences.userId, session.user.id))
        .returning();
    }

    return NextResponse.json({ 
      message: "Preferences updated successfully",
      notifications: {
        email: result[0].emailNotifications,
        turnApprovals: result[0].turnApprovals,
        overdueTurns: result[0].overdueTurns,
        vendorUpdates: result[0].vendorUpdates,
        weeklyReports: result[0].weeklyReports,
      },
      display: {
        theme: result[0].theme,
        language: result[0].language,
        timezone: result[0].timezone,
        dateFormat: result[0].dateFormat,
      },
      security: {
        sessionTimeout: result[0].sessionTimeout,
        twoFactorEnabled: result[0].twoFactorEnabled,
      },
    });
  } catch (error) {
    console.error("Failed to update user preferences:", error);
    return NextResponse.json(
      { error: "Failed to update user preferences" },
      { status: 500 }
    );
  }
}