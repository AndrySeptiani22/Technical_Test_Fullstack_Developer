import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";
import type { OrderStatus } from "./order-status.type";
import { Customer } from "./customer.entity";
import { OrderItem } from "./order-item.entity";
import { OrderStatusHistory } from "./order-status-history.entity";
import { User } from "./user.entity";

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
  customer!: Relation<Customer>;

  @ManyToOne(() => User, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "CREATED_BY", referencedColumnName: "userId" })
  creator!: Relation<User>;

  @OneToMany(() => OrderItem, (item) => item.order)
  items!: OrderItem[];

  @OneToMany(() => OrderStatusHistory, (history) => history.order)
  history!: OrderStatusHistory[];
}
