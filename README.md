# Internal Governance System Monorepo

Tech stack:
- Frontend: React + TypeScript (Vite)
- Backend: Node.js + Express (TypeScript)
- Database: PostgreSQL
- UI: modern, responsive, dark mode support
- Architecture: modular and extensible

Workspace layout:
- apps/backend — API server and modules
- apps/frontend — React app with routing and empty pages
- packages/shared — shared TypeScript types/enums
- infra/db — SQL schema and migration files

Development quick start:
1) Install Node 18+ and PostgreSQL
2) Run `npm install` in the repo root
3) Copy `.env.example` to `.env` and adjust values
   - Set `DATABASE_URL` to your local Postgres
   - Optionally set `VITE_API_BASE` and `VITE_DEV_USER_ID`
4) Apply SQL from `infra/db/migrations/001_init.sql` to your database
5) Start both apps:
   - Windows: double‑click `Start-IGS.cmd`
   - Or run `npm run dev` in the repo root (starts backend + frontend)

Notes:
- The backend reads `.env` from the repo root.
- Status values use Norwegian labels: ÅPEN, PÅGÅR, LUKKET, AVVIST.
- If ports are in use, set `PORT` in `.env`.

Dev user (required for creating incidents):
- Insert a test user and set its id as `VITE_DEV_USER_ID` in frontend `.env`.
  Example SQL:
  ```sql
  insert into users (id, email, name, role) values (
    '11111111-1111-1111-1111-111111111111', 'dev@example.com', 'Dev User', 'ADMIN'
  ) on conflict do nothing;
  ```
  Then set `VITE_DEV_USER_ID=11111111-1111-1111-1111-111111111111`.

