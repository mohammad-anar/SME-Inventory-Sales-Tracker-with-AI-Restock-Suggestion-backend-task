import { Role } from "@prisma/client";

export type ILoginUser = {
  email: string;
  password: string;
};

export type IAuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone: string | null;
  avatar: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ILoginResponse = {
  token: string;
  user: IAuthUser;
};

