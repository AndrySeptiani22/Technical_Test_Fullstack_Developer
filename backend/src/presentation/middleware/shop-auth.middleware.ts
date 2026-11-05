import type { NextFunction, Request, RequestHandler, Response } from "express";
import jwt, { type SignOptions } from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import { IsNull } from "typeorm";
import { User } from "@domain/entities";
import { HTTPContextAccessor } from "@infrastructure/config/http-context-accessor";
import dataSource from "@infrastructure/config/db-context";

export interface AuthContext {
  userId: string;
  email: string;
  name: string;
  roleCode: string;
  permissions: string[];
}

export type ShopRequest = Request & {
  auth?: AuthContext;
  requestId?: string;
};

interface AccessTokenPayload {
  sub: string;
}

export class ApiError extends Error {
  public readonly httpStatus: number;

  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.httpStatus = status;
  }
}

export function getAuth(req: Request): AuthContext {
  const auth = (req as ShopRequest).auth;
  if (!auth)
    throw new ApiError(
      "Authentication is required.",
      StatusCodes.UNAUTHORIZED,
      "UNAUTHORIZED",
    );
  return auth;
}

export function issueAccessToken(userId: string): string {
  const secret = process.env.APP_JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("APP_JWT_SECRET must contain at least 32 characters.");
  }

  return jwt.sign({ sub: userId }, secret, {
    expiresIn: (process.env.APP_TOKEN_EXPIRES_IN ??
      "1h") as SignOptions["expiresIn"],
  });
}

export const authenticate: RequestHandler = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const header = req.get("authorization");
    const token = header?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token)
      throw new ApiError(
        "Authentication is required.",
        StatusCodes.UNAUTHORIZED,
        "UNAUTHORIZED",
      );

    const secret = process.env.APP_JWT_SECRET;
    if (!secret || secret.length < 32) {
      throw new Error("APP_JWT_SECRET must contain at least 32 characters.");
    }

    let payload: AccessTokenPayload;
    try {
      const verified = jwt.verify(token, secret);
      if (typeof verified === "string" || typeof verified.sub !== "string") {
        throw new Error("Invalid token payload.");
      }
      payload = verified as AccessTokenPayload;
    } catch {
      throw new ApiError(
        "The access token is invalid or expired.",
        StatusCodes.UNAUTHORIZED,
        "INVALID_TOKEN",
      );
    }

    const user = await dataSource.getRepository(User).findOne({
      where: { userId: payload.sub, deletedAt: IsNull() },
      relations: { role: { rolePermissions: { permission: true } } },
    });
    if (!user) {
      throw new ApiError(
        "The user account is unavailable.",
        StatusCodes.UNAUTHORIZED,
        "INVALID_USER",
      );
    }

    const auth: AuthContext = {
      userId: user.userId,
      email: user.email,
      name: user.name,
      roleCode: user.role.code,
      permissions: [
        ...new Set(
          user.role.rolePermissions.map(({ permission }) => permission.code),
        ),
      ],
    };
    (req as ShopRequest).auth = auth;
    HTTPContextAccessor.run(
      {
        userId: auth.userId,
        email: auth.email,
        permissions: auth.permissions,
      },
      next,
    );
  } catch (error) {
    next(error);
  }
};

export function requirePermission(permission: string): RequestHandler {
  return (req, _res, next) => {
    try {
      const auth = getAuth(req);
      if (!auth.permissions.includes(permission)) {
        throw new ApiError(
          "You do not have permission to perform this action.",
          StatusCodes.FORBIDDEN,
          "FORBIDDEN",
        );
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

export const requireAdmin: RequestHandler = (req, _res, next) => {
  try {
    if (getAuth(req).roleCode !== "admin") {
      throw new ApiError(
        "Administrator access is required.",
        StatusCodes.FORBIDDEN,
        "FORBIDDEN",
      );
    }
    next();
  } catch (error) {
    next(error);
  }
};
