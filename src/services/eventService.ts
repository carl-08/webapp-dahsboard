import type { AcousticClass, FaceResult, SecurityEvent } from '../models/securityEvent'

const responses = (overrides: Partial<SecurityEvent['responses']>) => ({
  eventLogged: true,
  snapshotSaved: false,
  dashboardNotification: false,
  physicalSoundAlert: false,
  smsNotification: false,
  ...overrides,
})

export const demoEvents: SecurityEvent[] = [
  {
    id: 'evt-001', timestamp: '2026-09-27T09:39:00', acousticClass: 'Scream', audioConfidence: 0.942,
    faceResult: 'Unknown Person', recognitionConfidence: 0.961, visualProcessingNote: 'Face detected after qualifying audio event.',
    decision: 'Higher-Level Alert', alertLevel: 'Higher-Level Alert', snapshotUrl: '/demo-snapshot.svg',
    responses: responses({ snapshotSaved: true, dashboardNotification: true, physicalSoundAlert: true, smsNotification: true }),
    processingTime: { audio: 0.84, face: 0.37, total: 1.42 }, status: 'Alerted',
  },
  {
    id: 'evt-002', timestamp: '2026-09-27T09:21:00', acousticClass: 'Crying', audioConfidence: 0.875,
    faceResult: 'Known Person', recognitionConfidence: 0.932, visualProcessingNote: 'Known household member recognized after qualifying audio event.',
    decision: 'Attention / Log', alertLevel: 'Attention', snapshotUrl: '/demo-snapshot.svg',
    responses: responses({ snapshotSaved: true }),
    processingTime: { audio: 0.72, face: 0.34, total: 1.18 }, status: 'Logged',
  },
  {
    id: 'evt-003', timestamp: '2026-09-27T08:52:00', acousticClass: 'Loud Bang/Impact', audioConfidence: 0.91,
    faceResult: 'No Usable Face', recognitionConfidence: null, visualProcessingNote: 'No usable face in the captured event frame.',
    decision: 'Higher-Level Verification', alertLevel: 'Higher-Level Verification', snapshotUrl: '/demo-snapshot.svg',
    responses: responses({ snapshotSaved: true, dashboardNotification: true, physicalSoundAlert: true }),
    processingTime: { audio: 0.81, face: 0.4, total: 1.39 }, status: 'Verification Required',
  },
  {
    id: 'evt-004', timestamp: '2026-09-27T08:21:00', acousticClass: 'Crying', audioConfidence: 0.87,
    faceResult: 'No Usable Face', recognitionConfidence: null, visualProcessingNote: 'No usable face in the captured event frame.',
    decision: 'Attention / Verification', alertLevel: 'Verification', snapshotUrl: '/demo-snapshot.svg',
    responses: responses({ snapshotSaved: true, dashboardNotification: true }),
    processingTime: { audio: 0.76, face: 0.38, total: 1.28 }, status: 'Verification Required',
  },
  {
    id: 'evt-005', timestamp: '2026-09-27T07:45:00', acousticClass: 'Normal/Background', audioConfidence: 0.982,
    faceResult: 'No Usable Face', recognitionConfidence: null, visualProcessingNote: 'Visual processing not triggered for a non-qualifying acoustic class.',
    decision: 'Log Only', alertLevel: 'Recorded', snapshotUrl: null,
    responses: responses({}),
    processingTime: { audio: 0.31, face: null, total: 0.34 }, status: 'Logged',
  },
  {
    id: 'evt-006', timestamp: '2026-09-27T06:58:00', acousticClass: 'Loud Bang/Impact', audioConfidence: 0.914,
    faceResult: 'Known Person', recognitionConfidence: 0.948, visualProcessingNote: 'Known household member recognized after qualifying audio event.',
    decision: 'Alert / Verification', alertLevel: 'Verification', snapshotUrl: '/demo-snapshot.svg',
    responses: responses({ snapshotSaved: true, dashboardNotification: true, physicalSoundAlert: true }),
    processingTime: { audio: 0.79, face: 0.35, total: 1.31 }, status: 'Verification Required',
  },
  {
    id: 'evt-007', timestamp: '2026-09-27T06:32:00', acousticClass: 'Shouting', audioConfidence: 0.901,
    faceResult: 'Known Person', recognitionConfidence: 0.927, visualProcessingNote: 'Known household member recognized after qualifying audio event.',
    decision: 'Alert', alertLevel: 'Alert', snapshotUrl: '/demo-snapshot.svg',
    responses: responses({ snapshotSaved: true, dashboardNotification: true, physicalSoundAlert: true }),
    processingTime: { audio: 0.8, face: 0.36, total: 1.34 }, status: 'Alerted',
  },
  {
    id: 'evt-008', timestamp: '2026-09-26T23:14:00', acousticClass: 'Scream', audioConfidence: 0.931,
    faceResult: 'Known Person', recognitionConfidence: 0.958, visualProcessingNote: 'Known household member recognized after qualifying audio event.',
    decision: 'Alert', alertLevel: 'Alert', snapshotUrl: '/demo-snapshot.svg',
    responses: responses({ snapshotSaved: true, dashboardNotification: true, physicalSoundAlert: true }),
    processingTime: { audio: 0.83, face: 0.39, total: 1.4 }, status: 'Alerted',
  },
  {
    id: 'evt-009', timestamp: '2026-09-26T19:47:00', acousticClass: 'Shouting', audioConfidence: 0.889,
    faceResult: 'Unknown Person', recognitionConfidence: 0.902, visualProcessingNote: 'No enrolled household match; recognition is contextual and not a threat label.',
    decision: 'Higher-Level Alert', alertLevel: 'Higher-Level Alert', snapshotUrl: '/demo-snapshot.svg',
    responses: responses({ snapshotSaved: true, dashboardNotification: true, physicalSoundAlert: true, smsNotification: true }),
    processingTime: { audio: 0.82, face: 0.37, total: 1.41 }, status: 'Alerted',
  },
]

export interface EventFilters {
  search: string
  startDate: string
  endDate: string
  acousticClass: AcousticClass | 'All'
  faceResult: FaceResult | 'All'
  decision: 'All' | 'Attention' | 'Verification' | 'Alert' | 'Higher-Level Alert' | 'Higher-Level Verification' | 'Log Only'
}

export function queryEvents(events: SecurityEvent[], filters: EventFilters) {
  const query = filters.search.trim().toLowerCase()
  return events.filter((event) => {
    const eventDate = event.timestamp.slice(0, 10)
    const matchesSearch = !query || `${event.acousticClass} ${event.faceResult} ${event.decision} ${event.status}`.toLowerCase().includes(query)
    const matchesDecision = filters.decision === 'All' || (filters.decision === 'Log Only' ? event.decision === 'Log Only' : event.alertLevel === filters.decision)
    return matchesSearch && (!filters.startDate || eventDate >= filters.startDate) && (!filters.endDate || eventDate <= filters.endDate)
      && (filters.acousticClass === 'All' || event.acousticClass === filters.acousticClass)
      && (filters.faceResult === 'All' || event.faceResult === filters.faceResult)
      && matchesDecision
  }).sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}
