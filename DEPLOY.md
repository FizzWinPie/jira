# Deploy to Render

Single **Web Service** serves the React UI and Express API from one URL (for Jira Automation / Lambda webhooks).

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
   - `JIRA_WEBHOOK_SECRET` — optional; require matching `X-Webhook-Secret` header  
4. Deploy.  

## npm or Yarn?

**Use npm.** This repo has `package-lock.json` files and all scripts use `npm`. Render picks npm when it sees `package-lock.json`.

## Option B — Manual Web Service

| Setting | Value |
|--------|--------|
| **Language / Runtime** | Node |
| **Root Directory** | *(repo root)* |
| **Build Command** | `npm run build` |
| **Start Command** | `npm start` |
| **Health Check Path** | `/api/health` |

### Environment variables

| Key | Required | Notes |
|-----|----------|--------|
| `MONGODB_URI` | Yes | Atlas URI with database name |
| `NODE_ENV` | Yes | `production` |
| `GEMINI_API_KEY` | No | Omit or set `USE_MOCK_AI=true` for mock AI |
| `USE_MOCK_AI` | No | `true` forces mock even with API key |
| `JIRA_WEBHOOK_SECRET` | No | If set, webhook must send `X-Webhook-Secret` |
| `PORT` | Auto | Set by Render — do not override |

## MongoDB Atlas

1. Create cluster → **Database Access** user → **Network Access** → allow `0.0.0.0/0` (or Render egress IPs).  
2. **Connect** → Drivers → copy connection string.  
3. Replace `<password>` and add database name:  
   `mongodb+srv://user:PASSWORD@cluster.mongodb.net/swa-change-requests`

## Verify

- `https://YOUR-SERVICE.onrender.com/api/health` → `{ "ok": true }`  
- `https://YOUR-SERVICE.onrender.com/` → Change Requests UI (empty until webhooks create data)

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

Also accepts `jiraKey`, `title` (alias for summary).

**Responses:**

- `201` — New CHG + CTASKs created  
- `409` — CHG already exists for this `ticketKey` (idempotent; returns existing CHG)  
- `400` — Missing required fields  
- `401` — Wrong/missing webhook secret (if `JIRA_WEBHOOK_SECRET` is set)

Optional header: `X-Webhook-Secret` (must match `JIRA_WEBHOOK_SECRET` on Render).

**Test:**

```bash
curl -X POST https://YOUR-SERVICE.onrender.com/api/webhooks/jira \
  -H "Content-Type: application/json" \
  -d '{"ticketKey":"SCRUM-99","summary":"Test","description":"Body","statusName":"Ready for CHG","requestedBy":"Test User"}'
```

Use a **new** `ticketKey` each time you expect `201`.

## Local production test

```bash
npm run build
cd server && NODE_ENV=production MONGODB_URI="your-atlas-uri" npm start
```

Open http://localhost:5001
