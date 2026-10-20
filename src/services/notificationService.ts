import type { SecurityEvent } from '../models/securityEvent'
import { demoHouseholdMember } from './systemService'

export interface DashboardNotification {
  id: string
  eventId: string | null
  source: 'event' | 'motion'
  kind: string
  level: string
  levelCode: 'L1' | 'L2' | 'L3' | 'L4' | 'Event'
  title: string
  detail: string
  timestamp: string
  read: boolean
  status: string
  acknowledgementStatus: string
  deliveryStatus: string
  decision: string
  snapshotUrl: string | null
  reviewed: boolean
  falseTrigger: boolean
  active: boolean
}

export function notificationsFromEvents(events: SecurityEvent[]): DashboardNotification[] {
  return events.map((event) => {
    const levelCode: DashboardNotification['levelCode'] = event.alertLevel === 'Attention' ? 'L1'
      : event.alertLevel === 'Verification' || event.alertLevel === 'Higher-Level Verification' ? 'L2'
        : event.alertLevel === 'Alert' ? 'L3'
          : event.alertLevel === 'Higher-Level Alert' ? 'L4'
            : 'Event'
    const levelName = levelCode === 'L1' ? 'Attention'
      : levelCode === 'L2' ? 'Verification'
        : levelCode === 'L3' ? 'Alert'
          : levelCode === 'L4' ? 'High Alert'
            : 'Event'

    return {
      id: event.id,
      eventId: event.id,
      source: 'event',
      kind: event.acousticClass,
      level: levelCode === 'Event' ? 'Event' : `${levelCode} · ${levelName}`,
      levelCode,
      title: `${event.acousticClass} detected`,
      detail: event.faceResult === 'Known Person' ? `${demoHouseholdMember.name} · Known household member` : event.faceResult,
      timestamp: event.timestamp,
      read: !event.responses.dashboardNotification,
      status: event.status,
      acknowledgementStatus: 'Not recorded',
      deliveryStatus: event.responses.smsNotification ? 'SMS sample flag · recorded' : 'SMS delivery · not recorded',
      decision: event.decision,
      snapshotUrl: event.snapshotUrl,
      reviewed: false,
      falseTrigger: false,
      active: false,
    }
  })
}
