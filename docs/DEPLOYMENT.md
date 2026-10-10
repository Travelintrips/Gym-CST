# Gym CST — deployment policy

## Source of truth
GitHub repository `Travelintrips/Gym-CST` is the only source of application code changes. The `dev` branch is for development; `erp` is the current production release branch. No direct edits of application source files on the Hostinger VPS.

## Required release sequence
1. Make changes on a feature branch created from `dev`.
2. Open PR to `dev`; run syntax and smoke tests.
3. Promote tested changes by PR from `dev` into `erp`.
4. Deploy the reviewed `erp` commit to Hostinger, with a backup of the current release and database.
5. Verify live health, UI, member/attendance workflows, and rollback readiness. Do not report completion without evidence.

## Production deployment
Production host: `gym.cstlogistic.co.id`. systemd service: `gym-access.service`. Keep `/var/lib/gym-access/gym.db` outside the repository. Keep secrets in the host's protected environment file; never commit credentials, device keys, or member/biometric data.

**Deployment automation is not yet enabled.** Until a secure GitHub Actions runner/deployment credential is configured, the release operator must deploy a reviewed GitHub commit and record its SHA. Do not claim automated deployment exists.

## Security and device integration
Owner login remains disabled until explicitly requested. Operator management must not be publicly writable without a verified access-control boundary. X904 connector remains experimental until tested with the physical device.

## CI blocked / release gate
GitHub Actions workflow runs on 2026-10-10 failed before any step executed (no runner assigned). Treat this as an infrastructure/permissions/billing blocker, not a successful test or a proven code failure. Do not merge to `erp` or deploy automatically until a runner completes all tests successfully. Check repository Actions settings, organization policies, runner availability and account Actions billing/usage. No credentials should be committed.
