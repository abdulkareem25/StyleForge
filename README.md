# StyleForge

Your Wardrobe, Made Smarter — an AI-powered wardrobe assistant for men.

## Tech Stack

- **Frontend:** React (Vite) + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** MongoDB (Atlas)
- **AI Tagging:** Google Gemini API
- **Image Storage:** ImageKit
- **Email:** Brevo

## Getting Started

### Prerequisites

- Node.js >= 18
- MongoDB Atlas account (or local MongoDB)
- ImageKit account
- Google AI Studio API key
- Brevo account

### 1. Clone and install dependencies

```bash
git clone <repo-url> styleforge
cd styleforge

# Server
cd server
cp .env.example .env    # Fill in your values
npm install

# Client (new terminal)
cd client
cp .env.example .env    # Fill in your values
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` in both `server/` and `client/`, then fill in:

**Server** (`server/.env`):
- `MONGODB_URI` — MongoDB Atlas connection string
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — random strings for signing JWTs
- `GEMINI_API_KEY` — Google AI Studio API key
- `IMAGEKIT_*` — ImageKit credentials
- `BREVO_*` — Brevo API key and sender email
- `CLIENT_URL` — frontend URL (default: `http://localhost:5173`)

**Client** (`client/.env`):
- `VITE_API_BASE_URL` — backend API URL (default: `http://localhost:5000/api/v1`)
- `VITE_IMAGEKIT_URL_ENDPOINT` — ImageKit URL endpoint

### 3. Run locally

```bash
# Terminal 1 — Server
cd server
npm run dev

# Terminal 2 — Client
cd client
npm run dev
```

The client runs on `http://localhost:5173` and proxies API requests to the server on `http://localhost:5000`.

### 4. Verify

- Server health check: `http://localhost:5000/api/v1/health`
- Client: `http://localhost:5173` — Dashboard shows server connection status

## Linting

```bash
# Client (oxlint)
cd client && npm run lint

# Server (ESLint)
cd server && npm run lint
```

## Deployment

### Hosting Split

| Service | Platform | URL |
|---------|----------|-----|
| Backend API | Render Web Service | `https://styleforge-api.onrender.com` |
| Frontend | Render Static Site | `https://styleforge-client.onrender.com` |

Both are configured via `render.yaml` (Render Blueprint).

### Deploy to Render

1. Push to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com) → New → Blueprint
3. Connect the repo — Render reads `render.yaml` and creates both services
4. After frontend deploys, set `CLIENT_URL` on the backend service to the frontend URL (e.g., `https://styleforge-client.onrender.com`)
5. Set all `sync: false` env vars on the backend service (secrets from `.env`)

### Render Free Tier

The backend runs on Render's free tier. Free web services spin down after **15 minutes** of inactivity and take **30–60 seconds** to cold-start on the next request. This is fine for development and demos where you're the one clicking. A real first-time visitor hitting a cold instance will see a stalled loading screen for up to a minute.

**Decision:** For MVP/demo purposes, the free tier is acceptable. Before sharing with real users, we will evaluate either a paid instance ($7/mo) or a scheduled keep-alive ping (cron job hitting the health endpoint every 10 minutes) to prevent spin-down.

## CI

GitHub Actions runs lint on every PR and push to `main`:

- **Client:** `oxlint` (configured in `client/.oxlintrc.json`)
- **Server:** `eslint` (configured in `server/eslint.config.js`)

Workflow: `.github/workflows/ci.yml`

## Project Structure

```
styleforge/
├── client/          # React + Vite frontend
│   ├── src/
│   │   ├── assets/
│   │   ├── components/{ui,wardrobe,outfits,layout}/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── context/
│   │   ├── constants/
│   │   └── utils/
│   └── .env.example
│
├── server/          # Node/Express backend
│   ├── src/
│   │   ├── config/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── utils/
│   │   ├── constants/
│   │   ├── validators/
│   │   ├── app.js
│   │   └── server.js
│   ├── eslint.config.js
│   └── .env.example
│
├── .github/workflows/ci.yml   # CI: lint on PR
├── render.yaml                 # Render Blueprint (deployment)
├── .gitignore
└── README.md
```
