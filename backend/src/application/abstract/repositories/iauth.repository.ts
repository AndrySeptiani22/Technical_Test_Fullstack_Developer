export interface AuthUserView {
  userId: string;
  name: string;
  email: string;
  roleCode: string;
  permissions: string[];
}

export interface AuthTokenResult {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: AuthUserView;
}

export interface IAuthRepository {
  login(email: string, password: string): Promise<AuthTokenResult>;
  refresh(refreshToken: string): Promise<AuthTokenResult>;
  logout(refreshToken: string | undefined): Promise<void>;
  me(userId: string): Promise<AuthUserView>;
}
