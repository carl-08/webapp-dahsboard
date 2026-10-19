# Haven Home Thesis Dashboard

Frontend prototype for **Context-Aware Household Alert System Using Audio-Triggered Facial Recognition for False-Alarm Reduction**. The app is built with React, TypeScript, and Vite and keeps the dashboard, event history, household enrollment, and settings within one client-side interface.

## Prototype interactions

- The dashboard shows Standard Mode as active and Advanced Monitoring Mode off by default. The administrator/household-member role selector is a demo control, not authentication.
- With Advanced Monitoring enabled in the demo, **Simulate motion event** starts a 10-second face-check countdown and then opens L2 Verification for an unknown-person sample. The L2 screen has a 60-second response window; **Safe** resolves it and **Not Safe** or timeout escalates to L4 High Alert.
- Guest passes can be added for 1–7 days. They exist only in frontend memory and do not grant door or recording access.
- Privacy Settings states the 15-day media-retention policy and administrator-only recording access. The demo role can hide the sample snapshot in the interface, but neither access control nor automatic deletion is enforced.
- Sample events, device status, notifications, and snapshots are illustrative demo data.

## Integration status

This repository does not connect to household hardware or backend services. Authentication, authorization, motion sensing, camera capture, facial recognition, persistent guest passes, automatic media deletion, SMS, physical alarms, and live telemetry are not implemented. The timed workflows and role restrictions demonstrate UI behavior only.

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
