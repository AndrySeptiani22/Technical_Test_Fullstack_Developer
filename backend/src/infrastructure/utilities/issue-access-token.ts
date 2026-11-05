import jwt, { type SignOptions } from "jsonwebtoken";

export function issueAccessToken(userId: string): string {
  const secret = process.env.APP_JWT_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("APP_JWT_SECRET must contain at least 32 characters.");
  return jwt.sign({ sub: userId }, secret, {
    expiresIn: (process.env.APP_TOKEN_EXPIRES_IN ??
      "1h") as SignOptions["expiresIn"],
  });
}
