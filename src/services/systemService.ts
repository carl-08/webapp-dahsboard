export const demoSystem = {
  homeName: 'COJ-CS',
  edge: { name: 'Raspberry Pi 5', memory: '16 GB RAM', status: 'Online', cpu: 'Normal', memoryStatus: 'Normal', storage: 'Normal', uptime: '3 days, 8 hours', responseTime: '1.42 s', responseTimeLabel: 'Sample demo value · not measured' },
  audio: { name: 'ICS-43434 I2S Microphone', status: 'Connected', monitoring: 'Active', classifier: 'Ready', currentState: 'Monitoring' },
  camera: { name: 'Raspberry Pi Camera Module 3', status: 'Connected', rollingBuffer: 'Active', faceDetection: 'Standby', recognition: 'Standby', note: 'Visual processing starts only after a qualifying acoustic event.' },
  cloud: { name: 'Firebase', status: 'Not configured', lastSync: 'Not connected', eventLogs: 'Local demo data', selectedMedia: 'Local demo data', privacy: 'Raw continuous audio and video are not uploaded in this prototype.' },
}

export const demoDevices = [
  { name: 'Raspberry Pi 5', detail: 'Edge computer · 16 GB RAM', status: 'Online' },
  { name: 'ICS-43434 I2S Microphone', detail: 'Audio input · I2S', status: 'Connected' },
  { name: 'Raspberry Pi Camera Module 3', detail: 'Event-triggered visual verification', status: 'Connected' },
  { name: 'Storage', detail: 'Event logs and selected snapshots', status: 'Normal' },
  { name: 'Network', detail: 'Local system connectivity', status: 'Online' },
  { name: 'Physical Sound Alert', detail: 'Model not specified', status: 'Configured in prototype' },
]

export const demoHouseholdMember = { name: 'Carl', memberId: 'HM-001', enrolled: true, recognitionEnabled: true }
