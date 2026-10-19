import { useEffect, useState, type FormEvent } from 'react'
import {
  Activity, ArrowUpRight, Bell, Camera, Check, CircleAlert, Clock3, FileClock, Info,
  Cpu, Database, Mic2, Search, ShieldCheck, SlidersHorizontal,
  Smartphone, UserRound, Users, Video, Wifi, type LucideIcon,
} from 'lucide-react'
import { AcousticBadge, DecisionBadge } from './thesisBadges'
import { acousticClasses, faceResults, type SecurityEvent } from '../models/securityEvent'
import { demoHouseholdMember } from '../services/systemService'
import type { EventFilters } from '../services/eventService'
import type { DashboardNotification } from '../services/notificationService'

const formatTime = (timestamp: string) => new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(new Date(timestamp))
const formatDate = (timestamp: string) => new Intl.DateTimeFormat('en', { month: '2-digit', day: '2-digit', year: 'numeric' }).format(new Date(timestamp))
const formatShortDate = (timestamp: string) => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(timestamp))
const initialRenderTime = Date.now()

export type DemoRole = 'Administrator' | 'Household member'
export type DemoWorkflowState = 'idle' | 'face-check' | 'verification' | 'safe' | 'known-face' | 'no-face' | 'high-alert'
export type DemoFaceOutcome = 'known' | 'none' | 'unknown'
export interface GuestPass {
  id: string
  guestName: string
  durationDays: number
  createdAt: string
  expiresAt: string
}

export function OverviewPage({ events, advancedMode, onOpenEvent, onNavigate }: {
  events: SecurityEvent[]
  advancedMode: boolean
  onOpenEvent: (event: SecurityEvent) => void
  onNavigate: (page: 'Monitoring Modes' | 'Motion Events' | 'Notifications & Alerts' | 'Event History') => void
}) {
  return <>
    <section className="dashboard-system-status">
      <div className="dashboard-status-item"><span className="status-led status-led-muted" /><div><strong>Hardware</strong><span>Not connected</span></div></div>
      <div className="dashboard-status-item"><span className="status-led status-led-blue" /><div><strong>Event records</strong><span>Sample data only</span></div></div>
      <div className="dashboard-status-note">No live device telemetry or backend connection.</div>
    </section>
    <section className="dashboard-mode-summary panel">
      <div><span className="mode-kicker">CURRENT MONITORING MODE</span><h2>{advancedMode ? 'Advanced Monitoring Mode' : 'Standard Mode'} <span className={`mode-state ${advancedMode ? 'mode-state-active' : 'mode-state-off'}`}>{advancedMode ? 'ON' : 'DEFAULT'}</span></h2><p>{advancedMode ? 'Motion-triggered face checks are enabled in this UI prototype.' : 'Audio-triggered workflow is selected. Silent entry is not detected in Standard Mode.'}</p></div>
      <button className="secondary-button" type="button" onClick={() => onNavigate('Monitoring Modes')}>Monitoring controls <ArrowUpRight size={14} /></button>
    </section>
    <section className="panel dashboard-list-panel">
      <div className="panel-heading"><div><h2>Notifications &amp; Alerts</h2><p>Review all alert levels and sample notification status in one place.</p></div><button className="text-button" onClick={() => onNavigate('Notifications & Alerts')}>Open notifications <ArrowUpRight size={14} /></button></div>
    </section>
    <section className="panel dashboard-list-panel">
      <div className="panel-heading"><div><h2>Recent Events</h2><p>Latest entries in the local sample event set</p></div><button className="text-button" onClick={() => onNavigate('Event History')}>Event history <ArrowUpRight size={14} /></button></div>
      <div className="dashboard-event-list">{events.slice(0, 4).map((event) => <button className="dashboard-event-row" key={event.id} onClick={() => onOpenEvent(event)}><span className="dashboard-event-time">{formatShortDate(event.timestamp)}<small>{formatTime(event.timestamp)}</small></span><span className="dashboard-list-main"><strong>{event.acousticClass}</strong><small>{event.faceResult}</small></span><DecisionBadge decision={event.decision} /></button>)}</div>
    </section>
  </>
}

