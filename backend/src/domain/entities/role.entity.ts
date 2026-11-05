import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { RolePermission } from "./role-permission.entity";
import { User } from "./user.entity";

@Entity({ name: "ROLES" })
export class Role {
  @PrimaryGeneratedColumn("increment", { name: "ROLE_ID", type: "bigint" })
  roleId!: string;

  @Column({ name: "CODE", type: "varchar", length: 50, unique: true })
  code!: string;

  @Column({ name: "NAME", type: "varchar", length: 100, unique: true })
  name!: string;

  @Column({ name: "DESCRIPTION", type: "varchar", length: 500, nullable: true })
  description!: string | null;

  @CreateDateColumn({ name: "CREATED_AT", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "UPDATED_AT", type: "timestamptz" })
  updatedAt!: Date;

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.role)
  rolePermissions!: RolePermission[];

  @OneToMany(() => User, (user) => user.role)
  users!: User[];
}
