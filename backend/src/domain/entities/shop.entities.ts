import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "SHIPPED"
  | "COMPLETED"
  | "CANCELLED";

@Entity({ name: "ROLES" })
export class Role {
  @PrimaryGeneratedColumn("increment", { name: "ROLE_ID", type: "bigint" })
  roleId!: string;

  @Column({ name: "CODE", type: "varchar", length: 50, unique: true })
  code!: string;

  @Column({ name: "NAME", type: "varchar", length: 100, unique: true })
  name!: string;

  @Column({ name: "DESCRIPTION", type: "varchar", length: 500, nullable: true })
  description!: string | null;

  @CreateDateColumn({ name: "CREATED_AT", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "UPDATED_AT", type: "timestamptz" })
  updatedAt!: Date;

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.role)
  rolePermissions!: RolePermission[];

  @OneToMany(() => User, (user) => user.role)
  users!: User[];
}

@Entity({ name: "PERMISSIONS" })
export class Permission {
  @PrimaryGeneratedColumn("increment", { name: "PERMISSION_ID", type: "bigint" })
  permissionId!: string;

  @Column({ name: "CODE", type: "varchar", length: 100, unique: true })
  code!: string;

  @Column({ name: "MODULE", type: "varchar", length: 50 })
  module!: string;

  @Column({ name: "DESCRIPTION", type: "varchar", length: 500 })
  description!: string;

  @CreateDateColumn({ name: "CREATED_AT", type: "timestamptz" })
  createdAt!: Date;

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.permission)
  rolePermissions!: RolePermission[];
}

@Entity({ name: "ROLE_PERMISSIONS" })
export class RolePermission {
  @PrimaryColumn({ name: "ROLE_ID", type: "bigint" })
  roleId!: string;

  @PrimaryColumn({ name: "PERMISSION_ID", type: "bigint" })
  permissionId!: string;

  @ManyToOne(() => Role, (role) => role.rolePermissions, { onDelete: "CASCADE" })
  @JoinColumn({ name: "ROLE_ID", referencedColumnName: "roleId" })
  role!: Role;

  @ManyToOne(() => Permission, (permission) => permission.rolePermissions, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "PERMISSION_ID", referencedColumnName: "permissionId" })
  permission!: Permission;
}

@Entity({ name: "USERS" })
@Index("ux_users_email", ["email"], { unique: true })
export class User {
  @PrimaryGeneratedColumn("uuid", { name: "USER_ID" })
  userId!: string;

  @Column({ name: "ROLE_ID", type: "bigint" })
  roleId!: string;

  @Column({ name: "NAME", type: "varchar", length: 150 })
  name!: string;

  @Column({ name: "EMAIL", type: "varchar", length: 255 })
  email!: string;

  @Column({ name: "PASSWORD", type: "varchar", length: 255, select: false })
  password!: string;

  @CreateDateColumn({ name: "CREATED_AT", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "UPDATED_AT", type: "timestamptz" })
  updatedAt!: Date;

  @Column({ name: "DELETED_AT", type: "timestamptz", nullable: true })
  deletedAt!: Date | null;

  @ManyToOne(() => Role, (role) => role.users, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "ROLE_ID", referencedColumnName: "roleId" })
  role!: Role;

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens!: RefreshToken[];

  @OneToMany(() => Notification, (notification) => notification.recipient)
  notifications!: Notification[];
}

@Entity({ name: "REFRESH_TOKENS" })
export class RefreshToken {
  @PrimaryGeneratedColumn("increment", {
    name: "REFRESH_TOKEN_ID",
    type: "bigint",
  })
  refreshTokenId!: string;

  @Column({ name: "USER_ID", type: "uuid" })
  userId!: string;

  @Column({ name: "TOKEN_FAMILY", type: "uuid" })
  tokenFamily!: string;

  @Column({ name: "TOKEN_HASH", type: "varchar", length: 255, unique: true })
  tokenHash!: string;