export function EventTable({ events, onOpenEvent, compact = false }: { events: SecurityEvent[]; onOpenEvent: (event: SecurityEvent) => void; compact?: boolean }) {
  return <div className="event-table-wrap"><table className={`event-table thesis-event-table ${compact ? 'compact-table' : ''}`}><thead><tr><th>DATE / TIME</th><th>ACOUSTIC CLASS</th><th>AUDIO CONFIDENCE</th><th>FACE RESULT</th><th>FINAL DECISION</th><th>RESPONSE STATUS</th></tr></thead><tbody>{events.map((event) => <tr key={event.id} className="event-table-row" onClick={() => onOpenEvent(event)} tabIndex={0} onKeyDown={(keyEvent) => { if (keyEvent.key === 'Enter' || keyEvent.key === ' ') onOpenEvent(event) }}><td><strong>{formatDate(event.timestamp)}</strong><small>{formatTime(event.timestamp)}</small></td><td><AcousticBadge acousticClass={event.acousticClass} /></td><td>{(event.audioConfidence * 100).toFixed(1)}%</td><td>{event.faceResult}</td><td><DecisionBadge decision={event.decision} /></td><td><span className="response-status">{event.status}</span></td></tr>)}</tbody></table>{events.length === 0 && <EmptyState title="No matching events" text="Change a filter or search term to see sample events." />}</div>
}

export function EventHistoryPage({ events, filters, setFilters, onOpenEvent }: { events: SecurityEvent[]; filters: EventFilters; setFilters: (filters: EventFilters) => void; onOpenEvent: (event: SecurityEvent) => void }) {
  const change = (key: keyof EventFilters, value: string) => setFilters({ ...filters, [key]: value } as EventFilters)
  const clear = () => setFilters({ search: '', startDate: '', endDate: '', acousticClass: 'All', faceResult: 'All', decision: 'All' })
  return <section className="panel history-panel"><div className="panel-heading"><div><h2>Event history</h2><p>{events.length} matching records · demo dataset</p></div><button className="secondary-button" onClick={clear}><SlidersHorizontal size={14} /> Clear filters</button></div><div className="history-filters"><label className="history-search"><Search size={15} /><input aria-label="Search event history" placeholder="Search class, face result, decision" value={filters.search} onChange={(event) => change('search', event.target.value)} /></label><label className="history-filter"><span>Acoustic class</span><select value={filters.acousticClass} onChange={(event) => change('acousticClass', event.target.value)}><option>All</option>{acousticClasses.map((item) => <option key={item}>{item}</option>)}</select></label><label className="history-filter"><span>Face result</span><select value={filters.faceResult} onChange={(event) => change('faceResult', event.target.value)}><option>All</option>{faceResults.map((item) => <option key={item}>{item}</option>)}</select></label><label className="history-filter"><span>Decision</span><select value={filters.decision} onChange={(event) => change('decision', event.target.value)}><option>All</option><option>Log Only</option><option>Attention</option><option>Verification</option><option>Alert</option><option>Higher-Level Alert</option><option>Higher-Level Verification</option></select></label><label className="history-filter date-filter"><span>From</span><input type="date" value={filters.startDate} onChange={(event) => change('startDate', event.target.value)} /></label><label className="history-filter date-filter"><span>To</span><input type="date" value={filters.endDate} onChange={(event) => change('endDate', event.target.value)} /></label></div><EventTable events={events} onOpenEvent={onOpenEvent} /></section>
}

export function MonitoringModesPage({ demoRole, onDemoRoleChange, isAdministrator, advancedMode, onAdvancedModeChange }: {
  demoRole: DemoRole
  onDemoRoleChange: (role: DemoRole) => void
  isAdministrator: boolean
  advancedMode: boolean
  onAdvancedModeChange: (enabled: boolean) => void
}) {
  return <section className="monitoring-settings-grid">
    <article className="panel monitoring-mode-panel">
      <div className="panel-heading"><div><h2>Monitoring Modes</h2><p>Standard Mode is the default. Advanced Monitoring is optional and off initially.</p></div></div>
      <div className="monitoring-mode-option"><span className="monitoring-option-icon"><Mic2 size={18} /></span><div className="monitoring-option-copy"><strong>Standard Mode</strong><span>Audio-triggered event workflow. Silent entry is not detected in this mode.</span></div><span className={`mode-state ${advancedMode ? 'mode-state-off' : 'mode-state-active'}`}>{advancedMode ? 'AVAILABLE' : 'ACTIVE'}</span></div>
      <div className="monitoring-mode-option"><span className="monitoring-option-icon"><Activity size={18} /></span><div className="monitoring-option-copy"><strong>Advanced Monitoring Mode</strong><span>Optional motion-triggered face-check workflow.</span></div><span className={`mode-state ${advancedMode ? 'mode-state-active' : 'mode-state-off'}`}>{advancedMode ? 'ON' : 'OFF'}</span></div>
      <div className="mode-controls"><label className="demo-role-control">Demo role preview<select value={demoRole} onChange={(event) => onDemoRoleChange(event.target.value as DemoRole)}><option value="Administrator">Administrator</option><option value="Household member">Household member</option></select></label><div className="mode-toggle-control"><span>{isAdministrator ? 'Administrator control' : 'Administrator only'}</span><button className={`toggle-switch ${advancedMode ? 'toggle-on' : ''}`} type="button" role="switch" aria-checked={advancedMode} aria-label="Advanced Monitoring Mode" disabled={!isAdministrator} onClick={() => onAdvancedModeChange(!advancedMode)}><span /></button></div></div>
      <div className="prototype-note"><Info size={15} /><p>Role preview is only a UI demonstration. The app has no authentication or backend authorization; this does not enforce administrator access.</p></div>
    </article>
    <aside className="monitoring-control-note"><Activity size={18} /><h2>Motion workflow</h2><p>When advanced mode is on, motion events can be previewed in a simulated 10-second face-check flow.</p><span className="demo-chip">NO SENSOR CONNECTED</span></aside>
  </section>
}

