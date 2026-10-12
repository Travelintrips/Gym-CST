# Gym CST — Release Acceptance Matrix

This is a **release gate**, not a claim that the product is complete.

| Area | Current evidence | Required to release |
|---|---|---|
| GitHub dev CI | GitHub Actions syntax, smoke and unit tests have passed | Latest release commit must pass both workflows |
| Gym member/check-in/report API | Simulated smoke tests pass | Operator UAT and permissions review |
| X904 LAN connectivity | Almano reached 192.168.100.185:4370; library opened a socket | Verify device-specific log protocol and safe read-only hardware retrieval |
| X904 attendance mapping | Explicit mapping and quarantine tests pass offline | Verify real event IDs, timestamp semantics, status and checkout behavior |
| Queue/replay | Offline, restart, acknowledgement and duplicate simulations pass | Crash/power-loss and prolonged outage test using real device logs |
| WhatsApp notifications | Outbox and formatting implemented but real delivery unverified | Approved gateway account, group routing, delivery receipt and retries |
| Security | No remote desktop required; API key guard exists | Secrets handling, operator permissions, abuse protection and production threat review |
| Commercial release | Responsive dashboard styling has begun | Membership plans, expiry, billing, tenant/customer isolation, audit history, backup/restore, privacy notices and support procedures |
| Hosting | Not selected, by explicit user decision | Approve target hosting, DNS, TLS, backup retention and deployment plan |

## Blockers
1. **Critical:** Device X904 real attendance records have not been read and protocol compatibility is not established. Do not enable automatic polling or run undocumented commands against the device.
2. **Critical:** No chosen web hosting or deployment authorization; the previous deleted website is not the release target.
3. **Critical:** Real WhatsApp delivery and user acceptance have not been tested.
4. **Critical:** Multi-customer data separation and licensing required before offering as SaaS.
5. **Security:** Public GitHub requires ongoing secret/history reviews; never commit attendance records or customer data.

## Deployment rules
- Keep work in dev until evidence exists for all release gates.
- Do not claim production readiness from a passing CI run alone.
- No changes to Almano PC, X904 machine, Hostinger, DNS, existing Sport Center or WhatsApp gateway without explicit scope and approval.
- Do not send repeated device protocol probes without reviewing safety of specific operations.
- Publish a release only after independent functional, recovery, security and operator acceptance tests.
