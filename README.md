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
│   └── .env.example
│
├── .gitignore
└── README.md
```
