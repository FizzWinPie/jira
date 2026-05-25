# Southwest Airlines — Change Management Portal (MERN)

MERN app that creates **change requests (CHG)** and **change tasks (CTASK)** when **Jira automation** (Lambda) posts to the webhook. The UI lists and details change requests only — no in-app Jira board.

## Features

- **Change requests** — ServiceNow-style table and detail: `CHG123456`, planning fields, environment, dates, owner
- **Change tasks** — Three CTASKs per CHG (Pre-Implementation, Implementation, Validation)
- **Webhook** — `POST /api/webhooks/jira` creates CHG + CTASKs from Jira ticket payload (AI planning via Gemini or mock)
- **AI** — With `GEMINI_API_KEY`: Google Gemini; without: built-in mock drafts

## Stack

- MongoDB + Mongoose
- Express API
- React (Vite) frontend
- Node.js ESM

## Deploy on Render

See **[DEPLOY.md](./DEPLOY.md)** for MongoDB Atlas, `render.yaml`, and environment variables.

## Quick start

### Prerequisites

- Node.js 18+
- MongoDB locally or `MONGODB_URI` in `server/.env`

### Setup

```bash
cd /Users/xhonisuli/Desktop/jira
cp server/.env.example server/.env   # optional: GEMINI_API_KEY, MONGODB_URI
npm install
npm run install:all
```

### Run

```bash
npm run dev
```

- API: http://localhost:5001  
- UI: http://localhost:5173  

## Usage

1. Configure Jira Automation / Lambda to `POST` your app URL (see DEPLOY.md).
2. Open **Change Requests** in the app to see new CHGs after a webhook fires.
3. Each Jira `ticketKey` maps to one CHG; repeat webhooks return **409** with the existing record.

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health + AI mode |
| POST | `/api/webhooks/jira` | Create CHG + CTASKs from Jira payload |
| GET | `/api/change-requests` | List change requests |
| GET | `/api/change-requests/:number` | Change request detail |
| GET | `/api/change-requests/:number/ctasks` | List CTASKs for a CHG |
| GET | `/api/change-requests/:number/ctasks/:ctaskNumber` | CTASK detail |

## Webhook body (example)

```json
{
  "ticketKey": "SCRUM-1",
  "summary": "Issue title",
  "description": "Full description",
  "statusName": "Ready for CHG",
  "requestedBy": "Display Name",
  "requestedByEmail": "user@example.com"
}
```

Aliases: `jiraKey`, `title` (for `summary`).
