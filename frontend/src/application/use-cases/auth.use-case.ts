import { repositories } from "@/infrastructure/repositories";

export const loginUser = (email: string, password: string) =>
  repositories.auth.login(email, password);
export const logoutUser = (refreshToken?: string) =>
  repositories.auth.logout(refreshToken);
export const refreshSession = (refreshToken: string) =>
  repositories.auth.refresh(refreshToken);
export const fetchCurrentUser = () => repositories.auth.me();
