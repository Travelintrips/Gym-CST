# X904 ADMS activation safety gate

Status: NOT CONNECTED. Do not point physical X904 at the current diagnostic receiver.

Existing diagnostic receiver requires a custom HTTP header, x-gym-diagnostic-token, that the X904 firmware has not been shown capable of sending. JSON replies are not a verified ADMS handshake.

Verified: Almano local session to 192.168.100.185:4370 worked; machine menu shows ADMS and HTTPS; SC membership/check-in runs independently; diagnostic HTTP tests used only synthetic data.

Required before activation:
1. Identify actual firmware ADMS request paths, identification and authentication scheme, expected response bytes, and TLS behavior using vendor documentation or a controlled device trial.
2. Prepare dedicated HTTPS receiver with validated per-device identity, request bounds, replay/idempotency protection, minimal redacted logs, and resource isolation.
3. Preserve old Solution Cloud configuration and plan immediate rollback. Keep onsite operator at Gym to verify door access remains functional during any test.
4. Stage real ATTLOG only after compatible safe acknowledgment semantics are known. Reject unexpected USER/BIODATA/BIOPHOTO and never modify enrollment, biometrics or machine settings.
5. Map device identifiers to existing SC member IDs using read-only authenticated API. Never create duplicate member/payment/booking; require exact WIB and deduplication checks.
6. Report online only after verified device contact; report sync operational only when one genuine event is cross-checked in SC.

Current blocker: exact firmware ADMS handshake and an operator-approved controlled test. Synthetic CI passing is not sufficient. The existing diagnostic receiver is not production-ready.