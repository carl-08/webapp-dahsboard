import { useEffect, useMemo, useRef, useState } from 'react'
import { Activity, Bell, Camera, ChevronDown, ChevronRight, Cpu, FileClock, LayoutDashboard, Menu, Search, Settings, ShieldCheck, Users, X, type LucideIcon } from 'lucide-react'
import { EventDetailsModal } from './components/EventDetailsModal'
import { NotificationCenter } from './components/NotificationCenter'
import {
  AlertsPage, DevicesPage, EventHistoryPage, GuestPassesPage, HouseholdPage, L2VerificationPage,
  L4HighAlertPage, LiveViewPage, MonitoringModesPage, MotionEventsPage, NotificationSettingsPage,
  OverviewPage, PrivacySettingsPage, SystemSettingsPage, SystemStatusPage,
  type DemoFaceOutcome, type DemoRole, type DemoWorkflowState, type GuestPass,
} from './components/ThesisPages'
import { demoEvents, queryEvents, type EventFilters } from './services/eventService'
import { notificationsFromEvents } from './services/notificationService'
import { demoHouseholdMember, demoSystem } from './services/systemService'
import type { SecurityEvent } from './models/securityEvent'
import './App.css'

type Page = 'Overview' | 'Alerts' | 'Event History' | 'System Status' | 'Devices' | 'Household Members' | 'Guest Passes' | 'L2 Verification' | 'L4 High Alert' | 'Notification Settings' | 'Privacy Settings' | 'System Settings' | 'Monitoring Modes' | 'Motion Events' | 'Live View'
interface NavigationItem {
  label: string
  page: Page
  icon: LucideIcon
}
interface NavigationGroup {
  key: string
  title: string
  icon: LucideIcon
  items: NavigationItem[]
}
const groups: NavigationGroup[] = [
  { key: 'overview', title: 'Overview', icon: LayoutDashboard, items: [{ label: 'Dashboard', page: 'Overview', icon: LayoutDashboard }] },
  { key: 'alerts-events', title: 'Alerts & Events', icon: Bell, items: [
    { label: 'Active Alerts', page: 'Alerts', icon: Bell },
    { label: 'L2 Verification', page: 'L2 Verification', icon: Activity },
    { label: 'L4 High Alert', page: 'L4 High Alert', icon: ShieldCheck },
    { label: 'Event History', page: 'Event History', icon: FileClock },
  ] },
  { key: 'monitoring', title: 'Monitoring', icon: Activity, items: [
    { label: 'Monitoring Modes', page: 'Monitoring Modes', icon: Settings },
    { label: 'Motion Events', page: 'Motion Events', icon: Activity },
  ] },
  { key: 'camera-visitors', title: 'Camera & Visitors', icon: Camera, items: [
    { label: 'Live View', page: 'Live View', icon: Camera },
    { label: 'Household Members', page: 'Household Members', icon: Users },
    { label: 'Guest Passes', page: 'Guest Passes', icon: Users },
  ] },
  { key: 'system-settings', title: 'System & Settings', icon: Cpu, items: [
    { label: 'Device Status', page: 'Devices', icon: Cpu },
    { label: 'System Status', page: 'System Status', icon: Activity },
    { label: 'Notification Settings', page: 'Notification Settings', icon: Bell },
    { label: 'Privacy Settings', page: 'Privacy Settings', icon: ShieldCheck },
    { label: 'System Settings', page: 'System Settings', icon: Settings },
  ] },
]
const emptyFilters: EventFilters = { search: '', startDate: '', endDate: '', acousticClass: 'All', faceResult: 'All', decision: 'All' }
const subtitles: Record<Page, string> = {
  Overview: 'Audio events, visual verification, and contextual response at a glance.',
  Alerts: 'Review acoustic events that require attention or visual verification.',
  'Event History': 'Search and filter the recorded audio-triggered event history.',
  'System Status': 'Demo status for edge, audio, camera, and cloud subsystems.',
  Devices: 'Thesis prototype hardware and connected components.',
  'Household Members': 'Manage enrollment status without exposing biometric data.',
  'Guest Passes': 'Create temporary guest passes that expire after 1–7 days.',
  'L2 Verification': 'Review a simulated unknown-person verification request.',
  'L4 High Alert': 'Review the high-alert escalation state.',
  'Notification Settings': 'Configure channels for future system integration.',
  'Privacy Settings': 'Review the 15-day retention policy and recording access rules.',
  'System Settings': 'Prototype identity and data privacy information.',
  'Monitoring Modes': 'Choose the household monitoring mode. Advanced mode remains off by default.',
  'Motion Events': 'Preview the advanced motion-triggered workflow. Hardware is not connected.',
  'Live View': 'Camera live view is unavailable in this prototype.',
}

