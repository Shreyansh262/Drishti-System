# Drishti — Admin Panel

The admin Next.js app. Reads/writes the **same MongoDB database** as the client app
and provides:

- **`/dashboard`** — ticket / complaint / feedback overview counts.
- **`/tickets`** — list, inspect, and update ticket status / priority / response
  (`GET` + `PUT /api/tickets`).
- **`/complaints`, `/feedback`** — review submissions.
- **`/history`** — look up a vehicle's combined incident + sensor history.

## Setup

```bash
cp .env.example .env.local     # same MONGODB_URI + MONGODB_DB as the client app
npm install
npm run dev -- -p 3001
```

See the [root README](../README.md) for the full architecture.
