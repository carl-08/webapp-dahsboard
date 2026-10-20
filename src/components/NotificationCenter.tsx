import { Bell, Check, CircleAlert, Clock3, Search, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import type { DashboardNotification } from '../services/notificationService'

type NotificationFilter = 'All' | 'Needs Review' | 'L1' | 'L2' | 'L3' | 'L4' | 'History'
const filters: NotificationFilter[] = ['All', 'Needs Review', 'L1', 'L2', 'L3', 'L4', 'History']

function timeLabel(timestamp: string) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(timestamp))
}

function needsReview(notification: DashboardNotification) {
  return !notification.read
    || (notification.levelCode === 'L1' && !notification.reviewed)
    || (notification.levelCode === 'L2' && notification.active)
    || (notification.levelCode === 'L3' && !notification.acknowledgementStatus.startsWith('Acknowledged') && !notification.falseTrigger)
    || (notification.levelCode === 'L4' && !notification.acknowledgementStatus.startsWith('Acknowledged'))
}

function matchesFilter(notification: DashboardNotification, filter: NotificationFilter) {
  if (filter === 'Needs Review') return needsReview(notification)
  if (filter === 'History') return notification.read || notification.reviewed || notification.falseTrigger || notification.acknowledgementStatus.startsWith('Acknowledged') || notification.levelCode === 'Event'
  if (filter === 'All') return true
  return notification.levelCode === filter
}

export function NotificationCenter({ notifications, hiddenNotificationIds = [], onOpen, onMarkRead, onMarkAllRead, onReviewed, onAcknowledge, onFalseAlarm }: {
  notifications: DashboardNotification[]
  hiddenNotificationIds?: string[]
  onOpen: (notification: DashboardNotification) => void
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
  onReviewed: (id: string) => void
  onAcknowledge: (id: string) => void
  onFalseAlarm: (id: string) => void
}) {
  const [filter, setFilter] = useState<NotificationFilter>('All')
  const unreadCount = notifications.filter((item) => !item.read).length
  const hiddenIds = new Set(hiddenNotificationIds)
  const filteredNotifications = notifications.filter((item) => !hiddenIds.has(item.id) && matchesFilter(item, filter))

  return <section className="panel central-notifications">
    <div className="central-notifications-header">
      <div>
        <h2>Notifications &amp; Alerts</h2>
        <p>One event record per alert · sample records are marked as demo data.</p>
      </div>
      {unreadCount > 0 && <button className="text-button" type="button" onClick={onMarkAllRead}>Mark all read ({unreadCount})</button>}
    </div>
    <div className="notification-filter-tabs" role="tablist" aria-label="Notification filters">
      {filters.map((item) => <button key={item} type="button" role="tab" aria-selected={filter === item} className={filter === item ? 'notification-filter-active' : ''} onClick={() => setFilter(item)}>{item}</button>)}
    </div>
    {filteredNotifications.length ? <div className="central-notification-list">
      {filteredNotifications.map((item) => <article key={item.id} className={`central-notification ${item.read ? '' : 'central-notification-unread'} ${item.levelCode === 'L1' ? 'central-notification-level-l1' : ''} ${item.levelCode === 'L2' ? 'central-notification-level-l2' : ''} ${item.levelCode === 'L3' ? 'central-notification-critical' : ''} ${item.levelCode === 'L4' ? 'central-notification-high' : ''}`}>
        <span className={`central-notification-icon ${item.levelCode === 'L4' ? 'central-notification-urgent' : ''}`}>{item.levelCode === 'L4' ? <ShieldCheck size={17} /> : item.source === 'motion' ? <Bell size={16} /> : <CircleAlert size={16} />}</span>
        <div className="central-notification-content">
          <div className="central-notification-title"><strong>{item.title}</strong><span className={`notification-level notification-level-${item.levelCode.toLowerCase()}`}>{item.level}</span></div>
          <div className="central-notification-meta"><span>{item.kind}</span><span><Clock3 size={12} />{timeLabel(item.timestamp)}</span></div>
          <p className="central-notification-detail">Visual result: {item.detail}</p>
          <div className="central-notification-status">
            <span>Event status: {item.active ? 'Active · demo workflow' : item.status}</span>
            <span>Decision rule: {item.decision}</span>
            <span>Acknowledgement: {item.acknowledgementStatus}</span>
            <span>{item.deliveryStatus}</span>
            {item.reviewed && <span>Reviewed</span>}
            {item.falseTrigger && <span className="false-trigger-label">Recorded as a false trigger</span>}
          </div>
          {item.snapshotUrl && <button className="notification-snapshot-link" type="button" onClick={() => onOpen(item)}>
            <img src={item.snapshotUrl} alt="Sample event snapshot" />
            <span>Open event snapshot and details</span>
          </button>}
          <div className="notification-card-actions">
            {item.eventId && <button className="text-button" type="button" onClick={() => onOpen(item)}>Event details</button>}
            {item.levelCode === 'L1' && !item.reviewed && <button className="notification-action notification-action-review" type="button" onClick={() => onReviewed(item.id)}>Reviewed</button>}
            {item.levelCode === 'L3' && !item.acknowledgementStatus.startsWith('Acknowledged') && !item.falseTrigger && <>
              <button className="notification-action" type="button" onClick={() => onAcknowledge(item.id)}>Acknowledge</button>
              <button className="notification-action notification-action-false" type="button" onClick={() => onFalseAlarm(item.id)}>False alarm</button>
            </>}
            {item.levelCode === 'L4' && !item.acknowledgementStatus.startsWith('Acknowledged') && <button className="notification-action notification-action-high" type="button" onClick={() => onAcknowledge(item.id)}>Acknowledge high alert</button>}
            {!item.read && <button className="notification-action notification-action-read" type="button" onClick={() => onMarkRead(item.id)}><Check size={13} /> Mark read</button>}
            {item.read && <span className="notification-read-label"><Check size={12} /> Read</span>}
          </div>
        </div>
        {!item.read && <span className="notification-unread-label">Unread</span>}
      </article>)}
    </div> : <div className="empty-state central-notifications-empty"><span><Search size={18} /></span><strong>No matching notifications</strong><p>Try another severity filter or open Event History to review all event records.</p></div>}
    <p className="central-notifications-note">Alert actions and SMS flags shown here use demo records. Notification read state is separate from alarm acknowledgement; marking an item read never acknowledges an alert. The backend does not currently provide false-alarm, alarm-stop, SMS-delivery, or reviewed-state integrations.</p>
  </section>
}
