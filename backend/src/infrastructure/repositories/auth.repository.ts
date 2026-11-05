import { createHash, randomBytes, randomUUID } from "crypto";
import { StatusCodes } from "http-status-codes";
import bcrypt from "bcryptjs";
import { DataSource, IsNull } from "typeorm";
import { AuditLog, RefreshToken, User } from "@domain/entities";
import type {
  IAuthRepository,
  AuthTokenResult,
  AuthUserView,
} from "@application/abstract/repositories/iauth.repository";
import { ApplicationError } from "@application/models/error/application.error";
import { issueAccessToken } from "@infrastructure/utilities/issue-access-token";
import { HTTPContextAccessor } from "@infrastructure/config/http-context-accessor";

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function parseDuration(value: string): number {
  const match = value.trim().match(/^(\d+)(s|m|h|d)$/i);
  if (!match) return 7 * 24 * 60 * 60;
  const amount = Number(match[1]);
  return (
    amount *
    ({ s: 1, m: 60, h: 3600, d: 86400 } as const)[
      match[2].toLowerCase() as "s" | "m" | "h" | "d"
    ]
  );
}

function userView(user: User): AuthUserView {
  return {
    userId: user.userId,
    name: user.name,
    email: user.email,
    roleCode: user.role.code,
    permissions: [
      ...new Set(user.role.rolePermissions.map((item) => item.permission.code)),
    ],
  };
}

export class AuthRepository implements IAuthRepository {
  constructor(private readonly dataSource: DataSource) {}

