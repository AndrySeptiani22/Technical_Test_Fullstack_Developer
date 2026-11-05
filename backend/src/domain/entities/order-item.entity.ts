import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from "typeorm";
import { Order } from "./order.entity";
import { Product } from "./product.entity";

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
  order!: Relation<Order>;

  @ManyToOne(() => Product, (product) => product.orderItems, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "PRODUCT_ID", referencedColumnName: "productId" })
  product!: Relation<Product>;
}
