export const acousticClasses = [
  'Normal/Background',
  'Crying',
  'Scream',
  'Shouting',
  'Loud Bang/Impact',
] as const

export const faceResults = ['Known Person', 'Unknown Person', 'No Usable Face'] as const

export const decisions = [
  'Log Only',
  'Attention / Log',
  'Attention / Verification',
  'Alert',
  'Higher-Level Alert',
  'Alert / Verification',
  'Higher-Level Verification',
] as const

export type AcousticClass = typeof acousticClasses[number]
export type FaceResult = typeof faceResults[number]
export type Decision = typeof decisions[number]

export interface SystemResponses {
  eventLogged: boolean
  snapshotSaved: boolean
  dashboardNotification: boolean
  physicalSoundAlert: boolean
  smsNotification: boolean
}

export interface SecurityEvent {
  id: string
  timestamp: string
  acousticClass: AcousticClass
  audioConfidence: number
  faceResult: FaceResult
  recognitionConfidence: number | null
  visualProcessingNote: string
  decision: Decision
  alertLevel: 'Attention' | 'Verification' | 'Alert' | 'Higher-Level Alert' | 'Higher-Level Verification' | 'Recorded'
  snapshotUrl: string | null
  responses: SystemResponses
  processingTime: { audio: number; face: number | null; total: number }
  status: string
}
