export const toast = {
  success(message: string) {
    (window as any).$toast?.success(message);
  },
  error(message: string) {
    (window as any).$toast?.error(message);
  },
  info(message: string) {
    (window as any).$toast?.info(message);
  },
};
