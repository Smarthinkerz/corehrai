# Deploying CoreHR AI — Neon + Railway

This guide deploys the app to **Railway** (app hosting) with **Neon** (Postgres).
The whole app — API and frontend — runs as a single Node service on one port.

---

## Prerequisites
- A GitHub repo containing this project.
- A [Neon](https://neon.tech) account (free).
- A [Railway](https://railway.app) account (Hobby plan, ~$5/mo).

---

## Step 1 — Create the database (Neon)

1. In Neon, create a new **Project**.
2. Open **Connection Details** and copy the **Pooled connection** string
   (its host contains `-pooler`). Keep `?sslmode=require` at the end.
3. Save it — this is your `DATABASE_URL`.

> Use the **pooled** string, not the direct one. The app keeps a connection
> pool and stores sessions in Postgres, so pooling avoids exhausting connections.

---

## Step 2 — Create the app (Railway)

1. In Railway: **New Project → Deploy from GitHub repo** and pick this repo.
2. Railway auto-detects Node and uses the included `railway.json`:
   - Build: `npm run build`
   - Start: `npm run start`
   - Health check: `/api/health`

---

## Step 3 — Set environment variables (Railway)

In your service's **Variables** tab, add (see `.env.example` for the full list):

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | your Neon **pooled** connection string |
| `SESSION_SECRET` | run `openssl rand -hex 32` and paste the result |
| `NODE_ENV` | `production` |
| `APP_URL` | your Railway URL (e.g. `https://your-app.up.railway.app`) |

Add any feature keys you use (`OPENAI_API_KEY`, `RESEND_API_KEY`, etc.).

> The app **will not start in production without `SESSION_SECRET`** — this is intentional.

---

## Step 4 — Push the database schema

Run once from your machine, pointed at Neon:

```bash
DATABASE_URL="<your-neon-pooled-url>" npm run db:push
```

This creates all tables. (Optional: seed demo data with your seed script.)

---

## Step 5 — Deploy

Railway deploys automatically on every push to your default branch.
When it's live, open the Railway URL. Confirm health with:

```bash
curl https://your-app.up.railway.app/api/health
# → {"status":"ok","database":{"status":"connected",...}}
```

Log in with the demo account (`sarah.johnson` / `Welcome1!`) or register a new user.

---

## Notes
- **One port, one service.** Express serves both the API and the built React
  frontend. Don't split the frontend to a separate host — they share an origin
  and cookies.
- **Port binding.** The server uses Railway's injected `PORT` automatically and
  falls back to `5000` locally.
- **Credit model.** Railway is usage-based; the Hobby plan's $5/mo covers a small
  always-on service. Keep an eye on usage so the service doesn't pause.
- **No Redis needed.** Sessions live in Postgres.
