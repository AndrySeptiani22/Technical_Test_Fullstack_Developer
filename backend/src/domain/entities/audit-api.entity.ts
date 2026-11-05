import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

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
