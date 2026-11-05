import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

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
