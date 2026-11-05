import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from "typeorm";
import { User } from "./user.entity";

@Entity({ name: "REFRESH_TOKENS" })
export class RefreshToken {
  @PrimaryGeneratedColumn("increment", {
    name: "REFRESH_TOKEN_ID",
    type: "bigint",
  })
  refreshTokenId!: string;

  @Column({ name: "USER_ID", type: "uuid" })
  userId!: string;

  @Column({ name: "TOKEN_FAMILY", type: "uuid" })
  tokenFamily!: string;

  @Column({ name: "TOKEN_HASH", type: "varchar", length: 255, unique: true })
  tokenHash!: string;

  @Column({ name: "EXPIRES_AT", type: "timestamptz" })
  expiresAt!: Date;

  @Column({ name: "REVOKED_AT", type: "timestamptz", nullable: true })
  revokedAt!: Date | null;

  @Column({ name: "REPLACED_BY_ID", type: "bigint", nullable: true })
  replacedById!: string | null;

  @CreateDateColumn({ name: "CREATED_AT", type: "timestamptz" })
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.refreshTokens, { onDelete: "CASCADE" })
  @JoinColumn({ name: "USER_ID", referencedColumnName: "userId" })
  user!: Relation<User>;
}
