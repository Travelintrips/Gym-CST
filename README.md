# Gym CST

Internal CST Sport Center gym attendance web application.

## Local development

Requires Node.js 22+.

```bash
npm test
PORT=3109 DATA_DIR=./data npm start
```

Production uses an isolated SQLite database on VPS. Never commit databases, credentials, device communication keys, or biometric templates.

## Production

`gym.cstlogistic.co.id` uses systemd service `gym-access.service` on Hostinger VPS. Current public dashboard is read-only; member mutations require authenticated access. The X904 event API is disabled unless a dedicated device key is configured.

## Roadmap

- Configure verified Owner bootstrap and operator access.
- Finish private operator interface, end-to-end browser tests and deployment pipeline.
- Verify Solution X904 protocol on the local network before enabling the device connector.