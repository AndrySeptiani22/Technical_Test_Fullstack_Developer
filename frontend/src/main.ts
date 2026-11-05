import { createApp } from "vue";
import { createPinia } from "pinia";
import { VueQueryPlugin } from "@tanstack/vue-query";

import App from "./App.vue";
import { router } from "./presentation/router";
import { useAuthStore } from "./presentation/stores/auth.store";

import "./assets/style.css";

function bootstrap() {
  const app = createApp(App);
  const pinia = createPinia();

  app.use(pinia);

  useAuthStore().hydrate();

  app.use(VueQueryPlugin, {
    queryClientConfig: {
      defaultOptions: {
        queries: {
          staleTime: 30_000,
          retry: 1,
          refetchOnWindowFocus: true,
          refetchOnReconnect: true,
        },
      },
    },
  });

  app.use(router);
  app.mount("#app");
}

bootstrap();
