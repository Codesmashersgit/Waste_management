# Backend layer

This folder contains server-only business logic shared by the web API routes: PostgreSQL/Drizzle access, report and collection operations, mobile authentication, OTP sessions, admin sessions, and verification helpers.

The HTTP route adapters remain under `web/src/app/api` because the web deployment currently uses Next.js Route Handlers. They call backend modules through the `@backend/*` TypeScript alias. This keeps HTTP/framework concerns out of database and domain modules while allowing web and mobile clients to use the same API.

The database schema is `src/db/schema.ts`; apply the phone-auth additions from `src/db/phone-auth-migration.sql` after setting `DATABASE_URL` in `backend/.env`.
