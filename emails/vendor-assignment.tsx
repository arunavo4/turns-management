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

interface VendorAssignmentEmailProps {
  vendorName: string;
  propertyAddress: string;
  turnId: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  estimatedCost: number;
  turnUrl: string;
  dueDate?: string;
}

export const VendorAssignmentEmail = ({
  vendorName,
  propertyAddress,
  turnId,
  priority,
  estimatedCost,
  turnUrl,
  dueDate,
}: VendorAssignmentEmailProps) => {
  const priorityColors = {
    LOW: "#10B981",
    MEDIUM: "#F59E0B",
    HIGH: "#EF4444",
    URGENT: "#DC2626",
  };

  return (
    <Html>
      <Head />
      <Preview>New turn assignment: {propertyAddress}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>🔨 New Turn Assignment</Heading>
          
          <Text style={text}>Hi {vendorName},</Text>
          
          <Text style={text}>
            You have been assigned to a new turn. Please review the details 
            below and begin work as soon as possible.
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
            {dueDate && (
              <Text style={detailItem}>
                <strong>Target Completion:</strong> {dueDate}
              </Text>
            )}
          </Section>

          <Section style={instructionSection}>
            <Heading style={h2}>Next Steps:</Heading>
            <Text style={instructionItem}>
              1. Review the full turn details and requirements
            </Text>
            <Text style={instructionItem}>
              2. Contact the property manager if you have questions
            </Text>
            <Text style={instructionItem}>
              3. Update the turn status as work progresses
            </Text>
            <Text style={instructionItem}>
              4. Submit photos and documentation upon completion
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={buttonContainer}>
            <Button style={button} href={turnUrl}>
              View Turn Details
            </Button>
          </Section>

          <Text style={footer}>
            This is an automated notification from the Turns Management System.
            <br />
            Please do not reply to this email. If you have questions, 
            contact your property manager directly.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

VendorAssignmentEmail.PreviewProps = {
  vendorName: "ABC Contractors",
  propertyAddress: "123 Main St, Apt 4B, New York, NY 10001",
  turnId: "TURN-2024-001",
  priority: "HIGH" as const,
  estimatedCost: 5500,
  turnUrl: "http://localhost:3000/turns/123456",
  dueDate: "January 15, 2024",
} as VendorAssignmentEmailProps;

export default VendorAssignmentEmail;

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

const h2 = {
  color: "#333",
  fontSize: "18px",
  fontWeight: "600",
  lineHeight: "28px",
  margin: "0 0 16px",
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

const instructionSection = {
  backgroundColor: "#fef3c7",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
  borderLeft: "4px solid #f59e0b",
};

const instructionItem = {
  color: "#78350f",
  fontSize: "14px",
  lineHeight: "22px",
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