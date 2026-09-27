import { useState } from 'react'
import { Activity, ArrowUpRight, Bell, Check, CheckCheck, ChevronDown, DoorOpen, LayoutDashboard, LockKeyhole, Menu, Search, ShieldCheck, Siren, Thermometer, Video, Wifi, X, type LucideIcon } from 'lucide-react'
import './App.css'

type Severity = 'critical' | 'warning' | 'info'
type View = 'Overview' | 'Alerts' | 'Activity log' | 'Devices'

interface AlertItem {
  id: number
  title: string
  detail: string
  location: string
  time: string
  severity: Severity
  icon: LucideIcon
  acknowledged: boolean
}

interface EventItem {
  id: number
  title: string
  detail: string
  location: string
  time: string
  icon: LucideIcon
  tone: string
}

const startingAlerts: AlertItem[] = [
  { id: 1, title: 'Side gate opened', detail: 'Contact sensor triggered while system was armed', location: 'Side gate', time: '2 min ago', severity: 'critical', icon: DoorOpen, acknowledged: false },
  { id: 2, title: 'Motion detected', detail: 'Movement picked up in the back garden', location: 'Back garden', time: '18 min ago', severity: 'warning', icon: Video, acknowledged: false },
  { id: 3, title: 'Front door unlocked', detail: 'Unlocked with a registered keypad code', location: 'Front entrance', time: '8:24 AM', severity: 'info', icon: LockKeyhole, acknowledged: true },
]

const events: EventItem[] = [
  { id: 1, title: 'Side gate opened', detail: 'Contact sensor · Opened', location: 'Side gate', time: '9:39 AM', icon: DoorOpen, tone: 'danger' },
  { id: 2, title: 'Motion detected', detail: 'Outdoor camera · Person detected', location: 'Back garden', time: '9:23 AM', icon: Video, tone: 'amber' },
  { id: 3, title: 'System armed', detail: 'Armed away · Keypad', location: 'Front entrance', time: '8:02 AM', icon: ShieldCheck, tone: 'green' },
  { id: 4, title: 'Front door unlocked', detail: 'Access granted · PIN code', location: 'Front entrance', time: '8:24 AM', icon: LockKeyhole, tone: 'blue' },
  { id: 5, title: 'Temperature normal', detail: 'Climate sensor · 21°C', location: 'Living room', time: '7:46 AM', icon: Thermometer, tone: 'blue' },
]

