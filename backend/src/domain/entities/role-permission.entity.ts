import {
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Relation,
} from "typeorm";
import { Permission } from "./permission.entity";
import { Role } from "./role.entity";

@Entity({ name: "ROLE_PERMISSIONS" })
export class RolePermission {
  @PrimaryColumn({ name: "ROLE_ID", type: "bigint" })
  roleId!: string;

  @PrimaryColumn({ name: "PERMISSION_ID", type: "bigint" })
  permissionId!: string;

  @ManyToOne(() => Role, (role) => role.rolePermissions, { onDelete: "CASCADE" })
  @JoinColumn({ name: "ROLE_ID", referencedColumnName: "roleId" })
  role!: Relation<Role>;

  @ManyToOne(() => Permission, (permission) => permission.rolePermissions, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "PERMISSION_ID", referencedColumnName: "permissionId" })
  permission!: Relation<Permission>;
}
