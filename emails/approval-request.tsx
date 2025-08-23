import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface ApprovalRequestEmailProps {
  approverName: string;
  propertyAddress: string;
  turnId: string;
  estimatedCost: number;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  submitterName: string;
  approvalUrl: string;
}

export const ApprovalRequestEmail = ({
  approverName,
  propertyAddress,
  turnId,
  estimatedCost,
  priority,
  submitterName,
  approvalUrl,
}: ApprovalRequestEmailProps) => {
  const priorityColors = {
    LOW: "#10B981",
    MEDIUM: "#F59E0B",
    HIGH: "#EF4444",
    URGENT: "#DC2626",
  };

  return (
    <Html>
      <Head />
      <Preview>Turn approval required for {propertyAddress}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Turn Approval Required</Heading>
          
          <Text style={text}>Hi {approverName},</Text>
          
          <Text style={text}>
            {submitterName} has submitted a turn that requires your approval.
          </Text>

          <Section style={detailsSection}>
            <Text style={detailItem}>
              <strong>Property:</strong> {propertyAddress}
            </Text>
            <Text style={detailItem}>
              <strong>Turn ID:</strong> {turnId}
            </Text>
            <Text style={detailItem}>
              <strong>Estimated Cost:</strong> ${estimatedCost.toLocaleString()}
            </Text>
            <Text style={detailItem}>
              <strong>Priority:</strong>{" "}
              <span style={{ color: priorityColors[priority] }}>
                {priority}
              </span>
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={buttonContainer}>
            <Button style={button} href={approvalUrl}>
              Review & Approve
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

ApprovalRequestEmail.PreviewProps = {
  approverName: "John Smith",
  propertyAddress: "123 Main St, Apt 4B, New York, NY 10001",
  turnId: "TURN-2024-001",
  estimatedCost: 5500,
  priority: "HIGH" as const,
  submitterName: "Jane Doe",
  approvalUrl: "http://localhost:3000/turns/123456",
} as ApprovalRequestEmailProps;

export default ApprovalRequestEmail;

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