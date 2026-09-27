import { useEffect } from 'react'
import { Check, Clock3, X } from 'lucide-react'
import type { SecurityEvent } from '../models/securityEvent'
import { DecisionBadge } from './thesisBadges'

interface EventDetailsModalProps {
  event: SecurityEvent
  onClose: () => void
}

function displayDate(timestamp: string) {
  return new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(timestamp))
}

function displayTime(timestamp: string) {
  return new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(new Date(timestamp))
}

const responseLabels: [keyof SecurityEvent['responses'], string][] = [
  ['eventLogged', 'Event Logged'],
  ['snapshotSaved', 'Snapshot Saved'],
  ['dashboardNotification', 'Dashboard Notification'],
  ['physicalSoundAlert', 'Physical Sound Alert'],
  ['smsNotification', 'SMS Notification'],
]

export function EventDetailsModal({ event, onClose }: EventDetailsModalProps) {
  useEffect(() => {
    function handleKeyDown(keyEvent: KeyboardEvent) {
      if (keyEvent.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return <div className="modal-backdrop" onMouseDown={(mouseEvent) => { if (mouseEvent.target === mouseEvent.currentTarget) onClose() }}>
    <section className="event-modal" role="dialog" aria-modal="true" aria-labelledby="event-detail-title">
      <header className="modal-header"><div><span className="modal-kicker">EVENT DETAILS · {event.id.toUpperCase()}</span><h2 id="event-detail-title">{event.acousticClass}</h2><p>{displayDate(event.timestamp)} · {displayTime(event.timestamp)}</p></div><button className="icon-button" aria-label="Close event details" onClick={onClose}><X size={19} /></button></header>
      <div className="modal-content">
        <section className="detail-section"><h3>Acoustic event</h3><div className="detail-grid"><Detail label="Acoustic Class" value={event.acousticClass} /><Detail label="Audio Confidence" value={`${(event.audioConfidence * 100).toFixed(1)}%`} /><Detail label="Audio Processing" value="Completed" /><Detail label="Event Time" value={displayTime(event.timestamp)} /></div></section>
        <section className="detail-section"><h3>Visual verification</h3><p className="section-note">Triggered only after a qualifying acoustic event. Recognition is contextual and does not independently determine a threat.</p><div className="detail-grid"><Detail label="Face Detection" value={event.faceResult === 'No Usable Face' ? 'No Usable Face' : 'Face detected'} /><Detail label="Facial Recognition Result" value={event.faceResult} /><Detail label="Recognition Confidence" value={event.recognitionConfidence === null ? 'Not available' : `${(event.recognitionConfidence * 100).toFixed(1)}%`} /><Detail label="Processing" value={event.visualProcessingNote} wide /></div></section>
        <section className="detail-section"><h3>Final decision</h3><div className="decision-detail"><span>Decision</span><DecisionBadge decision={event.decision} /></div></section>
        <section className="detail-section"><h3>System response</h3><div className="response-grid">{responseLabels.map(([key, label]) => <div className="response-state" key={key}><span className={`response-check ${event.responses[key] ? 'response-done' : ''}`}>{event.responses[key] ? <Check size={13} /> : null}</span><span>{label}</span><strong className={event.responses[key] ? 'response-triggered' : 'response-not-triggered'}>{event.responses[key] ? 'Triggered' : 'Not Triggered'}</strong></div>)}</div></section>
        <section className="detail-section"><h3>Processing</h3><div className="processing-grid"><Detail label="Audio Processing" value={`${event.processingTime.audio.toFixed(2)} s`} /><Detail label="Face Recognition" value={event.processingTime.face === null ? 'Not triggered' : `${event.processingTime.face.toFixed(2)} s`} /><Detail label="Total Response Time" value={`${event.processingTime.total.toFixed(2)} s`} /><span className="sample-label"><Clock3 size={13} /> Sample UI values · not measured</span></div></section>
        <section className="detail-section snapshot-section"><div className="snapshot-heading"><div><h3>Recent Event Snapshot</h3><p>Selected visual context associated with this acoustic event</p></div><span className="snapshot-tag">DEMO SAMPLE</span></div>{event.snapshotUrl ? <img className="snapshot-image" src={event.snapshotUrl} alt="Illustrative demo frame, not a live camera feed" /> : <div className="snapshot-unavailable">No snapshot was captured for this non-qualifying acoustic event.</div>}<p className="snapshot-caption">Illustrative placeholder only. Actual captured event media requires camera and backend integration.</p></section>
      </div>
    </section>
  </div>
}

function Detail({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return <div className={`detail-item ${wide ? 'detail-wide' : ''}`}><span>{label}</span><strong>{value}</strong></div>
}
