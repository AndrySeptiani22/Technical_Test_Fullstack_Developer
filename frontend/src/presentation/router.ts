import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";
import { useAuthStore } from "./stores/auth.store";

const routes: RouteRecordRaw[] = [
  {
    path: "/login",
    name: "login",
    component: () => import("./views/login/index.vue"),
    meta: { public: true },
  },
  {
    path: "/",
    component: () => import("./views/layout/index.vue"),
    children: [
      { path: "", redirect: "/dashboard" },
      {
        path: "dashboard",
        name: "dashboard",
        component: () => import("./views/dashboard/index.vue"),
        meta: { perm: "dashboard.view" },
      },
      {
        path: "products",
        name: "products",
        component: () => import("./views/product/index.vue"),
        meta: { perm: "products.view" },
      },
      {
        path: "products/:id",
        name: "product-detail",
        component: () => import("./views/product/page/detail.vue"),
        meta: { perm: "products.view" },
      },
      {
        path: "customers",
        name: "customers",
        component: () => import("./views/customer/index.vue"),
        meta: { perm: "customers.view" },
      },
      {
        path: "orders",
        name: "orders",
        component: () => import("./views/order/index.vue"),
        meta: { perm: "orders.view" },
      },
      {
        path: "orders/new",
        name: "order-new",
        component: () => import("./views/order/page/create.vue"),
        meta: { perm: "orders.create" },
      },
      {
        path: "orders/:id",
        name: "order-detail",
        component: () => import("./views/order/page/detail.vue"),
        meta: { perm: "orders.view" },
      },
      {
        path: "reports",
        name: "reports",
        component: () => import("./views/report/index.vue"),
        meta: { perm: "reports.sales" },
      },
    ],
  },
  { path: "/:pathMatch(.*)*", redirect: "/dashboard" },
];

export const router = createRouter({ history: createWebHistory(), routes });

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.meta.public) return true;
  if (!auth.isAuthenticated)
    return { name: "login", query: { redirect: to.fullPath } };
  const perm = to.meta.perm as string | undefined;
  if (perm && !auth.hasPermission(perm)) return { name: "dashboard" };
  return true;
});
