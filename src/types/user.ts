export type Role = "TEACHER" | "STUDENT";

export interface User {
  id: string;
  email: string;
  role: Role;
  createdAt: Date;
}
