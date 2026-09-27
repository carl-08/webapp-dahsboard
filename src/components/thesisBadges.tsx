import type { Decision } from '../models/securityEvent'

export function DecisionBadge({ decision }: { decision: Decision }) {
  const tone = decision === 'Log Only' || decision === 'Attention / Log' ? 'attention'
    : decision === 'Attention / Verification' || decision === 'Alert / Verification' ? 'verification'
      : decision === 'Higher-Level Verification' ? 'higher-verification'
        : decision === 'Higher-Level Alert' ? 'higher-alert' : 'alert'
  return <span className={`decision-badge ${tone}`}>{decision}</span>
}

export function AcousticBadge({ acousticClass }: { acousticClass: string }) {
  const tone = acousticClass === 'Normal/Background' ? 'acoustic-normal'
    : acousticClass === 'Crying' ? 'acoustic-crying'
      : acousticClass === 'Scream' ? 'acoustic-scream'
        : acousticClass === 'Shouting' ? 'acoustic-shouting' : 'acoustic-impact'
  return <span className={`acoustic-badge ${tone}`}>{acousticClass}</span>
}
