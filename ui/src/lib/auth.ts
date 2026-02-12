import { betterAuth, BetterAuthOptions } from "better-auth";
import { env } from "@/env";
import { admin, customSession, apiKey, openAPI } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import { db } from "@/db";

import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createId } from "@paralleldrive/cuid2";

export type Session = typeof auth.$Infer.Session;

const options = {
  database: drizzleAdapter(db, {
    provider: "pg", // or "pg" or "mysql"
    usePlural: true,
  }), 
  emailAndPassword: {
    enabled: true,
    async sendResetPassword(data, request) {
      // Send an email to the user with a link to reset their password
  },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache duration in seconds
    },
  },
  plugins: [
    admin(),
    nextCookies(),
    openAPI(),
  ],
  advanced: {
    database: {
      generateId: () => {
        return createId();
      },
    },
  },
} satisfies BetterAuthOptions;

export const auth = betterAuth({
  ...options,
  plugins: [
    ...(options.plugins ?? []),
    // customSession(async ({ user, session }) => {
    //   try {
    //     // Get payment status for the user
    //     const [subscription, currentUsage, permission] = await Promise.all([
    //       getUserSubscription(user.id),
    //       getCurrentUsage(user.id),
    //       checkAnalysisPermission(user.id),
    //     ]);

    //     return {
    //       user,
    //       session,
    //       paymentStatus: {
    //         subscription,
    //         currentUsage, // Keep as-is, can be null
    //         permission,
    //       },
    //     };
    //   } catch (error) {
    //     console.error("Error fetching payment status for session:", error);
    //     // Return minimal fallback on error
    //     return {
    //       user,
    //       session,
    //       paymentStatus: {
    //         subscription: null,
    //         currentUsage: null,
    //         permission: {
    //           canAnalyze: false,
    //           hasUnlimitedAccess: false,
    //           uploadsRemaining: 0,
    //           uploadsUsed: 0,
    //           uploadsLimit: 0,
    //           currentPlan: null,
    //           reason: "Failed to load payment status",
    //         },
    //       },
    //     };
    //   }
    // }, options),
  ],
});

export const getServerSession = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
};
