import { AsyncLocalStorage } from "async_hooks";
import { IHTTPContextAccessor } from "@application/abstract/ihttp-context-accessor";
import { UnauthorizedError } from "@application/models/error/unauthorized.error";

interface HTTPContextStore {
  userId: string | null;
  email: string | null;
  permissions: string[];
  ipAddress?: string | null;
  userAgent?: string | null;
  correlationId?: string | null;
}

export class HTTPContextAccessor implements IHTTPContextAccessor {
  private static asyncLocalStorage: AsyncLocalStorage<HTTPContextStore> =
    new AsyncLocalStorage<HTTPContextStore>();

  public static run(store: HTTPContextStore, callback: () => void): void {
    this.asyncLocalStorage.run(
      { ...this.asyncLocalStorage.getStore(), ...store },
      callback,
    );
  }

  getUserId(): string | null {
    return HTTPContextAccessor.asyncLocalStorage.getStore()?.userId || null;
  }

  getRequiredUserId(): string {
    const userId = this.getUserId();
    if (!userId) {
      throw new UnauthorizedError("Authenticated user is required");
    }
    return userId;
  }

  getEmail(): string | null {
    return HTTPContextAccessor.asyncLocalStorage.getStore()?.email || null;
  }

  getRequiredEmail(): string {
    const email = this.getEmail();
    if (!email) {
      throw new Error(
        "Unauthenticated: Email is required but not found in HTTP context.",
      );
    }
    return email;
  }

  getPermissions(): string[] {
    return HTTPContextAccessor.asyncLocalStorage.getStore()?.permissions ?? [];
  }

  getIpAddress(): string | null {
    return HTTPContextAccessor.asyncLocalStorage.getStore()?.ipAddress ?? null;
  }

  getUserAgent(): string | null {
    return HTTPContextAccessor.asyncLocalStorage.getStore()?.userAgent ?? null;
  }

  getCorrelationId(): string | null {
    return HTTPContextAccessor.asyncLocalStorage.getStore()?.correlationId ?? null;
  }

}
