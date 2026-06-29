import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().default('./db.sqlite'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  AUTH_SECRET: z.string().min(32, 'AUTH_SECRET must be at least 32 characters'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  NEXT_PUBLIC_WS_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.errors);
    throw new Error(`Invalid environment variables: ${parsed.error.errors.map(e => e.message).join(', ')}`);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

export const env = getEnv();