function App() {
  const [view, setView] = useState<View>('Overview')
  const [alerts, setAlerts] = useState(startingAlerts)
  const [query, setQuery] = useState('')
  const [severity, setSeverity] = useState('All severity')
  const [armed, setArmed] = useState(true)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const activeAlerts = alerts.filter((alert) => !alert.acknowledged).length
  const matches = (text: string) => text.toLowerCase().includes(query.toLowerCase())
  const filteredAlerts = alerts.filter((alert) => matches(`${alert.title} ${alert.detail} ${alert.location}`) && (severity === 'All severity' || alert.severity === severity.toLowerCase()))
  const filteredEvents = events.filter((event) => matches(`${event.title} ${event.detail} ${event.location}`))

  function acknowledge(id: number) {
    setAlerts((items) => items.map((alert) => alert.id === id ? { ...alert, acknowledged: true } : alert))
  }

  function selectView(nextView: View) {
    setView(nextView)
    setMobileNavOpen(false)
    setQuery('')
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNavOpen ? 'sidebar-open' : ''}`}>
        <a className="brand" href="#overview" onClick={() => selectView('Overview')}><span className="brand-mark"><ShieldCheck size={21} /></span><span className="brand-name">Haven<span>home</span></span></a>
        <div className="home-switcher"><span className="home-avatar">H</span><span className="home-copy"><strong>Hillcrest House</strong><small>Home · 1 location</small></span><ChevronDown size={15} /></div>
        <span className="nav-label">YOUR HOME</span>
        <nav className="primary-nav" aria-label="Main navigation">
          {([{ label: 'Overview', icon: LayoutDashboard }, { label: 'Alerts', icon: Bell }, { label: 'Activity log', icon: Activity }, { label: 'Devices', icon: Wifi }] as { label: View; icon: LucideIcon }[]).map(({ label, icon: Icon }) => <button key={label} className={`nav-item ${view === label ? 'nav-item-active' : ''}`} onClick={() => selectView(label)}><Icon size={18} /><span>{label}</span>{label === 'Alerts' && activeAlerts > 0 && <span className="nav-count">{activeAlerts}</span>}</button>)}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-protection"><span className="protection-icon"><ShieldCheck size={18} /></span><div><strong>Home protected</strong><small>All systems operational</small></div><span className="status-dot" /></div>
        <button className="profile-button"><span className="profile-avatar">CJ</span><span className="profile-copy"><strong>Carl Johnson</strong><small>Home owner</small></span><ChevronDown size={15} /></button>
      </aside>
      {mobileNavOpen && <button className="nav-scrim" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}

      <main className="main-area">
        <header className="topbar"><button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}><Menu size={20} /></button><div className="breadcrumb"><span>Hillcrest House</span><span className="breadcrumb-slash">/</span><strong>{view}</strong></div>
          <div className="topbar-actions"><label className="search-box"><Search size={17} /><input aria-label="Search alerts and activity" placeholder="Search anything..." value={query} onChange={(event) => setQuery(event.target.value)} />{query ? <button className="search-clear" aria-label="Clear search" onClick={() => setQuery('')}><X size={14} /></button> : <kbd>/</kbd>}</label><button className="icon-button notification-button" aria-label={`${activeAlerts} unread alerts`} onClick={() => selectView('Alerts')}><Bell size={19} />{activeAlerts > 0 && <span className="notification-dot" />}</button><span className="topbar-divider" /><span className="today-label">Today · Home</span></div>
        </header>

        <div className="page-content">
          <div className="page-heading"><div><p className="eyebrow">SUNDAY, SEPTEMBER 27</p><h1>{view === 'Overview' ? 'Good morning, Carl' : view}</h1><p className="page-subtitle">{view === 'Overview' ? 'Here’s what’s happening at home today.' : view === 'Alerts' ? 'Review and manage your home security alerts.' : view === 'Activity log' ? 'A complete record of activity across your home.' : 'Check the status of your connected security devices.'}</p></div><button className={`arm-button ${armed ? 'is-armed' : 'is-disarmed'}`} onClick={() => setArmed(!armed)}><span className="arm-indicator" />{armed ? 'Armed' : 'Disarmed'}<ChevronDown size={15} /></button></div>

          <section className="status-strip"><div className="status-intro"><span className="status-emblem"><ShieldCheck size={22} /></span><div><strong>{armed ? 'Your home is protected' : 'Your system is disarmed'}</strong><span>{armed ? 'Armed away · Since 8:02 AM' : 'Sensors are active · Alarm is off'}</span></div></div><div className="status-metrics"><div className="status-metric"><span className="metric-icon green"><Wifi size={16} /></span><span><strong>Online</strong><small>Hub connection</small></span></div><div className="status-metric"><span className="metric-icon amber"><Activity size={16} /></span><span><strong>86%</strong><small>Hub battery</small></span></div><div className="status-metric"><span className="metric-icon green"><ShieldCheck size={16} /></span><span><strong>8 of 8</strong><small>Sensors active</small></span></div></div></section>

          {view === 'Overview' && <>
            <section className="stats-grid"><article className="stat-card"><div className="stat-top"><span>Active alerts</span><span className="stat-icon red"><Siren size={17} /></span></div><div className="stat-value">{activeAlerts}<span className="stat-change negative"><ArrowUpRight size={14} /> 1 new</span></div><p>Needs your attention</p></article><article className="stat-card"><div className="stat-top"><span>Events today</span><span className="stat-icon green"><Activity size={17} /></span></div><div className="stat-value">24<span className="stat-change positive">-12%</span></div><p>Compared to yesterday</p></article><article className="stat-card"><div className="stat-top"><span>Devices online</span><span className="stat-icon blue"><Wifi size={17} /></span></div><div className="stat-value">8<span className="stat-total">/ 8</span><span className="stat-change quiet">All connected</span></div><p>Across 4 rooms</p></article><article className="stat-card activity-stat"><div className="stat-top"><span>Home activity</span><span className="stat-period">Last 24 hours</span></div><div className="activity-chart" aria-label="Hourly activity chart">{[22, 32, 18, 14, 10, 17, 38, 72, 50, 29, 22, 17, 30, 24, 19, 46, 62, 40, 27, 19, 33, 24, 16, 12].map((height, index) => <span key={index} style={{ height: `${height}%` }} className={index === 7 ? 'bar-highlight' : ''} />)}</div><div className="chart-labels"><span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>Now</span></div></article></section>
            <div className="content-grid"><section className="panel alerts-panel"><div className="panel-heading"><div><div className="panel-title-line"><h2>Needs your attention</h2><span className="panel-count">{activeAlerts}</span></div><p>Recent alerts from your devices</p></div><button className="text-button" onClick={() => selectView('Alerts')}>View all <ArrowUpRight size={15} /></button></div><AlertList alerts={alerts.filter((alert) => !alert.acknowledged).slice(0, 3)} onAcknowledge={acknowledge} compact />{activeAlerts === 0 && <EmptyState />}</section>
              <section className="panel device-panel"><div className="panel-heading"><div><h2>Your devices</h2><p>All 8 devices are connected</p></div><button className="icon-button panel-more" aria-label="View all devices" onClick={() => selectView('Devices')}><ArrowUpRight size={17} /></button></div><div className="device-summary"><div className="device-ring"><span>8<small>/8</small></span></div><div><strong>Everything is online</strong><p>Last checked just now</p><span className="device-online"><span className="status-dot" /> No connection issues</span></div></div><div className="device-types"><span><Video size={15} /><b>2</b> Cameras</span><span><ShieldCheck size={15} /><b>4</b> Sensors</span><span><Activity size={15} /><b>2</b> Climate</span></div></section></div>
            <EventPanel events={filteredEvents.slice(0, 4)} title="Recent activity" subtitle="Latest events from your home" onViewAll={() => selectView('Activity log')} />
          </>}

          {view === 'Alerts' && <section className="panel full-panel"><div className="panel-heading filter-heading"><div><h2>All alerts</h2><p>{activeAlerts} unacknowledged · {alerts.length} total</p></div><div className="filter-controls"><label className="filter-select"><span>Severity</span><select value={severity} onChange={(event) => setSeverity(event.target.value)}><option>All severity</option><option>Critical</option><option>Warning</option><option>Info</option></select><ChevronDown size={14} /></label>{activeAlerts > 0 && <button className="secondary-button" onClick={() => setAlerts((items) => items.map((alert) => ({ ...alert, acknowledged: true })))}><CheckCheck size={15} /> Acknowledge all</button>}</div></div><AlertList alerts={filteredAlerts} onAcknowledge={acknowledge} />{filteredAlerts.length === 0 && <EmptyState />}</section>}

          {view === 'Activity log' && <EventPanel events={filteredEvents} title="All activity" subtitle={`${filteredEvents.length} events shown`} />}
          {view === 'Devices' && <DeviceList />}
          <footer className="page-footer"><span><span className="status-dot" /> Haven system healthy</span><span>Last synced just now · Firmware up to date</span></footer>
        </div>
      </main>
    </div>
  )
}

function AlertList({ alerts, onAcknowledge, compact = false }: { alerts: AlertItem[]; onAcknowledge: (id: number) => void; compact?: boolean }) {
  return <div className={`alert-list ${compact ? 'alert-list-compact' : ''}`}>{alerts.map((alert) => { const Icon = alert.icon; return <article className="alert-row" key={alert.id}><span className={`alert-icon ${alert.severity}`}><Icon size={18} /></span><div className="alert-copy"><div className="alert-title-row"><h3>{alert.title}</h3><span className={`severity-tag ${alert.severity}`}>{alert.severity}</span></div><p>{alert.detail}</p><div className="alert-meta"><span>{alert.location}</span><span>·</span><span>{alert.time}</span></div></div>{alert.acknowledged ? <span className="acknowledged-label"><Check size={14} /> Acknowledged</span> : <button className="acknowledge-button" onClick={() => onAcknowledge(alert.id)}><Check size={14} /><span>Acknowledge</span></button>}</article>})}</div>
}

function EventPanel({ events: visibleEvents, onViewAll, title, subtitle }: { events: EventItem[]; onViewAll?: () => void; title: string; subtitle: string }) {
  return <section className="panel events-panel"><div className="panel-heading"><div><h2>{title}</h2><p>{subtitle}</p></div>{onViewAll && <button className="text-button" onClick={onViewAll}>View activity log <ArrowUpRight size={15} /></button>}</div><div className="event-table-wrap"><table className="event-table"><thead><tr><th>EVENT</th><th>LOCATION</th><th>TIME</th><th>STATUS</th></tr></thead><tbody>{visibleEvents.map((event) => { const Icon = event.icon; return <tr key={event.id}><td><span className={`event-icon ${event.tone}`}><Icon size={16} /></span><span className="event-description"><strong>{event.title}</strong><small>{event.detail}</small></span></td><td>{event.location}</td><td>{event.time}</td><td><span className={`event-status ${event.tone}`}><span />{event.tone === 'danger' ? 'Alert' : event.tone === 'amber' ? 'Motion' : 'Recorded'}</span></td></tr>})}</tbody></table></div>{visibleEvents.length === 0 && <EmptyState />}</section>
}

function EmptyState() {
  return <div className="empty-state"><span><CheckCheck size={18} /></span><strong>All caught up</strong><p>No matching activity needs your attention.</p></div>
}

function DeviceList() {
  const devices = [{ name: 'Haven Hub', location: 'Hallway', kind: 'Security hub', icon: ShieldCheck, meta: 'Battery 86% · Connected' }, { name: 'Front door sensor', location: 'Front entrance', kind: 'Entry sensor', icon: ShieldCheck, meta: 'Battery 94% · Closed' }, { name: 'Side gate sensor', location: 'Side gate', kind: 'Entry sensor', icon: ShieldCheck, meta: 'Battery 78% · Open' }, { name: 'Garden camera', location: 'Back garden', kind: 'Security camera', icon: Video, meta: 'Streaming · 1080p' }, { name: 'Living room sensor', location: 'Living room', kind: 'Climate sensor', icon: Activity, meta: '21°C · 48% humidity' }, { name: 'Bedroom camera', location: 'Upstairs', kind: 'Security camera', icon: Video, meta: 'Privacy mode · 1080p' }]
  return <section className="device-list-grid">{devices.map(({ name, location, kind, icon: Icon, meta }) => <article className="device-card" key={name}><div className="device-card-top"><span className="device-card-icon"><Icon size={19} /></span><span className="device-status"><span className="status-dot" />Online</span></div><span className="device-kind">{kind}</span><h3>{name}</h3><p>{location}</p><div className="device-card-meta"><span>{meta}</span><ArrowUpRight size={15} /></div></article>)}</section>
}

export default App
