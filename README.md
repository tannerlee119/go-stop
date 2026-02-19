# Go-Stop (고스톱) — Online Card Game

A real-time online multiplayer implementation of the classic Korean flower card game **Go-Stop** (고스톱), playable with 1–4 players.

## Features

- **1–4 players** — solo (vs bot) or multiplayer
- **Real-time gameplay** via WebSocket (Socket.io)
- **Server-authoritative** — all game logic validated server-side
- **Beautiful UI** — Korean-themed card design with animations
- **Full Go-Stop rules** — brights, animals, ribbons, junk, godori, hong-dan, cheong-dan, cho-dan, ppuk, chok, ttadak, sseul, bombs, heundeum, Go/Stop decisions, nagari, payment multipliers

## Tech Stack

| Layer       | Technology                                |
|-------------|-------------------------------------------|
| Frontend    | Next.js 16, React 19, Tailwind CSS 4, Framer Motion |
| Real-time   | Socket.io 4                               |
| Game Server | Node.js, Express, Socket.io               |
| Language    | TypeScript (end-to-end)                   |
| Monorepo    | pnpm workspaces                           |

## Project Structure

```
go-stop/
├── packages/
│   ├── shared/     # Game logic, types, card definitions, scoring
│   ├── server/     # WebSocket game server (Express + Socket.io)
│   └── web/        # Next.js frontend
├── pnpm-workspace.yaml
└── render.yaml     # Render deployment config
```

## Getting Started

### Prerequisites

- Node.js ≥ 18
- pnpm ≥ 9

### Install

```bash
pnpm install
```

### Development

Run everything in parallel:

```bash
pnpm dev
```

Or run individually:

```bash
# Terminal 1 — Shared (watch mode)
pnpm dev:shared

# Terminal 2 — Game server
pnpm dev:server

# Terminal 3 — Web client
pnpm dev:web
```

The web client runs at `http://localhost:3000` and the game server at `http://localhost:3001`.

### Build

```bash
pnpm build
```

## Deployment

### Web Client → Vercel (Free)

1. Import the repository on [Vercel](https://vercel.com)
2. Set root directory to `packages/web`
3. Add environment variable: `NEXT_PUBLIC_SERVER_URL` = your server URL

### Game Server → Render (Free)

1. Create a new Web Service on [Render](https://render.com)
2. Connect your repository
3. The `render.yaml` will auto-configure the service
4. Add environment variable: `CLIENT_URL` = your Vercel URL

## Game Rules

Go-Stop uses a 48-card hwatu (花札) deck. Players capture cards from a central layout by matching months. Points come from collecting sets of bright, animal, ribbon, and junk cards. When your score reaches the target, you choose to **Go** (risk for more) or **Stop** (claim your winnings).

For full rules, see [pagat.com/fishing/gostop.html](https://www.pagat.com/fishing/gostop.html).
