import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";
 
export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    OPENAI_API_KEY: z.string().min(1),
    BLOB_READ_WRITE_TOKEN: z.string().optional(),
    REDIS_URL: z.string().optional(),
  },
  client: {

  },

  // only for client env variables
  experimental__runtimeEnv: {

  }
});
