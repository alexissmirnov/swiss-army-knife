import { auth as betterAuth, getServerSession } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export type UserType = "guest" | "regular";

export async function auth() {
  const session = await getServerSession();

  if (!session?.user) {
    return null;
  }

  return {
    ...session,
    user: {
      ...session.user,
      type: "regular" as const,
    },
  };
}

export async function signOut({ redirectTo }: { redirectTo?: string } = {}) {
  await betterAuth.api.signOut({ headers: await headers() });

  if (redirectTo) {
    redirect(redirectTo);
  }
}
