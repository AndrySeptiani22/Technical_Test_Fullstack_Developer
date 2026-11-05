import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Order } from "./order.entity";

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
