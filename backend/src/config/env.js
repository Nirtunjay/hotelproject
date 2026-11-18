// Fail fast if critical env vars are missing
const required = ['MONGO_URI', 'JWT_SECRET', 'REFRESH_SECRET'];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing required env var: ${key}`);
}

// Reject the insecure defaults shipped in .env.example
if (process.env.NODE_ENV === 'production') {
  if (process.env.JWT_SECRET === 'change_this_to_a_random_32_char_string')
    throw new Error('JWT_SECRET must be changed from the example value in production');
}

module.exports = {
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshSecret: process.env.REFRESH_SECRET,
  refreshExpiresIn: process.env.REFRESH_EXPIRES_IN || '7d',
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@stayease.dev',
  adminPassword: process.env.ADMIN_PASSWORD,
};
