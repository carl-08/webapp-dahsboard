# Haven Home Thesis Dashboard

Frontend prototype for **Context-Aware Household Alert System Using Audio-Triggered Facial Recognition for False-Alarm Reduction**. The app is built with React, TypeScript, and Vite. It uses collapsible sidebar groups to organize the dashboard, alerts, monitoring controls, visitors, and settings within one client-side interface.

## Prototype interactions

- Standard Mode is selected by default. Advanced Monitoring Mode is optional and off initially; the administrator/household-member role selector is only a demo control, not authentication.
- With Advanced Monitoring enabled, the Motion Events screen can simulate known-face (L1 Attention), no-face (time-only/no image), or unknown-face outcomes after a 10-second countdown. Unknown-person verification opens L2 with a 60-second response window; **Safe** resolves it and **Not Safe** or timeout escalates to L4 High Alert.
- Guest passes can be added for 1–7 days. They exist only in frontend memory and do not grant door or recording access.
- Privacy Settings describes the proposed 15-day media-retention period and main-user-only download/delete policy. These are policy requirements, not frontend-enforced restrictions.
- Live View is shown as unavailable. The sample event snapshot is illustrative, not a recording. There is no recording playback feature.
- Sample events, device status, notifications, and snapshots are illustrative demo data.

## Integration status

This repository does not connect to household hardware or backend services. Authentication, authorization, motion sensing, camera capture, facial recognition, persistent guest passes, automatic media deletion, recording access logs, SMS, physical alarms, and live telemetry are not implemented. The timed workflows demonstrate UI behavior only; secure access restrictions require backend enforcement.

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
