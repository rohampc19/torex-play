# TOREX PLAY — Architecture Roadmap

## Target

The project is being moved from a single-file local server into a maintainable product architecture without breaking the current UI/API contract.

## Layers

```text
Browser UI
  ↓
API client / feature modules
  ↓
HTTP routing
  ↓
Authentication + authorization
  ↓
Validation / domain services
  ↓
Repository / data access layer
  ↓
Database
```

## Current → target migration

| Area | Current | Target |
|---|---|---|
| HTTP server | large `server.js` | small bootstrap + routers |
| Storage | JSON file | SQLite for local/dev, PostgreSQL-ready repository layer |
| Auth | bearer sessions | dedicated auth service + secure session storage |
| Chat | 5-second polling | WebSocket/SSE transport with fallback |
| Validation | mixed inline checks | shared validators |
| Tests | almost none | Node test runner + API/domain tests |
| Configuration | hardcoded values | environment configuration |
| Frontend | multiple page-specific styles | design tokens + shared components |
| Deployment | local-first | reproducible production configuration |

## Non-negotiable rules

1. Do not store secrets in source code.
2. Never expose password hashes, phone numbers, session tokens, or admin secrets to the browser.
3. Validate input on the server even if the browser validates it too.
4. Keep the public API stable while internal modules are refactored.
5. Database writes must be atomic and recoverable.
6. Every important domain rule gets a test.
7. UI changes must remain responsive on mobile.

## Database plan

The JSON store is treated as a compatibility layer during migration. The next storage step is a repository interface so routes do not know whether data is stored in JSON or SQLite.

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
