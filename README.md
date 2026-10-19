# StockPilot — Backend REST API & Inventory Intelligence Engine

StockPilot is an enterprise-grade backend service powering an SME Inventory & Sales Tracker with AI Restock Forecasting. Built with **Node.js**, **Express.js (v5)**, **TypeScript**, **PostgreSQL**, and **Prisma ORM**, it provides high-throughput transactional endpoints for catalog taxonomy, Point of Sale transactions, purchase order lifecycles, audit ledgers, role-based staff administration, database-backed JWT revocation, and predictive stock replenishment powered by **Google Gemini AI**.

---

## 1. Project Overview

### Backend Responsibilities
The backend serves as the single source of truth for business operations:
1. **Transaction Integrity**: Enforces strict ACID compliance across sales and purchase order fulfillment using Prisma interactive transactions (`$transaction`). Prevents overselling or stock desynchronization.
2. **Point of Sale (POS) Processing**: Processes multi-item customer orders, computes subtotals/discounts/totals, deducts warehouse stock in real time, and logs outbound movements (`OUT`).
3. **Purchasing & Intake Lifecycle**: Manages supplier purchase orders across state transitions (`DRAFT` -> `ORDERED` -> `RECEIVED` -> `CANCELLED`) and handles automated inventory intake upon order arrival.
4. **Immutable Audit Ledger**: Records every stock change (`SALE`, `PURCHASE`, `ADJUSTMENT`, `RETURN`, `REVERSAL`) with user authorship and reference IDs in `StockMovement`.
5. **Staff Lifecycle & RBAC**: Admin-managed staff onboarding via time-limited, cryptographic setup tokens (`/set-password?token=...`), account status toggling, and role isolation (`ADMIN` vs `STAFF`).
6. **JWT Token Revocation**: Database-backed token blacklisting (`BlacklistedToken`) ensuring instantaneous session invalidation upon logout without storing raw JWTs.
7. **Predictive Restock Analytics**: Hybrid mathematical and LLM-driven engine leveraging historical sales velocity, supplier lead times, and Google Gemini (`@google/genai`) to suggest replenishment quantities with business reasoning.

---

## 2. Technology Stack

| Layer / Component | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Runtime** | Node.js | `>= 18.18.0` (tested on `v20.x`, `v22.x`) | JavaScript server runtime |
| **Web Framework** | Express.js | `^5.1.0` | HTTP application framework |
| **Language** | TypeScript | `^5.9.2` | Static typing and compiler |
| **Execution Engine** | `tsx` | `^4.21.0` | Fast TypeScript execution and watch mode |
| **Database** | PostgreSQL | `>= 14` | Relational transactional database |
| **ORM** | Prisma | `^7.9.1` | Type-safe query builder and migrations |
| **Database Adapter** | `@prisma/adapter-pg` & `pg` | `^7.9.1` / `^8.16.3` | Native PostgreSQL connection pooling |
| **AI / LLM** | `@google/genai` | `^2.30.0` | Google Gemini API SDK (`gemini-2.5-flash`) |
| **Authentication** | `jsonwebtoken` & `bcryptjs` | `^9.0.3` / `^3.0.3` | JWT signing, verification, and bcrypt hashing |
| **Input Validation** | Zod | `^4.3.6` | Runtime request body and query validation |
| **Security & CORS** | `cors` & Node `crypto` | `^2.8.5` | Cross-origin resource sharing & SHA-256 token hashing |
| **HTTP Status Codes**| `http-status-codes` | `^2.3.0` | Standardized REST status codes |
| **Document Export** | `pdfkit` | `^0.18.0` | PDF generation for receipts and reports |

---

## 3. Architecture & Project Structure

The project adheres to a modular, domain-driven layer architecture:

