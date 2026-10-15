import { useState, type FormEvent } from 'react'
import {
  Activity, ArrowUpRight, Bell, Check, CircleAlert, Clock3, Info,
  Cpu, Database, Mic2, Search, ShieldCheck, SlidersHorizontal,
  Smartphone, UserRound, Users, Video, Wifi, Radio, AudioLines, Power, type LucideIcon,
} from 'lucide-react'
import { AcousticBadge, DecisionBadge } from './thesisBadges'
import { acousticClasses, faceResults, type SecurityEvent } from '../models/securityEvent'
import { demoDevices, demoHouseholdMember, demoSystem } from '../services/systemService'
import type { EventFilters } from '../services/eventService'

const formatTime = (timestamp: string) => new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(new Date(timestamp))
const formatDate = (timestamp: string) => new Intl.DateTimeFormat('en', { month: '2-digit', day: '2-digit', year: 'numeric' }).format(new Date(timestamp))
const formatShortDate = (timestamp: string) => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(timestamp))

export function OverviewPage({ events, alerts, eventsToday, onOpenEvent, onNavigate }: { events: SecurityEvent[]; alerts: number; eventsToday: number; onOpenEvent: (event: SecurityEvent) => void; onNavigate: (page: 'Event History') => void }) {
  const counts = acousticClasses.map((label) => ({ label, count: events.filter((event) => event.acousticClass === label).length }))
  const bars = Array.from({ length: 12 }, (_, index) => events.filter((event) => Math.floor(new Date(event.timestamp).getHours() / 2) === index).length)
  const maxBar = Math.max(1, ...bars)
  return <>
    <LiveMonitoringPanel />
    <section className="status-strip thesis-status-strip"><div className="status-intro"><span className="status-emblem"><ShieldCheck size={22} /></span><div><strong>Prototype preview · DEMO</strong><span>Illustrative state · hardware telemetry not connected</span></div></div><div className="thesis-status-metrics"><StatusMetric icon={Mic2} title="DEMO" label="Audio pipeline" tone="green" /><StatusMetric icon={Video} title="NOT CONNECTED" label="Camera buffer" tone="blue" /><StatusMetric icon={UserRound} title="PLANNED" label="Recognition on event" tone="amber" /><StatusMetric icon={Database} title="NOT CONNECTED" label="Firebase sync" tone="muted" /></div></section>
    <section className="pipeline-strip"><span className="pipeline-label">EVENT WORKFLOW</span>{['Audio monitoring', 'Audio classification', 'Qualifying event', 'Visual verification', 'Rule-based decision', 'Alert / response', 'Event log + snapshot + notifications'].map((step, index) => <div className="pipeline-step" key={step}><span className="pipeline-number">0{index + 1}</span><span>{step}</span>{index < 6 && <i>→</i>}</div>)}</section>
    <section className="stats-grid thesis-stats-grid"><StatCard label="Active alerts" value={alerts} hint="Unread demo notifications" tone="red" icon={Bell} /><StatCard label="Events today" value={eventsToday} hint="Local demo dataset" tone="green" icon={Activity} /><StatCard label="Devices online" value="—" hint="No live device telemetry" tone="blue" icon={Wifi} /><StatCard label="Avg. response" value="1.42 s" hint="Sample · not measured" tone="amber" icon={Clock3} /></section>
    <div className="content-grid thesis-content-grid"><section className="panel chart-panel"><div className="panel-heading"><div><h2>Acoustic Events · Demo Dataset</h2><p>Sample events per two-hour window · not live measurements</p></div><span className="stat-period">LAST 24 HOURS</span></div><div className="event-chart">{bars.map((count, index) => <div className="event-chart-column" key={index}><span className={`event-chart-bar ${count ? 'has-events' : ''}`} style={{ height: `${count ? Math.max(14, count / maxBar * 100) : 5}%` }} title={`${count} sample events`} /><small>{String(index * 2).padStart(2, '0')}</small></div>)}</div><div className="chart-legend"><span><i /> Sample acoustic events</span><span>Demo records only</span></div></section><section className="panel distribution-panel"><div className="panel-heading"><div><h2>Events by acoustic class</h2><p>Counts in sample dataset</p></div></div><div className="class-count-list">{counts.map(({ label, count }) => <div className="class-count-row" key={label}><AcousticBadge acousticClass={label} /><strong>{count}</strong></div>)}</div></section></div>
    <section className="panel events-panel thesis-events-panel"><div className="panel-heading"><div><h2>Recent acoustic events</h2><p>Audio classification followed by contextual visual verification</p></div><button className="text-button" onClick={() => onNavigate('Event History')}>Event history <ArrowUpRight size={15} /></button></div><EventTable events={events.slice(0, 5)} onOpenEvent={onOpenEvent} compact /></section>
  </>
}



