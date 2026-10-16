# Pathora (backend + frontend)
Run: `node server.js` → http://localhost:3000   (Node ≥ 22.13, **no npm install needed**)
Env: `PORT`, `PATHORA_DB` (SQLite file, default ./pathora.db), `ADMIN_EMAIL` (the account registered with this email becomes admin).
Test: `npm test` (engine tests + HTTP API integration tests on a temp DB).
Schema: `schema.sql` (applied idempotently at start; 15 tables, FKs, CHECKs, indexes). Seed: `seed.js` (18 sample, *unverified* pathways).
Admin: register with ADMIN_EMAIL → "Admin" tab → import JSON/CSV (validated, all-or-nothing, upsert by id).
Stack note: the sandbox had no network, so Express/TypeScript/PostgreSQL/Prisma could not be installed or run. The backend uses Node's built-in http + SQLite instead;
`schema.sql` is plain relational SQL and ports to PostgreSQL with minor type changes. The scheduler engine lives in public/index.html and is reused by server.js, so preview and saved results match.
