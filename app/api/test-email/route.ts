import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import {
  sendApprovalRequestNotification,
  sendApprovalDecisionNotification,
  sendVendorAssignmentNotification,
} from "@/lib/email/notifications";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type } = body;

    // Use the current user's email for testing
    const testEmail = session.user.email || "test@example.com";
    const testName = session.user.name || "Test User";

    let result;

    switch (type) {
      case "approval-request":
        result = await sendApprovalRequestNotification({
          turnId: "TURN-2024-TEST",
          propertyAddress: "123 Test St, Apt 4B, Test City, TC 12345",
          estimatedCost: 5500,
          priority: "HIGH",
          approverEmail: testEmail,
          approverName: testName,
          submitterName: "Test Submitter",
        });
        break;

      case "approval-decision":
        result = await sendApprovalDecisionNotification({
          turnId: "TURN-2024-TEST",
          propertyAddress: "123 Test St, Apt 4B, Test City, TC 12345",
          estimatedCost: 5500,
          priority: "HIGH",
          recipientEmail: testEmail,
          recipientName: testName,
          decision: "APPROVED",
          approverName: "Test Approver",
          comments: "Test approval - all requirements met.",
        });
        break;

      case "vendor-assignment":
        result = await sendVendorAssignmentNotification({
          turnId: "TURN-2024-TEST",
          propertyAddress: "123 Test St, Apt 4B, Test City, TC 12345",
          estimatedCost: 5500,
          priority: "URGENT",
          vendorEmail: testEmail,
          vendorName: testName,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        });
        break;

      default:
        return NextResponse.json(
          { error: "Invalid email type" },
          { status: 400 }
        );
    }

    if (result?.success) {
      return NextResponse.json({ 
        message: `Test email sent successfully to ${testEmail}`,
        data: result.data 
      });
    } else {
      return NextResponse.json(
        { error: "Failed to send test email", details: result?.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error sending test email:", error);
    return NextResponse.json(
      { error: "Failed to send test email" },
      { status: 500 }
    );
  }
}