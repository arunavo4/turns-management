import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";

// Create handlers that check auth availability at runtime
const handlers = auth ? toNextJsHandler(auth) : {
  GET: async (req: NextRequest) => {
    return NextResponse.json(
      { error: "Authentication service not available" },
      { status: 503 }
    );
  },
  POST: async (req: NextRequest) => {
    return NextResponse.json(
      { error: "Authentication service not available" },
      { status: 503 }
    );
  }
};

export const GET = handlers.GET;
export const POST = handlers.POST;