export function MotionEventsPage({ workflowState, faceCheckRemaining, motionTimestamp, isAdministrator, advancedMode, onSimulateMotion, onOpenVerification }: {
  workflowState: DemoWorkflowState
  faceCheckRemaining: number
  motionTimestamp: string | null
  isAdministrator: boolean
  advancedMode: boolean
  onSimulateMotion: (outcome: DemoFaceOutcome) => void
  onOpenVerification: () => void
}) {
  const resultText = workflowState === 'known-face'
    ? 'Known face · L1 Attention · would be logged without escalation.'
    : workflowState === 'no-face'
      ? `No usable face · time-only log${motionTimestamp ? ` at ${formatTime(motionTimestamp)}` : ''} · no image stored.`
      : workflowState === 'verification'
        ? 'Unknown face · L2 verification is active.'
        : workflowState === 'face-check'
          ? `Face check in progress · ${faceCheckRemaining} seconds remaining.`
          : workflowState === 'safe'
            ? 'Event marked safe and closed.'
            : workflowState === 'high-alert'
              ? 'Escalated to L4 High Alert.'
              : 'No motion event in progress.'

  return <section className="panel motion-events-panel">
    <div className="panel-heading"><div><h2>Motion Events</h2><p>Optional workflow for Advanced Monitoring Mode only.</p></div><span className="demo-chip">SIMULATION</span></div>
    {workflowState === 'face-check' && <div className="motion-notification" role="status"><Bell size={15} /><span><strong>Motion detected</strong> · simulated notification</span></div>}
    <div className="motion-event-state"><span className={`workflow-status-dot ${workflowState === 'high-alert' ? 'workflow-status-alert' : workflowState === 'known-face' || workflowState === 'no-face' || workflowState === 'safe' ? 'workflow-status-complete' : workflowState !== 'idle' ? 'workflow-status-active' : ''}`} /><strong>{resultText}</strong></div>
    {workflowState === 'verification' && <button className="secondary-button" type="button" onClick={onOpenVerification}>Open L2 verification <ArrowUpRight size={13} /></button>}
    <fieldset className="motion-outcome-picker" disabled={!advancedMode || !isAdministrator || workflowState === 'face-check' || workflowState === 'verification'}>
      <legend>Preview a simulated motion result</legend>
      <div className="motion-outcome-actions"><button className="secondary-button" type="button" onClick={() => onSimulateMotion('known')}><UserRound size={14} /> Known face</button><button className="secondary-button" type="button" onClick={() => onSimulateMotion('none')}><Camera size={14} /> No face</button><button className="secondary-button" type="button" onClick={() => onSimulateMotion('unknown')}><CircleAlert size={14} /> Unknown face</button></div>
    </fieldset>
    {!advancedMode && <p className="workflow-hint">Turn on Advanced Monitoring Mode to preview motion events.</p>}
    {!isAdministrator && <p className="workflow-hint">The demo role is not Administrator; the simulated controls are disabled.</p>}
    <div className="prototype-note"><Info size={15} /><p>No motion sensor or camera is connected. Outcomes are not persisted as event records; no-face mode stores no image in this simulation.</p></div>
  </section>
}

export function LiveViewPage() {
  return <section className="panel unavailable-feature-panel"><span className="unavailable-feature-icon"><Camera size={22} /></span><h2>Live View is unavailable</h2><p>This prototype has no camera stream, user sign-in, or backend access-control integration.</p><span className="demo-chip">NOT IMPLEMENTED</span><div className="prototype-note"><Info size={15} /><p>Live view and playback should require authenticated users; access logging and authorization must be implemented by a backend.</p></div></section>
}

