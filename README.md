# Gym CST — Standalone Attendance (DEV)

Gym CST is being prepared as an **independent** membership and attendance application. The target hosting environment, DNS and future systems integration are **undecided**. This repository makes no assumption that Gym must be deployed on a specific VPS or attached to Sport Center.

## Included groundwork
- Node.js 22+ Gym API and browser interface
- SQLite-backed members, visits, operator authentication and reports
- Authenticated device event ingest with event ID deduplication
- Solution X904 read-only protocol probe and a protocol-independent adapter
- WhatsApp group notification outbox with Jakarta-time formatting, stable idempotency key and retry

## Run locally (no VPS required)
```bash
npm run check
npm test
PORT=3109 DATA_DIR=./data ADMIN_PASSWORD='<set secure local test password>' npm start
```
For actual deployment use secret management rather than hardcoding credentials. Do not commit databases, private keys, device Comm Keys or biometric templates.

## Configuration
See `.env.example` and `docs/DEV-READINESS.md`. Notification delivery is **disabled by default**. Only enable after target group/device and gateway credentials are verified.

## Roadmap / release gates
1. Finish operator permissions, membership rules and audit trail.
2. Build a reliable on-LAN X904 collector **after** validating the real device protocol.
3. Add durable device cursor/queue, hardware clock drift controls and unknown-member handling.
4. Verify authenticated group notification lifecycle and delivery receipts.
5. Pass GitHub CI and integration tests. Only then choose hosting/domain and deployment path.

No current GitHub code change automatically deploys or changes any live server.
