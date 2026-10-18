export type CreateCategoryPayload = {
  name: string;
  description?: string;
};

export type UpdateCategoryPayload = {
  name?: string;
  description?: string;
};

export type UpdateCategoryStatusPayload = {
  isActive: boolean;
};

export type CategoryQueryOptions = {
  page?: string | number;
  limit?: string | number;
  search?: string;
  isActive?: string | boolean;
};
