# StockPilot Backend

## Overview
StockPilot Backend is a REST API built with Node.js, Express, TypeScript, PostgreSQL, and Prisma. It handles inventory transactions, sales processing, purchase order receiving, staff user management with role-based access control, database-backed JWT token revocation, and AI-assisted restock forecasting.

## Features
- **Authentication & RBAC**: JWT authentication with `ADMIN` and `STAFF` roles.
- **Secure Token Revocation**: Database-backed token blacklist for immediate logout invalidation.
- **Inventory & Catalog**: Products, categories, suppliers, and stock tracking.
- **Sales & POS**: Multi-item sales transactions with stock deduction and receipt generation.
- **Purchase Orders**: Order creation, status tracking, and automated stock intake on receiving.
- **Stock Movement Ledger**: Audit history recording sales deductions, purchase intake, and manual adjustments.
- **Staff Administration**: Admin-managed staff invites with time-limited setup tokens.
- **AI Restock Forecasting**: Gemini-powered restock suggestions using sales velocity and supplier lead times, with rule-based fallback.

## Getting Started

### Prerequisites
- Node.js 18.18+ (Node 20+ recommended)
- PostgreSQL 14+
- Google Gemini API key (optional, for AI restock forecast)

### Installation & Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Update `DATABASE_URL`, `JWT_SECRET`, and other settings in `.env`.

3. Push the database schema:
   ```bash
   npx prisma db push
   ```

4. Generate the Prisma client:
   ```bash
   npx prisma generate
   ```

5. (Optional) Seed an initial admin user:
   ```bash
   npx tsx src/utils/seedSuperAdmin.ts
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```
   The API will run at `http://localhost:4001` (or your configured `PORT`).

### Available Scripts
- `npm run dev` - Run development server with watch mode (`tsx`)
- `npm run build` - Compile TypeScript to `dist/`
- `npm run start:prod` - Run compiled production server

## API Documentation (Swagger)

Interactive OpenAPI / Swagger documentation is available for all endpoints, including authentication, user & staff management, inventory, sales, purchase orders, stock movements, reports, and AI restock forecasting.

To access the documentation locally:
1. Start the backend server (`npm run dev`).
2. Open the Swagger UI in your browser:

[Open Swagger API Documentation](http://localhost:4001/api-docs)

- Local Swagger UI URL: `http://localhost:4001/api-docs`
- OpenAPI JSON Specification: `http://localhost:4001/api-docs.json`

To test protected endpoints in Swagger UI, click **Authorize** at the top right and enter your Bearer token in the format: `Bearer <your_token>` (or paste your JWT token).


## Environment Variables
Configure these in your `.env` file (refer to `.env.example` for all options):

| Variable | Description | Default / Example |
| --- | --- | --- |
| `PORT` | Port the server listens on | `4001` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:password@localhost:5432/stockpilot?schema=public` |
| `JWT_SECRET` | Secret key used to sign and verify JWT tokens | Required |
| `JWT_EXPIRE_IN` | JWT token expiration duration | `1d` |
| `FRONTEND_URL` | URL of the frontend (for staff setup links) | `http://localhost:3000` |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated) | `http://localhost:3000,http://localhost:3001` |
| `GEMINI_API_KEY` | Google Gemini API key for restock suggestions | Optional |
| `GEMINI_MODEL` | Gemini model name | `gemini-2.5-flash` |

Do not commit your real `.env` file with secrets to version control.

## Frontend Connection
The API routes are mounted at `/api/v1`. The frontend connects using `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:4001/api/v1`). Authenticated endpoints require the header `Authorization: Bearer <token>`.