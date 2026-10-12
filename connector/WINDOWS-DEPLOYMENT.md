# Windows Almano deployment preparation (not an installer)

This document is a *future* deployment checklist, not an instruction to install remote access software. The standalone connector has no remote desktop capability.

## Requirements
- Windows 11, Node.js 22+, non-administrator dedicated local service identity.
- Connection to X904 `192.168.100.185:4370` on the local LAN.
- Only an approved HTTPS Gym API destination can receive attendance.
- A protected local directory for pending events (e.g. `C:\\ProgramData\\GymCST\\queue\\pending.json`); grant write permission only to the service identity.
- API credentials and any device Comm Key held outside source control and protected by the Windows account. Never send biometrics to the API.

## Service approach (future only)
Use Windows Task Scheduler with an explicitly authorized restricted service identity, configured to start at boot and restart on failure. Do not register or enable it until the actual protocol driver has passed a read-only device test and authenticated API tests. The background task must only run the connector entry point: it must not execute arbitrary remote commands, start PowerShell listeners, enable RDP, or open incoming ports.

## Safe integration and rollback
1. Export/backup connector state before upgrade (exclude secrets from GitHub).
2. Stop the service, install versioned connector package, validate syntax and integration tests.
3. Verify machine protocol read-only against sample logs; quarantine unsupported status codes.
4. Configure allowlisted X904 address and authenticated HTTPS endpoint.
5. Start in dry-run mode; compare counts and event identifiers without sending.
6. Enable forwarding only after explicit approval; verify API acknowledgements and group notification lifecycle.
7. Roll back by disabling the scheduled task and restoring the previous version; preserve pending events for replay.

## Do not assume protocol compatibility
TCP 4370 was reachable from Almano. That proves transport reachability only. `node-zklib` in the experimental probe is not guaranteed to support this X904 model. Until read-only firmware and record parsing are verified, there is **no live poller** and no service installation.