  @Column({ name: "EXPIRES_AT", type: "timestamptz" })
  expiresAt!: Date;

  @Column({ name: "REVOKED_AT", type: "timestamptz", nullable: true })
  revokedAt!: Date | null;

  @Column({ name: "REPLACED_BY_ID", type: "bigint", nullable: true })
  replacedById!: string | null;

  @CreateDateColumn({ name: "CREATED_AT", type: "timestamptz" })
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.refreshTokens, { onDelete: "CASCADE" })
  @JoinColumn({ name: "USER_ID", referencedColumnName: "userId" })
  user!: User;
}

@Entity({ name: "PRODUCTS" })
export class Product {
  @PrimaryGeneratedColumn("increment", { name: "PRODUCT_ID", type: "bigint" })
  productId!: string;

  @Column({ name: "PRODUCT_CODE", type: "varchar", length: 50, unique: true })
  productCode!: string;

  @Column({ name: "PRODUCT_NAME", type: "varchar", length: 200 })
  productName!: string;

  @Column({ name: "STOCK", type: "integer", default: 0 })
  stock!: number;

  @Column({ name: "PRICE", type: "numeric", precision: 12, scale: 2 })
  price!: string;

  @Column({ name: "LOW_STOCK_THRESHOLD", type: "integer", default: 5 })
  lowStockThreshold!: number;

  @CreateDateColumn({ name: "CREATED_AT", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "UPDATED_AT", type: "timestamptz" })
  updatedAt!: Date;

  @Column({ name: "DELETED_AT", type: "timestamptz", nullable: true })
  deletedAt!: Date | null;

  @OneToMany(() => OrderItem, (item) => item.product)
  orderItems!: OrderItem[];

  @OneToMany(() => StockMovement, (movement) => movement.product)
  stockMovements!: StockMovement[];
}

@Entity({ name: "CUSTOMERS" })
export class Customer {
  @PrimaryGeneratedColumn("uuid", { name: "CUSTOMER_ID" })
  customerId!: string;

  @Column({ name: "CUSTOMER_NAME", type: "varchar", length: 200 })
  customerName!: string;

  @Column({ name: "CUSTOMER_ADDRESS", type: "varchar", length: 500 })
  customerAddress!: string;

  @Column({
    name: "GENDER",
    type: "enum",
    enum: ["MALE", "FEMALE"],
    enumName: "CUSTOMER_GENDER",
    nullable: true,
  })
  gender!: "MALE" | "FEMALE" | null;

  @Column({ name: "BIRTH_DATE", type: "date", nullable: true })
  birthDate!: string | null;

  @Column({ name: "PHONE", type: "varchar", length: 30, nullable: true })
  phone!: string | null;

  @Column({ name: "EMAIL", type: "varchar", length: 255, nullable: true })
  email!: string | null;

  @CreateDateColumn({ name: "CREATED_AT", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "UPDATED_AT", type: "timestamptz" })
  updatedAt!: Date;

  @Column({ name: "DELETED_AT", type: "timestamptz", nullable: true })
  deletedAt!: Date | null;

  @OneToMany(() => Order, (order) => order.customer)
  orders!: Order[];
}

@Entity({ name: "ORDERS" })
export class Order {
  @PrimaryGeneratedColumn("increment", { name: "ORDER_ID", type: "bigint" })
  orderId!: string;

  @Column({ name: "ORDER_NUMBER", type: "varchar", length: 30 })
  orderNumber!: string;

  @Column({ name: "CUSTOMER_ID", type: "uuid" })
  customerId!: string;

  @Column({ name: "CREATED_BY", type: "uuid" })
  createdBy!: string;

  @Column({
    name: "STATUS",
    type: "enum",
    enum: ["PENDING", "PAID", "SHIPPED", "COMPLETED", "CANCELLED"],
    enumName: "ORDER_STATUS",
    default: "PENDING",
  })
  status!: OrderStatus;

