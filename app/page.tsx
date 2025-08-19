"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IconBuilding, IconRefresh, IconUsers, IconChartBar } from "@tabler/icons-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary/10 rounded-full">
              <IconBuilding className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Turns Management System
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Streamline your property turnover process with our comprehensive management platform
          </p>
        </div>

        <div className="flex justify-center gap-4 mb-16">
          <Link href="/login">
            <Button size="lg">Sign In</Button>
          </Link>
          <Link href="/signup">
            <Button size="lg" variant="outline">Get Started</Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <IconRefresh className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Turn Management</h3>
            <p className="text-muted-foreground">
              Track and manage property turnovers from start to finish
            </p>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <IconUsers className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Vendor Coordination</h3>
            <p className="text-muted-foreground">
              Assign and track vendor work with performance metrics
            </p>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <IconChartBar className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Analytics & Reports</h3>
            <p className="text-muted-foreground">
              Real-time insights into your property portfolio performance
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
