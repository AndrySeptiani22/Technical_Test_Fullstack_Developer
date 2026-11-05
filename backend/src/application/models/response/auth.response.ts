import type {
  AuthTokenResult,
  AuthUserView,
} from "@application/abstract/repositories/iauth.repository";
import {
  apiSuccess,
  apiSuccessWithoutData,
  type ApiSuccessResponse,
} from "./api.response";

export type AuthTokenResponse = ApiSuccessResponse<AuthTokenResult>;
export type AuthUserResponse = ApiSuccessResponse<AuthUserView>;
export type LogoutResponse = ApiSuccessResponse;

export const loginResponse = (data: AuthTokenResult): AuthTokenResponse =>
  apiSuccess("Login successful.", data);

export const refreshResponse = (data: AuthTokenResult): AuthTokenResponse =>
  apiSuccess("Token refreshed.", data);

export const logoutResponse = (): LogoutResponse =>
  apiSuccessWithoutData("Logout successful.");

export const currentUserResponse = (data: AuthUserView): AuthUserResponse =>
  apiSuccess("OK", data);
