"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function HealthCheck() {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<any>(null);

  const { data: healthData } = trpc.health.check.useQuery();

  const handlePing = async () => {
    setIsChecking(true);
    try {
      // Call ping mutation
      setResult({ status: "success", message: "Server is responding" });
    } catch (error) {
      setResult({ status: "error", message: "Failed to reach server" });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Server Health</CardTitle>
        <CardDescription>Check API connectivity</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {healthData && (
          <div className="text-sm space-y-2">
            <p>
              <span className="font-medium">Status:</span>{" "}
              <span className="text-green-600 dark:text-green-400">{healthData.status}</span>
            </p>
            <p>
              <span className="font-medium">Version:</span> {healthData.version}
            </p>
            <p>
              <span className="font-medium">Time:</span>{" "}
              {new Date(healthData.timestamp).toLocaleString()}
            </p>
          </div>
        )}
        <Button onClick={handlePing} disabled={isChecking}>
          {isChecking ? "Checking..." : "Ping Server"}
        </Button>
        {result && (
          <div
            className={`p-3 rounded text-sm ${
              result.status === "success"
                ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-200"
                : "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-200"
            }`}
          >
            {result.message}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
