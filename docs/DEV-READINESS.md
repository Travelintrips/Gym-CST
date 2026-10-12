# Gym CST — GitHub DEV readiness

## Scope
This repository contains an attendance web app and a **protocol-independent** preparation layer for Solution X904. No hardware is contacted by CI. This branch does not deploy to a server.

## End-to-end contract
1. A read-only LAN probe checks whether the physical X904 speaks a compatible protocol. It must not enroll, clear logs, modify settings or retrieve biometric templates.
2. A future LAN polling agent reads record identifiers from the machine and persists its cursor and retry queue locally. Do not advance the cursor until the Gym API has acknowledged the event.
3. `normalizeX904Attendance()` converts a device event to `{code,eventId,mode}`. Its record ID must be stable across polling/restarts. Unknown attendance direction must be quarantined, never guessed.
4. `submitX904Event()` authenticates to `POST /api/device-event` using a server-only X-Device-Key. Do not pass secrets to a browser.
5. The Gym API deduplicates device `eventId` and creates a visit. It queues one WhatsApp notification for a check-in.
6. `wa-outbox.js` posts via the CST WA Gateway `POST /v1/messages`, with `to` set to the configured group JID and a stable idempotency key. Accepted by gateway does **not** mean delivered to WhatsApp. Delivery receipts and reconciliation remain a future integration gate.

## Notification configuration (future deployment only)
```
GYM_WA_ENABLED=false
GYM_WA_GATEWAY_URL=
GYM_WA_GATEWAY_TOKEN=
GYM_WA_GROUP_ID=
GYM_WA_DEVICE_ID=
GYM_DEVICE_API_KEY=
```
Do not commit actual credentials or group identifiers. Use a dedicated Gym client with minimal `messages:send` scope, dedicated device routing and test group before production. Messages contain member name and check-in time in Asia/Jakarta; no biometric data.

## GitHub verification
```
npm run check
npm test
```
Tests cover application smoke flows, WhatsApp retry/deduplication/WIB formatting, and device event normalization/authenticated submission.

## Remaining gates before real X904 integration
- Verify exact X904 firmware, supported library/protocol, device ID and stable record fields.
- Decide how device attendance codes map to Gym member codes, and how to resolve missing/expired members.
- Implement cursor persistence and retry queue on the LAN agent.
- Validate check-in/check-out classification from real sample events, including restart, duplicate, clock drift and offline sync.
- Test the delivery lifecycle of Gateway group notifications. Do not infer success from HTTP 202.
- Prove CI green before promoting DEV changes; protect PROD and its database.

## Operator readiness and release checklist
- GET /api/notifications is authenticated and returns queue counts plus the 50 newest message records. This shows accepted/failed/pending *gateway requests*, not confirmed handset delivery.
- Never expose this endpoint or member identity to the public dashboard.
- Before enabling real WhatsApp: define message retention, message destination authorization, accepted-to-delivered reconciliation, group opt-in/privacy notice, and redaction policies.
- Before enabling X904: verify member device-code mapping, repeat-event behavior, timestamp integrity and local queue durability.
- CI is a mandatory gate. A green local test does not replace GitHub Actions. If Actions fails without log/steps, investigate repository Actions permissions, runner availability, limits and security settings before classifying the code as passing.
- Keep database backups/migrations and upgrade/rollback procedures separate from the choice of VPS/DNS/hosting; no deployment implied by this document.
