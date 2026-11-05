<script setup lang="ts">
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../stores/auth.store";
import Button from "../components/ui/button.vue";
import Input from "../components/ui/input.vue";
import { Store, ArrowRight } from "lucide-vue-next";

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const email = ref("admin@example.com");
const password = ref("admin123");

async function submit() {
  const ok = await auth.login(email.value, password.value);
  if (ok) {
    const redirect = (route.query.redirect as string) || "/dashboard";
    router.replace(redirect);
  }
}

function quickFill(role: "admin" | "staff") {
  if (role === "admin") {
    email.value = "admin@example.com";
    password.value = "admin123";
  } else {
    email.value = "staff@example.com";
    password.value = "staff123";
  }
}
</script>

<template>
  <div class="min-h-screen grid lg:grid-cols-2 bg-background">
    <!-- Brand panel -->
    <div
      class="hidden lg:flex relative overflow-hidden bg-primary text-primary-foreground p-12 flex-col justify-between grain"
    >
      <div class="flex items-center gap-2.5">
        <div class="w-10 h-10 rounded-lg bg-accent grid place-items-center">
          <Store class="w-5 h-5 text-accent-foreground" />
        </div>
        <span class="font-display text-xl font-semibold tracking-tight"
          >Azatech Shop</span
        >
      </div>

      <div class="space-y-6 max-w-md">
        <div
          class="inline-block px-3 py-1 text-[11px] uppercase tracking-[0.2em] bg-accent/20 text-accent rounded-full"
        >
          Order Management · v1.0
        </div>
        <h1
          class="font-display text-5xl leading-[1.05] font-semibold tracking-tight"
        >
          Run your shop with&nbsp;calm,<br />
          <span class="italic text-accent">deliberate</span> motion.
        </h1>
        <p class="text-primary-foreground/70 text-base leading-relaxed">
          A production-shaped console for products, customers, and orders —
          built on an OpenAPI contract with a clean, layered architecture at the
          core.
        </p>
      </div>

      <div class="text-xs text-primary-foreground/50 font-mono">
        © 2026 — Vue 3 · Clean Architecture · Mock Mode
      </div>

      <div
        class="absolute -right-32 -bottom-32 w-[480px] h-[480px] rounded-full bg-accent/10 blur-3xl"
      ></div>
    </div>

    <!-- Form panel -->
    <div class="flex items-center justify-center p-6 md:p-12">
      <div class="w-full max-w-sm">
        <div class="lg:hidden mb-8 flex items-center gap-2.5">
          <div class="w-10 h-10 rounded-lg bg-primary grid place-items-center">
            <Store class="w-5 h-5 text-primary-foreground" />
          </div>
          <span class="font-display text-xl font-semibold tracking-tight"
            >Azatech Shop</span
          >
        </div>

        <h2 class="font-display text-3xl font-semibold tracking-tight">
          Welcome back
        </h2>
        <p class="text-muted-foreground mt-2 text-sm">
          Sign in to the operations console.
        </p>

        <form
          class="mt-8 space-y-4"
          @submit.prevent="submit"
          data-testid="login-form"
        >
          <div>
            <label
              class="text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >Email</label
            >
            <Input
              v-model="email"
              type="email"
              required
              class="mt-1.5"
              data-testid="login-email-input"
            />
          </div>
          <div>
            <label
              class="text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >Password</label
            >
            <Input
              v-model="password"
              type="password"
              required
              class="mt-1.5"
              data-testid="login-password-input"
            />
          </div>

          <p
            v-if="auth.errorMessage"
            class="text-sm text-destructive"
            data-testid="login-error"
          >
            {{ auth.errorMessage }}
          </p>

          <Button
            type="submit"
            :loading="auth.loading"
            variant="accent"
            size="lg"
            class="w-full"
            data-testid="login-submit-btn"
          >
            Sign in <ArrowRight class="w-4 h-4" />
          </Button>
        </form>

        <div class="mt-8 p-4 rounded-lg bg-muted/60 border border-border">
          <div
            class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-2 font-medium"
          >
            Demo credentials
          </div>
          <div class="grid grid-cols-2 gap-2">
            <button
              class="text-left p-2 rounded-md hover:bg-background border border-transparent hover:border-border transition"
              @click="quickFill('admin')"
              data-testid="fill-admin-btn"
            >
              <div class="text-xs font-semibold">Admin</div>
              <div class="text-[11px] text-muted-foreground font-mono">
                admin@example.com
              </div>
            </button>
            <button
              class="text-left p-2 rounded-md hover:bg-background border border-transparent hover:border-border transition"
              @click="quickFill('staff')"
              data-testid="fill-staff-btn"
            >
              <div class="text-xs font-semibold">Staff</div>
              <div class="text-[11px] text-muted-foreground font-mono">
                staff@example.com
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
