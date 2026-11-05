import type { ISODateString, UUID } from "./common.entity";

export type Gender = "MALE" | "FEMALE";

export interface Customer {
  id: UUID;
  customer_name: string;
  customer_address: string;
  gender: Gender | null;
  birth_date: string | null;
  phone: string | null;
  email: string | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}
