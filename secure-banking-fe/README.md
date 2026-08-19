# Secure Banking Platform — Frontend

Production-style operations console for the Secure Multi-Tenant Banking Platform.

Stack: React 19, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, Recharts, Keycloak JS (Authorization Code + PKCE).

## Run

```bash
cp .env.example .env
npm install
npm run dev
```

The app is served at [http://localhost:5173](http://localhost:5173).

API calls to `/api` and `/actuator` are proxied to the Spring Cloud Gateway at `http://localhost:8080`.

## Authentication

Primary login uses Keycloak realm `banking`, client `banking-frontend`, Authorization Code + PKCE.

If Keycloak is not running, use **Explore as ADMIN** (or another role) to walk the full UI against the demonstration dataset.

Demo users when the backend is up (password `Password123!`):

| User             | Role     | Tenant     |
| ---------------- | -------- | ---------- |
| `awa.diop`       | CUSTOMER | BANK_DAKAR |
| `mamadou.ndiaye` | OPERATOR | BANK_DAKAR |
| `auditor`        | AUDITOR  | PLATFORM   |
| `admin`          | ADMIN    | PLATFORM   |

Navigation is filtered from JWT / demo roles. The API remains the source of truth for authorization.

## Scripts

| Command           | Description                   |
| ----------------- | ----------------------------- |
| `npm run dev`     | Vite dev server on port 5173  |
| `npm run build`   | Typecheck + production bundle |
| `npm run preview` | Preview the production build  |
