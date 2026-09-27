import { useMemo, useState } from 'react'
import { Activity, Bell, ChevronDown, Cpu, FileClock, LayoutDashboard, Menu, Search, Settings, ShieldCheck, Users, X, type LucideIcon } from 'lucide-react'
import { EventDetailsModal } from './components/EventDetailsModal'
import { NotificationCenter } from './components/NotificationCenter'
import {
  AlertsPage, DevicesPage, EventHistoryPage, HouseholdPage, NotificationSettingsPage,
  OverviewPage, SystemSettingsPage, SystemStatusPage,
} from './components/ThesisPages'
import { demoEvents, queryEvents, type EventFilters } from './services/eventService'
import { notificationsFromEvents } from './services/notificationService'
import { demoHouseholdMember, demoSystem } from './services/systemService'
import type { SecurityEvent } from './models/securityEvent'
import './App.css'

type Page = 'Overview' | 'Alerts' | 'Event History' | 'System Status' | 'Devices' | 'Household Members' | 'Notification Settings' | 'System Settings'
const groups: { title: string; items: { label: Page; icon: LucideIcon }[] }[] = [
  { title: 'HOME', items: [{ label: 'Overview', icon: LayoutDashboard }, { label: 'Alerts', icon: Bell }, { label: 'Event History', icon: FileClock }, { label: 'System Status', icon: Activity }] },
  { title: 'SYSTEM', items: [{ label: 'Devices', icon: Cpu }, { label: 'Household Members', icon: Users }] },
  { title: 'SETTINGS', items: [{ label: 'Notification Settings', icon: Bell }, { label: 'System Settings', icon: Settings }] },
]
const emptyFilters: EventFilters = { search: '', startDate: '', endDate: '', acousticClass: 'All', faceResult: 'All', decision: 'All' }
const subtitles: Record<Page, string> = {
  Overview: 'Audio events, visual verification, and contextual response at a glance.',
  Alerts: 'Review acoustic events that require attention or visual verification.',
  'Event History': 'Search and filter the recorded audio-triggered event history.',
  'System Status': 'Demo status for edge, audio, camera, and cloud subsystems.',
  Devices: 'Thesis prototype hardware and connected components.',
  'Household Members': 'Manage enrollment status without exposing biometric data.',
  'Notification Settings': 'Configure channels for future system integration.',
  'System Settings': 'Prototype identity and data privacy information.',
}

