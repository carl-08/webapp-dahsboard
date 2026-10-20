# Haven Home Thesis Dashboard

Frontend prototype for **Context-Aware Household Alert System Using Audio-Triggered Facial Recognition for False-Alarm Reduction**. The app is built with React, TypeScript, and Vite. It uses collapsible sidebar groups to organize the dashboard, a central Notifications & Alerts page, users and monitoring, device status, visitors, and settings within one client-side interface.

## Prototype interactions

- Standard Mode is selected by default. Advanced Monitoring Mode is optional and off initially; the administrator/household-member role selector is only a demo control, not authentication.
- Notifications & Alerts consolidates event records and simulated notifications with All, Needs Review, High Alert, and History filters. The top-bar bell opens this same page; its badge is derived from the notification list's unread state. Event History remains available for detailed date, class, face-result, and decision searches.
- With Advanced Monitoring enabled, the Motion Events screen can simulate known-face (L1 Attention), no-face (time-only/no image), or unknown-face outcomes after a 10-second countdown. Unknown-person verification appears in Notifications & Alerts with a 60-second response window; **Safe** resolves it and **Not Safe** or timeout escalates to the L4 High Alert view in that same workflow.
- Guest passes can be added for 1–7 days. They exist only in frontend memory and do not grant door or recording access.
- Device Status separates System Health, Monitoring Mode, and System Activity Log. Component health checks are not integrated, so unavailable components are shown as Not connected or Unknown; the app does not report fabricated online telemetry. The activity log reuses sample event and in-session motion/mode-change records, not a backend system audit feed.
- Privacy Settings describes the proposed 15-day media-retention period and main-user-only download/delete policy. These are policy requirements, not frontend-enforced restrictions.
- Live View is shown as unavailable. The sample event snapshot is illustrative, not a recording. There is no recording playback feature.
- Sample events, device status, notifications, and snapshots are illustrative demo data. Acknowledgement and notification delivery integrations are not implemented; the UI labels sample response flags and simulated user choices accordingly.

## Integration status

The `backend/` directory contains a local-only FastAPI and SQLite service for device records, component-health reports, event records, monitoring-mode configuration, and household-member photo enrollment. The User Enrollment page connects to its authenticated enrollment endpoints using a development-only bearer token; uploaded JPEG/PNG photos are stored privately, and records remain pending because face processing is not implemented. Other dashboard data remains demo or unavailable, and the API does not connect to household hardware. Production user authentication and authorization, component-health probes, network probing, startup/shutdown and access audit logs, motion sensing, camera capture, facial recognition, persistent guest passes, automatic media deletion, recording access logs, SMS, physical alarms, and live telemetry are not implemented. The timed workflows demonstrate UI behavior only; secure access restrictions require backend enforcement.

Backend setup, enrollment configuration, API endpoints, and security limitations are documented in [backend/README.md](./backend/README.md). The API rejects non-loopback bind addresses and must not be exposed remotely before production authentication and secure device access are implemented.

## Development

```sh
npm install
npm run dev
```

Validate changes with:

```sh
npm run build
npm run lint
```
