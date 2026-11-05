export interface IHTTPContextAccessor {
  getUserId(): string | null;
  getRequiredUserId(): string;
  getEmail(): string | null;
  getRequiredEmail(): string;
  getPermissions(): string[];
  getIpAddress(): string | null;
  getUserAgent(): string | null;
  getCorrelationId(): string | null;
}
