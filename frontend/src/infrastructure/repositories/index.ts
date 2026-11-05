import { AuthRepository } from "./auth.repository";
import { CustomerRepository } from "./customer.repository";
import { DashboardRepository } from "./dashboard.repository";
import { OrderRepository } from "./order.repository";
import { ProductRepository } from "./product.repository";

export { AuthRepository } from "./auth.repository";
export { CustomerRepository } from "./customer.repository";
export { DashboardRepository } from "./dashboard.repository";
export { OrderRepository } from "./order.repository";
export { ProductRepository } from "./product.repository";

export const repositories = {
  auth: new AuthRepository(),
  products: new ProductRepository(),
  customers: new CustomerRepository(),
  orders: new OrderRepository(),
  dashboard: new DashboardRepository(),
};