  @Column({ name: "TOTAL_AMOUNT", type: "numeric", precision: 14, scale: 2 })
  totalAmount!: string;

  @CreateDateColumn({ name: "ORDER_DATE", type: "timestamptz" })
  orderDate!: Date;

  @Column({ name: "PAID_AT", type: "timestamptz", nullable: true })
  paidAt!: Date | null;

  @Column({ name: "SHIPPED_AT", type: "timestamptz", nullable: true })
  shippedAt!: Date | null;

  @Column({ name: "COMPLETED_AT", type: "timestamptz", nullable: true })
  completedAt!: Date | null;

  @Column({ name: "CANCELLED_AT", type: "timestamptz", nullable: true })
  cancelledAt!: Date | null;

  @Column({ name: "CANCEL_REASON", type: "varchar", length: 500, nullable: true })
  cancelReason!: string | null;

  @CreateDateColumn({ name: "CREATED_AT", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "UPDATED_AT", type: "timestamptz" })
  updatedAt!: Date;

  @ManyToOne(() => Customer, (customer) => customer.orders, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "CUSTOMER_ID", referencedColumnName: "customerId" })
  customer!: Customer;

  @ManyToOne(() => User, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "CREATED_BY", referencedColumnName: "userId" })
  creator!: User;

  @OneToMany(() => OrderItem, (item) => item.order)
  items!: OrderItem[];

  @OneToMany(() => OrderStatusHistory, (history) => history.order)
  history!: OrderStatusHistory[];
}

@Entity({ name: "ORDER_ITEMS" })
export class OrderItem {
  @PrimaryGeneratedColumn("increment", { name: "ORDER_ITEM_ID", type: "bigint" })
  orderItemId!: string;

  @Column({ name: "ORDER_ID", type: "bigint" })
  orderId!: string;

  @Column({ name: "PRODUCT_ID", type: "bigint" })
  productId!: string;

  @Column({ name: "QUANTITY", type: "integer" })
  quantity!: number;

  @Column({ name: "UNIT_PRICE", type: "numeric", precision: 12, scale: 2 })
  unitPrice!: string;

  @Column({ name: "SUBTOTAL", type: "numeric", precision: 14, scale: 2 })
  subtotal!: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: "CASCADE" })
  @JoinColumn({ name: "ORDER_ID", referencedColumnName: "orderId" })
  order!: Order;

  @ManyToOne(() => Product, (product) => product.orderItems, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "PRODUCT_ID", referencedColumnName: "productId" })
  product!: Product;
}

@Entity({ name: "ORDER_STATUS_HISTORY" })
export class OrderStatusHistory {
  @PrimaryGeneratedColumn("increment", {
    name: "ORDER_STATUS_HISTORY_ID",
    type: "bigint",
  })
  orderStatusHistoryId!: string;

  @Column({ name: "ORDER_ID", type: "bigint" })
  orderId!: string;

  @Column({
    name: "FROM_STATUS",
    type: "enum",
    enum: ["PENDING", "PAID", "SHIPPED", "COMPLETED", "CANCELLED"],
    enumName: "ORDER_STATUS",
    nullable: true,
  })
  fromStatus!: OrderStatus | null;

  @Column({
    name: "TO_STATUS",
    type: "enum",
    enum: ["PENDING", "PAID", "SHIPPED", "COMPLETED", "CANCELLED"],
    enumName: "ORDER_STATUS",
  })
  toStatus!: OrderStatus;

  @Column({ name: "REASON", type: "varchar", length: 1000, nullable: true })
  reason!: string | null;

  @Column({ name: "CREATED_BY", type: "uuid" })
  createdBy!: string;

  @CreateDateColumn({ name: "CREATED_AT", type: "timestamptz" })
  createdAt!: Date;