```text
backend/
├── prisma/
│   ├── schema/
│   │   ├── schema.prisma          # Generator & DB provider settings
│   │   ├── enum.prisma            # Enums (Role, UserStatus, SaleStatus, etc.)
│   │   └── user.prisma            # Models (User, Product, Sale, PurchaseOrder, etc.)
│   └── migrations/                # Database migrations
├── src/
│   ├── config/
│   │   ├── env.ts                 # Centralized environment variable loader
│   │   └── prisma.ts              # PrismaClient instance with pg connection pool
│   ├── middleware/
│   │   ├── auth.middleware.ts     # JWT auth, role validation & blacklist lookup
│   │   ├── validate.middleware.ts # Zod request validation wrapper
│   │   └── error.middleware.ts    # Global error handling and 404 handler
│   ├── modules/
│   │   ├── routes.ts              # Central API router mounting all modules
│   │   ├── auth/                  # Login, logout, setup tokens, blacklist service
│   │   ├── users/                 # Admin user CRUD, status updates, profile
│   │   ├── staff/                 # Staff portal endpoints (sales, activities)
│   │   ├── categories/            # Product category taxonomy
│   │   ├── suppliers/             # Supplier directory and lead time records
│   │   ├── products/              # Product catalog and low-stock queries
│   │   ├── sales/                 # POS sales, transactions, invoices, voiding
│   │   ├── sale-items/            # Line items management
│   │   ├── purchase-orders/       # PO lifecycle, receiving intake, receipts
│   │   ├── stock-movements/       # Audit ledger and manual adjustments
│   │   ├── dashboard/             # Financial KPIs, sales trends, top products
│   │   ├── reports/               # Inventory valuation, sales, and purchase reports
│   │   └── ai-restock/            # Velocity math, Gemini AI client, restock logic
│   ├── utils/
│   │   ├── tokenHash.ts           # Cryptographic SHA-256 token hashing
│   │   ├── ApiError.ts            # Custom operational error class
│   │   ├── catchAsync.ts          # Async route error wrapper
│   │   ├── sendResponse.ts        # Standardized JSON response envelope
│   │   └── seedSuperAdmin.ts      # Initial database admin seeding script
│   ├── app.ts                     # Express app configuration & middleware
│   └── server.ts                  # HTTP server bootstrap & periodic cleanup job
├── tests/
│   ├── complete_backend_audit.test.ts # Comprehensive 34-step end-to-end backend audit test
│   └── jwt_blacklist_security.test.ts # Automated token blacklist security test suite
├── .env.example                   # Environment template
├── package.json                   # Dependencies & scripts
└── tsconfig.json                  # TypeScript compiler configuration
```

### Architectural Responsibilities:
- **Routes (`*.route.ts`)**: Route definitions, HTTP methods, and middleware attachment (`auth`, `validateRequest`).
- **Controllers (`*.controller.ts`)**: Parses request parameters, delegates to services via `catchAsync`, and formats responses using `sendResponse`.
- **Services (`*.service.ts`)**: Encapsulates business logic, database transactions (`prisma.$transaction`), and external integrations (Gemini AI).
- **Validation (`*.validation.ts`)**: Defines Zod validation schemas for request bodies, queries, and route parameters.

---

## 4. Prerequisites

