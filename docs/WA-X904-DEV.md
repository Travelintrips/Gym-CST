# Gym CST — X904 + WhatsApp group (DEV)

The application stores accepted check-ins in SQLite and queues **one** group notification per visit. WhatsApp is not called synchronously during check-in. Gateway acceptance is **not** proof that a message reached the group.

## Notification settings (server environment, never in Git)
- `GYM_WA_ENABLED=true` (off by default)
- `GYM_WA_GATEWAY_URL` (base URL of CST WA Gateway)
- `GYM_WA_GATEWAY_TOKEN` (client token with messages:send scope, stored in secrets)
- `GYM_WA_GROUP_ID` (approved group JID, e.g. ...@g.us)
- `GYM_WA_DEVICE_ID` (the authorized sending device, optional when assigned by client)

Each check-in is queued even when WA is disabled. Pending items retry with exponential backoff when enabled. Gateway response is marked `accepted`, not `delivered`. Check delivery separately through the gateway message lifecycle.

The event ingest API requires `GYM_DEVICE_API_KEY` and a stable `eventId` on `POST /api/device-event` with `{code,eventId,mode:"checkin"|"checkout"}`. The X904 machine's on-LAN format must be validated read-only **before** building an adapter; the `connector/probe.js` is only a protocol experiment. Do not send biometric templates or secrets.

DEV must have its own database, client credential, and testing group; do not point it at production member data or a real operational group. Existing deployment remains unchanged until test and promotion approval.
