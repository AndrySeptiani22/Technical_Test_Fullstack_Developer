import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./user.entity";

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
