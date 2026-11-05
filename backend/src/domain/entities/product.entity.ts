import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { OrderItem } from "./order-item.entity";
import { StockMovement } from "./stock-movement.entity";

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
