const dotenv = require('dotenv');
const { z } = require('zod');

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().default('postgres://postgres:postgres@localhost:5432/seatsync'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().default('seatsync_super_secret_production_key_change_in_real_prod_2026'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  MAX_SEATS_PER_BOOKING: z.coerce.number().default(6),
  LOCK_TTL_SECONDS: z.coerce.number().default(600),
  PAYMENT_TIMEOUT_SECONDS: z.coerce.number().default(180),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

module.exports = parsed.data;
