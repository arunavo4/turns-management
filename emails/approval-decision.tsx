import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface ApprovalDecisionEmailProps {
  recipientName: string;
  propertyAddress: string;
  turnId: string;
  decision: "APPROVED" | "REJECTED";
  approverName: string;
  comments?: string;
  turnUrl: string;
  estimatedCost: number;
}

export const ApprovalDecisionEmail = ({
  recipientName,
  propertyAddress,
  turnId,
  decision,
  approverName,
  comments,
  turnUrl,
  estimatedCost,
}: ApprovalDecisionEmailProps) => {
  const isApproved = decision === "APPROVED";
  const statusColor = isApproved ? "#10B981" : "#EF4444";
  const statusEmoji = isApproved ? "✅" : "❌";

  return (
    <Html>
      <Head />
      <Preview>
        Turn {decision.toLowerCase()} for {propertyAddress}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>
            {statusEmoji} Turn {decision}
          </Heading>
          
          <Text style={text}>Hi {recipientName},</Text>
          
          <Text style={text}>
            The turn for <strong>{propertyAddress}</strong> has been{" "}
            <span style={{ color: statusColor, fontWeight: "600" }}>
              {decision.toLowerCase()}
            </span>{" "}
            by {approverName}.
          </Text>

          <Section style={detailsSection}>
            <Text style={detailItem}>
              <strong>Turn ID:</strong> {turnId}
            </Text>
            <Text style={detailItem}>
              <strong>Property:</strong> {propertyAddress}
            </Text>
            <Text style={detailItem}>
              <strong>Estimated Cost:</strong> ${estimatedCost.toLocaleString()}
            </Text>
            <Text style={detailItem}>
              <strong>Decision:</strong>{" "}
              <span style={{ color: statusColor }}>
                {decision}
              </span>
            </Text>
            <Text style={detailItem}>
              <strong>Approved/Rejected by:</strong> {approverName}
            </Text>
            {comments && (
              <Text style={detailItem}>
                <strong>Comments:</strong> {comments}
              </Text>
            )}
          </Section>

          {isApproved && (
            <Section style={messageSection}>
              <Text style={messageText}>
                The turn has been approved and work can now proceed. 
                The assigned vendor has been notified.
              </Text>
            </Section>
          )}

          {!isApproved && (
            <Section style={messageSection}>
              <Text style={messageText}>
                The turn has been rejected. Please review the comments 
                and make necessary adjustments before resubmitting.
              </Text>
            </Section>
          )}

          <Hr style={hr} />

          <Section style={buttonContainer}>
            <Button style={button} href={turnUrl}>
              View Turn Details
            </Button>
          </Section>

          <Text style={footer}>
            This is an automated notification from the Turns Management System.
            <br />
            If you have questions, please contact your administrator.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

ApprovalDecisionEmail.PreviewProps = {
  recipientName: "Jane Doe",
  propertyAddress: "123 Main St, Apt 4B, New York, NY 10001",
  turnId: "TURN-2024-001",
  decision: "APPROVED" as const,
  approverName: "John Smith",
  comments: "All requirements met. Proceed with the work.",
  turnUrl: "http://localhost:3000/turns/123456",
  estimatedCost: 5500,
} as ApprovalDecisionEmailProps;

export default ApprovalDecisionEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "40px",
  margin: "0 0 20px",
  textAlign: "center" as const,
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "16px 0",
};

const detailsSection = {
  backgroundColor: "#f4f4f5",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
};

const detailItem = {
  color: "#333",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "8px 0",
};

const messageSection = {
  backgroundColor: "#f0f9ff",
  borderRadius: "8px",
  padding: "16px",
  margin: "24px 0",
  borderLeft: "4px solid #0284c7",
};

const messageText = {
  color: "#0c4a6e",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 0",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#0F172A",
  borderRadius: "5px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  textAlign: "center" as const,
  margin: "32px 0 0 0",
};