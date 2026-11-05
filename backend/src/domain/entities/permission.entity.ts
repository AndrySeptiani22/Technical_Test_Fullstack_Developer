import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { RolePermission } from "./role-permission.entity";

@Entity({ name: "PERMISSIONS" })
export class Permission {
  @PrimaryGeneratedColumn("increment", { name: "PERMISSION_ID", type: "bigint" })
  permissionId!: string;

  @Column({ name: "CODE", type: "varchar", length: 100, unique: true })
  code!: string;

  @Column({ name: "MODULE", type: "varchar", length: 50 })
  module!: string;

  @Column({ name: "DESCRIPTION", type: "varchar", length: 500 })
  description!: string;

  @CreateDateColumn({ name: "CREATED_AT", type: "timestamptz" })
  createdAt!: Date;

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.permission)
  rolePermissions!: RolePermission[];
}