function LiveMonitoringPanel() {
  const [motionEnabled, setMotionEnabled] = useState(false)
  const [audioMode, setAudioMode] = useState<'prototype' | 'browser'>('prototype')
  const bars = [12, 20, 9, 29, 16, 24, 11, 32, 19, 13, 27, 16, 35, 22, 11, 25, 17, 30, 14, 23, 10, 28, 18, 12, 32, 20, 15, 26, 11, 22, 16, 30, 12, 25, 18, 9, 28, 15, 21, 13, 31, 18, 11, 24, 15, 27, 10, 20]
  return <section className="live-monitor-grid" aria-label="Live monitoring controls">
    <article className="panel live-audio-card">
      <div className="live-card-heading">
        <div className="live-card-title"><span className="live-card-icon"><AudioLines size={18} /></span><div><h2>Live audio feed</h2><p>Prototype microphone · Raspberry Pi 5</p></div></div>
        <span className="connection-pill connection-off"><i /> NOT CONNECTED</span>
      </div>
      <div className="audio-feed-preview">
        <div className="audio-feed-topline"><span><Radio size={13} /> AUDIO INPUT</span><span>Awaiting device stream</span></div>
        <div className="audio-waveform" role="img" aria-label="Static waveform placeholder, not live audio">{bars.map((height, index) => <i key={index} style={{ height: height + 'px' }} />)}</div>
        <div className="audio-feed-footer"><span><span className="audio-status-dot" /> No live signal</span><span>Level: — dBFS</span><span>Classification: waiting</span></div>
      </div>
      <div className="audio-card-bottom"><span>Live waveform will appear when the Pi stream is connected.</span><button className="monitor-secondary-button" onClick={() => setAudioMode((mode) => mode === 'prototype' ? 'browser' : 'prototype')}>Input: {audioMode === 'prototype' ? 'Prototype mic' : 'Browser preview'}</button></div>
      <p className="preview-note">Input selector is a UI preview only; it does not open a microphone or connect to hardware.</p>
    </article>
    <article className="panel motion-control-card">
      <div className="live-card-heading">
        <div className="live-card-title"><span className="live-card-icon motion-icon"><Activity size={18} /></span><div><h2>Motion sensor</h2><p>Raspberry Pi GPIO control</p></div></div>
        <span className="connection-pill connection-off"><i /> DEVICE OFFLINE</span>
      </div>
      <div className="motion-state-panel">
        <div className="motion-state-icon"><Activity size={24} /></div>
        <div><span className="motion-state-label">SENSOR MONITORING</span><strong>{motionEnabled ? 'Enabled · UI preview' : 'Disabled · UI preview'}</strong><small>Hardware state unavailable</small></div>
      </div>
      <div className="motion-toggle-row"><div><strong>Motion detection</strong><small>{motionEnabled ? 'Preview switch is on' : 'Preview switch is off'}</small></div><button type="button" className={`motion-toggle ${motionEnabled ? 'motion-toggle-on' : ''}`} role="switch" aria-checked={motionEnabled} aria-label="Toggle motion sensor UI preview" onClick={() => setMotionEnabled((enabled) => !enabled)}><span /></button></div>
      <div className="motion-last-event"><span>LAST MOTION EVENT</span><strong>—</strong><small>No live sensor data received</small></div>
      <div className="motion-warning"><Info size={14} /><span>This switch only previews the interface. It will control the physical sensor after the authenticated device API is connected.</span></div>
    </article>
  </section>
}

function StatusMetric({ icon: Icon, title, label, tone }: { icon: LucideIcon; title: string; label: string; tone: string }) {
  return <div className="status-metric"><span className={`metric-icon ${tone}`}><Icon size={16} /></span><span><strong>{title}</strong><small>{label}</small></span></div>
}

function StatCard({ label, value, hint, tone, icon: Icon }: { label: string; value: string | number; hint: string; tone: string; icon: LucideIcon }) {
  return <article className="stat-card"><div className="stat-top"><span>{label}</span><span className={`stat-icon ${tone}`}><Icon size={17} /></span></div><div className="stat-value">{value}</div><p>{hint}</p></article>
}