  async login(email: string, password: string): Promise<AuthTokenResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.dataSource
      .getRepository(User)
      .createQueryBuilder("user")
      .addSelect("user.password")
      .leftJoinAndSelect("user.role", "role")
      .leftJoinAndSelect("role.rolePermissions", "rolePermission")
      .leftJoinAndSelect("rolePermission.permission", "permission")
      .where("LOWER(user.email) = :email", { email: normalizedEmail })
      .andWhere("user.deletedAt IS NULL")
      .getOne();
    if (!user || !(await bcrypt.compare(password, user.password))) {
      await this.auditLogin("LOGIN_FAILED", null, normalizedEmail);
      throw new ApplicationError(
        "Email or password is incorrect.",
        StatusCodes.UNAUTHORIZED,
        "INVALID_CREDENTIALS",
      );
    }
    return this.issueTokenPair(user, normalizedEmail);
  }

  async refresh(refreshToken: string): Promise<AuthTokenResult> {
    const requestId = new HTTPContextAccessor().getCorrelationId();
    const result = await this.dataSource.transaction(
      "READ COMMITTED",
      async (manager) => {
        const tokenHash = sha256(refreshToken);
        const tokenRepo = manager.getRepository(RefreshToken);
        const current = await tokenRepo
          .createQueryBuilder("token")
          .where("token.tokenHash = :tokenHash", { tokenHash })
          .setLock("pessimistic_write")
          .getOne();
        if (!current) return { error: "INVALID_REFRESH" as const };
        if (current.revokedAt || current.expiresAt <= new Date()) {
          if (current.revokedAt) {
            await tokenRepo.update(
              { tokenFamily: current.tokenFamily, revokedAt: IsNull() },
              { revokedAt: new Date() },
            );
            return { error: "TOKEN_REUSE" as const };
          }
          current.revokedAt = new Date();
          await tokenRepo.save(current);
          return { error: "EXPIRED_REFRESH" as const };
        }
        const user = await manager.getRepository(User).findOne({
          where: { userId: current.userId, deletedAt: IsNull() },
          relations: { role: { rolePermissions: { permission: true } } },
        });
        if (!user) return { error: "INVALID_REFRESH" as const };
        const rawNextToken = randomBytes(48).toString("base64url");
        const expiresAt = new Date(
          Date.now() +
            parseDuration(process.env.APP_REFRESH_TOKEN_EXPIRES_IN ?? "7d") *
              1000,
        );
        const next = await tokenRepo.save({
          userId: current.userId,
          tokenFamily: current.tokenFamily,
          tokenHash: sha256(rawNextToken),
          expiresAt,
          revokedAt: null,
          replacedById: null,
        });
        current.revokedAt = new Date();
        current.replacedById = next.refreshTokenId;
        await tokenRepo.save(current);
        await manager.getRepository(AuditLog).save({
          requestId,
          userId: user.userId,
          action: "REFRESH",
          entityType: "AUTHENTICATION",
          entityId: user.userId,
          beforeData: null,
          afterData: null,
          metadata: {},
        });
        return { user, refreshToken: rawNextToken };
      },
    );
    if ("error" in result) {
      await this.dataSource.getRepository(AuditLog).save({
        requestId,
        userId: null,
        action: "REFRESH_FAILED",
        entityType: "AUTHENTICATION",
        entityId: sha256(refreshToken),
        beforeData: null,
        afterData: null,
        metadata: { reason: result.error },
      });
      throw new ApplicationError(
        result.error === "TOKEN_REUSE"
          ? "Refresh token reuse detected; the token family was revoked."
          : "Refresh token is invalid or expired.",
        StatusCodes.UNAUTHORIZED,
        result.error,
      );
    }
    return this.makeTokenResult(result.user, result.refreshToken);
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    const context = new HTTPContextAccessor();
    const userId = context.getUserId();
    const requestId = context.getCorrelationId();
    await this.dataSource.transaction(async (manager) => {
      if (refreshToken) {
        await manager.getRepository(RefreshToken).update(
          { tokenHash: sha256(refreshToken), revokedAt: IsNull() },
          { revokedAt: new Date() },
        );
      }
      await manager.getRepository(AuditLog).save({
        requestId,
        userId,
        action: "LOGOUT",
        entityType: "AUTHENTICATION",
        entityId: userId ?? sha256(requestId ?? randomUUID()),
        beforeData: null,
        afterData: null,
        metadata: { refreshTokenProvided: Boolean(refreshToken) },
      });
    });
  }

  async me(userId: string): Promise<AuthUserView> {
    const user = await this.dataSource.getRepository(User).findOne({
      where: { userId, deletedAt: IsNull() },
      relations: { role: { rolePermissions: { permission: true } } },
    });
    if (!user)
      throw new ApplicationError(
        "User account is unavailable.",
        StatusCodes.UNAUTHORIZED,
        "INVALID_USER",
      );
    return userView(user);
  }

  private async issueTokenPair(
    user: User,
    normalizedEmail: string,
  ): Promise<AuthTokenResult> {
    const rawRefreshToken = randomBytes(48).toString("base64url");
    const expiresIn = parseDuration(
      process.env.APP_REFRESH_TOKEN_EXPIRES_IN ?? "7d",
    );
    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(RefreshToken).save({
        userId: user.userId,
        tokenFamily: randomUUID(),
        tokenHash: sha256(rawRefreshToken),
        expiresAt: new Date(Date.now() + expiresIn * 1000),
        revokedAt: null,
        replacedById: null,
      });
      await manager.getRepository(AuditLog).save({
        requestId: new HTTPContextAccessor().getCorrelationId(),
        userId: user.userId,
        action: "LOGIN",
        entityType: "AUTHENTICATION",
        entityId: user.userId,
        beforeData: null,
        afterData: null,
        metadata: { email: normalizedEmail },
      });
    });
    return this.makeTokenResult(user, rawRefreshToken);
  }

  private auditLogin(
    action: "LOGIN_FAILED",
    userId: null,
    normalizedEmail: string,
  ): Promise<AuditLog> {
    return this.dataSource.getRepository(AuditLog).save({
      requestId: new HTTPContextAccessor().getCorrelationId(),
      userId,
      action,
      entityType: "AUTHENTICATION",
      entityId: sha256(normalizedEmail),
      beforeData: null,
      afterData: null,
      metadata: { identifierHash: sha256(normalizedEmail) },
    });
  }

  private makeTokenResult(user: User, refreshToken: string): AuthTokenResult {
    const view = userView(user);
    const accessSeconds = parseDuration(
      process.env.APP_TOKEN_EXPIRES_IN ?? "1h",
    );
    return {
      accessToken: issueAccessToken(user.userId),
      refreshToken,
      tokenType: "Bearer",
      expiresIn: accessSeconds,
      user: view,
    };
  }
}
