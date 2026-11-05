import { SignOptions } from "jsonwebtoken";

const nodeEnv = process.env.NODE_ENV ?? "development";
export default {
  env: nodeEnv,
  host: process.env.APP_HOST,
  port: Number(process.env.APP_PORT ?? 1919),
  isProduction: nodeEnv === "production",
  corsOrigins: (
    process.env.CORS_ORIGINS ?? "http://localhost:5173,http://localhost:3000"
  )
    .split(",")
    .map((origin: string) => origin.trim())
    .filter(Boolean),

  // JWT Config
  jwtSecret: process.env.APP_JWT_SECRET ?? "",
  jwtRefreshSecret: process.env.APP_JWT_REFRESH_SECRET ?? "",
  tokenExpiredIn: (process.env.APP_TOKEN_EXPIRES_IN ||
    "1h") as SignOptions["expiresIn"],
  refreshTokenExpiredIn: (process.env.APP_REFRESH_TOKEN_EXPIRES_IN ||
    "7d") as SignOptions["expiresIn"],

  bcryptSaltRounds: Number(process.env.APP_BCRYPT_SALT_ROUNDS),
  database: {
    host: process.env.DB_HOST as string,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER as string,
    password: process.env.DB_PASS as string,
    dbName: process.env.DB_NAME as string,
  },
};
