import { createAuthClient } from "better-auth/react" // make sure to import from better-auth/react
import { adminClient, customSessionClient, apiKeyClient } from "better-auth/client/plugins"
import type { auth } from "@/lib/auth"; // Import the auth instance as a type

export const authClient = createAuthClient({
  plugins: [
    adminClient(),
    customSessionClient<typeof auth>()
    // apiKeyClient()
  ],
})

export type Session = typeof authClient.$Infer.Session