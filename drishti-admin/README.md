# Drishti — Admin Panel

The administrative Next.js application. It reads from and writes to the **same MongoDB
database** as the client app, providing back-office tools for support and oversight.

## Features

| Route                     | Description                                                            |
| ------------------------- | --------------------------------------------------------------------- |
| `/dashboard`              | Overview counts for tickets, complaints, and feedback.                |
| `/tickets`                | List, inspect, and update ticket status, priority, and admin response. |
| `/complaints`, `/feedback`| Review user-submitted complaints and feedback.                        |
| `/history`                | Look up a vehicle's combined incident and sensor history.            |

Tickets are managed through `GET` and `PUT /api/tickets`.

## Prerequisites

- Node.js 18 or later
- Access to the same MongoDB database used by the client app

## Setup

```bash
cp .env.example .env.local     # use the same MONGODB_URI and MONGODB_DB as the client app
npm install
npm run dev -- -p 3001         # http://localhost:3001
```

## Environment Variables

| Variable      | Description                     |
| ------------- | ------------------------------- |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `MONGODB_DB`  | Database name                   |

> **Note:** `MONGODB_URI` must include the user credentials in the form
> `mongodb+srv://<user>:<password>@<cluster>...`. A missing colon between user and
> password results in an `Authentication failed` error.

See the [root README](../README.md) for the full system architecture.
