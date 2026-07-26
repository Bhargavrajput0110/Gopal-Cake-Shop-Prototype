import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  NEXTAUTH_SECRET: z.string().optional(),
  NEXTAUTH_URL: z.string().optional(),
  
  // Mandatory Tier 1 (Production Blockers)
  NEXT_PUBLIC_SUPABASE_URL: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_URL is required for authentication'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required for authentication'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required for server-side operations'),
  
  // Payment
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  // Map Provider
  DISTANCE_PROVIDER: z.enum(['google', 'manual']).default('manual'),
  GOOGLE_MAPS_API_KEY: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.DISTANCE_PROVIDER === 'google' && !data.GOOGLE_MAPS_API_KEY) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "GOOGLE_MAPS_API_KEY must be provided if DISTANCE_PROVIDER is 'google'",
      path: ['GOOGLE_MAPS_API_KEY'],
    });
  }
});

function validateEnv() {
  if (
    process.env.NODE_ENV === 'test' || 
    process.env.SKIP_ENV_VALIDATION === 'true' ||
    process.env.NEXT_PHASE === 'phase-production-build'
  ) {
    // Skip full validation during tests or build step
    return process.env;
  }

  const parsed = envSchema.safeParse(process.env);
  
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables. Fix them before starting the app.');
  }

  return parsed.data;
}

export const env = validateEnv();
