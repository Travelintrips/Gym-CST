# Almano Connector — safe preparation

This folder contains an offline-tested event adapter and queue, **not yet a compatible X904 protocol driver**. There is no remote desktop agent, inbound HTTP server, or Windows service installer.

## Test without touching the attendance machine
Install Node.js 22+ on the computer used for development and run:

```powershell
npm run check
npm test
npm run connector:dry-run
```

The dry run uses a synthetic attendance record and an in-memory sender. It **never** opens a device connection, contacts the Gym API, or sends WhatsApp messages.

## Device integration prerequisites
1. Confirm that TCP 192.168.100.185:4370 is reachable (observed from Almano).
2. Determine X904 firmware protocol compatibility using read-only commands. TCP connectivity alone does not prove compatibility.
3. Identify the device's stable record ID, timestamps, person identifiers and verified check-in/out mapping. Never guess check-in/out from unrecognized status codes.
4. Add a dedicated read-only collector implementation. No enrollment, clear logs, delete, config modification, or biometric template operations.
5. Verify no inbound listener and no remote-control capability. Run as a dedicated non-admin Windows account, protect API key and event queue via NTFS ACL.
6. Run explicit tests of offline replay, duplicate prevention, acknowledgement, event persistence and recovery before production.

Do **not** run `connector/probe.js` against a live device until its exact commands and compatibility are reviewed and authorized. No device changes or installations have been made as part of this repository update.