- **Node.js**: `v18.18.0` or higher (verified on Node `v20.x` and `v22.x`).
- **PostgreSQL**: PostgreSQL `14+` running locally or hosted (e.g. AWS RDS, Neon, Supabase).
- **Package Manager**: `npm` (default), or `pnpm` / `yarn`.
- **Google Gemini API Key** (optional but recommended): Free tier or pay-as-you-go key from [Google AI Studio](https://aistudio.google.com/) for AI restock recommendations. If absent, the system operates seamlessly using deterministic calculations.

---

## 5. Installation and Setup

1. **Clone the repository and enter the backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```
   *(Update `DATABASE_URL`, `JWT_SECRET`, and other settings as detailed in Section 6).*

4. **Initialize Database Schema**:
   Push the Prisma schema to your PostgreSQL database:
   ```bash
   npx prisma db push
   ```
   *(Or generate a migration with `npx prisma migrate dev --name init`).*

5. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

6. **Seed Initial Super Admin User (Optional)**:
   ```bash
   npx tsx src/utils/seedSuperAdmin.ts
   ```

7. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   The API will start with file watching enabled on `http://localhost:4001` (or your configured `PORT`).

8. **Production Build & Execution**:
   ```bash
   # Compile TypeScript to JavaScript
   npm run build

   # Start production server
   npm run start:prod
   ```

---

## 6. Environment Variables

All environment variables read by [src/config/env.ts](file:///e:/Anar/Tasks/SME%20Inventory%20&%20Sales%20Tracker%20with%20AI%20Restock%20Suggestion/backend/src/config/env.ts) are documented below:

| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | No | `development` | Environment mode (`development`, `production`, `test`) |
| `PORT` | No | `5000` | Port on which the Express server listens (e.g. `4001`) |
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection string (`postgresql://user:pass@host:port/db?schema=public`) |
| `BCRYPT_SALT_ROUND` | No | `10` | Salt rounds for password hashing with bcrypt |
| `CORS_ORIGIN` | No | `*` | Allowed CORS origins (comma-separated for multiple origins) |
| `FRONTEND_URL` | No | `http://localhost:3000` | Frontend URL for invitation setup links |
| `JWT_SECRET` | **Yes** | `default_jwt_secret` | Secret key used to sign and verify JWT access tokens |
| `JWT_EXPIRE_IN` | No | `1d` | Expiration window for access tokens (e.g., `15m`, `1d`) |
| `JWT_REFRESH_EXPIRE_IN`| No | `30d` | Reserved session window configuration |
| `GEMINI_API_KEY` | No | `""` | Google Gemini API Key for AI restock recommendations |
| `GEMINI_MODEL` | No | `gemini-2.5-flash` | Gemini model name (e.g., `gemini-2.5-flash`, `gemini-3.8-flash`) |
| `REDIS_URL` | No | `redis://localhost:6379`| Optional Redis connection string |
| `EMAIL_HOST` | No | `""` | SMTP email host (e.g. `smtp.gmail.com`) |
| `EMAIL_PORT` | No | `587` | SMTP email port |
| `EMAIL_USER` | No | `""` | SMTP email username |
| `EMAIL_PASS` | No | `""` | SMTP email application password |
| `NAME` | No | `Super Admin` | Seed name for initial super admin user |
| `EMAIL` | No | `admin@example.com` | Seed email for initial super admin user |
| `PHONE` | No | `""` | Seed phone for initial super admin user |
| `PASSWORD` | No | `admin123456` | Seed password for initial super admin user |

> **Security Note**: Never commit your `.env` file to version control. Keep `.env.example` populated with generic placeholders.

---

## 7. Authentication, Permissions & Token Blacklist

### JWT Authentication
- When a user logs in via `POST /api/v1/auth/login`, passwords are verified using `bcrypt.compare`.
- A signed JWT is returned containing `{ id, role, email }`.
- Clients include this token in the header: `Authorization: Bearer <token>`.

### Role-Based Access Control (RBAC)
Two distinct roles exist in `enum Role`:
- `ADMIN`: Full access to all endpoints, including staff administration, inventory adjustments, categories, suppliers, purchase orders, financial reports, and AI restock analysis.
- `STAFF`: Access restricted to POS sales creation (`POST /api/v1/sales`), personal sales history (`GET /api/v1/staff/me/sales`), personal shift activity log (`GET /api/v1/staff/me/activities`), and read access to the product catalog for pricing lookup. Forbidden from accessing administrative routes.

### Database-Backed Token Blacklist & Secure Logout
- **Endpoint**: `POST /api/v1/auth/logout`.
- **Revocation Process**:
  1. The token is extracted from the `Authorization` header and verified for valid signature.
  2. A cryptographic **SHA-256 hash** of the raw token is computed via `hashToken(token)`.
  3. The hash, token expiration date (`expiresAt`), and user ID are written to the `blacklisted_tokens` table. Raw tokens are **never** stored.
  4. The operation is idempotent: repeated logout requests are handled gracefully without duplicate key errors.
- **Verification on Every Protected Request**:
  - The shared `auth(...roles)` middleware hashes the incoming token and performs an indexed query on `blacklisted_tokens`.
  - If blacklisted, the request is rejected with `401 Unauthorized` (`{ success: false, message: "Authentication required" }`).
  - **Fail-Closed Security**: If the database is unreachable during blacklist verification, the request fails closed (`500 Internal Server Error`) to prevent unauthorized access.
- **Automated Expired Token Cleanup**:
  - `TokenBlacklistService.cleanupExpiredTokens()` runs on server startup and every 6 hours via an unreferenced background interval (`.unref()`).
  - Only records where `expiresAt < now()` are deleted; active revoked tokens remain until their natural expiration.

---

## 8. API Documentation

All routes are mounted under `/api/v1`.

### 1. Authentication (`/api/v1/auth`)
| Method | Endpoint | Role | Description | Status |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Public | Register new initial user | `201 Created` |
| `POST` | `/auth/login` | Public | Authenticate credentials & issue JWT | `200 OK` |
| `GET` | `/auth/verify-setup-token`| Public | Verify query param `?token=...` for staff invite | `200 OK` / `400` |
| `POST` | `/auth/set-password` | Public | Complete staff account setup with token | `200 OK` |
| `GET` | `/auth/me` | Authenticated | Retrieve current authenticated user profile | `200 OK` |
| `POST` | `/auth/logout` | Authenticated | Revoke JWT token and persist to blacklist | `200 OK` |

### 2. Staff Self-Service (`/api/v1/staff`)
| Method | Endpoint | Role | Description | Status |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/staff/me` | Staff, Admin | Get authenticated staff member's profile | `200 OK` |
| `PATCH`| `/staff/me` | Staff, Admin | Update staff profile (name, phone, avatar) | `200 OK` |
| `GET` | `/staff/me/sales` | Staff, Admin | Retrieve personal sales records with pagination | `200 OK` |
| `GET` | `/staff/me/sales/summary`| Staff, Admin | Get personal sales volume and totals for shift | `200 OK` |
| `GET` | `/staff/me/activities` | Staff, Admin | Retrieve personal audit activity trail | `200 OK` |

### 3. User Administration (`/api/v1/users`)
| Method | Endpoint | Role | Description | Status |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/users/staff` | Admin | Create pending staff account & generate setup token | `201 Created` |
| `POST` | `/users/:id/setup-token` | Admin | Regenerate/re-issue staff setup invitation link | `200 OK` |
| `PATCH`| `/users/:id/status` | Admin | Toggle user status (`ACTIVE`, `INACTIVE`) | `200 OK` |
| `GET` | `/users/:id/sales` | Admin | View sales history for a specific staff member | `200 OK` |
| `GET` | `/users/:id/activities` | Admin | View audit activities for a specific staff member | `200 OK` |
| `GET` | `/users` | Admin | List all registered users with role/status filters | `200 OK` |
| `GET` | `/users/:id` | Admin | Get user details by ID | `200 OK` |
| `PATCH`| `/users/:id` | Admin | Update user information | `200 OK` |
| `PATCH`| `/users/:id/password` | Admin | Force update/reset a user's password | `200 OK` |

### 4. Product Catalog (`/api/v1/products`)
| Method | Endpoint | Role | Description | Status |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/products` | Admin | Create product with SKU, category, supplier, pricing | `201 Created` |
| `GET` | `/products` | Authenticated | List products with pagination, search, category filter| `200 OK` |
| `GET` | `/products/low-stock` | Authenticated | Query products where `stockQty <= reorderLevel` | `200 OK` |
| `GET` | `/products/:id` | Authenticated | Retrieve product details with supplier and category | `200 OK` |
| `PATCH`| `/products/:id` | Admin | Update product details, prices, or reorder levels | `200 OK` |
| `PATCH`| `/products/:id/status` | Admin | Toggle product active/inactive status | `200 OK` |

### 5. Categories (`/api/v1/categories`)
| Method | Endpoint | Role | Description | Status |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/categories` | Admin | Create product category | `201 Created` |
| `GET` | `/categories` | Authenticated | List all active categories | `200 OK` |
| `GET` | `/categories/:id` | Authenticated | Retrieve category by ID | `200 OK` |
| `PATCH`| `/categories/:id` | Admin | Update category name and description | `200 OK` |
| `PATCH`| `/categories/:id/status`| Admin | Toggle category active/deleted status | `200 OK` |

### 6. Suppliers (`/api/v1/suppliers`)
| Method | Endpoint | Role | Description | Status |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/suppliers` | Admin | Create supplier with contact and address | `201 Created` |
| `GET` | `/suppliers` | Authenticated | List all suppliers | `200 OK` |
| `GET` | `/suppliers/:id` | Authenticated | Get supplier by ID with catalog associations | `200 OK` |
| `PATCH`| `/suppliers/:id` | Admin | Update supplier contact info | `200 OK` |
| `PATCH`| `/suppliers/:id/status` | Admin | Toggle supplier active status | `200 OK` |

### 7. Sales & Point of Sale (`/api/v1/sales`)
| Method | Endpoint | Role | Description | Status |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/sales` | Staff, Admin | Create sale, validate stock, deduct inventory, log movements | `201 Created` |
| `GET` | `/sales` | Authenticated | List sales transactions with pagination and date filter | `200 OK` |
| `GET` | `/sales/invoice/:invoiceNo`| Authenticated | Get complete sale invoice details | `200 OK` |
| `GET` | `/sales/:id` | Authenticated | Get sale details by ID | `200 OK` |
| `POST` | `/sales/:id/void` | Staff, Admin | Void sale, restore inventory, write `REVERSAL` ledger | `200 OK` |

### 8. Purchase Orders (`/api/v1/purchase-orders`)
| Method | Endpoint | Role | Description | Status |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/purchase-orders` | Staff, Admin | Create draft or ordered purchase order | `201 Created` |
| `GET` | `/purchase-orders` | Authenticated | List POs with status and supplier filters | `200 OK` |
| `GET` | `/purchase-orders/:id`| Authenticated | Get purchase order details and line items | `200 OK` |
| `PATCH`| `/purchase-orders/:id/status`| Staff, Admin | Update status (`ORDERED`, `CANCELLED`) | `200 OK` |
| `POST` | `/purchase-orders/:id/receive`| Staff, Admin | Receive order, increment stock, create `PURCHASE` movements | `200 OK` |
| `GET` | `/purchase-orders/:id/receipt`| Authenticated | Generate / retrieve receiving receipt | `200 OK` |

### 9. AI Restock Recommendations (`/api/v1/ai-restock`)
| Method | Endpoint | Role | Description | Status |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/ai-restock/recommendations` | Staff, Admin | Get system-wide restock recommendations with Gemini reasoning | `200 OK` |
| `GET` | `/ai-restock/products/:id` | Staff, Admin | Get 30-day velocity, runout days & forecast for product | `200 OK` |
| `POST` | `/ai-restock/refresh` | Staff, Admin | Force refresh and recalculate forecast metrics | `200 OK` |

---

## 9. Database Design & Models

The PostgreSQL schema is partitioned across Prisma schema files in `prisma/schema/`:

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      User       │       │  PurchaseOrder  │       │    Supplier     │
│─────────────────│       │─────────────────│       │─────────────────│
│ id (cuid)       │◄──┐   │ id (cuid)       │◄──┐   │ id (cuid)       │
│ email (unique)  │   │   │ poNumber (uniq) │   │   │ name            │
│ passwordHash    │   │   │ supplierId (FK) ├───┼──►│ email           │
│ role (enum)     │   │   │ createdById(FK) ├───┘   │ phone           │
│ isActive        │   │   │ status (enum)   │       └─────────────────┘
└────────┬────────┘   │   └────────┬────────┘                ▲
         │            │            │                         │
         │            │   ┌────────┴────────┐                │
         │            └───┤    SaleItem     │       ┌────────┴────────┐
         │                │─────────────────│       │     Product     │
         │                │ id (cuid)       │       │─────────────────│
         │                │ saleId (FK)     │   ┌──►│ id (cuid)       │
         │                │ productId (FK)  ├───┘   │ sku (unique)    │
         │                │ quantity        │       │ unitPrice       │
         │                │ lineTotal       │       │ costPrice       │
         │                └────────┬────────┘       │ stockQty        │
         ▼                         │                │ reorderLevel    │
┌─────────────────┐                ▼                │ supplierId (FK) │
│  StockMovement  │       ┌─────────────────┐       │ categoryId (FK) │
│─────────────────│       │BlacklistedToken │       └─────────────────┘
│ id (cuid)       │       │─────────────────│
│ productId (FK)  │       │ id (cuid)       │
│ type (enum)     │       │ tokenHash (uniq)│
│ quantityChange  │       │ userId (FK)     │
│ createdById(FK) │       │ expiresAt       │
└─────────────────┘       └─────────────────┘
```

### Key Models & Constraints
- **`User`**: Unique `email`, indexed `role` and `setupTokenHash`. Has relations to sales, purchase orders, stock movements, and blacklisted tokens.
- **`BlacklistedToken`**: `tokenHash` (unique, indexed), `expiresAt` (indexed for cleanup), `userId` (cascade on delete).
- **`Product`**: Unique `sku`, foreign keys to `Category` and `Supplier`. Contains `stockQty` (Int) and `reorderLevel` (Int default 10).
- **`Sale` & `SaleItem`**: Unique `invoiceNo`. `SaleItem` has unique compound index `@@unique([saleId, productId])` and cascading delete with parent sale.
- **`PurchaseOrder` & `PurchaseOrderItem`**: Unique `poNumber`. `PurchaseOrderItem` has compound unique `@@unique([purchaseOrderId, productId])`.
- **`StockMovement`**: Tracks `quantityChange` (positive or negative integer) with mandatory `type` (`SALE`, `PURCHASE`, `ADJUSTMENT`, `RETURN`, `REVERSAL`), `productId`, and author `createdById`.

---

## 10. Business Logic & Transaction Workflows

### 1. Point of Sale Transaction
When `POST /api/v1/sales` is called:
```typescript
await prisma.$transaction(async (tx) => {
  // 1. Lock and verify each product's stock availability
  // 2. Reject if requested quantity > current stockQty
  // 3. Create Sale record with generated invoice number
  // 4. Create SaleItem rows with snapshot of unitPrice and unitCost
  // 5. Decrement Product stockQty
  // 6. Write StockMovement record (type: SALE, quantityChange: -qty)
});
```

### 2. Purchase Order Fulfillment
When `POST /api/v1/purchase-orders/:id/receive` is called:
- Checks that the PO is in `ORDERED` status (prevents double-intake).
- Transitions status to `RECEIVED` and sets `receivedAt = new Date()`.
- Increments each product's `stockQty` by the order quantity.
- Creates `StockMovement` records (type: `PURCHASE`, `quantityChange: +qty`).

### 3. Inventory Correction / Shrinkage
When stock is adjusted:
- Admin submits adjustment with reason (`DAMAGE`, `PHYSICAL_COUNT`, etc.).
- Product `stockQty` is updated.
- A `StockMovement` of type `ADJUSTMENT` is recorded with `note` explaining the correction.

---

## 11. AI Restock Forecasting Engine

StockPilot integrates with **Google Gemini AI** (`@google/genai` with model `gemini-2.5-flash`) via a hybrid architecture combining mathematical velocity metrics with LLM reasoning.

### Inputs Evaluated
1. **30-Day Sales Velocity**: Computes daily sales aggregation per product from `SaleItem`.
2. **Current Stock**: Existing available inventory in warehouse.
3. **Reorder Level**: Safety threshold configured per product.
4. **Incoming Stock**: Unreceived units on active Purchase Orders (`ORDERED` status).
5. **Supplier Lead Time Buffer**: Standard lead-time buffer.

### Mathematical Formulation
- **Average Daily Demand ($\text{ADD}$)**:
  $$\text{ADD} = \frac{\sum \text{Units Sold in Analysis Period}}{\text{Analysis Period Days (30)}}$$
- **Estimated Runout Days**:
  $$\text{Days Remaining} = \begin{cases} \frac{\text{Current Stock}}{\text{ADD}} & \text{if } \text{ADD} > 0 \\ 999 & \text{if } \text{ADD} = 0 \end{cases}$$
- **Target Stock Level**:
  $$\text{Target Stock} = \text{reorderLevel} + (\text{ADD} \times \text{Planning Horizon (14 days)})$$
- **Suggested Restock Quantity**:
  $$\text{Suggested Qty} = \max(0, \lceil \text{Target Stock} - (\text{Current Stock} + \text{Incoming Stock}) \rceil)$$

### AI Output & Classification
The LLM evaluates the candidates and assigns:
- `priority`: `HIGH` (stock $\le$ reorder level or runout $\le$ 3 days), `MEDIUM` (runout within 14 days or upward sales velocity), `LOW` (healthy buffer).
- `reason`: Concise business rationale (e.g. *"Fast-moving item with 1.4 units/day; current stock of 2 will deplete in under 48 hours"*).
- `warnings`: Actionable flags (e.g. *"Stockout imminent before next supplier delivery"*).

### Resilience & Fallback
- If the Gemini API key is missing or quota is exhausted, the service automatically switches to `DETERMINISTIC_FALLBACK` mode using strict mathematical rules without disrupting user workflows.
- Products with fewer than 3 sales days in the analysis window are flagged with `INSUFFICIENT_DATA`.

---

## 12. Testing & Quality Assurance

### Automated Security Test Suite
The backend includes an automated, live test suite in [tests/jwt_blacklist_security.test.ts](file:///e:/Anar/Tasks/SME%20Inventory%20&%20Sales%20Tracker%20with%20AI%20Restock%20Suggestion/backend/tests/jwt_blacklist_security.test.ts) covering JWT token revocation, database blacklist persistence, and access control.

Run the test suite:
```bash
npx tsx tests/jwt_blacklist_security.test.ts
```

### Verified Test Results (13/13 Scenarios Passing)
```text
=== StockPilot JWT Token Blacklist Security Test Suite ===

[PASS] 1. Valid non-revoked token can access protected endpoints -> Status: 200
[PASS] 2. Logging out successfully revokes the token -> Status: 200, Message: User logged out successfully
[PASS] 3. Raw JWT is never stored in the blacklist table (only cryptographic SHA-256 hash) -> Stored hash: f1d43d9788411726...
[PASS] 4. Blacklisted token receives 401 Unauthorized on subsequent protected requests -> Status: 401, Message: Authentication required
[PASS] 5. Logging out does not revoke unrelated sessions or users' tokens -> Status: 200
[PASS] 6. Repeated logout requests are handled safely and idempotently -> Status: 200
[PASS] 7. Expired tokens are rejected with 401 even if not yet blacklisted -> Status: 401
[PASS] 8. Invalid JWT signatures are rejected with 401 -> Status: 401
[PASS] 9. Malformed tokens are rejected with 401 -> Status: 401
[PASS] 10. Database failures fail closed and never permit unverified access -> Threw exception on database error rather than returning false
[PASS] 11. Expired blacklist records are cleaned up safely without deleting active records -> Cleaned count: 1, active token preserved
[PASS] 12. Refresh token audit: verified no unmanaged refresh token bypass exists -> Standalone access token model with direct logout revocation
[PASS] 13. Admin and Staff role authentication continue to function properly -> Admin and Staff roles verified

=== Summary: 13/13 Tests Passed ===
```

---

## 13. Error Handling and Security

- **Centralized Error Handling**: Unhandled exceptions and operational `ApiError` instances are intercepted by `errorHandler` in `src/middleware/error.middleware.ts`. In production mode (`NODE_ENV=production`), error stack traces are omitted.
- **Strict Input Validation**: Every write and update endpoint runs through `validateRequest` using Zod schemas (`ZodError` maps to HTTP `400 Bad Request` with field-level issues).
- **Secure Password Storage**: User passwords are encrypted with bcrypt (10 rounds). Passwords and setup token hashes are excluded from API response serializations.
- **Fail-Closed Blacklist**: Token blacklist verification rejects access if the database is unreachable rather than allowing potentially revoked tokens through.

---

## 14. Deployment & Known Limitations

### Deployment Guidelines
1. **Database Provisioning**: Ensure PostgreSQL has active connection pooling enabled.
2. **Environment Configuration**: Set `NODE_ENV=production`, configure a strong 32+ character `JWT_SECRET`, and define specific origins in `CORS_ORIGIN`.
3. **Build & Start**:
   ```bash
   npm run build
   npm run start:prod
   ```

### Known Limitations
- **Standalone Access Tokens**: The current architecture uses standalone 15-minute JWT access tokens without refresh-token rotation. Users must re-authenticate once their token expires.
- **Synchronous AI Calls**: AI restock recommendations invoke Google Gemini synchronously per request; large catalogs (>100 candidates) will benefit from background queue workers (e.g. BullMQ) in future high-scale deployments.