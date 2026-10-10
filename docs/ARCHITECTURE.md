# Gym Access (DEV)

Hostinger VPS hosts the web application and secure API. Supabase CST-DEV holds an isolated `gym_access` schema. A Windows Node.js LAN connector will read Solution X904 events and submit them via authenticated API after read-only protocol validation.

## Security gates
- Do not expose biometric templates, Comm Key, service-role keys or device IP to public clients.
- Never expose an ingest endpoint without device authentication and idempotency.
- Use server-side DB credentials only, RLS policies before production, separate PROD storage.
- Validate X904 protocol with read-only operations before enabling ingestion.

## Status
Prototype HTTP landing page only. Device synchronization, authenticated admin, reports, and production deployment are NOT implemented.