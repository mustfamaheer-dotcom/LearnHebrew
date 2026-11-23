import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  PORT: z.string().default('5001'),
  FRONTEND_URL: z.string().default('https://engrew.com'),
  DATABASE_URL: z.string().default('postgresql://postgres.wlkalsgkstlhmzczinex:Av%2Aq.Wp2G-V3sL%2B@aws-0-eu-west-1.pooler.supabase.com:5432/postgres'),
  JWT_SECRET: z.string().default('engrew_jwt_prod_key_2026_super_secure_enterprise_key_v1'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string().default('engrew_refresh_prod_key_2026_super_secure_enterprise_key_v1'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_ROUNDS: z.coerce.number().default(12),
  APP_NAME: z.string().default('Engrew Academy'),
});

export const env = envSchema.parse(process.env);