export function EventTable({ events, onOpenEvent, compact = false }: { events: SecurityEvent[]; onOpenEvent: (event: SecurityEvent) => void; compact?: boolean }) {
  return <div className="event-table-wrap"><table className={`event-table thesis-event-table ${compact ? 'compact-table' : ''}`}><thead><tr><th>DATE / TIME</th><th>ACOUSTIC CLASS</th><th>AUDIO CONFIDENCE</th><th>FACE RESULT</th><th>FINAL DECISION</th><th>RESPONSE STATUS</th></tr></thead><tbody>{events.map((event) => <tr key={event.id} className="event-table-row" onClick={() => onOpenEvent(event)} tabIndex={0} onKeyDown={(keyEvent) => { if (keyEvent.key === 'Enter' || keyEvent.key === ' ') onOpenEvent(event) }}><td><strong>{formatDate(event.timestamp)}</strong><small>{formatTime(event.timestamp)}</small></td><td><AcousticBadge acousticClass={event.acousticClass} /></td><td>{(event.audioConfidence * 100).toFixed(1)}%</td><td>{event.faceResult}</td><td><DecisionBadge decision={event.decision} /></td><td><span className="response-status">{event.status}</span></td></tr>)}</tbody></table>{events.length === 0 && <EmptyState title="No matching events" text="Change a filter or search term to see sample events." />}</div>
}

export function EventHistoryPage({ events, filters, setFilters, onOpenEvent }: { events: SecurityEvent[]; filters: EventFilters; setFilters: (filters: EventFilters) => void; onOpenEvent: (event: SecurityEvent) => void }) {
  const change = (key: keyof EventFilters, value: string) => setFilters({ ...filters, [key]: value } as EventFilters)
  const clear = () => setFilters({ search: '', startDate: '', endDate: '', acousticClass: 'All', faceResult: 'All', decision: 'All' })
  return <section className="panel history-panel"><div className="panel-heading"><div><h2>Event history</h2><p>{events.length} matching records · demo dataset</p></div><button className="secondary-button" onClick={clear}><SlidersHorizontal size={14} /> Clear filters</button></div><div className="history-filters"><label className="history-search"><Search size={15} /><input aria-label="Search event history" placeholder="Search class, face result, decision" value={filters.search} onChange={(event) => change('search', event.target.value)} /></label><label className="history-filter"><span>Acoustic class</span><select value={filters.acousticClass} onChange={(event) => change('acousticClass', event.target.value)}><option>All</option>{acousticClasses.map((item) => <option key={item}>{item}</option>)}</select></label><label className="history-filter"><span>Face result</span><select value={filters.faceResult} onChange={(event) => change('faceResult', event.target.value)}><option>All</option>{faceResults.map((item) => <option key={item}>{item}</option>)}</select></label><label className="history-filter"><span>Decision</span><select value={filters.decision} onChange={(event) => change('decision', event.target.value)}><option>All</option><option>Log Only</option><option>Attention</option><option>Verification</option><option>Alert</option><option>Higher-Level Alert</option><option>Higher-Level Verification</option></select></label><label className="history-filter date-filter"><span>From</span><input type="date" value={filters.startDate} onChange={(event) => change('startDate', event.target.value)} /></label><label className="history-filter date-filter"><span>To</span><input type="date" value={filters.endDate} onChange={(event) => change('endDate', event.target.value)} /></label></div><EventTable events={events} onOpenEvent={onOpenEvent} /></section>
}

export function AlertsPage({ events, onOpenEvent }: { events: SecurityEvent[]; onOpenEvent: (event: SecurityEvent) => void }) {
  return <section className="panel alert-page-panel"><div className="panel-heading"><div><h2>Events requiring review</h2><p>{events.length} sample events · response states from demo records</p></div><span className="demo-chip">SAMPLE DATA</span></div><div className="thesis-alert-list">{events.map((event) => <article className={`thesis-alert-card alert-tone-${event.alertLevel.toLowerCase().replaceAll(' ', '-')}`} key={event.id}><span className="thesis-alert-icon"><CircleAlert size={18} /></span><div className="thesis-alert-main"><div className="alert-title-row"><DecisionBadge decision={event.decision} /><span className="alert-card-time">{formatShortDate(event.timestamp)} · {formatTime(event.timestamp)}</span></div><h3>{event.acousticClass} detected</h3><div className="alert-facts"><span>Audio confidence <b>{(event.audioConfidence * 100).toFixed(1)}%</b></span><span>Face <b>{event.faceResult}</b></span><span>Verification <b>{event.decision.includes('Verification') ? 'Required' : 'Not required'}</b></span></div><div className="response-chip-row"><ResponseChip active={event.responses.eventLogged}>Logged</ResponseChip><ResponseChip active={event.responses.dashboardNotification}>Web notification</ResponseChip><ResponseChip active={event.responses.physicalSoundAlert}>Physical alert</ResponseChip><ResponseChip active={event.responses.smsNotification}>SMS</ResponseChip></div></div><button className="secondary-button review-event-button" onClick={() => onOpenEvent(event)}>Review event <ArrowUpRight size={14} /></button></article>)}</div></section>
}

function ResponseChip({ active, children }: { active: boolean; children: string }) {
  return <span className={`response-chip ${active ? 'response-chip-on' : ''}`}>{active && <Check size={11} />}{children}: {active ? 'Sent' : 'Not Triggered'}</span>
}

