import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";
import { Notification } from "./notification.entity";
import { RefreshToken } from "./refresh-token.entity";
import { Role } from "./role.entity";

@Entity({ name: "USERS" })
@Index("ux_users_email", ["email"], { unique: true })
export class User {
  @PrimaryGeneratedColumn("uuid", { name: "USER_ID" })
  userId!: string;

  @Column({ name: "ROLE_ID", type: "bigint" })
  roleId!: string;

  @Column({ name: "NAME", type: "varchar", length: 150 })
  name!: string;

  @Column({ name: "EMAIL", type: "varchar", length: 255 })
  email!: string;

  @Column({ name: "PASSWORD", type: "varchar", length: 255, select: false })
  password!: string;

  @CreateDateColumn({ name: "CREATED_AT", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "UPDATED_AT", type: "timestamptz" })
  updatedAt!: Date;

  @Column({ name: "DELETED_AT", type: "timestamptz", nullable: true })
  deletedAt!: Date | null;

  @ManyToOne(() => Role, (role) => role.users, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "ROLE_ID", referencedColumnName: "roleId" })
  role!: Relation<Role>;

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens!: RefreshToken[];

  @OneToMany(() => Notification, (notification) => notification.recipient)
  notifications!: Notification[];
}
