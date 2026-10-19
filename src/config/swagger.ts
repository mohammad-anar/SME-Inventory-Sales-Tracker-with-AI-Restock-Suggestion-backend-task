import env from "./env.js";

export const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "StockPilot SME Inventory & Sales Tracker API",
    version: "1.0.0",
    description:
      "Enterprise REST API documentation for StockPilot SME Inventory & Sales Tracker with AI Restock Forecasting. Includes role-based authentication, user & staff management, inventory control, sales, purchase orders, stock movements, reports, and AI recommendations.",
  },
  servers: [
    {
      url: "/api/v1",
      description: "Current Host API v1 Base URL",
    },
    {
      url: `http://localhost:${env.port || 4001}/api/v1`,
      description: "Local Development Server",
    },
  ],
  tags: [
    { name: "Auth", description: "Authentication, session management, and password setup" },
    { name: "Users", description: "Admin-managed user and staff accounts" },
    { name: "Profile", description: "Authenticated user profile self-service" },
    { name: "Staff", description: "Staff self-service, staff sales, and activities" },
    { name: "Categories", description: "Product category management" },
    { name: "Suppliers", description: "Supplier catalog and contact management" },
    { name: "Products", description: "Product catalog, SKU/barcode lookup, and low-stock queries" },
    { name: "Sales", description: "Sales orders, invoicing, and voiding" },
    { name: "Sale Items", description: "Line item management for sales" },
    { name: "Purchase Orders", description: "Supplier purchase orders, status updates, and receiving" },
    { name: "Stock Movements", description: "Audit trail of inventory changes and manual stock adjustments" },
    { name: "AI Restock", description: "Gemini-powered restock recommendations and product demand forecasting" },
    { name: "Dashboard", description: "Business analytics, sales trends, and top product metrics" },
    { name: "Reports", description: "Valuation, sales, and purchase reporting" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your Bearer JWT access token to authenticate requests.",
      },
    },
    schemas: {
      ApiResponseSuccess: {
        type: "object",
        properties: {
          statusCode: { type: "integer", example: 200 },
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Operation completed successfully" },
          pagination: {
            type: "object",
            properties: {
              page: { type: "integer", example: 1 },
              limit: { type: "integer", example: 10 },
              total: { type: "integer", example: 50 },
              totalPage: { type: "integer", example: 5 },
            },
          },
          data: { type: "object" },
        },
      },
      ApiErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Error description" },
          errorSources: {
            type: "array",
            items: {
              type: "object",
              properties: {
                path: { type: "string", example: "email" },
                message: { type: "string", example: "Valid email is required" },
              },
            },
          },
          stack: { type: "string", nullable: true },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "admin@gmail.com" },
          password: { type: "string", format: "password", example: "12345678" },
        },
      },
      RegisterRequest: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", example: "John Doe" },
          email: { type: "string", format: "email", example: "john@example.com" },
          password: { type: "string", format: "password", minLength: 8, example: "Password123!" },
          phone: { type: "string", example: "+1234567890" },
          avatar: { type: "string", format: "uri", example: "https://example.com/avatar.jpg" },
        },
      },
      SetPasswordRequest: {
        type: "object",
        required: ["token", "password"],
        properties: {
          token: { type: "string", example: "a1b2c3d4e5f6g7h8i9j0" },
          password: { type: "string", format: "password", minLength: 8, example: "NewSecurePass123!" },
        },
      },
      CreateStaffRequest: {
        type: "object",
        required: ["name", "email"],
        properties: {
          name: { type: "string", example: "Alice Johnson" },
          email: { type: "string", format: "email", example: "alice@example.com" },
          phone: { type: "string", example: "01700000000" },
          avatar: { type: "string", format: "uri", example: "https://example.com/alice.jpg" },
        },
      },
      CreateUserDirectRequest: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", example: "Bob Smith" },
          email: { type: "string", format: "email", example: "bob@example.com" },
          password: { type: "string", format: "password", minLength: 8, example: "Password123!" },
          role: { type: "string", enum: ["ADMIN", "STAFF"], default: "STAFF" },
          phone: { type: "string", example: "01800000000" },
          avatar: { type: "string", format: "uri" },
        },
      },
      UpdateUserRequest: {
        type: "object",
        properties: {
          name: { type: "string", example: "Bob Updated" },
          email: { type: "string", format: "email", example: "bob.updated@example.com" },
          role: { type: "string", enum: ["ADMIN", "STAFF"] },
          isActive: { type: "boolean", example: true },
          phone: { type: "string", example: "01811111111" },
          avatar: { type: "string", format: "uri" },
        },
      },
      UpdateUserStatusRequest: {
        type: "object",
        required: ["isActive"],
        properties: {
          isActive: { type: "boolean", example: false },
        },
      },
      UpdatePasswordRequest: {
        type: "object",
        required: ["newPassword"],
        properties: {
          newPassword: { type: "string", format: "password", minLength: 8, example: "FreshPassword123!" },
        },
      },
      UpdateProfileRequest: {
        type: "object",
        properties: {
          name: { type: "string", example: "My Updated Name" },
          phone: { type: "string", example: "+8801700000000" },
          avatar: { type: "string", format: "uri", example: "https://example.com/avatar.jpg" },
        },
      },
      CategoryRequest: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", example: "Electronics" },
          description: { type: "string", example: "Consumer electronic gadgets and accessories" },
        },
      },
      UpdateCategoryRequest: {
        type: "object",
        properties: {
          name: { type: "string", example: "Updated Category Name" },
          description: { type: "string", example: "Updated description text" },
        },
      },
      UpdateCategoryStatusRequest: {
        type: "object",
        required: ["isActive"],
        properties: {
          isActive: { type: "boolean", example: true },
        },
      },
      SupplierRequest: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", example: "Apex Electronics Ltd" },
          phone: { type: "string", example: "+8801900000000" },
          email: { type: "string", format: "email", example: "info@apexelectronics.com" },
          address: { type: "string", example: "123 Tech Avenue, Dhaka" },
        },
      },
      UpdateSupplierRequest: {
        type: "object",
        properties: {
          name: { type: "string", example: "Apex Technologies" },
          phone: { type: "string", example: "+8801911111111" },
          email: { type: "string", format: "email", example: "sales@apextech.com" },
          address: { type: "string", example: "456 Tech Park, Dhaka" },
        },
      },
      UpdateSupplierStatusRequest: {
        type: "object",
        required: ["isActive"],
        properties: {
          isActive: { type: "boolean", example: true },
        },
      },
      CreateProductRequest: {
        type: "object",
        required: ["sku", "name", "categoryId", "supplierId", "unitPrice", "costPrice"],
        properties: {
          sku: { type: "string", example: "ELEC-WLS-MSE-01" },
          name: { type: "string", example: "Wireless Optical Mouse" },
          description: { type: "string", example: "Ergonomic 2.4GHz wireless optical mouse" },
          barcode: { type: "string", example: "8901234567890" },
          categoryId: { type: "string", example: "cat_clx123abc" },
          supplierId: { type: "string", example: "sup_clx456def" },
          avatar: { type: "string", format: "uri" },
          unitPrice: { type: "number", example: 25.5 },
          costPrice: { type: "number", example: 14.0 },
          reorderLevel: { type: "integer", example: 15 },
          stockQty: { type: "integer", example: 100 },
        },
      },
      UpdateProductRequest: {
        type: "object",
        properties: {
          sku: { type: "string", example: "ELEC-WLS-MSE-01" },
          name: { type: "string", example: "Pro Wireless Optical Mouse" },
          description: { type: "string", example: "Updated ergonomic 2.4GHz wireless mouse" },
          barcode: { type: "string", example: "8901234567890" },
          categoryId: { type: "string", example: "cat_clx123abc" },
          supplierId: { type: "string", example: "sup_clx456def" },
          avatar: { type: "string", format: "uri" },
          unitPrice: { type: "number", example: 28.0 },
          costPrice: { type: "number", example: 15.0 },
          reorderLevel: { type: "integer", example: 20 },
        },
      },
      UpdateProductStatusRequest: {
        type: "object",
        required: ["isActive"],
        properties: {
          isActive: { type: "boolean", example: true },
        },
      },
      CreateSaleRequest: {
        type: "object",
        required: ["items"],
        properties: {
          customerName: { type: "string", example: "Walk-in Customer" },
          discount: { type: "number", example: 5.0 },
          paymentMethod: { type: "string", enum: ["CASH", "CARD", "MOBILE_BANKING"], default: "CASH" },
          items: {
            type: "array",
            items: {
              type: "object",
              required: ["productId", "quantity"],
              properties: {
                productId: { type: "string", example: "prod_clx123abc" },
                quantity: { type: "integer", minimum: 1, example: 2 },
              },
            },
          },
        },
      },
      CreateSaleItemRequest: {
        type: "object",
        required: ["saleId", "productId", "quantity", "unitPrice", "unitCost"],
        properties: {
          saleId: { type: "string", example: "sale_clx123abc" },
          productId: { type: "string", example: "prod_clx123abc" },
          quantity: { type: "integer", minimum: 1, example: 1 },
          unitPrice: { type: "number", example: 25.5 },
          unitCost: { type: "number", example: 14.0 },
        },
      },
      UpdateSaleItemRequest: {
        type: "object",
        properties: {
          quantity: { type: "integer", minimum: 1, example: 3 },
          unitPrice: { type: "number", example: 26.0 },
          unitCost: { type: "number", example: 14.5 },
        },
      },
      CreatePurchaseOrderRequest: {
        type: "object",
        required: ["supplierId", "items"],
        properties: {
          supplierId: { type: "string", example: "sup_clx456def" },
          note: { type: "string", example: "Urgent shipment for weekend restock" },
          items: {
            type: "array",
            items: {
              type: "object",
              required: ["productId", "quantity", "unitCost"],
              properties: {
                productId: { type: "string", example: "prod_clx123abc" },
                quantity: { type: "integer", minimum: 1, example: 50 },
                unitCost: { type: "number", minimum: 0, example: 13.5 },
              },
            },
          },
        },
      },
      UpdatePurchaseOrderRequest: {
        type: "object",
        properties: {
          supplierId: { type: "string", example: "sup_clx456def" },
          note: { type: "string", example: "Updated restock notes" },
          items: {
            type: "array",
            items: {
              type: "object",
              required: ["productId", "quantity", "unitCost"],
              properties: {
                productId: { type: "string", example: "prod_clx123abc" },
                quantity: { type: "integer", minimum: 1, example: 60 },
                unitCost: { type: "number", minimum: 0, example: 13.0 },
              },
            },
          },
        },
      },
      UpdatePurchaseOrderStatusRequest: {
        type: "object",
        required: ["status"],
        properties: {
          status: { type: "string", enum: ["DRAFT", "ORDERED", "RECEIVED", "CANCELLED"] },
        },
      },
      AdjustStockRequest: {
        type: "object",
        required: ["productId", "quantityChange"],
        properties: {
          productId: { type: "string", example: "prod_clx123abc" },
          quantityChange: { type: "integer", example: -3, description: "Positive to add stock, negative to reduce" },
          note: { type: "string", example: "Damaged during handling in aisle 2" },
        },
      },
    },
  },
  paths: {
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register new user account",
        description: "Creates a new user profile with hashed password credentials.",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterRequest" } } },
        },
        responses: {
          201: {
            description: "User registered successfully",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } },
          },
          400: { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorResponse" } } } },
          409: { description: "User email already registered", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorResponse" } } } },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "User and admin login",
        description: "Authenticates credentials and returns a JWT access token and user profile.",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } } },
        },
        responses: {
          200: {
            description: "Login successful with JWT access token",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } },
          },
          400: { description: "Invalid request payload", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorResponse" } } } },
          401: { description: "Incorrect credentials or inactive account", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorResponse" } } } },
        },
      },
    },
    "/auth/verify-setup-token": {
      get: {
        tags: ["Auth"],
        summary: "Verify staff invitation setup token",
        description: "Checks if a staff account invitation token is valid and unexpired.",
        parameters: [
          {
            name: "token",
            in: "query",
            required: true,
            schema: { type: "string" },
            description: "The staff invitation token received via setup link",
          },
        ],
        responses: {
          200: { description: "Token is valid", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
          400: { description: "Invalid or expired token", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorResponse" } } } },
        },
      },
    },
    "/auth/set-password": {
      post: {
        tags: ["Auth"],
        summary: "Set password via staff invitation token",
        description: "Allows an invited staff member to activate their account and choose a password.",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/SetPasswordRequest" } } },
        },
        responses: {
          200: { description: "Password set and account activated", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
          400: { description: "Invalid or expired token", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorResponse" } } } },
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get current authenticated user",
        description: "Returns profile details of the user associated with the provided Bearer JWT.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Current user details retrieved", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
          401: { description: "Unauthorized / token missing or revoked", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorResponse" } } } },
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout user and revoke JWT token",
        description: "Hashes the Bearer token and records it in the database blacklist, revoking future access.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Logged out and token revoked successfully", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
    },
    "/users": {
      get: {
        tags: ["Users"],
        summary: "List all users (Admin only)",
        description: "Retrieves a paginated list of registered users and staff accounts.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "role", in: "query", schema: { type: "string", enum: ["ADMIN", "STAFF"] } },
          { name: "isActive", in: "query", schema: { type: "boolean" } },
        ],
        responses: {
          200: { description: "Users list retrieved", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden - Admin access required" },
        },
      },
      post: {
        tags: ["Users"],
        summary: "Create a user directly (Admin only)",
        description: "Admin endpoint to directly create any user account with role and password.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateUserDirectRequest" } } },
        },
        responses: {
          201: { description: "User created successfully", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
        },
      },
    },
    "/users/staff": {
      post: {
        tags: ["Users"],
        summary: "Create staff account with invitation token (Admin only)",
        description: "Creates an inactive staff user and generates a setup link for onboarding.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateStaffRequest" } } },
        },
        responses: {
          201: { description: "Staff account created with setupLink", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
        },
      },
    },
    "/users/{id}": {
      get: {
        tags: ["Users"],
        summary: "Get user by ID (Admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "User found", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
          404: { description: "User not found" },
        },
      },
      patch: {
        tags: ["Users"],
        summary: "Update user details (Admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateUserRequest" } } },
        },
        responses: {
          200: { description: "User updated successfully", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
    },
    "/users/{id}/setup-token": {
      post: {
        tags: ["Users"],
        summary: "Generate new setup token for staff member (Admin only)",
        description: "Re-issues an onboarding setup token and invitation URL for an existing staff member.",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "New setup link generated", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
    },
    "/users/{id}/status": {
      patch: {
        tags: ["Users"],
        summary: "Toggle user active status (Admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateUserStatusRequest" } } },
        },
        responses: {
          200: { description: "User status updated", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
    },
    "/users/{id}/password": {
      patch: {
        tags: ["Users"],
        summary: "Reset user password (Admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdatePasswordRequest" } } },
        },
        responses: {
          200: { description: "Password reset successfully", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
    },
    "/users/{id}/sales": {
      get: {
        tags: ["Users"],
        summary: "Get sales created by specific user (Admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
        ],
        responses: {
          200: { description: "User sales list retrieved", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
    },
    "/users/{id}/activities": {
      get: {
        tags: ["Users"],
        summary: "Get activity log of specific user (Admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
        ],
        responses: {
          200: { description: "User activities retrieved", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
    },
    "/profile": {
      get: {
        tags: ["Profile"],
        summary: "Get profile of logged-in user",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Profile retrieved", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
      patch: {
        tags: ["Profile"],
        summary: "Update current user profile",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateProfileRequest" } } },
        },
        responses: {
          200: { description: "Profile updated successfully", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
    },
    "/staff/me": {
      get: {
        tags: ["Staff"],
        summary: "Get current staff profile",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Staff profile retrieved", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
      patch: {
        tags: ["Staff"],
        summary: "Update current staff profile",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateProfileRequest" } } },
        },
        responses: {
          200: { description: "Staff profile updated", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
    },
    "/staff/me/sales": {
      get: {
        tags: ["Staff"],
        summary: "Get sales processed by current staff member",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
        ],
        responses: {
          200: { description: "Staff sales retrieved", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
    },
    "/staff/me/sales/summary": {
      get: {
        tags: ["Staff"],
        summary: "Get sales performance summary for current staff member",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Staff sales summary retrieved", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
    },
    "/staff/me/activities": {
      get: {
        tags: ["Staff"],
        summary: "Get recent activities for current staff member",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
        ],
        responses: {
          200: { description: "Staff activities retrieved", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
    },
    "/categories": {
      get: {
        tags: ["Categories"],
        summary: "List all product categories",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "isActive", in: "query", schema: { type: "boolean" } },
        ],
        responses: {
          200: { description: "Categories list retrieved", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
      post: {
        tags: ["Categories"],
        summary: "Create product category (Admin only)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CategoryRequest" } } },
        },
        responses: {
          201: { description: "Category created", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
    },
    "/categories/{id}": {
      get: {
        tags: ["Categories"],
        summary: "Get category by ID",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Category found", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
          404: { description: "Category not found" },
        },
      },
      patch: {
        tags: ["Categories"],
        summary: "Update category (Admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateCategoryRequest" } } },
        },
        responses: {
          200: { description: "Category updated", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
    },
    "/categories/{id}/status": {
      patch: {
        tags: ["Categories"],
        summary: "Toggle category active status (Admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateCategoryStatusRequest" } } },
        },
        responses: {
          200: { description: "Category status updated", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
    },
    "/suppliers": {
      get: {
        tags: ["Suppliers"],
        summary: "List all suppliers",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "isActive", in: "query", schema: { type: "boolean" } },
        ],
        responses: {
          200: { description: "Suppliers retrieved", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
      post: {
        tags: ["Suppliers"],
        summary: "Create supplier (Admin only)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/SupplierRequest" } } },
        },
        responses: {
          201: { description: "Supplier created", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
    },
    "/suppliers/{id}": {
      get: {
        tags: ["Suppliers"],
        summary: "Get supplier by ID",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Supplier found", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
      patch: {
        tags: ["Suppliers"],
        summary: "Update supplier (Admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateSupplierRequest" } } },
        },
        responses: {
          200: { description: "Supplier updated", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
    },
    "/suppliers/{id}/status": {
      patch: {
        tags: ["Suppliers"],
        summary: "Toggle supplier active status (Admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateSupplierStatusRequest" } } },
        },
        responses: {
          200: { description: "Supplier status updated", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
    },
    "/products": {
      get: {
        tags: ["Products"],
        summary: "List products with search and filtering",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          { name: "search", in: "query", schema: { type: "string" }, description: "Searches name, SKU, or barcode" },
          { name: "categoryId", in: "query", schema: { type: "string" } },
          { name: "supplierId", in: "query", schema: { type: "string" } },
          { name: "isActive", in: "query", schema: { type: "boolean" } },
          { name: "stockStatus", in: "query", schema: { type: "string", enum: ["ALL", "IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"] } },
          { name: "sortBy", in: "query", schema: { type: "string", default: "createdAt" } },
          { name: "sortOrder", in: "query", schema: { type: "string", enum: ["asc", "desc"], default: "desc" } },
        ],
        responses: {
          200: { description: "Products list retrieved", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
      post: {
        tags: ["Products"],
        summary: "Create new product (Admin only)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateProductRequest" } } },
        },
        responses: {
          201: { description: "Product created", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
    },
    "/products/low-stock": {
      get: {
        tags: ["Products"],
        summary: "Get low stock products",
        description: "Retrieves products whose available quantity is at or below the configured reorder level.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          { name: "categoryId", in: "query", schema: { type: "string" } },
          { name: "supplierId", in: "query", schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Low stock products retrieved", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
    },
    "/products/{id}": {
      get: {
        tags: ["Products"],
        summary: "Get product details by ID",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Product found", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
          404: { description: "Product not found" },
        },
      },
      patch: {
        tags: ["Products"],
        summary: "Update product (Admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateProductRequest" } } },
        },
        responses: {
          200: { description: "Product updated", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
    },
    "/products/{id}/status": {
      patch: {
        tags: ["Products"],
        summary: "Toggle product active status (Admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateProductStatusRequest" } } },
        },
        responses: {
          200: { description: "Product status updated", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
    },
    "/sales": {
      get: {
        tags: ["Sales"],
        summary: "List all sales transactions",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          { name: "search", in: "query", schema: { type: "string" }, description: "Invoice number or customer name" },
          { name: "status", in: "query", schema: { type: "string", enum: ["COMPLETED", "VOIDED"] } },
          { name: "paymentMethod", in: "query", schema: { type: "string", enum: ["CASH", "CARD", "MOBILE_BANKING"] } },
          { name: "startDate", in: "query", schema: { type: "string", format: "date-time" } },
          { name: "endDate", in: "query", schema: { type: "string", format: "date-time" } },
        ],
        responses: {
          200: { description: "Sales list retrieved", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
      post: {
        tags: ["Sales"],
        summary: "Create new sale transaction (Admin & Staff)",
        description: "Records a new sale, creates line items, automatically decrements product stock, and generates stock movement records.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateSaleRequest" } } },
        },
        responses: {
          201: { description: "Sale completed and invoice generated", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
          400: { description: "Insufficient stock or invalid item request" },
        },
      },
    },
    "/sales/invoice/{invoiceNo}": {
      get: {
        tags: ["Sales"],
        summary: "Get sale details by invoice number",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "invoiceNo", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Sale found", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
          404: { description: "Invoice not found" },
        },
      },
    },
    "/sales/{id}": {
      get: {
        tags: ["Sales"],
        summary: "Get sale details by ID",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Sale found", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
    },
    "/sales/{id}/void": {
      post: {
        tags: ["Sales"],
        summary: "Void a completed sale (Admin & Staff)",
        description: "Reverses a sale transaction, transitions status to VOIDED, and restores product stock levels.",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Sale voided and stock restored", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
          400: { description: "Sale already voided or invalid" },
        },
      },
    },
    "/sale-items": {
      get: {
        tags: ["Sale Items"],
        summary: "List all sale items",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          { name: "saleId", in: "query", schema: { type: "string" } },
          { name: "productId", in: "query", schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Sale items retrieved", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
      post: {
        tags: ["Sale Items"],
        summary: "Add item to sale",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateSaleItemRequest" } } },
        },
        responses: {
          201: { description: "Sale item added", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
    },
    "/sale-items/{id}": {
      get: {
        tags: ["Sale Items"],
        summary: "Get sale item by ID",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Sale item found", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
      patch: {
        tags: ["Sale Items"],
        summary: "Update sale item",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateSaleItemRequest" } } },
        },
        responses: {
          200: { description: "Sale item updated", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
      delete: {
        tags: ["Sale Items"],
        summary: "Delete sale item",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Sale item deleted", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
    },
    "/purchase-orders": {
      get: {
        tags: ["Purchase Orders"],
        summary: "List purchase orders",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          { name: "status", in: "query", schema: { type: "string", enum: ["DRAFT", "ORDERED", "RECEIVED", "CANCELLED"] } },
          { name: "supplierId", in: "query", schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Purchase orders retrieved", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
      post: {
        tags: ["Purchase Orders"],
        summary: "Create new purchase order (Admin & Staff)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreatePurchaseOrderRequest" } } },
        },
        responses: {
          201: { description: "Purchase order created", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
    },
    "/purchase-orders/{id}": {
      get: {
        tags: ["Purchase Orders"],
        summary: "Get purchase order by ID",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Purchase order found", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
      patch: {
        tags: ["Purchase Orders"],
        summary: "Update purchase order items / notes (Admin & Staff)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdatePurchaseOrderRequest" } } },
        },
        responses: {
          200: { description: "Purchase order updated", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
    },
    "/purchase-orders/{id}/status": {
      patch: {
        tags: ["Purchase Orders"],
        summary: "Update purchase order status",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdatePurchaseOrderStatusRequest" } } },
        },
        responses: {
          200: { description: "Status updated", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
    },
    "/purchase-orders/{id}/receive": {
      post: {
        tags: ["Purchase Orders"],
        summary: "Receive purchase order into inventory (Admin & Staff)",
        description: "Marks the order as RECEIVED, increments product stockQty for all order items, and writes PURCHASE stock movement records.",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Purchase order received and inventory updated", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
          400: { description: "Order cannot be received (invalid state or already received)" },
        },
      },
    },
    "/purchase-orders/{id}/receipt": {
      get: {
        tags: ["Purchase Orders"],
        summary: "Get printable purchase order receipt",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Purchase order receipt details retrieved", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
    },
    "/stock-movements": {
      get: {
        tags: ["Stock Movements"],
        summary: "List stock movement audit logs",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          { name: "type", in: "query", schema: { type: "string", enum: ["SALE", "PURCHASE", "ADJUSTMENT", "RETURN", "REVERSAL"] } },
          { name: "productId", in: "query", schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Stock movements retrieved", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
    },
    "/stock-movements/adjustments": {
      post: {
        tags: ["Stock Movements"],
        summary: "Create manual inventory stock adjustment (Admin & Staff)",
        description: "Adjusts product stock count with a positive or negative quantity delta and logs an ADJUSTMENT audit record with a note.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/AdjustStockRequest" } } },
        },
        responses: {
          201: { description: "Stock adjusted successfully", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
    },
    "/stock-movements/{id}": {
      get: {
        tags: ["Stock Movements"],
        summary: "Get stock movement details by ID",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Stock movement found", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
    },
    "/ai-restock/recommendations": {
      get: {
        tags: ["AI Restock"],
        summary: "Get AI restock suggestions (Gemini + Velocity)",
        description: "Combines 30-day historical sales velocity, current inventory, supplier lead time, and Google Gemini AI reasoning to prioritize restock items.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "planningHorizonDays", in: "query", schema: { type: "integer", default: 7 }, description: "Days into future to forecast demand" },
          { name: "analysisPeriodDays", in: "query", schema: { type: "integer", default: 30 }, description: "Historical days to compute sales velocity" },
          { name: "priority", in: "query", schema: { type: "string", enum: ["HIGH", "MEDIUM", "LOW", "ALL"], default: "ALL" } },
          { name: "search", in: "query", schema: { type: "string" }, description: "Filter suggestions by product name or SKU" },
          { name: "forceRefresh", in: "query", schema: { type: "boolean", default: false }, description: "Bypass cached AI recommendations" },
        ],
        responses: {
          200: { description: "AI restock recommendations generated", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
    },
    "/ai-restock/products/{id}": {
      get: {
        tags: ["AI Restock"],
        summary: "Get demand forecast for a single product",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "planningHorizonDays", in: "query", schema: { type: "integer", default: 7 } },
          { name: "analysisPeriodDays", in: "query", schema: { type: "integer", default: 30 } },
        ],
        responses: {
          200: { description: "Product forecast retrieved", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
    },
    "/ai-restock/refresh": {
      post: {
        tags: ["AI Restock"],
        summary: "Force refresh AI restock cache",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "AI cache refreshed and recommendations recomputed", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
    },
    "/dashboard/summary": {
      get: {
        tags: ["Dashboard"],
        summary: "Get overall dashboard summary metrics",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Summary metrics retrieved", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
    },
    "/dashboard/sales-trend": {
      get: {
        tags: ["Dashboard"],
        summary: "Get historical sales trend data",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "period", in: "query", schema: { type: "string", enum: ["7d", "30d", "90d", "1y"], default: "30d" } }],
        responses: {
          200: { description: "Sales trend points retrieved", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
    },
    "/dashboard/top-products": {
      get: {
        tags: ["Dashboard"],
        summary: "Get top performing products by volume and revenue",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "limit", in: "query", schema: { type: "integer", default: 5 } }],
        responses: {
          200: { description: "Top products retrieved", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
    },
    "/reports/inventory-valuation": {
      get: {
        tags: ["Reports"],
        summary: "Get inventory valuation report",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Valuation report retrieved", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
    },
    "/reports/sales": {
      get: {
        tags: ["Reports"],
        summary: "Get comprehensive sales report",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "startDate", in: "query", schema: { type: "string", format: "date-time" } },
          { name: "endDate", in: "query", schema: { type: "string", format: "date-time" } },
        ],
        responses: {
          200: { description: "Sales report retrieved", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
    },
    "/reports/purchases": {
      get: {
        tags: ["Reports"],
        summary: "Get comprehensive purchases report",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "startDate", in: "query", schema: { type: "string", format: "date-time" } },
          { name: "endDate", in: "query", schema: { type: "string", format: "date-time" } },
        ],
        responses: {
          200: { description: "Purchases report retrieved", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponseSuccess" } } } },
        },
      },
    },
  },
};

export default swaggerSpec;