export function SystemStatusPage() {
  return <><div className="status-callout"><span className="status-dot" /><div><strong>System prototype · demo status</strong><p>Illustrative UI states, not telemetry from connected thesis hardware.</p></div><span className="demo-chip">NO LIVE TELEMETRY</span></div><div className="system-status-grid"><SystemCard title="EDGE COMPUTING" icon={Cpu} name={demoSystem.edge.name} status={demoSystem.edge.status} rows={[["Memory", demoSystem.edge.memory], ["CPU", demoSystem.edge.cpu], ["Memory status", demoSystem.edge.memoryStatus], ["Storage", demoSystem.edge.storage], ["Uptime", demoSystem.edge.uptime]]} /><SystemCard title="AUDIO SYSTEM" icon={Mic2} name={demoSystem.audio.name} status={demoSystem.audio.status} rows={[["Audio Monitoring", demoSystem.audio.monitoring], ["Audio Classifier", demoSystem.audio.classifier], ["Current State", demoSystem.audio.currentState], ["Audio path", "Mel-Spectrogram → Lightweight CNN"]]} /><SystemCard title="CAMERA · EVENT-TRIGGERED" icon={Video} name={demoSystem.camera.name} status={demoSystem.camera.status} rows={[["Rolling Buffer", demoSystem.camera.rollingBuffer], ["Face Detection", demoSystem.camera.faceDetection], ["Facial Recognition", demoSystem.camera.recognition], ["Recognition model", "MobileFaceNet-based"]]} note={demoSystem.camera.note} /><SystemCard title="CLOUD" icon={Database} name={demoSystem.cloud.name} status={demoSystem.cloud.status} rows={[["Last Sync", demoSystem.cloud.lastSync], ["Event Logs", demoSystem.cloud.eventLogs], ["Selected Event Media", demoSystem.cloud.selectedMedia]]} note={demoSystem.cloud.privacy} /></div><PipelinePanel /></>
}

function SystemCard({ title, icon: Icon, name, status, rows, note }: { title: string; icon: LucideIcon; name: string; status: string; rows: [string, string][]; note?: string }) {
  return <section className="panel system-card"><div className="system-card-head"><span className="system-icon"><Icon size={18} /></span><span className="system-eyebrow">{title}</span></div><div className="system-name-row"><h2>{name}</h2><span className={`system-state ${status === 'Connected' || status === 'Online' ? 'state-ok' : 'state-muted'}`}><i />{status}</span></div><div className="system-details">{rows.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>{note && <p className="system-note">{note}</p>}</section>
}

function PipelinePanel() {
  return <section className="panel pipeline-explainer"><div className="panel-heading"><div><h2>Audio-first processing</h2><p>Facial recognition is event-triggered, not continuous</p></div></div><div className="pipeline-flow"><PipelineBlock icon={Mic2} title="ICS-43434" note="Audio input" /><b>→</b><PipelineBlock icon={Activity} title="Mel-Spectrogram" note="Lightweight CNN" /><b>→</b><PipelineBlock icon={CircleAlert} title="Qualifying audio" note="Acoustic class" /><b>→</b><PipelineBlock icon={Video} title="Camera frame" note="Short rolling buffer" muted /><b>→</b><PipelineBlock icon={UserRound} title="Face check" note="On qualifying event" muted /><b>→</b><PipelineBlock icon={ShieldCheck} title="Rule-based" note="Decision / response" /></div></section>
}

function PipelineBlock({ icon: Icon, title, note, muted = false }: { icon: LucideIcon; title: string; note: string; muted?: boolean }) {
  return <span className={`pipeline-block ${muted ? 'pipeline-standby' : ''}`}><Icon size={17} /><strong>{title}</strong><small>{note}</small></span>
}

export function DevicesPage() {
  const icons = [Mic2, Video, Database, Wifi, Bell]
  return <><div className="device-host-card"><span className="device-card-icon"><Cpu size={20} /></span><div><span className="device-kind">EDGE COMPUTER · DEMO STATUS</span><h2>Raspberry Pi 5</h2><p>16 GB RAM · Online in sample interface</p></div><span className="device-status"><span className="status-dot" />Online</span></div><div className="device-list-grid thesis-device-grid">{demoDevices.slice(1).map((device, index) => { const Icon = icons[index]; return <article className="device-card" key={device.name}><div className="device-card-top"><span className="device-card-icon"><Icon size={19} /></span><span className="device-status"><span className="status-dot" />{device.status}</span></div><span className="device-kind">CONNECTED COMPONENT</span><h3>{device.name}</h3><p>{device.detail}</p></article> })}</div><p className="page-inline-note">The physical sound alert model has not been specified. No buzzer model is assumed.</p></>
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

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="empty-state"><span><Search size={18} /></span><strong>{title}</strong><p>{text}</p></div>
}