  @ManyToOne(() => Order, (order) => order.history, { onDelete: "CASCADE" })
  @JoinColumn({ name: "ORDER_ID", referencedColumnName: "orderId" })
  order!: Order;
}

@Entity({ name: "STOCK_MOVEMENTS" })
export class StockMovement {
  @PrimaryGeneratedColumn("increment", {
    name: "STOCK_MOVEMENT_ID",
    type: "bigint",
  })
  stockMovementId!: string;

  @Column({ name: "PRODUCT_ID", type: "bigint" })
  productId!: string;

  @Column({
    name: "TYPE",
    type: "enum",
    enum: ["INITIAL", "ORDER_OUT", "CANCEL_RESTORE", "ADJUSTMENT"],
    enumName: "STOCK_MOVEMENT_TYPE",
  })
  type!: "INITIAL" | "ORDER_OUT" | "CANCEL_RESTORE" | "ADJUSTMENT";

  @Column({ name: "QUANTITY_CHANGE", type: "integer" })
  quantityChange!: number;

  @Column({ name: "STOCK_AFTER", type: "integer" })
  stockAfter!: number;

  @Column({ name: "REFERENCE_TYPE", type: "varchar", length: 50, nullable: true })
  referenceType!: string | null;

  @Column({ name: "REFERENCE_ID", type: "varchar", length: 100, nullable: true })
  referenceId!: string | null;

  @Column({ name: "NOTE", type: "varchar", length: 1000, nullable: true })
  note!: string | null;

  @Column({ name: "CREATED_BY", type: "uuid", nullable: true })
  createdBy!: string | null;

  @CreateDateColumn({ name: "CREATED_AT", type: "timestamptz" })
  createdAt!: Date;

  @ManyToOne(() => Product, (product) => product.stockMovements, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "PRODUCT_ID", referencedColumnName: "productId" })
  product!: Product;
}

@Entity({ name: "IDEMPOTENCY_KEYS" })
export class IdempotencyKey {
  @PrimaryGeneratedColumn("increment", { name: "IDEMPOTENCY_ID", type: "bigint" })
  idempotencyId!: string;

  @Column({ name: "USER_ID", type: "uuid" })
  userId!: string;

  @Column({ name: "IDEMPOTENCY_KEY", type: "uuid" })
  idempotencyKey!: string;

  @Column({ name: "REQUEST_HASH", type: "char", length: 64 })
  requestHash!: string;

  @Column({
    name: "STATUS",
    type: "enum",
    enum: ["PROCESSING", "COMPLETED"],
    enumName: "IDEMPOTENCY_STATUS",
    default: "PROCESSING",
  })
  status!: "PROCESSING" | "COMPLETED";

  @Column({ name: "RESPONSE_STATUS", type: "integer", nullable: true })
  responseStatus!: number | null;

  @Column({ name: "RESPONSE_BODY", type: "jsonb", nullable: true })
  responseBody!: unknown;

  @Column({ name: "ORDER_ID", type: "bigint", nullable: true })
  orderId!: string | null;

  @Column({ name: "EXPIRES_AT", type: "timestamptz" })
  expiresAt!: Date;

  @CreateDateColumn({ name: "CREATED_AT", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "UPDATED_AT", type: "timestamptz" })
  updatedAt!: Date;
}

@Entity({ name: "NOTIFICATIONS" })
export class Notification {
  @PrimaryGeneratedColumn("increment", {
    name: "NOTIFICATION_ID",
    type: "bigint",
  })
  notificationId!: string;

  @Column({
    name: "TYPE",
    type: "enum",
    enum: ["ORDER_INVOICE_EMAIL", "LOW_STOCK_ALERT"],
    enumName: "NOTIFICATION_TYPE",
  })
  type!: "ORDER_INVOICE_EMAIL" | "LOW_STOCK_ALERT";

  @Column({ name: "DEDUPE_KEY", type: "varchar", length: 150, unique: true })
  dedupeKey!: string;

