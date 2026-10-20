import { useEffect, useMemo, useRef, useState } from 'react'
import { Activity, Bell, Camera, ChevronDown, ChevronRight, Cpu, FileClock, LayoutDashboard, Menu, Search, Settings, ShieldCheck, Users, X, type LucideIcon } from 'lucide-react'
import { EventDetailsModal } from './components/EventDetailsModal'
import { NotificationCenter } from './components/NotificationCenter'
import {
  EventHistoryPage, GuestPassesPage, L2VerificationPage,
  L4HighAlertPage, LiveViewPage, MonitoringModesPage, MotionEventsPage, NotificationSettingsPage,
  OverviewPage, PrivacySettingsPage, SystemActivityLogPage, SystemSettingsPage, SystemStatusPage,
  type DemoFaceOutcome, type DemoRole, type DemoWorkflowState, type GuestPass,
} from './components/ThesisPages'
import { UserEnrollmentPage } from './components/UserEnrollmentPage'
import { demoEvents, queryEvents, type EventFilters } from './services/eventService'
import { notificationsFromEvents, type DashboardNotification } from './services/notificationService'
import { demoHouseholdMember, demoSystem } from './services/systemService'
import type { SecurityEvent } from './models/securityEvent'
import './App.css'

type Page = 'Overview' | 'Notifications & Alerts' | 'Event History' | 'System Status' | 'System Activity Log' | 'Household Members' | 'Guest Passes' | 'Notification Settings' | 'Privacy Settings' | 'System Settings' | 'Monitoring Modes' | 'Motion Events' | 'Live View'
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
    { label: 'Notifications & Alerts', page: 'Notifications & Alerts', icon: Bell },
    { label: 'Event History', page: 'Event History', icon: FileClock },
  ] },
  { key: 'users-monitoring', title: 'Users & Monitoring', icon: Users, items: [
    { label: 'User Enrollment', page: 'Household Members', icon: Users },
    { label: 'Live Monitoring', page: 'Live View', icon: Camera },
    { label: 'Motion Events', page: 'Motion Events', icon: Activity },
  ] },
  { key: 'device-status', title: 'Device Status', icon: Cpu, items: [
    { label: 'System Health', page: 'System Status', icon: Activity },
    { label: 'Monitoring Mode', page: 'Monitoring Modes', icon: Settings },
    { label: 'System Activity Log', page: 'System Activity Log', icon: FileClock },
  ] },
  { key: 'camera-visitors', title: 'Camera & Visitors', icon: Camera, items: [
    { label: 'Guest Passes', page: 'Guest Passes', icon: Users },
  ] },
  { key: 'settings', title: 'Settings', icon: Settings, items: [
    { label: 'Notification Settings', page: 'Notification Settings', icon: Bell },
    { label: 'Privacy Settings', page: 'Privacy Settings', icon: ShieldCheck },
    { label: 'System Settings', page: 'System Settings', icon: Settings },
  ] },
]
const emptyFilters: EventFilters = { search: '', startDate: '', endDate: '', acousticClass: 'All', faceResult: 'All', decision: 'All' }
const subtitles: Record<Page, string> = {
  Overview: 'COJ-CS System Overview',
  'Notifications & Alerts': 'Review notifications, alert levels, simulated verification, and sample event status.',
  'Event History': 'Search and filter the recorded audio-triggered event history.',
  'System Status': 'Current component health availability and required backend integrations.',
  'System Activity Log': 'Chronological sample event activity from the existing event records.',
  'Household Members': 'Manage enrollment status without exposing biometric data.',
  'Guest Passes': 'Create temporary guest passes that expire after 1–7 days.',
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
  const [filters, setFilters] = useState(emptyFilters)
  const [query, setQuery] = useState('')
  const [notificationSettings, setNotificationSettings] = useState({ web: true, sms: true, physical: true })
  const [memberName] = useState(demoHouseholdMember.name)
  const [homeName, setHomeName] = useState(demoSystem.homeName)
  const [savedHomeName, setSavedHomeName] = useState(demoSystem.homeName)
  const [demoRole, setDemoRole] = useState<DemoRole>('Administrator')
  const [advancedMode, setAdvancedMode] = useState(false)
  const [workflowState, setWorkflowState] = useState<DemoWorkflowState>('idle')
  const [motionOutcome, setMotionOutcome] = useState<DemoFaceOutcome>('unknown')
  const [motionTimestamp, setMotionTimestamp] = useState<string | null>(null)
  const [faceCheckRemaining, setFaceCheckRemaining] = useState(10)
  const [verificationRemaining, setVerificationRemaining] = useState(60)
  const [motionNotificationId, setMotionNotificationId] = useState<string | null>(null)
  const [modeActivity, setModeActivity] = useState<{ id: string; timestamp: string; title: string; detail: string; status: string }[]>([])
  const [guestPasses, setGuestPasses] = useState<GuestPass[]>([])
  const guestPassSequence = useRef(0)
  const visibleEvents = useMemo(() => queryEvents(demoEvents, { ...filters, search: [filters.search, query].filter(Boolean).join(' ') }), [filters, query])
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
          setPage('Notifications & Alerts')
          updateNotification(motionNotificationId, { level: 'L2 · Verification', status: 'L2 verification required' })
        } else {
          setWorkflowState(motionOutcome === 'known' ? 'known-face' : 'no-face')
          setPage('Motion Events')
          updateNotification(motionNotificationId, {
            level: motionOutcome === 'known' ? 'L1 · Attention' : 'Event',
            status: motionOutcome === 'known' ? 'Known face · logged as L1 Attention' : 'No face · time only, no image stored',
          })
        }
      } else {
        setFaceCheckRemaining(faceCheckRemaining - 1)
      }
    }, 1000)
    return () => window.clearTimeout(timeout)
  }, [workflowState, faceCheckRemaining, motionOutcome, motionNotificationId])

  useEffect(() => {
    if (workflowState !== 'verification') return
    const timeout = window.setTimeout(() => {
      if (verificationRemaining <= 1) {
        setWorkflowState('high-alert')
        setPage('Notifications & Alerts')
        updateNotification(motionNotificationId, { level: 'L4 · High Alert', status: 'L2 timer expired · escalated to L4' })
      } else {
        setVerificationRemaining(verificationRemaining - 1)
      }
    }, 1000)
    return () => window.clearTimeout(timeout)
  }, [workflowState, verificationRemaining, motionNotificationId])

  function navigate(next: Page) {
    setPage(next)
    const activeGroup = navigationGroupForPage(next)
    if (activeGroup) setExpandedGroups((expanded) => expanded.includes(activeGroup) ? expanded : [...expanded, activeGroup])
    setMobileNavOpen(false)
    setQuery('')
  }

  function updateNotification(id: string | null, changes: Partial<DashboardNotification>) {
    if (!id) return
    setNotifications((items) => items.map((item) => item.id === id ? { ...item, ...changes } : item))
  }

  function openNotification(notification: DashboardNotification) {
    updateNotification(notification.id, { read: true })
    if (notification.eventId) {
      setSelectedEvent(demoEvents.find((event) => event.id === notification.eventId) ?? null)
    }
  }

  const markAllRead = () => setNotifications((items) => items.map((item) => ({ ...item, read: true })))

  function simulateMotion(outcome: DemoFaceOutcome) {
    if (!advancedMode || !isAdministrator) return
    const timestamp = new Date().toISOString()
    const notificationId = `motion-${Date.now()}`
    setMotionOutcome(outcome)
    setMotionTimestamp(timestamp)
    setMotionNotificationId(notificationId)
    setNotifications((items) => [{
      id: notificationId,
      eventId: null,
      source: 'motion',
      kind: 'MOTION',
      level: 'Motion',
      title: 'Motion detected',
      detail: 'Simulated motion event · 10-second face check started',
      timestamp,
      read: false,
      status: '10-second face check in progress',
      acknowledgementStatus: 'Not available',
      deliveryStatus: 'Simulation only · no device notification sent',
    }, ...items])
    setFaceCheckRemaining(10)
    setVerificationRemaining(60)
    setWorkflowState('face-check')
    setPage('Notifications & Alerts')
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
      <button className="brand" onClick={() => navigate('Overview')}><span className="brand-mark"><ShieldCheck size={21} /></span><span className="brand-name">COJ-CS</span></button>
      <div className="home-switcher"><span className="home-avatar">C</span><span className="home-copy"><strong>{homeName}</strong><small>System prototype · Demo data</small></span><ChevronDown size={15} /></div>
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
        <div className="topbar-actions"><label className="search-box"><Search size={17} /><input aria-label="Search events" placeholder="Search events..." value={query} onChange={(event) => setQuery(event.target.value)} />{query && <button className="search-clear" aria-label="Clear search" onClick={() => setQuery('')}><X size={14} /></button>}</label><button className="icon-button notification-button" aria-label={`Notifications & Alerts, ${unread} unread`} onClick={() => navigate('Notifications & Alerts')}><Bell size={19} />{unread > 0 && <span className="notification-count">{unread > 99 ? '99+' : unread}</span>}</button><span className="topbar-divider" /><span className="today-label">{todayText}</span></div>
      </header>
      <div className="page-content"><div className="page-heading"><div><p className="eyebrow">{page === 'Overview' ? 'COJ-CS SYSTEM OVERVIEW' : 'COJ-CS SECURITY DASHBOARD'}</p><h1>{groups.flatMap((group) => group.items).find((item) => item.page === page)?.label ?? page}</h1><p className="page-subtitle">{subtitles[page]}</p></div>{(page === 'Overview' || page === 'Notifications & Alerts') && <span className="demo-chip">DEMO DATA</span>}</div>
        {page === 'Overview' && <OverviewPage events={demoEvents} advancedMode={advancedMode} unreadNotifications={unread} activityEntries={modeActivity} onOpenEvent={setSelectedEvent} onNavigate={navigate} />}
        {page === 'Notifications & Alerts' && <>
          {(workflowState === 'face-check' || workflowState === 'verification' || workflowState === 'safe') && <L2VerificationPage workflowState={workflowState} remainingSeconds={verificationRemaining} faceCheckRemaining={faceCheckRemaining} onSafe={() => {
            setWorkflowState('safe')
            updateNotification(motionNotificationId, { status: 'Marked Safe · demo response', acknowledgementStatus: 'Safe response · demo only' })
          }} onNotSafe={() => {
            setWorkflowState('high-alert')
            updateNotification(motionNotificationId, { level: 'L4 · High Alert', status: 'Not Safe · escalated to L4', acknowledgementStatus: 'Not Safe response · demo only' })
          }} onStartDemo={() => { setVerificationRemaining(60); setWorkflowState('verification') }} onCreateGuestPass={() => navigate('Guest Passes')} />}
          {workflowState === 'high-alert' && <L4HighAlertPage active onReturn={() => navigate('Overview')} />}
          <NotificationCenter notifications={notifications} onOpen={openNotification} onMarkAllRead={markAllRead} />
          <button className="text-button notification-history-link" type="button" onClick={() => navigate('Event History')}>Open detailed event history <FileClock size={14} /></button>
        </>}
        {page === 'Event History' && <EventHistoryPage events={visibleEvents} filters={filters} setFilters={setFilters} onOpenEvent={setSelectedEvent} />}
        {page === 'System Status' && <SystemStatusPage />}
        {page === 'System Activity Log' && <SystemActivityLogPage notifications={notifications} modeActivity={modeActivity} />}
        {page === 'Monitoring Modes' && <MonitoringModesPage demoRole={demoRole} onDemoRoleChange={setDemoRole} isAdministrator={isAdministrator} advancedMode={advancedMode} onAdvancedModeChange={(enabled) => {
          setAdvancedMode(enabled)
          setModeActivity((entries) => [...entries, {
            id: `mode-${Date.now()}`,
            timestamp: new Date().toISOString(),
            title: 'Monitoring mode changed',
            detail: `${enabled ? 'Advanced Monitoring Mode enabled' : 'Standard Mode selected'} using the local UI demo control.`,
            status: 'UI simulation · not a backend-authorized change',
          }])
        }} />}
        {page === 'Motion Events' && <MotionEventsPage workflowState={workflowState} faceCheckRemaining={faceCheckRemaining} motionTimestamp={motionTimestamp} isAdministrator={isAdministrator} advancedMode={advancedMode} onSimulateMotion={simulateMotion} onOpenVerification={() => navigate('Notifications & Alerts')} />}
        {page === 'Live View' && <LiveViewPage />}
        {page === 'Household Members' && <UserEnrollmentPage />}
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
