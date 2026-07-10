import "server-only";
import { z } from "zod";

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string(),
});

const serverEnv = serverSchema.safeParse(process.env);

if (!serverEnv.success) {
  console.error(
    "Invalid server environment variables:",
    serverEnv.error.format(),
  );
  throw new Error("Invalid server environment variables", {
    cause: serverEnv.error,
  });
}

export const env = serverEnv.data;
