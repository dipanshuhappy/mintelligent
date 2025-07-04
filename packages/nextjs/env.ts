import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]),
    FILEBASE_ACCESS_KEY: z.string(),
    FILEBASE_SECRET_KEY: z.string(),
    FILEBASE_BUCKET_NAME: z.string(),
  },
  client: {
    NEXT_PUBLIC_ALCHEMY_API_KEY: z.string(),
    NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: z.string(),
    NEXT_PUBLIC_ENV: z.string(),
  },
  runtimeEnv: {

    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_ALCHEMY_API_KEY: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
    NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
    FILEBASE_ACCESS_KEY: process.env.FILEBASE_ACCESS_KEY,
    FILEBASE_SECRET_KEY: process.env.FILEBASE_SECRET_KEY,
    FILEBASE_BUCKET_NAME: process.env.FILEBASE_BUCKET_NAME,
  },
});
