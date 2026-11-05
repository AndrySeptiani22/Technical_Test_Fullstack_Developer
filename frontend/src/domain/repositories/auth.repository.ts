import type { ApiEnvelope, AuthSession, User } from "../entities";

export interface IAuthRepository {
  login(email: string, password: string): Promise<ApiEnvelope<AuthSession>>;
  logout(refreshToken?: string): Promise<ApiEnvelope<null>>;
  refresh(refreshToken: string): Promise<ApiEnvelope<AuthSession>>;
  me(): Promise<ApiEnvelope<User>>;
}
