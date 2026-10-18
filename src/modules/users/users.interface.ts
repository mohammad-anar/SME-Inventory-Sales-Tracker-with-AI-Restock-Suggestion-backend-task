import { Role } from "@prisma/client";

export type CreateUserPayload = {
  name: string;
  email: string;
  password: string;
  role?: Role;
  phone?: string;
  avatar?: string;
};

export type UpdateUserPayload = {
  name?: string;
  email?: string;
  role?: Role;
  isActive?: boolean;
  phone?: string;
  avatar?: string;
};

export type UpdatePasswordPayload = {
  newPassword: string;
};

export type UpdateProfilePayload = {
  name?: string;
  phone?: string;
  avatar?: string;
};

export type UserQueryOptions = {
  page?: number;
  limit?: number;
  search?: string;
};