export default function Dashboard() {
  const [page, setPage] = useState<Page>('Overview')
  const [notifications, setNotifications] = useState(() => notificationsFromEvents(demoEvents))
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [filters, setFilters] = useState(emptyFilters)
  const [query, setQuery] = useState('')
  const [notificationSettings, setNotificationSettings] = useState({ web: true, sms: true, physical: true })
  const [memberName, setMemberName] = useState(demoHouseholdMember.name)
  const [recognitionEnabled, setRecognitionEnabled] = useState(true)
  const [enrollmentRequests, setEnrollmentRequests] = useState<{ id: string; name: string; createdAt: string }[]>([])
  const [homeName, setHomeName] = useState(demoSystem.homeName)
  const [savedHomeName, setSavedHomeName] = useState(demoSystem.homeName)
  const visibleEvents = useMemo(() => queryEvents(demoEvents, { ...filters, search: [filters.search, query].filter(Boolean).join(' ') }), [filters, query])
  const reviewEvents = demoEvents.filter((event) => event.decision !== 'Log Only')
  const unread = notifications.filter((item) => !item.read).length
  const eventsToday = demoEvents.filter((event) => event.timestamp.slice(0, 10) === new Date().toISOString().slice(0, 10)).length
  const todayText = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())

  function navigate(next: Page) {
    setPage(next)
    setMobileNavOpen(false)
    setNotificationsOpen(false)
    setQuery('')
  }

  function openEvent(id: string) {
    setSelectedEvent(demoEvents.find((event) => event.id === id) ?? null)
    setNotifications((items) => items.map((item) => item.eventId === id ? { ...item, read: true } : item))
    setNotificationsOpen(false)
  }

  const markAllRead = () => setNotifications((items) => items.map((item) => ({ ...item, read: true })))

  return <div className="app-shell thesis-app">
    <aside className={`sidebar ${mobileNavOpen ? 'sidebar-open' : ''}`}>
      <button className="brand" onClick={() => navigate('Overview')}><span className="brand-mark"><ShieldCheck size={21} /></span><span className="brand-name">Haven<span>home</span></span></button>
      <div className="home-switcher"><span className="home-avatar">H</span><span className="home-copy"><strong>{homeName}</strong><small>Thesis prototype · Demo data</small></span><ChevronDown size={15} /></div>
      {groups.map((group) => <div className="nav-group" key={group.title}><span className="nav-label">{group.title}</span><nav className="primary-nav" aria-label={group.title}>{group.items.map(({ label, icon: Icon }) => <button key={label} className={`nav-item ${page === label ? 'nav-item-active' : ''}`} onClick={() => navigate(label)}><Icon size={18} /><span>{label}</span>{label === 'Alerts' && <span className="nav-count">{reviewEvents.length}</span>}</button>)}</nav></div>)}
      <div className="sidebar-spacer" /><div className="sidebar-protection"><span className="protection-icon"><ShieldCheck size={18} /></span><div><strong>Audio-first monitoring</strong><small>Face recognition on event</small></div><span className="status-dot" /></div>
      <div className="profile-button"><span className="profile-avatar">{memberName.slice(0, 1).toUpperCase()}</span><span className="profile-copy"><strong>{memberName}</strong><small>Enrolled household member</small></span><ChevronDown size={15} /></div>
    </aside>
    {mobileNavOpen && <button className="nav-scrim" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}
    <main className="main-area">
      <header className="topbar"><button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}><Menu size={20} /></button><div className="breadcrumb"><span>{homeName}</span><span className="breadcrumb-slash">/</span><strong>{page}</strong></div>
        <div className="topbar-actions"><label className="search-box"><Search size={17} /><input aria-label="Search events" placeholder="Search events..." value={query} onChange={(event) => setQuery(event.target.value)} />{query && <button className="search-clear" aria-label="Clear search" onClick={() => setQuery('')}><X size={14} /></button>}</label><div className="notification-anchor"><button className="icon-button notification-button" aria-label={`Notifications, ${unread} unread`} aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((open) => !open)}><Bell size={19} />{unread > 0 && <span className="notification-dot" />}</button>{notificationsOpen && <NotificationCenter notifications={notifications} onOpen={openEvent} onMarkAllRead={markAllRead} />}</div><span className="topbar-divider" /><span className="today-label">{todayText}</span></div>
      </header>
      <div className="page-content"><div className="page-heading"><div><p className="eyebrow">HAVEN HOME · THESIS PROTOTYPE</p><h1>{page === 'Overview' ? 'Home monitoring' : page}</h1><p className="page-subtitle">{subtitles[page]}</p></div>{page === 'Overview' && <span className="demo-chip">DEMO DATA</span>}</div>
        {page === 'Overview' && <OverviewPage events={demoEvents} alerts={unread} eventsToday={eventsToday} onOpenEvent={setSelectedEvent} onNavigate={navigate} />}
        {page === 'Alerts' && <AlertsPage events={reviewEvents} onOpenEvent={setSelectedEvent} />}
        {page === 'Event History' && <EventHistoryPage events={visibleEvents} filters={filters} setFilters={setFilters} onOpenEvent={setSelectedEvent} />}
        {page === 'System Status' && <SystemStatusPage />}
        {page === 'Devices' && <DevicesPage />}
        {page === 'Household Members' && <HouseholdPage name={memberName} setName={setMemberName} recognitionEnabled={recognitionEnabled} setRecognitionEnabled={setRecognitionEnabled} enrollmentRequests={enrollmentRequests} onRequestEnrollment={(name) => setEnrollmentRequests((requests) => [...requests, { id: `HM-${String(requests.length + 2).padStart(3, '0')}`, name, createdAt: new Date().toISOString() }])} />}
        {page === 'Notification Settings' && <NotificationSettingsPage settings={notificationSettings} setSettings={setNotificationSettings} />}
        {page === 'System Settings' && <SystemSettingsPage homeName={homeName} setHomeName={setHomeName} savedHomeName={savedHomeName} saveName={() => setSavedHomeName(homeName)} />}
        <footer className="page-footer"><span><span className="status-dot" /> Demo interface · no hardware connection</span><span>Sample event data <span className="footer-separator">·</span> Firebase not configured</span></footer>
      </div>
    </main>
    {selectedEvent && <EventDetailsModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
  </div>
}
