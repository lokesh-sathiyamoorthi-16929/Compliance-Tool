# Log360 API Integration

> **Architecture:** The browser never calls Log360 directly.  
> All Log360 traffic is routed through the `Compliance-Tool-API` backend proxy.  
> The Log360 auth token is stored server-side (AES-GCM encrypted) and never sent to the browser.

---

## Architecture Overview

```
┌─────────────┐        ┌────────────────────────┐        ┌───────────────┐
│   Browser   │        │  Compliance-Tool-API   │        │    Log360     │
│ (React SPA) │        │  (Node.js backend)     │        │  (SIEM)       │
└──────┬──────┘        └───────────┬────────────┘        └───────┬───────┘
       │                           │                             │
       │  1. POST /auth/login      │                             │
       │ ─────────────────────────>│                             │
       │  ← ComplianceIQ JWT       │                             │
       │                           │                             │
       │  2. PUT /integrations/    │                             │
       │     log360/credentials    │                             │
       │     {baseUrl, authToken}  │                             │
       │ ─────────────────────────>│                             │
       │                           │  stores encrypted token     │
       │  ← {configured: true}     │                             │
       │                           │                             │
       │  3. GET /integrations/    │                             │
       │     log360/health         │                             │
       │ ─────────────────────────>│                             │
       │                           │  GET /api/v2/meta/log-fields│
       │                           │ ───────────────────────────>│
       │                           │  ← {ok: true, latency: 42} │
       │  ← {configured:true,      │                             │
       │      ok:true,latencyMs:42}│                             │
       │                           │                             │
       │  4. GET /integrations/    │                             │
       │     log360/proxy/api/v2/  │                             │
       │     log-sources           │                             │
       │ ─────────────────────────>│                             │
       │                           │  GET /api/v2/log-sources    │
       │                           │  Authorization: Bearer <tok>│
       │                           │ ───────────────────────────>│
       │                           │  ← log source list          │
       │  ← log source list        │                             │
       │                           │                             │
```

---

## Frontend API Calls

### Credentials Management

The Connections page (`src/pages/ConnectionsPage.tsx`) uses `log360CredentialsApi` from `src/api/integrations.ts`:

| Action | Method | Path |
|--------|--------|------|
| Load status | `GET` | `/integrations/log360/credentials` |
| Save token | `PUT` | `/integrations/log360/credentials` body: `{baseUrl, authToken}` |
| Remove | `DELETE` | `/integrations/log360/credentials` |
| Health check | `GET` | `/integrations/log360/health` |

All requests include the ComplianceIQ JWT in `Authorization: Bearer <jwt>` (injected automatically by `apiRequest`).

### Data Proxy

`Log360Client` (in `src/services/log360Client.ts`) proxies all Log360 v2 calls through the backend:

```
Browser path:  /integrations/log360/proxy/api/v2/<path>
Log360 path:   /api/v2/<path>   (as seen by Log360)
```

The ComplianceIQ JWT is attached by `apiRequest`. The Log360 auth token is attached server-side by the proxy.

---

## Log360 Score Inputs (No Placeholder Metrics)

ComplianceIQ measures four Log360 API-backed signals only:

| Metric | Source endpoint | Weight |
|--------|------------------|--------|
| Health | `GET /api/v2/meta/log-fields` | `0.25` |
| Coverage | `GET /api/v2/log-sources` | `0.25` |
| Detection | `POST /api/v2/alerts` | `0.25` |
| Response | `GET /api/v2/alerts/profile` | `0.25` |

Retention and archive settings are not exposed by the public Log360 v2 API and are therefore not measured.

---

## Error Codes

| Backend error code | HTTP status | User-facing message | `Log360ErrorKind` |
|--------------------|-------------|---------------------|-------------------|
| `LOG360_NOT_CONFIGURED` | 409 | "No Log360 connection saved. Configure it on the Connections page." | `NOT_CONFIGURED` |
| `LOG360_UNREACHABLE` | 502 | "Backend could not reach Log360 server (network error)." | `NETWORK_ERROR` |
| `LOG360_TIMEOUT` | 504 | "Log360 did not respond within 30 seconds." | `TIMEOUT` |
| `LOG360_INVALID_PATH` | 400 | Developer error (logged, not surfaced in prod) | `BAD_REQUEST` |
| `UNAUTHORIZED` | 401 | "Your ComplianceIQ session expired. Please log in again." | `UNAUTHORIZED` |

---

## Security Properties

- **Token never in browser storage.** No `localStorage`, `sessionStorage`, IndexedDB, or in-memory cache beyond the form submit callback.
- **One-shot migration.** On app start (`App.tsx`), `localStorage.removeItem('complianceiq-log360-connection')` wipes any token that was stored by older versions of the app.
- **Token masked in UI.** After save, the Connections page shows `••••• (stored on server)` with a "Replace token" button. The actual token is never re-rendered.
- **Server-side encryption.** The backend stores the token using AES-GCM (see `Compliance-Tool-API#6`).
- **No CORS.** The browser only talks to `localhost:3001` (or your deployed backend). Log360 is never contacted from the browser.

---

## Local Development Setup

1. Start the backend: `npm run dev` in `Compliance-Tool-API` (port 3001)
2. Copy `.env.example` to `.env` in this repo (contains `VITE_API_BASE_URL=http://localhost:3001`)
3. Start the frontend: `npm run dev` (port 5173)
4. Log in as `admin`, navigate to Connections, enter Log360 URL + token, click Save
5. Click "Test Connection" to verify the backend can reach Log360

---

*Cross-references: `Compliance-Tool-API#6` (backend proxy implementation)*
