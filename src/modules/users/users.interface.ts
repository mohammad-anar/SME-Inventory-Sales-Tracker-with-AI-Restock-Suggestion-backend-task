import { Role } from "@prisma/client";

export type CreateUserPayload = {
  name: string;
  email: string;
  password: string;
  role?: Role;
  phone?: string;
  avatar?: string;
};

export type CreateStaffPayload = {
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
};

export type CreateStaffResponse = {
  user: {
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
  setupToken: string;
  setupUrl: string;
  expiresAt: Date;
};

export type UpdateUserPayload = {
  name?: string;
  email?: string;
  role?: Role;
  isActive?: boolean;
  phone?: string;
  avatar?: string;
};

export type UpdateUserStatusPayload = {
  isActive: boolean;
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
  role?: Role;
  isActive?: boolean;
};
