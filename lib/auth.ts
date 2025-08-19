import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";

// Only create auth instance if database is available
const createAuth = () => {
  if (!db) {
    console.warn('Database not available, auth will not work');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return null as any;
  }

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
    }),
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
      requireEmailVerification: false, // Set to true in production
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day
    },
    trustedOrigins: [
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    ],
  });
};

export const auth = createAuth();