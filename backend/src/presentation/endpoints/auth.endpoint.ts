import { Router } from "express";
import { AuthRepository } from "@infrastructure/repositories/auth.repository";
import { AuthUseCase } from "@application/use-cases/auth/auth.use-case";
import dataSource from "@infrastructure/config/db-context";
import {
  authenticate,
  getAuth,
  type ShopRequest,
} from "@presentation/middleware/shop-auth.middleware";
import { asyncRoute } from "./endpoint-helpers";
import { rateLimit } from "@presentation/middleware/rate-limit.middleware";
import { parseRequest } from "@application/models/validators/common.validator";
import {
  loginRequestSchema,
  logoutRequestSchema,
  refreshRequestSchema,
} from "@application/models/validators/auth.validator";
import type {
  LoginRequest,
  LogoutRequest,
  RefreshRequest,
} from "@application/models/requests/auth.request";
import {
  currentUserResponse,
  loginResponse,
  logoutResponse,
  refreshResponse,
} from "@application/models/response/auth.response";

const router = Router();
const useCase = new AuthUseCase(new AuthRepository(dataSource));
router.post(
  "/login",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 10, keyPrefix: "auth-login" }),
  asyncRoute(async (req, res) => {
    const body: LoginRequest = parseRequest(loginRequestSchema, req.body);
    const result = await useCase.login(body.email, body.password);
    (req as ShopRequest).auth = {
      userId: result.user.userId,
      email: result.user.email,
      name: result.user.name,
      roleCode: result.user.roleCode,
      permissions: result.user.permissions,
    };
    res.status(200).json(loginResponse(result));
  }),
);
router.post(
  "/refresh",
  rateLimit({ windowMs: 60 * 1000, max: 30, keyPrefix: "auth-refresh" }),
  asyncRoute(async (req, res) => {
    const body: RefreshRequest = parseRequest(refreshRequestSchema, req.body);
    const result = await useCase.refresh(body.refresh_token);
    res.status(200).json(refreshResponse(result));
  }),
);
router.post(
  "/logout",
  authenticate,
  asyncRoute(async (req, res) => {
    const body: LogoutRequest = parseRequest(
      logoutRequestSchema,
      req.body ?? {},
    );
    await useCase.logout(body.refresh_token);
    res.status(200).json(logoutResponse());
  }),
);
router.get(
  "/me",
  authenticate,
  asyncRoute(async (req, res) => {
    const auth = getAuth(req);
    const user = await useCase.me(auth.userId);
    res.status(200).json(currentUserResponse(user));
  }),
);
export default router;
