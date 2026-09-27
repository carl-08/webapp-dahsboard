import type { SecurityEvent } from '../models/securityEvent'

export interface DashboardNotification {
  id: string
  eventId: string
  kind: string
  title: string
  detail: string
  timestamp: string
  read: boolean
}

export function notificationsFromEvents(events: SecurityEvent[]): DashboardNotification[] {
  return events.filter((event) => event.responses.dashboardNotification).map((event) => ({
    id: `notice-${event.id}`,
    eventId: event.id,
    kind: event.alertLevel.toUpperCase(),
    title: `${event.acousticClass} detected`,
    detail: event.faceResult,
    timestamp: event.timestamp,
    read: false,
  }))
}
