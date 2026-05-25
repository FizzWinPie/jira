# Southwest Airlines — Jira & AI Change Requests (MERN)

A basic MERN demo app that shows a **Jira-style board** with Southwest Airlines dummy stories and uses **AI** to draft **change requests** from ticket details.

## Features

- **Jira Board tab** — Kanban columns (To Do, In Progress, In Review, Done) with 8 SWA-themed tickets
- **Change Requests tab** — ServiceNow-style table: Number (`CHG123456`), change type, state, environment (QA/PROD), owning group, owner, planned dates, and AI draft
- **AI integration** — `POST /api/change-requests/generate` builds a CAB-ready draft from the selected Jira ticket
  - With `GEMINI_API_KEY`: uses Google Gemini
  - Without API key: uses built-in mock drafts (same flow, no external calls)

## Stack

- **MongoDB** + Mongoose
- **Express** API
- **React** (Vite) frontend
- **Node.js** ESM

## Quick start

### Prerequisites

- Node.js 18+
- MongoDB running locally (`mongod`) or a `MONGODB_URI` in `.env`

### Setup

```bash
cd /Users/xhonisuli/Desktop/jira
cp .env.example server/.env   # optional: add GEMINI_API_KEY
npm install
npm run install:all
npm run seed --prefix server    # optional; server auto-seeds on first start
```

### Run

Terminal 1 — API:

```bash
npm run start:server
```

Terminal 2 — UI:

```bash
npm run start:client
```

Or both with `npm run dev` after installing `concurrently` at the root.

Open **http://localhost:5173**

## Usage

1. Open the **Jira Board** tab and click a ticket card.
2. Click **Generate change request (AI)** in the detail panel.
3. Switch to **Change Requests** to see the new row and read the AI draft.

Each Jira key can only have one change request (duplicate generation returns the existing CR).

**After schema updates:** drop old change requests in MongoDB (`db.changerequests.drop()`) or delete documents that still use `crId` instead of `number`.

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health + AI mode |
| GET | `/api/jira/board` | Board columns + tickets |
| GET | `/api/change-requests` | List all CRs |
| POST | `/api/change-requests/generate` | Body: `{ "jiraKey": "SWA-101" }` |

## Dummy data

Tickets cover SWA domains: mobile check-in, crew roster API, Rapid Rewards email, gate displays, fuel hedging export, Wi-Fi portal, turnaround checklist, and IRROPS notifications.
