import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { loginUser, logoutUser } from "@/application/use-cases/auth.use-case";
import { setStoredToken } from "@/infrastructure/http/client";
import type { User } from "@/domain/entities";

const USER_KEY = "azashop.user";
const REFRESH_KEY = "azashop.refreshToken";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);
  const refreshToken = ref<string | null>(null);
  const loading = ref(false);
  const errorMessage = ref<string | null>(null);

  const isAuthenticated = computed(() => !!user.value);

  function hasPermission(perm: string) {
    return user.value?.permissions.includes(perm) ?? false;
  }

  function hydrate() {
    const rawUser = localStorage.getItem(USER_KEY);
    const rt = localStorage.getItem(REFRESH_KEY);
    if (rawUser) {
      try {
        user.value = JSON.parse(rawUser);
      } catch {
        user.value = null;
      }
    }
    refreshToken.value = rt;
  }

  async function login(email: string, password: string) {
    loading.value = true;
    errorMessage.value = null;
    try {
      const res = await loginUser(email, password);
      if (!res.success || !res.data) {
        errorMessage.value = res.message || "Login failed";
        return false;
      }
      setStoredToken(res.data.accessToken);
      refreshToken.value = res.data.refreshToken;
      user.value = res.data.user;
      localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
      localStorage.setItem(REFRESH_KEY, res.data.refreshToken);
      return true;
    } catch (e: any) {
      errorMessage.value = e?.message || "Login failed";
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    try {
      await logoutUser(refreshToken.value || undefined);
    } catch (err: any) {
      console.error("Logout error:", err);
    }
    setStoredToken(null);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(REFRESH_KEY);
    user.value = null;
    refreshToken.value = null;
  }

  return {
    user,
    refreshToken,
    loading,
    errorMessage,
    isAuthenticated,
    hasPermission,
    hydrate,
    login,
    logout,
  };
});
