# Solution X904 Gym — restricted ADMS intake (staging)

Status: **implemented in source, OFF by default; no hardware pairing validated.**

## Scope
- X904 is an existing **Gym door controller**. Keep all locally stored fingerprints, face templates, cards, admin accounts, door rules and offline access **unchanged**.
- ADMS attendance logs are observations, **not authorizations to unlock/lock**. Never send `DATA UPDATE`, `DELETE`, `REBOOT`, `CLEAR LOG` or enrollment/permission commands.
- Do not conflate Gym cardholders or historical X904 users with SC active members. No automatic member matching until a reviewed ID map is in place.
- Do not use employee attendance functionality.
- The web dashboard currently displays Sport Center's own manual check-ins; it does **not** yet read these isolated ADMS records.

## Technical intake
- Isolated Gym-CST backend has `GET /iclock/cdata?SN=<registered serial>` handshake and `POST /iclock/cdata?SN=<registered serial>&table=ATTLOG`.
- Inbound ADMS requests are disabled by default (`GYM_ADMS_ENABLED` must equal `true`).
- Additionally, the request MUST contain an `X-Gym-Ingress-Key` matching a randomly generated **32+ character** `GYM_ADMS_INGRESS_KEY` and serial must equal `GYM_ADMS_SERIAL`.
- The fingerprint device should **never** hold this secret or use this direct exposed endpoint. Put a **private, verified device-authenticating ingress gateway / VPN** in front of this API. Strip all inbound user-provided `X-Gym-Ingress-Key` headers and only inject this secret after authenticating the actual hardware. Restrict the backend path to the trusted ingress network. Don't use a publicly accessible Hostinger Node URL for the ADMS device.
- POST only allows attendance table ATTLOG. Data payload max 64 KiB/500 records. Invalid records reject the entire batch. Event SHA-256 de-duplicates retries; records stored in isolated SQLite table `adms_attendance` with raw device user PIN, timestamp, status and verification type (not any fingerprint/face template).
- Body and user PIN are never printed in runtime logs. Acknowledgment is returned only after the batch is committed.
- Do not infer an "unlock succeeded" or "member checked in" from a raw status code before real X904 protocol validation.
- Existing `/api/device-event` is separate and must not be used as the ADMS ingress.

## Before activating
1. Backup and verify 1,412 historical presence logs, cardholders, and biometric enrollments **without exporting biometric templates to SC**.
2. Confirm exact X904 firmware wire format, push handshake, status/verify code semantics, time-zone and time drift using **staging equipment capture** or vendor documentation.
3. Verify an authenticated private ingress can reach Gym-CST and that unauthorized traffic, commands, other tables, malformed batches and device serials are rejected.
4. Use a staging instance and test read-only ATTLOG, duplicate uploads, reconnect and internet outage recovery. Confirm physical door can still open offline.
5. Verify data retention and access controls for visitor log history. Limit operator permissions.
6. Only after all tests are green: enable the gated receiver, point X904 to the **validated** private ingress endpoint, and verify attendance records in the isolated database.
7. Review and separately implement a read-only SC admin API for device logs once mapping and permission checks are validated. Do not switch SC dashboard source without this.

Never change the X904 server address (`solutioncloud.co.id`) as part of repository deployment. The current domain setting is a device configuration, not evidence of an active cloud subscription.
