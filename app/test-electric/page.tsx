"use client";

import { useState } from "react";
import { useCustomShape } from "@/lib/electric/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestElectricPage() {
  const [tableName, setTableName] = useState("properties");
  const [testStarted, setTestStarted] = useState(false);
  
  const { data, isLoading, error } = useCustomShape(
    testStarted ? { table: tableName } : { table: "" }
  );

  const handleTest = () => {
    setTestStarted(true);
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Electric SQL Test Page</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Connection Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Electric URL:</span>{" "}
              <span className="text-muted-foreground">
                {process.env.NEXT_PUBLIC_ELECTRIC_URL || "Not configured"}
              </span>
            </div>
            <div>
              <span className="font-medium">Source ID:</span>{" "}
              <span className="text-muted-foreground">
                {process.env.NEXT_PUBLIC_ELECTRIC_SOURCE_ID || "Not configured"}
              </span>
            </div>
            <div>
              <span className="font-medium">Auth Token:</span>{" "}
              <span className="text-muted-foreground">
                {process.env.NEXT_PUBLIC_ELECTRIC_SOURCE_SECRET ? "Configured ✓" : "Not configured"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Test Shape Request</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Table Name</label>
              <Input
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                placeholder="Enter table name (e.g., properties, turns, vendors)"
              />
            </div>
            <Button onClick={handleTest} disabled={!tableName || isLoading}>
              {isLoading ? "Loading..." : "Test Connection"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {testStarted && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span>Fetching shape from Electric SQL...</span>
              </div>
            )}
            
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-lg">
                <div className="font-medium">Error:</div>
                <div className="text-sm mt-1">{error.message}</div>
              </div>
            )}
            
            {data && (
              <div>
                <div className="mb-2 text-sm text-muted-foreground">
                  Received {Array.isArray(data) ? data.length : 0} records
                </div>
                <pre className="p-4 bg-gray-50 rounded-lg overflow-auto max-h-96 text-xs">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            )}
            
            {!isLoading && !error && !data && (
              <div className="text-muted-foreground">
                No data received. The table might be empty or the connection might not be properly configured.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}