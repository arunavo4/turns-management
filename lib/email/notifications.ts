import { sendEmail } from './resend';
import ApprovalRequestEmail from '@/emails/approval-request';
import ApprovalDecisionEmail from '@/emails/approval-decision';
import VendorAssignmentEmail from '@/emails/vendor-assignment';

interface NotificationData {
  turnId: string;
  propertyAddress: string;
  estimatedCost: number;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
}

interface ApprovalRequestData extends NotificationData {
  approverEmail: string;
  approverName: string;
  submitterName: string;
}

interface ApprovalDecisionData extends NotificationData {
  recipientEmail: string;
  recipientName: string;
  decision: "APPROVED" | "REJECTED";
  approverName: string;
  comments?: string;
}

interface VendorAssignmentData extends NotificationData {
  vendorEmail: string;
  vendorName: string;
  dueDate?: string;
}

export async function sendApprovalRequestNotification(data: ApprovalRequestData) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const approvalUrl = `${baseUrl}/turns/${data.turnId}`;

  const emailHtml = ApprovalRequestEmail({
    approverName: data.approverName,
    propertyAddress: data.propertyAddress,
    turnId: data.turnId,
    estimatedCost: data.estimatedCost,
    priority: data.priority,
    submitterName: data.submitterName,
    approvalUrl,
  });

  return await sendEmail({
    to: data.approverEmail,
    subject: `Approval Required: Turn for ${data.propertyAddress}`,
    react: emailHtml,
  });
}

export async function sendApprovalDecisionNotification(data: ApprovalDecisionData) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const turnUrl = `${baseUrl}/turns/${data.turnId}`;

  const emailHtml = ApprovalDecisionEmail({
    recipientName: data.recipientName,
    propertyAddress: data.propertyAddress,
    turnId: data.turnId,
    decision: data.decision,
    approverName: data.approverName,
    comments: data.comments,
    turnUrl,
    estimatedCost: data.estimatedCost,
  });

  const subject = data.decision === 'APPROVED' 
    ? `✅ Turn Approved: ${data.propertyAddress}`
    : `❌ Turn Rejected: ${data.propertyAddress}`;

  return await sendEmail({
    to: data.recipientEmail,
    subject,
    react: emailHtml,
  });
}

export async function sendVendorAssignmentNotification(data: VendorAssignmentData) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const turnUrl = `${baseUrl}/turns/${data.turnId}`;

  const emailHtml = VendorAssignmentEmail({
    vendorName: data.vendorName,
    propertyAddress: data.propertyAddress,
    turnId: data.turnId,
    priority: data.priority,
    estimatedCost: data.estimatedCost,
    turnUrl,
    dueDate: data.dueDate,
  });

  return await sendEmail({
    to: data.vendorEmail,
    subject: `New Turn Assignment: ${data.propertyAddress}`,
    react: emailHtml,
  });
}

export async function sendBulkApprovalRequests(
  turns: NotificationData[],
  approvers: { email: string; name: string }[],
  submitterName: string
) {
  const notifications = [];
  
  for (const turn of turns) {
    for (const approver of approvers) {
      notifications.push(
        sendApprovalRequestNotification({
          ...turn,
          approverEmail: approver.email,
          approverName: approver.name,
          submitterName,
        })
      );
    }
  }

  return await Promise.all(notifications);
}