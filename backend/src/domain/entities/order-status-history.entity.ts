import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from "typeorm";
import type { OrderStatus } from "./order-status.type";
import { Order } from "./order.entity";

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
  order!: Relation<Order>;
}
