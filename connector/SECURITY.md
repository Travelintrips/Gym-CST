# Almano X904 Connector — isolated design

## Security model
The future connector is a small outbound-only Node.js program, **not remote desktop software**. It will run as a restricted Windows account on Almano. There is no inbound HTTP listener, desktop screen sharing, arbitrary command execution, or browser/file-management endpoint. Only a dedicated local queue file is written. No biometric templates are collected.

The machine address `192.168.100.185:4370` was confirmed reachable from Almano by a user-run TCP test; this does **not** prove protocol compatibility. Do not activate a hardware poller until firmware/protocol and safe read-only commands are verified.

## Allowlist and configuration
- Device target: `192.168.100.185`, port `4370`; configure on the machine only, never use unrestricted IP discovery.
- Output: a future **HTTPS** Gym API endpoint; credentials stored in a Windows-protected environment or credential store, not GitHub.
- No contact with CST Sport Center, WA Gateway, VPS, or DNS is required to develop/test the connector.
- Local persistent events must have a stable device-scoped event ID. Connector submission uses `x-device-key`; the API deduplicates event IDs.
- The local queue retains events when an API is down. Do not discard a record until the API acknowledges it. Do not infer check-in/check-out direction from unknown machine status codes; quarantine unsupported records.
- Device communication is only permitted through an authenticated, read-only library after compatibility testing. No settings changes, enrollment, logs clearing or fingerprint extraction.

## Current GitHub components
`adapter.js`: mapping validated events and sending via authenticated HTTPS to a future Gym endpoint.
`queue.js`: crash-persistent local JSON event queue with deduplication; designed for **one** connector process.
`probe.js`: experimental read-only ZKLib compatibility check, not a confirmed X904 driver.

## Future integration gates
1. Verify X904 protocol read-only and identify stable event IDs, timestamps and member identifiers.
2. Implement an X904-specific collector and cursor; ensure cross-restart replay safety, ordering, time drift handling and diagnostics.
3. Add Windows service installer limited to a dedicated account and protect local queue plus credentials with Windows ACL.
4. Test offline/reconnect events, real device sample logs, network disruption and safe recovery.
5. Select hosting/API endpoint only later, then authorize a separate device credential and optional WA group routing.
6. Require CI success and operator acceptance tests before any live deployment.

Do not grant ChatGPT or third parties remote control of the Almano computer to operate Gym CST.
