import type { UUID } from "./common.entity";

export interface User {
  userId: UUID;
  name: string;
  email: string;
  roleCode: string;
  permissions: string[];
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}
