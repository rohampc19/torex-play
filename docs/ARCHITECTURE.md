# TOREX PLAY — Architecture Roadmap

## Target

TOREX PLAY is being moved from a monolithic local server toward a layered, maintainable product architecture without breaking the current UI/API contract.

## Layers

```text
Browser UI
  ↓
API client / feature modules
  ↓
HTTP transport / routing
  ↓
Authentication + authorization
  ↓
Domain services
  ↓
Repository / data access
  ↓
Database
```

## Migration status

| Area | Before | Current | Target |
|---|---|---|---|
| HTTP server | large `server.js` | compatibility monolith retained | small bootstrap + routers |
| Realtime gateway | mixed transport + lifecycle | modular transport/client/stream manager | independent realtime service |
| Storage | JSON file | JSON compatibility layer | SQLite for local/dev, PostgreSQL-ready repository |
| Auth | inline bearer sessions | existing contract preserved | dedicated auth service + secure session storage |
| Chat | 5-second polling | SSE realtime transport | WebSocket/SSE transport with horizontal fan-out |
| Validation | mixed inline checks | shared validation primitives | domain validators |
| Tests | almost none | Node test runner + CI | API/domain/integration coverage |
| Configuration | scattered environment reads | centralized `src/config.js` for new modules | typed configuration boundary |
| Frontend | page-specific styles | design tokens + shared polish | reusable UI components |
| Deployment | local-first | reproducible start scripts | production-ready process topology |

## Architecture rules

1. Keep `server.js` as a compatibility boundary until route extraction is complete.
2. New modules must not import browser/UI code.
3. Transport modules may call services/repositories, but domain code must not depend on HTTP objects.
4. Configuration is read at the boundary and passed into modules.
5. Secrets never belong in source code.
6. Database access stays behind repository interfaces.
7. Public API responses remain backward-compatible during migration.
8. Every extracted module must be syntax-checked and covered by focused tests.

## Current module boundaries

```text
src/
├─ config.js
├─ http/
│  └─ json-response.js
└─ realtime/
   ├─ stream-manager.js
   └─ upstream-client.js
```

The realtime gateway now composes these modules instead of owning all transport and stream lifecycle logic itself. This is the first concrete extraction from the server/process layer.

## Next extraction order

1. `server.js` bootstrap + static file server
2. API router registry
3. auth service and session repository
4. news/profile/follow domain services
5. chat/message service
6. JSON repository compatibility adapter
7. SQLite repository implementation
8. integration tests against the real API

## Database plan

The JSON store is a compatibility layer during migration. The repository boundary will support SQLite locally and a PostgreSQL-compatible implementation later.

Recommended entities:

- `users`
- `sessions`
- `news`
- `news_likes`
- `comments`
- `comment_likes`
- `follows`
- `friendships`
- `messages`
- `notifications`

Indexes should cover usernames, session tokens, news publication time, conversation participants, and follower relationships.

## Quality gate

Before a change is considered production-ready:

```text
npm run check
npm test
manual smoke test: register → approve → login → news → profile → follow → chat
```