export function AlertsPage({ events, onOpenEvent }: { events: SecurityEvent[]; onOpenEvent: (event: SecurityEvent) => void }) {
  return <section className="panel alert-page-panel"><div className="panel-heading"><div><h2>Alert records</h2><p>{events.length} historical sample records · no live alert feed or acknowledgement integration</p></div><span className="demo-chip">SAMPLE DATA</span></div><div className="thesis-alert-list">{events.map((event) => <article className={`thesis-alert-card alert-tone-${event.alertLevel.toLowerCase().replaceAll(' ', '-')}`} key={event.id}><span className="thesis-alert-icon"><CircleAlert size={18} /></span><div className="thesis-alert-main"><div className="alert-title-row"><DecisionBadge decision={event.decision} /><span className="alert-card-time">{formatShortDate(event.timestamp)} · {formatTime(event.timestamp)}</span></div><h3>{event.acousticClass} detected</h3><div className="alert-facts"><span>Audio confidence <b>{(event.audioConfidence * 100).toFixed(1)}% · sample</b></span><span>Face <b>{event.faceResult}</b></span><span>Verification <b>{event.decision.includes('Verification') ? 'Required' : 'Not required'}</b></span></div><div className="response-chip-row"><ResponseChip active={event.responses.eventLogged}>Logged</ResponseChip><ResponseChip active={event.responses.dashboardNotification}>Dashboard notification</ResponseChip><ResponseChip active={event.responses.physicalSoundAlert}>Physical alarm</ResponseChip><ResponseChip active={event.responses.smsNotification}>SMS</ResponseChip></div></div><button className="secondary-button review-event-button" onClick={() => onOpenEvent(event)}>Review event <ArrowUpRight size={14} /></button></article>)}</div></section>
}

function ResponseChip({ active, children }: { active: boolean; children: string }) {
  return <span className={`response-chip ${active ? 'response-chip-on' : ''}`}>{active && <Check size={11} />}{children}: {active ? 'Sample says triggered' : 'Not recorded'}</span>
}

export function SystemStatusPage() {
  type HealthStatus = 'Online' | 'Degraded' | 'Offline' | 'Unknown' | 'Not connected'
  const components: { name: string; status: HealthStatus; integration: string; icon: LucideIcon }[] = [
    { name: 'Audio monitoring pipeline & microphone', status: 'Not connected', integration: 'Connect the I2S microphone and expose a pipeline health check.', icon: Mic2 },
    { name: 'Camera & frame capture', status: 'Not connected', integration: 'Connect the camera and expose frame-capture health.', icon: Video },
    { name: 'Raspberry Pi processing service', status: 'Not connected', integration: 'Connect the edge service and report its health endpoint.', icon: Cpu },
    { name: 'Network connectivity', status: 'Unknown', integration: 'Add a backend network probe; no connectivity check is available.', icon: Wifi },
    { name: 'SMS modem/service', status: 'Not connected', integration: 'Connect an SMS provider/modem and return delivery results.', icon: Smartphone },
    { name: 'Local storage & logging', status: 'Unknown', integration: 'Add storage and log-writer checks; current event records are demo data.', icon: Database },
  ]
  const overallStatus = components.some((item) => item.status === 'Offline') ? 'Offline'
    : components.some((item) => item.status === 'Degraded') ? 'Degraded'
      : components.some((item) => item.status === 'Not connected') ? 'Not connected'
        : components.some((item) => item.status === 'Unknown') ? 'Unknown'
          : 'All systems online'
  return <section className="system-health-page">
    <div className={`system-health-overall system-health-${overallStatus.toLowerCase().replaceAll(' ', '-')}`}>
      <div><span className="system-health-label">OVERALL STATUS</span><h2>{overallStatus}</h2><p>Health checks are not connected; this status is not based on live telemetry.</p></div>
      <span className="demo-chip">NO LIVE HEALTH CHECKS</span>
    </div>
    <div className="system-health-grid">{components.map(({ name, status, integration, icon: Icon }) => <article className="panel system-health-card" key={name}>
      <div className="system-health-card-heading"><span className="system-health-icon"><Icon size={17} /></span><span className={`system-health-state system-health-state-${status.toLowerCase().replaceAll(' ', '-')}`}>{status}</span></div>
      <h3>{name}</h3>
      <p>{integration}</p>
    </article>)}</div>
    <p className="system-health-note"><Info size={15} /> This frontend has no component-health API. “All systems online” will only be shown after every required component reports a healthy state.</p>
  </section>
}

