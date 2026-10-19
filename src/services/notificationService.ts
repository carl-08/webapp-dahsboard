import type { SecurityEvent } from '../models/securityEvent'

export interface DashboardNotification {
  id: string
  eventId: string | null
  source: 'event' | 'motion'
  kind: string
  level: string
  title: string
  detail: string
  timestamp: string
  read: boolean
  status: string
  acknowledgementStatus: string
  deliveryStatus: string
}

export function notificationsFromEvents(events: SecurityEvent[]): DashboardNotification[] {
  return events.map((event) => ({
    id: `notice-${event.id}`,
    eventId: event.id,
    source: 'event',
    kind: event.alertLevel.toUpperCase(),
    level: event.alertLevel === 'Attention' ? 'L1 · Attention'
      : event.alertLevel === 'Verification' ? 'L2 · Verification'
        : event.alertLevel === 'Alert' ? 'L3 · Alert'
          : event.alertLevel.startsWith('Higher-Level') ? 'L4 · High Alert'
            : 'Event',
    title: `${event.acousticClass} detected`,
    detail: event.faceResult,
    timestamp: event.timestamp,
    read: !event.responses.dashboardNotification,
    status: event.status,
    acknowledgementStatus: 'Not recorded',
    deliveryStatus: [
      event.responses.dashboardNotification && 'Dashboard notification · sample recorded',
      event.responses.smsNotification && 'SMS · sample recorded',
      event.responses.physicalSoundAlert && 'Physical alarm · sample recorded',
    ].filter(Boolean).join(' · ') || 'No delivery recorded',
  }))
}
