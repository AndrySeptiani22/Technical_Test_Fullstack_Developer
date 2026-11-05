import { Column, CreateDateColumn } from "typeorm";

export abstract class AuditableBaseEntity {
  @CreateDateColumn({
    name: "CREATED_AT",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date;

  @Column({ name: "CREATED_BY", type: "uuid", nullable: true })
  createdBy!: string | null;

  @Column({ name: "UPDATED_AT", type: "timestamptz", nullable: true })
  updatedAt!: Date | null;

  @Column({ name: "UPDATED_BY", type: "uuid", nullable: true })
  updatedBy!: string | null;
}