function navigationGroupForPage(page: Page) {
  return groups.find((group) => group.items.some((item) => item.page === page))?.key
}

export default function Dashboard() {
  const [page, setPage] = useState<Page>('Overview')
  const [notifications, setNotifications] = useState(() => notificationsFromEvents(demoEvents))
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['alerts-events'])
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [filters, setFilters] = useState(emptyFilters)
  const [query, setQuery] = useState('')
  const [notificationSettings, setNotificationSettings] = useState({ web: true, sms: true, physical: true })
  const [memberName, setMemberName] = useState(demoHouseholdMember.name)
  const [recognitionEnabled, setRecognitionEnabled] = useState(true)
  const [enrollmentRequests, setEnrollmentRequests] = useState<{ id: string; name: string; createdAt: string }[]>([])
  const [homeName, setHomeName] = useState(demoSystem.homeName)
  const [savedHomeName, setSavedHomeName] = useState(demoSystem.homeName)
  const [demoRole, setDemoRole] = useState<DemoRole>('Administrator')
  const [advancedMode, setAdvancedMode] = useState(false)
  const [workflowState, setWorkflowState] = useState<DemoWorkflowState>('idle')
  const [motionOutcome, setMotionOutcome] = useState<DemoFaceOutcome>('unknown')
  const [motionTimestamp, setMotionTimestamp] = useState<string | null>(null)
  const [faceCheckRemaining, setFaceCheckRemaining] = useState(10)
  const [verificationRemaining, setVerificationRemaining] = useState(60)
  const [guestPasses, setGuestPasses] = useState<GuestPass[]>([])
  const guestPassSequence = useRef(0)
  const visibleEvents = useMemo(() => queryEvents(demoEvents, { ...filters, search: [filters.search, query].filter(Boolean).join(' ') }), [filters, query])
  const reviewEvents = demoEvents.filter((event) => event.decision !== 'Log Only')
  const unread = notifications.filter((item) => !item.read).length
  const todayText = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())
  const isAdministrator = demoRole === 'Administrator'

  useEffect(() => {
    if (workflowState !== 'face-check') return
    const timeout = window.setTimeout(() => {
      if (faceCheckRemaining <= 1) {
        if (motionOutcome === 'unknown') {
          setWorkflowState('verification')
          setVerificationRemaining(60)
          setPage('L2 Verification')
        } else {
          setWorkflowState(motionOutcome === 'known' ? 'known-face' : 'no-face')
          setPage('Motion Events')
        }
      } else {
        setFaceCheckRemaining(faceCheckRemaining - 1)
      }
    }, 1000)
    return () => window.clearTimeout(timeout)
  }, [workflowState, faceCheckRemaining, motionOutcome])

  useEffect(() => {
    if (workflowState !== 'verification') return
    const timeout = window.setTimeout(() => {
      if (verificationRemaining <= 1) {
        setWorkflowState('high-alert')
        setPage('L4 High Alert')
      } else {
        setVerificationRemaining(verificationRemaining - 1)
      }
    }, 1000)
    return () => window.clearTimeout(timeout)
  }, [workflowState, verificationRemaining])

  function navigate(next: Page) {
    setPage(next)
    const activeGroup = navigationGroupForPage(next)
    if (activeGroup) setExpandedGroups((expanded) => expanded.includes(activeGroup) ? expanded : [...expanded, activeGroup])
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

  function simulateMotion(outcome: DemoFaceOutcome) {
    if (!advancedMode || !isAdministrator) return
    setMotionOutcome(outcome)
    setMotionTimestamp(new Date().toISOString())
    setFaceCheckRemaining(10)
    setVerificationRemaining(60)
    setWorkflowState('face-check')
    setPage('Motion Events')
  }

  function createGuestPass(guestName: string, durationDays: number) {
    const createdAt = new Date()
    const expiresAt = new Date(createdAt)
    expiresAt.setDate(expiresAt.getDate() + durationDays)
    guestPassSequence.current += 1
    setGuestPasses((passes) => [...passes, {
      id: `GP-${String(guestPassSequence.current).padStart(3, '0')}`,
      guestName,
      durationDays,
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    }])
  }

  return <div className="app-shell thesis-app">
    <aside className={`sidebar ${mobileNavOpen ? 'sidebar-open' : ''}`}>
      <button className="brand" onClick={() => navigate('Overview')}><span className="brand-mark"><ShieldCheck size={21} /></span><span className="brand-name">Haven<span>home</span></span></button>
      <div className="home-switcher"><span className="home-avatar">H</span><span className="home-copy"><strong>{homeName}</strong><small>Thesis prototype · Demo data</small></span><ChevronDown size={15} /></div>
      {groups.map((group) => {
        const GroupIcon = group.icon
        const isExpanded = expandedGroups.includes(group.key)
        const activeGroup = navigationGroupForPage(page) === group.key
        if (group.items.length === 1) {
          const item = group.items[0]
          const ItemIcon = item.icon
          return <div className="nav-group" key={group.key}><button className={`nav-item nav-group-single ${page === item.page ? 'nav-item-active' : ''}`} onClick={() => navigate(item.page)}><ItemIcon size={17} /><span>{item.label}</span></button></div>
        }
        return <div className="nav-group" key={group.key}>
          <button className="nav-group-toggle" type="button" aria-expanded={isExpanded} aria-controls={`nav-${group.key}`} onClick={() => {
            if (activeGroup) return
            setExpandedGroups((expanded) => expanded.includes(group.key) ? expanded.filter((key) => key !== group.key) : [...expanded, group.key])
          }}><GroupIcon size={15} /><span>{group.title}</span>{isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</button>
          {isExpanded && <nav className="primary-nav" id={`nav-${group.key}`} aria-label={group.title}>{group.items.map(({ label, page: itemPage, icon: Icon }) => <button key={label} className={`nav-item ${page === itemPage ? 'nav-item-active' : ''}`} onClick={() => navigate(itemPage)}><Icon size={16} /><span>{label}</span></button>)}</nav>}
        </div>
      })}
      <div className="sidebar-spacer" /><div className="sidebar-protection"><span className="protection-icon"><ShieldCheck size={18} /></span><div><strong>Prototype status</strong><small>Hardware not connected</small></div><span className="status-dot" /></div>
      <div className="profile-button"><span className="profile-avatar">{memberName.slice(0, 1).toUpperCase()}</span><span className="profile-copy"><strong>{memberName}</strong><small>Demo · {demoRole}</small></span><ChevronDown size={15} /></div>
    </aside>
    {mobileNavOpen && <button className="nav-scrim" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}
    <main className="main-area">
      <header className="topbar"><button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}><Menu size={20} /></button><div className="breadcrumb"><span>{homeName}</span><span className="breadcrumb-slash">/</span><strong>{groups.flatMap((group) => group.items).find((item) => item.page === page)?.label ?? page}</strong></div>
        <div className="topbar-actions"><label className="search-box"><Search size={17} /><input aria-label="Search events" placeholder="Search events..." value={query} onChange={(event) => setQuery(event.target.value)} />{query && <button className="search-clear" aria-label="Clear search" onClick={() => setQuery('')}><X size={14} /></button>}</label><div className="notification-anchor"><button className="icon-button notification-button" aria-label={`Sample notifications, ${unread} unread`} aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((open) => !open)}><Bell size={19} />{unread > 0 && <span className="notification-dot" />}</button>{notificationsOpen && <NotificationCenter notifications={notifications} onOpen={openEvent} onMarkAllRead={markAllRead} />}</div><span className="topbar-divider" /><span className="today-label">{todayText}</span></div>
      </header>
      <div className="page-content"><div className="page-heading"><div><p className="eyebrow">HAVEN HOME · SECURITY DASHBOARD</p><h1>{groups.flatMap((group) => group.items).find((item) => item.page === page)?.label ?? page}</h1><p className="page-subtitle">{subtitles[page]}</p></div>{(page === 'Overview' || page === 'Alerts') && <span className="demo-chip">DEMO DATA</span>}</div>
        {page === 'Overview' && <OverviewPage events={demoEvents} alerts={reviewEvents} advancedMode={advancedMode} onOpenEvent={setSelectedEvent} onNavigate={navigate} />}
        {page === 'Alerts' && <AlertsPage events={reviewEvents} onOpenEvent={setSelectedEvent} />}
        {page === 'Event History' && <EventHistoryPage events={visibleEvents} filters={filters} setFilters={setFilters} onOpenEvent={setSelectedEvent} />}
        {page === 'L2 Verification' && <L2VerificationPage workflowState={workflowState} remainingSeconds={verificationRemaining} faceCheckRemaining={faceCheckRemaining} onSafe={() => setWorkflowState('safe')} onNotSafe={() => { setWorkflowState('high-alert'); setPage('L4 High Alert') }} onStartDemo={() => { setVerificationRemaining(60); setWorkflowState('verification') }} onCreateGuestPass={() => navigate('Guest Passes')} />}
        {page === 'L4 High Alert' && <L4HighAlertPage active={workflowState === 'high-alert'} onReturn={() => navigate('Overview')} />}
        {page === 'System Status' && <SystemStatusPage />}
        {page === 'Devices' && <DevicesPage />}
        {page === 'Monitoring Modes' && <MonitoringModesPage demoRole={demoRole} onDemoRoleChange={setDemoRole} isAdministrator={isAdministrator} advancedMode={advancedMode} onAdvancedModeChange={setAdvancedMode} />}
        {page === 'Motion Events' && <MotionEventsPage workflowState={workflowState} faceCheckRemaining={faceCheckRemaining} motionTimestamp={motionTimestamp} isAdministrator={isAdministrator} advancedMode={advancedMode} onSimulateMotion={simulateMotion} onOpenVerification={() => navigate('L2 Verification')} />}
        {page === 'Live View' && <LiveViewPage />}
        {page === 'Household Members' && <HouseholdPage name={memberName} setName={setMemberName} recognitionEnabled={recognitionEnabled} setRecognitionEnabled={setRecognitionEnabled} enrollmentRequests={enrollmentRequests} onRequestEnrollment={(name) => setEnrollmentRequests((requests) => [...requests, { id: `HM-${String(requests.length + 2).padStart(3, '0')}`, name, createdAt: new Date().toISOString() }])} />}
        {page === 'Guest Passes' && <GuestPassesPage passes={guestPasses} onCreatePass={createGuestPass} onRevokePass={(id) => setGuestPasses((passes) => passes.filter((pass) => pass.id !== id))} />}
        {page === 'Notification Settings' && <NotificationSettingsPage settings={notificationSettings} setSettings={setNotificationSettings} />}
        {page === 'Privacy Settings' && <PrivacySettingsPage />}
        {page === 'System Settings' && <SystemSettingsPage homeName={homeName} setHomeName={setHomeName} savedHomeName={savedHomeName} saveName={() => setSavedHomeName(homeName)} />}
        <footer className="page-footer"><span><span className="status-dot" /> Demo interface · no hardware connection</span><span>Sample event data <span className="footer-separator">·</span> Firebase not configured</span></footer>
      </div>
    </main>
    {selectedEvent && <EventDetailsModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
  </div>
}
