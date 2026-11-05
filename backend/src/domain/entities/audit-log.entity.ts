import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

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
