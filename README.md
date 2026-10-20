# Haven Home Thesis Dashboard

Frontend prototype for **Context-Aware Household Alert System Using Audio-Triggered Facial Recognition for False-Alarm Reduction**. The app is built with React, TypeScript, and Vite. It uses collapsible sidebar groups to organize the dashboard, a central Notifications & Alerts page, users and monitoring, device status, visitors, and settings within one client-side interface.

## Prototype interactions

- Standard Mode is selected by default. Advanced Monitoring Mode is optional and off initially; the administrator/household-member role selector is only a demo control, not authentication.
- Notifications & Alerts is the single notification/alert list, with All, Needs Review, L1–L4, and History filters. It presents the sound class, event time, visual result, snapshot link, decision rule, sample SMS status, and acknowledgement/review/false-trigger state. The top-bar bell opens this page and counts unread notifications only; reading a notification does not acknowledge an alert. Event Log remains available for detailed event searches.
- The Dashboard is a compact overview: it links to the latest event and a short list of other recent events, reports unavailable health/sounder/lights/recipient integrations, and only shows a critical banner during the simulated L4 workflow. System Activity Log no longer repeats event/notification records.
- With Advanced Monitoring enabled, the Motion Events screen can simulate known-face (L1 Attention), no-face (time-only/no image), or unknown-face outcomes after a 10-second countdown. Unknown-person verification appears in Notifications & Alerts with a 60-second response window; **Everything is fine** resolves the local demo prompt and **Needs help** or timeout escalates to the L4 High Alert view. These countdown/escalation/response controls are demonstrations, not backend-driven alert actions.
- Guest passes can be added for 1–7 days. They exist only in frontend memory and do not grant door or recording access.
- Device Status separates System Health, Monitoring Mode, and System Activity Log. Component health checks are not integrated, so unavailable components are shown as Not connected or Unknown; the app does not report fabricated online telemetry. The activity log reuses sample event and in-session motion/mode-change records, not a backend system audit feed.
- Privacy Settings describes the proposed 15-day media-retention period and main-user-only download/delete policy. These are policy requirements, not frontend-enforced restrictions.
- Live View is shown as unavailable. The sample event snapshot is illustrative, not a recording. There is no recording playback feature.
- Sample events, device status, notification state, and snapshots are illustrative demo data. Reviewed, acknowledgement, and false-trigger changes are local UI state only. The dashboard's Stop alarm control reports that it cannot send a command because physical alarm control is not integrated. SMS flags are sample data, not confirmed delivery results.

## Integration status

The `backend/` directory contains a local-only FastAPI and SQLite service for device records, component-health reports, event records, monitoring-mode configuration, event acknowledgement, and household-member photo enrollment. The User Enrollment page connects to its authenticated enrollment endpoints using a development-only bearer token; uploaded JPEG/PNG photos are stored privately, and records remain pending because face processing is not implemented. The dashboard does not currently consume the event or acknowledgement endpoints; its notifications are generated from frontend demo fixtures. Other dashboard data remains demo or unavailable, and the API does not connect to household hardware. Production user authentication and authorization, component-health probes, network probing, startup/shutdown and access audit logs, motion sensing, camera capture, facial recognition, persistent guest passes, automatic media deletion, recording access logs, SMS, physical alarms, and live telemetry are not implemented. The timed workflows demonstrate UI behavior only; secure access restrictions require backend enforcement.

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