export function SystemActivityLogPage({ notifications, modeActivity }: {
  notifications: DashboardNotification[]
  modeActivity: { id: string; timestamp: string; title: string; detail: string; status: string }[]
}) {
  const logEntries = [
    ...notifications.map((entry) => ({
      id: entry.id,
      timestamp: entry.timestamp,
      title: entry.title,
      detail: entry.detail,
      status: entry.status,
      level: entry.level,
      acknowledgementStatus: entry.acknowledgementStatus,
      deliveryStatus: entry.deliveryStatus,
    })),
    ...modeActivity.map((entry) => ({
      ...entry,
      level: 'SYSTEM',
      acknowledgementStatus: 'Not recorded',
      deliveryStatus: 'Not applicable',
    })),
  ].sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  return <section className="panel system-activity-panel">
    <div className="panel-heading"><div><h2>System Activity Log</h2><p>{logEntries.length} event records · sample and simulated data only</p></div><span className="demo-chip">NO SYSTEM AUDIT FEED</span></div>
    <p className="system-activity-disclaimer"><Info size={15} /> Startup/shutdown, component connectivity, access, and SMS delivery logs are not available in this app. Entries below reuse the existing sample event and in-session simulated motion data; they are not a system audit log.</p>
    {logEntries.length ? <ol className="system-activity-list">{logEntries.map((entry) => <li className="system-activity-entry" key={entry.id}>
      <span className="system-activity-time">{new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(entry.timestamp))}</span>
      <span className="system-activity-copy"><strong>{entry.title}</strong><span>{entry.detail}</span>{entry.acknowledgementStatus !== 'Not recorded' && <span>{entry.acknowledgementStatus}</span>}<span>{entry.deliveryStatus}</span></span>
      <span className={`system-activity-status ${entry.level.startsWith('L4') ? 'system-activity-status-alert' : ''}`}>{entry.status}</span>
    </li>)}</ol> : <div className="empty-state"><span><FileClock size={18} /></span><strong>No event activity recorded</strong><p>New events will appear here when available.</p></div>}
  </section>
}

export function HouseholdPage({ name, setName, recognitionEnabled, setRecognitionEnabled, enrollmentRequests, onRequestEnrollment }: { name: string; setName: (name: string) => void; recognitionEnabled: boolean; setRecognitionEnabled: (enabled: boolean) => void; enrollmentRequests: { id: string; name: string; createdAt: string }[]; onRequestEnrollment: (name: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [tab, setTab] = useState<'members' | 'enroll'>('members')
  const [newMemberName, setNewMemberName] = useState('')
  const [consent, setConsent] = useState(false)
  const [requestMessage, setRequestMessage] = useState('')

  function submitEnrollment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const displayName = newMemberName.trim()
    if (!displayName || !consent) return
    onRequestEnrollment(displayName)
    setNewMemberName('')
    setConsent(false)
    setRequestMessage(`${displayName} was added to the demo enrollment queue. Device enrollment is still pending.`)
    setTab('members')
  }

  return <section className="panel member-panel">
    <div className="panel-heading"><div><h2>Household members</h2><p>Manage enrolled profiles and device enrollment requests.</p></div><span className="demo-chip">MOCK ENROLLMENT</span></div>
    <div className="member-tabs" role="tablist" aria-label="Household member options">
      <button className={`member-tab ${tab === 'members' ? 'member-tab-active' : ''}`} role="tab" aria-selected={tab === 'members'} onClick={() => setTab('members')}><Users size={15} /> Members <span>{1 + enrollmentRequests.length}</span></button>
      <button className={`member-tab ${tab === 'enroll' ? 'member-tab-active' : ''}`} role="tab" aria-selected={tab === 'enroll'} onClick={() => { setRequestMessage(''); setTab('enroll') }}><UserRound size={15} /> Enroll person</button>
    </div>
    {tab === 'members' ? <>
      {requestMessage && <div className="enrollment-feedback" role="status"><Check size={15} />{requestMessage}</div>}
      <article className="member-row"><span className="member-avatar"><UserRound size={22} /></span><div className="member-main">{editing ? <input aria-label="Household member display name" className="member-name-input" value={name} onChange={(event) => setName(event.target.value)} /> : <h3>{name}</h3>}<p>Member ID · {demoHouseholdMember.memberId}</p><div className="member-flags"><span className="member-enrolled"><Check size={12} /> Enrolled</span><span className={recognitionEnabled ? 'member-enabled' : 'member-disabled'}>Recognition {recognitionEnabled ? 'Enabled' : 'Disabled'}</span></div></div><div className="member-actions"><button className="secondary-button" onClick={() => setEditing(!editing)}>{editing ? 'Save display name' : 'Edit display name'}</button><button className="secondary-button" onClick={() => setRecognitionEnabled(!recognitionEnabled)}>{recognitionEnabled ? 'Disable recognition' : 'Enable recognition'}</button></div></article>
      {enrollmentRequests.map((request) => <article className="member-row pending-member" key={request.id}><span className="member-avatar pending-avatar"><UserRound size={22} /></span><div className="member-main"><h3>{request.name}</h3><p>Member ID · {request.id}</p><div className="member-flags"><span className="member-pending">Enrollment pending</span><span className="member-disabled">Recognition disabled</span></div></div><span className="pending-date">Requested {new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(request.createdAt))}</span></article>)}
      <div className="privacy-callout"><ShieldCheck size={17} /><p>Recognition is contextual input to the rule-based decision. Unknown or unmatched results are not treated as a threat by themselves.</p></div>
    </> : <div className="enroll-content">
      <div className="enrollment-notice"><Info size={17} /><div><strong>Device enrollment is not connected</strong><p>This demo can queue a member profile, but it cannot capture or store a face. Complete biometric enrollment on the Raspberry Pi after the device workflow is integrated.</p></div></div>
      <form className="enrollment-form" onSubmit={submitEnrollment}>
        <label className="field-label">Display name<input autoComplete="name" placeholder="Enter household member name" value={newMemberName} onChange={(event) => setNewMemberName(event.target.value)} required maxLength={60} /></label>
        <label className="enrollment-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>I have permission to request this person’s enrollment and understand this demo does not capture or save biometric data.</span></label>
        <button className="primary-button" type="submit" disabled={!newMemberName.trim() || !consent}><UserRound size={15} /> Add to enrollment queue</button>
      </form>
      <div className="enrollment-steps"><span className="enrollment-step-current">1 <b>Member profile</b></span><i /><span>2 <b>Device capture</b></span><i /><span>3 <b>Enrollment confirmation</b></span></div>
    </div>}
  </section>
}