  @Column({ name: "RECIPIENT_USER_ID", type: "uuid", nullable: true })
  recipientUserId!: string | null;

  @Column({ name: "RECIPIENT_EMAIL", type: "varchar", length: 255, nullable: true })
  recipientEmail!: string | null;

  @Column({ name: "PAYLOAD", type: "jsonb", default: {} })
  payload!: Record<string, unknown>;

  @Column({ name: "SENT_AT", type: "timestamptz", nullable: true })
  sentAt!: Date | null;

  @Column({ name: "READ_AT", type: "timestamptz", nullable: true })
  readAt!: Date | null;

  @CreateDateColumn({ name: "CREATED_AT", type: "timestamptz" })
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.notifications, { onDelete: "CASCADE" })
  @JoinColumn({ name: "RECIPIENT_USER_ID", referencedColumnName: "userId" })
  recipient!: User | null;
}

@Entity({ name: "AUDIT_LOGS" })
export class AuditLog {
  @PrimaryGeneratedColumn("increment", { name: "AUDIT_LOG_ID", type: "bigint" })
  auditLogId!: string;

  @Column({ name: "REQUEST_ID", type: "varchar", length: 128, nullable: true })
  requestId!: string | null;

  @Column({ name: "USER_ID", type: "uuid", nullable: true })
  userId!: string | null;

  @Column({ name: "ACTION", type: "varchar", length: 100 })
  action!: string;

  @Column({ name: "ENTITY_TYPE", type: "varchar", length: 100 })
  entityType!: string;

  @Column({ name: "ENTITY_ID", type: "varchar", length: 100 })
  entityId!: string;

  @Column({ name: "BEFORE_DATA", type: "jsonb", nullable: true })
  beforeData!: Record<string, unknown> | null;

  @Column({ name: "AFTER_DATA", type: "jsonb", nullable: true })
  afterData!: Record<string, unknown> | null;

  @Column({ name: "METADATA", type: "jsonb", default: {} })
  metadata!: Record<string, unknown>;

  @CreateDateColumn({ name: "CREATED_AT", type: "timestamptz" })
  createdAt!: Date;
}

@Entity({ name: "AUDIT_API" })
export class AuditApi {
  @PrimaryGeneratedColumn("increment", { name: "AUDIT_API_ID", type: "bigint" })
  auditApiId!: string;

  @Column({ name: "REQUEST_ID", type: "varchar", length: 128 })
  requestId!: string;

  @Column({ name: "USER_ID", type: "uuid", nullable: true })
  userId!: string | null;

  @Column({ name: "HTTP_METHOD", type: "varchar", length: 10 })
  httpMethod!: string;

  @Column({ name: "PATH", type: "varchar", length: 2000 })
  path!: string;

  @Column({ name: "ROUTE", type: "varchar", length: 200, nullable: true })
  route!: string | null;

  @Column({ name: "QUERY_PARAMS", type: "jsonb", nullable: true })
  queryParams!: Record<string, unknown> | null;

  @Column({ name: "STATUS_CODE", type: "smallint" })
  statusCode!: number;

  @Column({ name: "DURATION_MS", type: "integer" })
  durationMs!: number;

  @Column({ name: "IDEMPOTENCY_KEY", type: "uuid", nullable: true })
  idempotencyKey!: string | null;

  @Column({ name: "IP_ADDRESS", type: "inet", nullable: true })
  ipAddress!: string | null;

  @Column({ name: "USER_AGENT", type: "text", nullable: true })
  userAgent!: string | null;

  @Column({ name: "ERROR_CODE", type: "varchar", length: 100, nullable: true })
  errorCode!: string | null;

  @Column({ name: "METADATA", type: "jsonb", default: {} })
  metadata!: Record<string, unknown>;

  @CreateDateColumn({ name: "CREATED_AT", type: "timestamptz" })
  createdAt!: Date;
}
