# byv-code Web

Web version of Claude Code — browser-native UI that mirrors the desktop CLI.

## Scope

Internal subscribers and 3P (Bedrock/Vertex/Foundry) providers only. 1P (direct Anthropic API) is **not** in scope for the web version.

## Architecture

```
web/
├── backend/          # Bun HTTP server (API proxy + auth bridge)
│   ├── server.ts     # Bun.serve() with 4 endpoints
│   └── tsconfig.json # Path aliases to ../../src/*
├── frontend/         # Next.js 15 App Router + React 19 + Tailwind CSS
│   ├── app/          # App Router routes
│   ├── components/   # React components
│   ├── hooks/        # Custom hooks (useAuth)
│   ├── next.config.mjs
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   └── package.json
└── README.md         # This file
```

### Backend

Bun HTTP server at `web/backend/server.ts` acts as an API proxy:

| Endpoint              | Method | Description                                    |
|-----------------------|--------|------------------------------------------------|
| `/api/auth/status`    | GET    | Auth + subscription info (3P + internal only)  |
| `/api/models`         | GET    | Model catalog with capability flags            |
| `/api/chat`           | POST   | SSE streaming — proxies to Anthropic API       |
| `/health`             | GET    | Health check                                   |

The backend imports auth/model utilities directly from `../../src/` via TypeScript path aliases.

### Frontend

Next.js App Router frontend at `web/frontend/`. It communicates with the backend via:

- API calls (GET `/api/models`, GET `/api/auth/status`) — JSON over HTTP
- SSE streaming (POST `/api/chat`) — Server-Sent Events for streaming responses

In dev mode, Next.js proxies `/api/*` to `localhost:5000` (backend).

## Setup

### Prerequisites

- Bun 1.3+
- Node.js 20+ (for Next.js dev server)
- Claude Code auth configured (`~/.claude/` + OS keychain)

### Backend

```bash
cd web/backend
bun web/backend/server.ts
# Server: http://localhost:5000
```

### Frontend

```bash
cd web/frontend
bun install
bun dev
# App: http://localhost:3000
# (proxies /api/* → localhost:5000 automatically)
```

### Run both (dev)

```bash
# Terminal 1 — backend
bun web/backend/server.ts

# Terminal 2 — frontend
cd web/frontend && bun dev
```

Open `http://localhost:3000` — the app will check auth status, load the model catalog, and enable chat.

## Environment Variables

| Variable          | Default                  | Description                        |
|-------------------|--------------------------|------------------------------------|
| `PORT`            | `5000`                   | Backend server port                |
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000` | Frontend → backend proxy target    |

## Auth Model

Web app shares auth state with the CLI:
- Reads API token from `~/.claude/.credentials.json`
- Reads subscription type/provider from CLI settings
- `isInternalSubscriber()` detects internal subscription tier
- `getAPIProvider()` detects Bedrock/Vertex/Foundry provider

The web UI is only shown to users with `inScope: true` (internal subscribers or 3P providers).

## Fase A Status

| Feature              | Status  |
|----------------------|---------|
| Backend scaffold     | ✅ Done |
| Frontend scaffold    | ✅ Done |
| Health check         | ✅ Done |
| Auth status          | ✅ Done |
| Model catalog        | ✅ Done |
| Chat (SSE streaming) | ✅ Done (placeholder) |
| Thinking toggle      | ✅ Done (UI only) |
| Effort selector      | ✅ Done (UI only) |
| Claude web UI style  | ✅ Partial (Tailwind + dark mode) |

## Fase B–E (Planned)

- **Fase B**: Thinking status display (progress only, not raw reasoning)
- **Fase C**: Artifacts — HTML/kode/document render in iframe sandbox
- **Fase D**: Web search + citations toggle
- **Fase E**: MCP + skills + plugin integration (per-chat enable/disable)

## Known Issues

- `resolveAntModel` is not defined in `src/utils/thinking.ts` and `src/utils/effort.ts` (missing import in CLI codebase). The backend wraps calls in try/catch with fallback to `false`.
- Chat SSE currently returns a placeholder response. Full integration with `getAnthropicClient()` is planned for the complete implementation.
