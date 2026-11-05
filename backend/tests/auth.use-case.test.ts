import assert from "node:assert/strict";
import test from "node:test";
import type { IAuthRepository } from "@application/abstract/repositories/iauth.repository";
import { AuthUseCase } from "@application/use-cases/auth/auth.use-case";

async function assertDelegatedRejection(
  action: Promise<unknown>,
  error: Error,
): Promise<void> {
  await assert.rejects(action, (received) => received === error);
}

test("AuthUseCase delegates authentication operations including optional logout token", async () => {
  const error = new Error("repository failure");
  const calls: Array<{ method: string; args: unknown[] }> = [];
  const reject = (method: string) => (...args: unknown[]) => {
    calls.push({ method, args });
    return Promise.reject(error);
  };
  const repository: IAuthRepository = {
    login: reject("login"),
    refresh: reject("refresh"),
    logout: reject("logout"),
    me: reject("me"),
  };
  const useCase = new AuthUseCase(repository);

  await assertDelegatedRejection(useCase.login("a@example.com", "secret"), error);
  await assertDelegatedRejection(useCase.refresh("refresh-token"), error);
  await assertDelegatedRejection(useCase.logout("refresh-token"), error);
  await assertDelegatedRejection(useCase.logout(), error);
  await assertDelegatedRejection(useCase.me("user-1"), error);

  assert.deepEqual(calls, [
    { method: "login", args: ["a@example.com", "secret"] },
    { method: "refresh", args: ["refresh-token"] },
    { method: "logout", args: ["refresh-token"] },
    { method: "logout", args: [undefined] },
    { method: "me", args: ["user-1"] },
  ]);
});

test("AuthUseCase returns successful login and refresh results unchanged", async () => {
  const calls: Array<{ method: string; args: unknown[] }> = [];
  const user = {
    userId: "user-1",
    name: "Ayu",
    email: "ayu@example.com",
    roleCode: "cashier",
    permissions: ["orders.view"],
  };
  const loginResult = {
    accessToken: "access-token",
    refreshToken: "refresh-token",
    tokenType: "Bearer" as const,
    expiresIn: 3600,
    user,
  };
  const refreshedResult = {
    ...loginResult,
    accessToken: "next-access-token",
    refreshToken: "next-refresh-token",
  };
  const repository: IAuthRepository = {
    login: async (...args) => {
      calls.push({ method: "login", args });
      return loginResult;
    },
    refresh: async (...args) => {
      calls.push({ method: "refresh", args });
      return refreshedResult;
    },
    logout: async (...args) => {
      calls.push({ method: "logout", args });
    },
    me: async (...args) => {
      calls.push({ method: "me", args });
      return user;
    },
  };
  const useCase = new AuthUseCase(repository);

  assert.equal(await useCase.login("ayu@example.com", "correct-password"), loginResult);
  assert.equal(await useCase.refresh("opaque-refresh-token"), refreshedResult);
  assert.deepEqual(calls, [
    { method: "login", args: ["ayu@example.com", "correct-password"] },
    { method: "refresh", args: ["opaque-refresh-token"] },
  ]);
});

test("AuthUseCase resolves logout with or without a refresh token and returns the current user", async () => {
  const calls: Array<{ method: string; args: unknown[] }> = [];
  const user = {
    userId: "user-1",
    name: "Ayu",
    email: "ayu@example.com",
    roleCode: "cashier",
    permissions: ["orders.view"],
  };
  const repository: IAuthRepository = {
    login: async () => {
      throw new Error("Not used by this test.");
    },
    refresh: async () => {
      throw new Error("Not used by this test.");
    },
    logout: async (...args) => {
      calls.push({ method: "logout", args });
    },
    me: async (...args) => {
      calls.push({ method: "me", args });
      return user;
    },
  };
  const useCase = new AuthUseCase(repository);

  assert.equal(await useCase.logout("refresh-token"), undefined);
  assert.equal(await useCase.logout(), undefined);
  assert.equal(await useCase.me("user-1"), user);
  assert.deepEqual(calls, [
    { method: "logout", args: ["refresh-token"] },
    { method: "logout", args: [undefined] },
    { method: "me", args: ["user-1"] },
  ]);
});
