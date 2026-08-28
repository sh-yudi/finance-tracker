import dotenv from 'dotenv';

dotenv.config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  appName: process.env.APP_NAME || 'FinanceTracker',
  databaseUrl: process.env.DATABASE_URL || '',
  redisUrl: process.env.REDIS_URL || '',
  jwt: {
    secret: process.env.JWT_SECRET || '',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
  plaid: {
    env: process.env.PLAID_ENV || 'sandbox',
    clientId: process.env.PLAID_CLIENT_ID || '',
    secret: process.env.PLAID_SECRET || '',
    publicKey: process.env.PLAID_PUBLIC_KEY || '',
    webhookUrl: process.env.PLAID_WEBHOOK_URL || '',
  },
  fraud: {
    provider: process.env.FRAUD_CHECK_PROVIDER || 'internal',
    cacheTtl: parseInt(process.env.FRAUD_SCORE_CACHE_TTL || '86400', 10),
  },
  notifications: {
    expoToken: process.env.EXPO_ACCESS_TOKEN || '',
    projectId: process.env.EXPO_PROJECT_ID || '',
  },
  rateLimit: {
    windowMs: parseInt(process.env.API_RATE_WINDOW || '15', 10) * 60 * 1000,
    max: parseInt(process.env.API_RATE_LIMIT || '100', 10),
  },
};

export default config;