function ToggleRow({ title, description, enabled, onChange }: { title: string; description: string; enabled: boolean; onChange: (value: boolean) => void }) {
  return <div className="toggle-row"><div><strong>{title}</strong><p>{description}</p></div><button className={`toggle-switch ${enabled ? 'toggle-on' : ''}`} role="switch" aria-checked={enabled} aria-label={title} onClick={() => onChange(!enabled)}><span /></button></div>
}

export function NotificationSettingsPage({ settings, setSettings }: { settings: { web: boolean; sms: boolean; physical: boolean }; setSettings: (settings: { web: boolean; sms: boolean; physical: boolean }) => void }) {
  const change = (key: keyof typeof settings, value: boolean) => setSettings({ ...settings, [key]: value })
  return <div className="settings-layout"><section className="panel settings-panel"><div className="panel-heading"><div><h2>Notification channels</h2><p>Preferences are local UI settings; this prototype sends no messages.</p></div></div><div className="toggle-list"><ToggleRow title="Web Dashboard Notifications" description="Show event notifications in the dashboard center." enabled={settings.web} onChange={(value) => change('web', value)} /><ToggleRow title="SMS Notifications" description="Configured for future integration. No SMS provider is connected." enabled={settings.sms} onChange={(value) => change('sms', value)} /><ToggleRow title="Physical Sound Alert" description="Preference only. Physical output hardware is not connected." enabled={settings.physical} onChange={(value) => change('physical', value)} /></div></section><aside className="settings-note"><Smartphone size={19} /><h3>Configured vs triggered</h3><p>These toggles represent preferences. Event details show response states saved in each sample record.</p><span className="demo-chip">NO LIVE SMS INTEGRATION</span></aside></div>
}

export function SystemSettingsPage({ homeName, setHomeName, savedHomeName, saveName }: { homeName: string; setHomeName: (name: string) => void; savedHomeName: string; saveName: () => void }) {
  return <div className="settings-layout"><section className="panel settings-panel"><div className="panel-heading"><div><h2>System preferences</h2><p>Prototype identity and data privacy information.</p></div></div><div className="system-setting-form"><label className="field-label">Home / system name<input value={homeName} onChange={(event) => setHomeName(event.target.value)} /></label><button className="secondary-button" onClick={saveName}>Save name</button><span className="save-status">{homeName === savedHomeName ? 'Saved in this session' : 'Unsaved changes'}</span></div><div className="privacy-info"><h3>Data and privacy</h3><p>Sample events are frontend demo data only. Firebase is not configured. This interface stores no credentials, raw audio, continuous video, or facial embeddings.</p></div><div className="privacy-info"><h3>Theme and status</h3><p>Haven’s existing light theme is preserved. Authentication and live telemetry are not implemented.</p></div></section></div>
}

