const OPTIONAL_URL_KEYS = [
  'CORS_ORIGINS',
  'REDIS_URL',
  'STRIPE_SUCCESS_URL',
  'STRIPE_CANCEL_URL',
  'API_PUBLIC_URL',
  'PUBLIC_API_URL',
];

const OPTIONAL_NUMBER_KEYS = [
  'PORT',
  'REDIS_PORT',
  'JWT_REFRESH_EXPIRATION_DAYS',
];

const REQUIRED_IN_PRODUCTION = [
  'DATABASE_URL',
  'JWT_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
];

function assertNumber(key: string, value: string) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    throw new Error(`${key} must be a positive number`);
  }
}

function assertUrl(key: string, value: string) {
  for (const origin of value.split(',')) {
    const trimmedOrigin = origin.trim();
    if (!trimmedOrigin) continue;
    try {
      new URL(trimmedOrigin);
    } catch {
      throw new Error(`${key} contains an invalid URL: ${trimmedOrigin}`);
    }
  }
}

export function validateEnv(config: Record<string, unknown>) {
  const nodeEnv =
    typeof config.NODE_ENV === 'string' ? config.NODE_ENV : 'development';

  if (nodeEnv === 'production') {
    for (const key of REQUIRED_IN_PRODUCTION) {
      if (!config[key]) {
        throw new Error(`${key} is required in production`);
      }
    }
  }

  for (const key of OPTIONAL_NUMBER_KEYS) {
    const value = config[key];
    if (typeof value === 'string' && value.trim()) {
      assertNumber(key, value);
    }
  }

  for (const key of OPTIONAL_URL_KEYS) {
    const value = config[key];
    if (typeof value === 'string' && value.trim()) {
      assertUrl(key, value);
    }
  }

  return config;
}
