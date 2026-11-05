import { http } from "../http/client";
import type { IAuthRepository } from "@/domain/repositories";
import type { ApiEnvelope, AuthSession, User } from "@/domain/entities";

export class AuthRepository implements IAuthRepository {
  async login(email: string, password: string) {
    const { data } = await http.post<ApiEnvelope<AuthSession>>("/auth/login", {
      email,
      password,
    });
    return data;
  }

  async logout(refresh_token?: string) {
    const { data } = await http.post<ApiEnvelope<null>>(
      "/auth/logout",
      refresh_token ? { refresh_token } : {},
    );
    return data;
  }

  async refresh(refresh_token: string) {
    const { data } = await http.post<ApiEnvelope<AuthSession>>(
      "/auth/refresh",
      { refresh_token },
    );
    return data;
  }

  async me() {
    const { data } = await http.get<ApiEnvelope<User>>("/auth/me");
    return data;
  }
}
