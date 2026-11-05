import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from "typeorm";
import { Product } from "./product.entity";

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
  product!: Relation<Product>;
}
