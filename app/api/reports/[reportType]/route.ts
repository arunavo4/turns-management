import { NextRequest, NextResponse } from "next/server";
import * as turnCompletion from '../turn-completion/route';
import * as propertyPerformance from '../property-performance/route';
import * as vendorPerformance from '../vendor-performance/route';
import * as financialSummary from '../financial-summary/route';

const reportHandlers: Record<string, any> = {
  'turn-completion': turnCompletion,
  'property-performance': propertyPerformance,
  'vendor-performance': vendorPerformance,
  'financial-summary': financialSummary
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportType: string }> }
) {
  try {
    const { reportType } = await params;
    
    // Check if the report type exists
    const handler = reportHandlers[reportType];
    if (!handler || !handler.GET) {
      return NextResponse.json(
        { error: `Unknown report type: ${reportType}` },
        { status: 404 }
      );
    }

    // Forward the request to the specific handler
    return handler.GET(request);
  } catch (error) {
    console.error(`Error handling report:`, error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}