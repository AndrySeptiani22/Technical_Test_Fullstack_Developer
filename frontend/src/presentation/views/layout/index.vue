<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, RouterView, useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/presentation/stores/auth.store";
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  BarChart3,
  LogOut,
  Store,
} from "lucide-vue-next";

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const nav = computed(() =>
  [
    {
      to: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      perm: "dashboard.view",
    },
    { to: "/orders", label: "Orders", icon: ShoppingCart, perm: "orders.view" },
    {
      to: "/products",
      label: "Products",
      icon: Package,
      perm: "products.view",
    },
    {
      to: "/customers",
      label: "Customers",
      icon: Users,
      perm: "customers.view",
    },
    {
      to: "/reports",
      label: "Reports",
      icon: BarChart3,
      perm: "reports.sales",
    },
  ].filter((n) => auth.hasPermission(n.perm)),
);

async function doLogout() {
  await auth.logout();
  router.push({ name: "login" });
}
</script>

<template>
  <div class="min-h-full flex bg-background grain">
    <!-- Sidebar -->
    <aside
      class="hidden md:flex w-64 flex-col border-r border-border bg-card/70 glass sticky top-0 h-screen"
    >
      <div class="h-16 flex items-center gap-2.5 px-6 border-b border-border">
        <div
          class="w-9 h-9 rounded-lg bg-primary text-primary-foreground grid place-items-center"
        >
          <Store class="w-5 h-5" />
        </div>
        <div>
          <div
            class="font-display text-base font-semibold leading-none tracking-tight"
          >
            Azatech Shop
          </div>
          <div
            class="text-[11px] uppercase tracking-widest text-muted-foreground mt-1"
          >
            Ops Console
          </div>
        </div>
      </div>

      <nav class="p-3 flex-1 space-y-1" data-testid="sidebar-nav">
        <RouterLink
          v-for="n in nav"
          :key="n.to"
          :to="n.to"
          :data-testid="`nav-${n.label.toLowerCase()}`"
          class="group flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          :class="{
            'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground':
              route.path.startsWith(n.to),
          }"
        >
          <component :is="n.icon" class="w-4 h-4" />
          <span>{{ n.label }}</span>
        </RouterLink>
      </nav>

      <div class="p-3 border-t border-border">
        <div
          class="px-3 py-2 rounded-md bg-muted/60 mb-2"
          data-testid="user-info"
        >
          <div class="text-sm font-medium truncate">{{ auth.user?.name }}</div>
          <div class="text-xs text-muted-foreground truncate">
            {{ auth.user?.email }}
          </div>
          <div
            class="text-[10px] mt-1 inline-block px-1.5 py-0.5 rounded bg-accent/15 text-accent uppercase tracking-wider"
          >
            {{ auth.user?.roleCode }}
          </div>
        </div>
        <button
          @click="doLogout"
          data-testid="logout-btn"
          class="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut class="w-4 h-4" /> Sign out
        </button>
      </div>
    </aside>

    <!-- Main -->
    <main class="flex-1 min-w-0">
      <div class="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">
        <RouterView />
      </div>
    </main>
  </div>
</template>
