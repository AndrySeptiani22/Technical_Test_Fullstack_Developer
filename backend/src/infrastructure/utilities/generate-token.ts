import jwt from "jsonwebtoken";

import { User } from "@domain/entities";
import appConfig from "@infrastructure/config/app-config";

export const createAccessToken = (
  user: Pick<User, "userId" | "email">,
  permissions: string[],
): string =>
  jwt.sign(
    { userId: user.userId, email: user.email, permissions },
    appConfig.jwtSecret,
    { expiresIn: appConfig.tokenExpiredIn },
  );

export const createRefreshToken = (
  user: Pick<User, "userId" | "email">,
): string =>
  jwt.sign(
    { userId: user.userId, email: user.email },
    appConfig.jwtRefreshSecret,
    { expiresIn: appConfig.refreshTokenExpiredIn },
  );
