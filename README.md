# MedhaX

A real-time 1v1 multiplayer coding quiz game with a battleship-style twist. Two players go head-to-head answering programming questions — whoever answers correctly first gets to "dig" into the opponent's hidden grid. Sink all their shapes and you win.

Built as a full-stack TypeScript monorepo with a web client (React + Vite), a mobile client (React Native + Expo), and a Node.js/Express backend tied together with Socket.IO for real-time communication.

## How it works

1. **Lobby** — Create or join a match room. Pick a programming language (Python, JavaScript, Java, C++, etc.), select topics, and choose a match scale (10 / 20 / 30 questions with corresponding grid sizes 5×5 / 6×6 / 7×7).
2. **Placement Phase** — The server randomly generates a fixed set of shapes for each player based on the match scale: 10 questions → 2 shapes covering 6 cells, 20 questions → 3 shapes covering 14 cells, 30 questions → 4 shapes covering 25 cells. Each player has 90 seconds to place these pieces onto their grid. Think Tetris pieces on a battleship board.
3. **Question Rounds** — An MCQ coding question appears for both players simultaneously with a 45-second timer. The first player to answer correctly wins the round.
4. **Dig Turn** — The round winner picks a cell on the opponent's grid. Hit a shape cell? Score bonus points. Miss? Tough luck.
5. **Game Over** — Match ends when all of a player's shapes are uncovered, all questions are exhausted, or someone forfeits/disconnects.

There's also a built-in anti-cheat system — switch tabs 3 times during a match and you get auto-disqualified.

## Project structure

```
MedhaX/
├── backend/          # Express + Socket.IO server
│   ├── src/
│   │   ├── config/   # env vars, Supabase client, Gemini key rotation
│   │   ├── data/     # question bank + seeding logic
│   │   ├── game/     # match state machine, shape catalog & placement
│   │   ├── routes/   # REST endpoints (auth, matches, friends)
│   │   └── sockets/  # Socket.IO event handlers for match flow
│   ├── migrations/   # Postgres schema (users, friendships, matches, questions)
│   └── Dockerfile    # multi-stage build for Fly.io deployment
│
├── web/              # React (Vite) web client
│   └── src/
│       ├── pages/    # Landing, Login, Signup, Dashboard, Friends,
│       │             # Lobby, Placement, Game, Results
│       ├── components/
│       ├── services/ # Axios API client + Socket.IO wrapper
│       └── store/    # Zustand stores (auth, game state)
│
├── frontend/         # React Native (Expo) mobile client
│   └── src/
│       ├── screens/  # Home, Login, Signup, Friends, Lobby,
│       │             # ShapePlacement, Game, Result, ChallengeSetup
│       ├── components/
│       ├── services/
│       ├── store/
│       └── hooks/
│
└── testsprite_tests/ # automated test configs
```

## Tech stack

| Layer | Stack |
|---|---|
| **Backend** | Node.js, Express 5, Socket.IO, TypeScript, JWT auth |
| **Database** | PostgreSQL via [Supabase](https://supabase.com) (BaaS) |
| **AI Hints** | Google Gemini 2.5 Flash (with rotating API key pool) |
| **Web Client** | React 19, Vite, React Router, Zustand, Three.js |
| **Mobile Client** | React Native 0.81, Expo SDK 54, NativeWind, React Navigation |
| **Deployment** | Backend on Fly.io (Docker), Web on Vercel |

## Getting started

### Prerequisites

- Node.js v18+
- npm
- A PostgreSQL database (or a [Supabase](https://supabase.com) project)
- Gemini API key(s) for the hint feature (optional but recommended)

### Backend

```bash
cd backend
npm install

# create a .env file with:
#   JWT_SECRET=your_jwt_secret
#   SUPABASE_URL=https://llerufiektzdfelaovzj.supabase.co
#   SUPABASE_ANON_KEY=your_anon_key
#   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
#   GEMINI_API_KEYS=key1,key2,key3   (comma-separated, rotated automatically)
#   PORT=8080

npm run dev
```

The server starts at `http://localhost:8080`. It auto-seeds the questions table on first boot if it's empty.

### Web client

```bash
cd web
npm install
npm run dev
```

Opens at `http://localhost:5173` by default (Vite).

### Mobile client

```bash
cd frontend
npm install
npm start
```

Scan the QR code with Expo Go on your phone, or launch an emulator.

## Database schema

The backend expects these Postgres tables (see `backend/migrations/` for the full SQL):

- **users** — extends Supabase auth; stores handle, avatar, email hash
- **user_stats** — wins, losses, ties, MMR (starts at 1200), streak tracking
- **friendships** — friend requests with pending/accepted/blocked status
- **matches** — match metadata (language, topics, grid size, winner, timestamps)
- **match_players** — per-player scores and response stats for each match
- **questions** — MCQ question bank with language, topic, difficulty, choices, correct index, explanation

## REST API endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/api/auth/signup` | Register a new account |
| POST | `/api/auth/login` | Log in and get a JWT |
| GET | `/api/users` | Search/list users |
| POST | `/api/friends/request` | Send a friend request |
| PATCH | `/api/friends/:id` | Accept/decline a friend request |
| GET | `/api/matches/history` | Get match history for a user |

## Socket.IO events

The real-time game flow is entirely driven through Socket.IO. Key events:

**Client → Server:**
- `lobby.join` — join/create a match room
- `lobby.ready` — mark yourself as ready
- `lobby.update_config` — change match settings
- `placement.lock` — submit your shape layout
- `answer.submit` — submit an MCQ answer
- `dig.submit` — pick a cell to attack on the opponent's grid
- `hint.request` — request a Gemini-powered hint
- `challenge.send` / `challenge.decline` — friend challenge system
- `match.forfeit` — forfeit the current match

**Server → Client:**
- `lobby.update` — lobby state sync
- `placement.start` / `placement.locked` — placement phase events
- `question.start` — new question with timer
- `answer.result` — round outcome + score update
- `dig.turn` / `dig.result` — dig phase events (hit/miss)
- `match.end` — final results (winner, scores, reason)
- `challenge.received` / `challenge.declined` — challenge notifications
- `friend.status` — online/offline status updates
- `presence.update` — reconnect/disconnect notifications

## Deployment

**Backend** is containerized and deployed to [Fly.io](https://fly.io). The `Dockerfile` does a two-stage build (compile TS → slim production image on `node:20-alpine`).

**Web client** is deployed to [Vercel](https://vercel.com) with security headers configured in `vercel.json` (CSP, HSTS, X-Frame-Options, etc.) and SPA rewrites.

## Environment variables

### Backend (`.env`)

| Variable | Description |
|---|---|
| `JWT_SECRET` | Secret for signing JWTs |
| `SUPABASE_URL` | Supabase project API URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service/admin key |
| `GEMINI_API_KEYS` | Comma-separated Gemini API keys |
| `PORT` | Server port (default: 8080) |

### Web client (`.env.local`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend REST API base URL |
| `VITE_SOCKET_URL` | Backend WebSocket URL |

### Mobile client (`.env`)

| Variable | Description |
|---|---|
| `API_BASE_URL` | Backend REST API URL |
| `SOCKET_URL` | Backend WebSocket URL |

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/your-thing`)
3. Commit your changes
4. Push and open a PR

Keep PRs focused — one feature or fix per PR.

## License

This project doesn't have a license yet. If you'd like to use it, reach out to the maintainers.
