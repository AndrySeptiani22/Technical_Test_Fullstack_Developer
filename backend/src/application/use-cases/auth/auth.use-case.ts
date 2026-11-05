import type { IAuthRepository } from "@application/abstract/repositories/iauth.repository";

export class AuthUseCase {
  constructor(private readonly repository: IAuthRepository) {}
  login(email: string, password: string) {
    return this.repository.login(email, password);
  }
  refresh(refreshToken: string) {
    return this.repository.refresh(refreshToken);
  }
  logout(refreshToken?: string) {
    return this.repository.logout(refreshToken);
  }
  me(userId: string) {
    return this.repository.me(userId);
  }
}
