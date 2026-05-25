# Deploy to Render

Single **Web Service** serves the React UI and Express API from one URL (good for Jira Automation webhooks).

## Prerequisites

1. [Render](https://render.com) account  
2. [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (free tier is fine)  
3. Git repo (GitHub/GitLab) connected to Render  

## Option A — Blueprint (`render.yaml`)

1. Push this repo to GitHub.  
2. In Render: **New → Blueprint** → connect the repo.  
3. Set **Environment** variables when prompted:
   - `MONGODB_URI` — Atlas connection string (e.g. `mongodb+srv://user:pass@cluster.mongodb.net/swa-change-requests`)
   - `GEMINI_API_KEY` — optional  
   - `JIRA_WEBHOOK_SECRET` — optional, for future webhooks  
4. Deploy.  

## npm or Yarn?

**Use npm.** This repo has `package-lock.json` files and all scripts use `npm` (`npm run build`, `npm start`). Do not use Yarn on Render unless you add a `yarn.lock` and change every script.

Render picks npm automatically when it sees `package-lock.json` (no extra setting required).

## Option B — Manual Web Service

In Render dashboard → your service → **Settings**:

| Setting | Value |
|--------|--------|
| **Language / Runtime** | Node |
| **Root Directory** | *(leave blank — repo root)* |
| **Build Command** | `npm run build` |
| **Start Command** | `npm start` |
| **Health Check Path** | `/api/health` |
| **Auto-Deploy** | On (optional) |

**Do not set** a custom install command unless builds fail; default `npm install` at root is enough for `concurrently` in devDependencies. The `build` script installs `client` and `server` via `npm install --prefix`.

### Environment variables

| Key | Required | Notes |
|-----|----------|--------|
| `MONGODB_URI` | Yes | Atlas URI with database name |
| `NODE_ENV` | Yes | `production` |
| `SEED_ON_START` | Recommended | `true` seeds demo Jira tickets if DB is empty |
| `GEMINI_API_KEY` | No | Omit or set `USE_MOCK_AI=true` for mock AI |
| `USE_MOCK_AI` | No | `true` forces mock even with API key |
| `PORT` | Auto | Set by Render — do not override |

## MongoDB Atlas

1. Create cluster → **Database Access** user → **Network Access** → allow `0.0.0.0/0` (or Render egress IPs).  
2. **Connect** → Drivers → copy connection string.  
3. Replace `<password>` and add database name:  
   `mongodb+srv://user:PASSWORD@cluster.mongodb.net/swa-change-requests`

## Verify

- `https://YOUR-SERVICE.onrender.com/api/health` → `{ "ok": true }`  
- `https://YOUR-SERVICE.onrender.com/` → React app  
- **Change Requests** tab loads after seed  

## Jira webhook (Lambda or Automation)

**URL:** `POST https://YOUR-SERVICE.onrender.com/api/webhooks/jira`

**Body (JSON):**

```json
{
  "ticketKey": "SCRUM-1",
  "summary": "Issue title from Jira",
  "description": "Full description markdown",
  "statusName": "Ready for CHG",
  "requestedBy": "Display Name",
  "requestedByEmail": "user@example.com"
}
```

Also accepts `jiraKey`, `title` (alias for summary). Set `generateChangeRequest: false` to only upsert the ticket without creating a CHG.

Optional header: `X-Webhook-Secret` (must match `JIRA_WEBHOOK_SECRET` on Render).

**Legacy:** `POST /api/change-requests/generate` with `{ "jiraKey": "SWA-101" }` still works for tickets already in MongoDB.

## Local production test

```bash
npm run build
cd server && NODE_ENV=production SEED_ON_START=true MONGODB_URI="your-atlas-uri" npm start
```

Open http://localhost:5001