export function L2VerificationPage({ workflowState, remainingSeconds, faceCheckRemaining, onSafe, onNotSafe, onStartDemo, onCreateGuestPass }: {
  workflowState: DemoWorkflowState
  remainingSeconds: number
  faceCheckRemaining: number
  onSafe: () => void
  onNotSafe: () => void
  onStartDemo: () => void
  onCreateGuestPass: () => void
}) {
  const countdown = `${String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:${String(remainingSeconds % 60).padStart(2, '0')}`
  return <section className="verification-screen">
    <div className="verification-heading"><span className="verification-level">L2 · VERIFICATION</span><span className="demo-chip">SIMULATED WORKFLOW</span></div>
    {workflowState === 'verification' ? <article className="verification-prompt panel">
      <div className="verification-timer"><Clock3 size={17} /><span>Response window</span><strong role="timer" aria-label={`${remainingSeconds} seconds remaining`}>{countdown}</strong></div>
      <div className="verification-content"><span className="verification-symbol"><UserRound size={25} /></span><div><h2>Unknown person detected</h2><p>A simulated face check found no enrolled household match. Please confirm whether this person is safe.</p></div></div>
      <div className="verification-context"><ShieldCheck size={16} /><span>Face recognition is contextual; an unknown match is not, by itself, a threat determination.</span></div>
      <div className="verification-actions"><button className="safe-action" type="button" onClick={onSafe}><Check size={16} /> Safe</button><button className="unsafe-action" type="button" onClick={onNotSafe}><CircleAlert size={16} /> Not Safe</button></div>
      <p className="prototype-disclaimer">Safe / Not Safe responses and the 60-second timer are local UI simulation only.</p>
    </article> : workflowState === 'face-check' ? <article className="verification-empty panel"><span className="workflow-icon"><Video size={19} /></span><h2>10-second face check in progress</h2><p>Motion was detected in the simulated workflow. The L2 prompt will appear after the face-check timer completes.</p><div className="face-check-progress"><span style={{ width: `${((10 - faceCheckRemaining) / 10) * 100}%` }} /></div><strong>{faceCheckRemaining} seconds remaining</strong></article> : workflowState === 'safe' ? <article className="verification-empty panel verification-safe-result"><span className="verification-symbol"><Check size={22} /></span><h2>Marked safe</h2><p>The simulated verification was resolved as safe. No L4 escalation was triggered.</p><button className="secondary-button" type="button" onClick={onCreateGuestPass}>Create optional guest pass</button><span className="prototype-disclaimer">Guest passes are local demo state only and grant no physical or recording access.</span></article> : <article className="verification-empty panel"><span className="verification-symbol"><UserRound size={23} /></span><h2>No active verification</h2><p>Run a sample unknown-person prompt to preview the L2 screen and its 60-second response window.</p><button className="primary-button" type="button" onClick={onStartDemo}><Bell size={14} /> Start simulated L2 prompt</button><span className="prototype-disclaimer">No camera, identity matching, or notifications are connected.</span></article>}
  </section>
}

export function L4HighAlertPage({ active, onReturn }: { active: boolean; onReturn: () => void }) {
  return <section className="high-alert-screen">
    <div className="high-alert-heading"><span className="high-alert-level">L4 · HIGH ALERT</span><span className="demo-chip">SIMULATED WORKFLOW</span></div>
    <article className={`high-alert-card panel ${active ? 'high-alert-active' : ''}`}>
      <span className="high-alert-symbol"><ShieldCheck size={26} /></span>
      <span className="high-alert-kicker">{active ? 'ESCALATION ACTIVE' : 'SCREEN PREVIEW'}</span>
      <h2>{active ? 'High alert requires attention' : 'L4 High Alert screen'}</h2>
      <p>{active ? 'The simulated L2 response window expired or was marked Not Safe. Review the event using your household’s response plan.' : 'This is the consistent L4 high-alert presentation. No active demo escalation is in progress.'}</p>
      <div className="high-alert-facts"><span>Escalation level <strong>L4 High Alert</strong></span><span>Source <strong>{active ? 'L2 verification' : 'No active event'}</strong></span><span>System action <strong>UI state only</strong></span></div>
      <p className="prototype-disclaimer">No SMS, physical alarm, emergency service, or backend alert is triggered by this screen.</p>
      <button className="secondary-button" type="button" onClick={onReturn}>Return to overview</button>
    </article>
  </section>
}

