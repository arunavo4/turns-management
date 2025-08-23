"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function EmailPreviewPage() {
  const [loading, setLoading] = useState(false);

  const sendTestEmail = async (type: string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      if (!response.ok) {
        throw new Error("Failed to send test email");
      }

      toast.success(`Test ${type} email sent successfully!`);
    } catch (error) {
      toast.error(`Failed to send test email: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Email Template Preview</h1>

      <Tabs defaultValue="approval-request" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="approval-request">Approval Request</TabsTrigger>
          <TabsTrigger value="approval-decision">Approval Decision</TabsTrigger>
          <TabsTrigger value="vendor-assignment">Vendor Assignment</TabsTrigger>
        </TabsList>

        <TabsContent value="approval-request">
          <Card>
            <CardHeader>
              <CardTitle>Approval Request Email</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This email is sent to approvers when a turn requires approval.
                </p>
                <div className="bg-gray-100 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Preview:</h3>
                  <div className="bg-white rounded border p-4">
                    <h2 className="text-xl font-semibold text-center mb-4">Turn Approval Required</h2>
                    <p>Hi John Smith,</p>
                    <p className="mt-2">Jane Doe has submitted a turn that requires your approval.</p>
                    <div className="bg-gray-50 rounded p-4 mt-4">
                      <p><strong>Property:</strong> 123 Main St, Apt 4B, New York, NY 10001</p>
                      <p><strong>Turn ID:</strong> TURN-2024-001</p>
                      <p><strong>Estimated Cost:</strong> $5,500</p>
                      <p><strong>Priority:</strong> <span className="text-red-600">HIGH</span></p>
                    </div>
                    <div className="text-center mt-6">
                      <Button className="bg-slate-900">Review & Approve</Button>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={() => sendTestEmail("approval-request")}
                  disabled={loading}
                >
                  Send Test Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approval-decision">
          <Card>
            <CardHeader>
              <CardTitle>Approval Decision Email</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This email is sent when a turn is approved or rejected.
                </p>
                <div className="bg-gray-100 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Preview (Approved):</h3>
                  <div className="bg-white rounded border p-4">
                    <h2 className="text-xl font-semibold text-center mb-4">✅ Turn APPROVED</h2>
                    <p>Hi Jane Doe,</p>
                    <p className="mt-2">
                      The turn for <strong>123 Main St, Apt 4B, New York, NY 10001</strong> has been{" "}
                      <span className="text-green-600 font-semibold">approved</span> by John Smith.
                    </p>
                    <div className="bg-gray-50 rounded p-4 mt-4">
                      <p><strong>Turn ID:</strong> TURN-2024-001</p>
                      <p><strong>Estimated Cost:</strong> $5,500</p>
                      <p><strong>Decision:</strong> <span className="text-green-600">APPROVED</span></p>
                      <p><strong>Comments:</strong> All requirements met. Proceed with the work.</p>
                    </div>
                    <div className="bg-blue-50 rounded p-4 mt-4 border-l-4 border-blue-500">
                      <p className="text-blue-900">
                        The turn has been approved and work can now proceed. 
                        The assigned vendor has been notified.
                      </p>
                    </div>
                    <div className="text-center mt-6">
                      <Button className="bg-slate-900">View Turn Details</Button>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={() => sendTestEmail("approval-decision")}
                  disabled={loading}
                >
                  Send Test Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendor-assignment">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Assignment Email</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This email is sent to vendors when they are assigned to a turn.
                </p>
                <div className="bg-gray-100 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Preview:</h3>
                  <div className="bg-white rounded border p-4">
                    <h2 className="text-xl font-semibold text-center mb-4">🔨 New Turn Assignment</h2>
                    <p>Hi ABC Contractors,</p>
                    <p className="mt-2">
                      You have been assigned to a new turn. Please review the details 
                      below and begin work as soon as possible.
                    </p>
                    <div className="bg-gray-50 rounded p-4 mt-4">
                      <p><strong>Property:</strong> 123 Main St, Apt 4B, New York, NY 10001</p>
                      <p><strong>Turn ID:</strong> TURN-2024-001</p>
                      <p><strong>Estimated Cost:</strong> $5,500</p>
                      <p><strong>Priority:</strong> <span className="text-red-600">HIGH</span></p>
                      <p><strong>Target Completion:</strong> January 15, 2024</p>
                    </div>
                    <div className="bg-yellow-50 rounded p-4 mt-4 border-l-4 border-yellow-500">
                      <h3 className="font-semibold mb-2">Next Steps:</h3>
                      <ol className="list-decimal list-inside space-y-1 text-sm">
                        <li>Review the full turn details and requirements</li>
                        <li>Contact the property manager if you have questions</li>
                        <li>Update the turn status as work progresses</li>
                        <li>Submit photos and documentation upon completion</li>
                      </ol>
                    </div>
                    <div className="text-center mt-6">
                      <Button className="bg-slate-900">View Turn Details</Button>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={() => sendTestEmail("vendor-assignment")}
                  disabled={loading}
                >
                  Send Test Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}