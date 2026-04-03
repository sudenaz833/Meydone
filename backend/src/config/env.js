const required = (key) => {
  const value = process.env[key];
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

/** Primary: **MONGO_URL**. Legacy: `MONGODB_URI`. */
function resolveMongoUri() {
  const uri = (process.env.MONGO_URL || process.env.MONGODB_URI || '').trim();
  if (!uri) {
    throw new Error('Set MONGO_URL in .env (e.g. mongodb://localhost:27017/meydone)');
  }
  return uri;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT) || 4000,
  /** MongoDB URI from `MONGO_URL` (preferred) or `MONGODB_URI` */
  mongodbUri: resolveMongoUri(),
  jwt: {
    secret: required('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
  /** If set, POST /api/admin/register requires header X-Admin-Register-Secret */
  adminRegisterSecret: process.env.ADMIN_REGISTER_SECRET || null,
};