export function GuestPassesPage({ passes, onCreatePass, onRevokePass }: {
  passes: GuestPass[]
  onCreatePass: (guestName: string, durationDays: number) => void
  onRevokePass: (id: string) => void
}) {
  const [guestName, setGuestName] = useState('')
  const [durationDays, setDurationDays] = useState(1)
  const [currentTime, setCurrentTime] = useState(initialRenderTime)

  useEffect(() => {
    const interval = window.setInterval(() => setCurrentTime(Date.now()), 60_000)
    return () => window.clearInterval(interval)
  }, [])

  function submitPass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = guestName.trim()
    if (!name) return
    onCreatePass(name, durationDays)
    setGuestName('')
    setDurationDays(1)
  }

  return <div className="guest-pass-layout">
    <section className="panel guest-pass-panel">
      <div className="panel-heading"><div><h2>Create a guest pass</h2><p>Choose a temporary household visit duration from 1 to 7 days.</p></div><span className="demo-chip">OPTIONAL · DEMO</span></div>
      <form className="guest-pass-form" onSubmit={submitPass}>
        <label className="field-label">Guest name<input value={guestName} onChange={(event) => setGuestName(event.target.value)} placeholder="Enter guest name" required maxLength={60} /></label>
        <label className="field-label">Pass duration<select value={durationDays} onChange={(event) => setDurationDays(Number(event.target.value))}>{Array.from({ length: 7 }, (_, index) => index + 1).map((days) => <option key={days} value={days}>{days} {days === 1 ? 'day' : 'days'}</option>)}</select></label>
        <button className="primary-button" type="submit" disabled={!guestName.trim()}><Users size={14} /> Create guest pass</button>
      </form>
      <p className="prototype-disclaimer guest-pass-note">Passes are stored in browser memory for this demo. They do not unlock a door, create an account, or grant access to recordings.</p>
    </section>
    <section className="panel guest-pass-panel">
      <div className="panel-heading"><div><h2>Guest passes</h2><p>{passes.length} pass{passes.length === 1 ? '' : 'es'} created in this session.</p></div></div>
      {passes.length ? <div className="guest-pass-list">{passes.map((pass) => {
        const expired = new Date(pass.expiresAt).getTime() <= currentTime
        return <article className="guest-pass-row" key={pass.id}><span className="guest-pass-avatar"><Users size={17} /></span><div className="guest-pass-info"><strong>{pass.guestName}</strong><span>{pass.durationDays} day{pass.durationDays === 1 ? '' : 's'} · expires {new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(pass.expiresAt))}</span></div><span className={`guest-pass-status ${expired ? 'guest-pass-expired' : ''}`}>{expired ? 'Expired' : 'Active · demo'}</span>{!expired && <button className="text-button" type="button" onClick={() => onRevokePass(pass.id)}>Revoke</button>}</article>
      })}</div> : <div className="guest-pass-empty"><Users size={20} /><strong>No guest passes yet</strong><span>Create an optional pass for a 1–7 day visit.</span></div>}
    </section>
  </div>
}

export function PrivacySettingsPage() {
  return <div className="privacy-settings-layout">
    <div className="privacy-policy-banner"><ShieldCheck size={20} /><div><strong>Privacy policy preview</strong><p>These settings describe the thesis policy; this demo has no media-retention or authorization backend.</p></div><span className="demo-chip">POLICY · NOT ENFORCED</span></div>
    <section className="privacy-policy-grid">
      <article className="panel privacy-policy-card"><span className="privacy-policy-icon"><Clock3 size={18} /></span><span className="mode-kicker">EVENT MEDIA RETENTION</span><strong className="retention-value">15 days</strong><p>Event recordings and associated snapshots should be retained for no more than 15 days, then deleted.</p><span className="policy-status">Target policy · automatic deletion not implemented</span></article>
      <article className="panel privacy-policy-card"><span className="privacy-policy-icon"><ShieldCheck size={18} /></span><span className="mode-kicker">RECORDING ACCESS POLICY</span><strong className="retention-value">Main user only</strong><p>Only the main user should download or delete recordings. Guest passes must not grant live-view, playback, or download access.</p><span className="policy-status">Policy requirement · no access-control backend</span></article>
    </section>
    <div className="privacy-enforcement-note"><Info size={16} /><p>This app contains sample event data, not recordings. Authentication, authorization, recording-access logs, download/delete controls, and automatic 15-day deletion are not implemented.</p></div>
  </div>
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="empty-state"><span><Search size={18} /></span><strong>{title}</strong><p>{text}</p></div>
}
