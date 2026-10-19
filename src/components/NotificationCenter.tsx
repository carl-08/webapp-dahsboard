import { Bell, Check, CircleAlert, Clock3, Search, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import type { DashboardNotification } from '../services/notificationService'

type NotificationFilter = 'All' | 'Needs Review' | 'High Alert' | 'History'
const filters: NotificationFilter[] = ['All', 'Needs Review', 'High Alert', 'History']

function timeLabel(timestamp: string) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(timestamp))
}

function matchesFilter(notification: DashboardNotification, filter: NotificationFilter) {
  if (filter === 'Needs Review') return notification.status === 'Alerted' || notification.status === 'Verification Required'
  if (filter === 'High Alert') return notification.level.startsWith('L4')
  if (filter === 'History') return notification.read || notification.level === 'Event'
  return true
}

export function NotificationCenter({ notifications, onOpen, onMarkAllRead }: {
  notifications: DashboardNotification[]
  onOpen: (notification: DashboardNotification) => void
  onMarkAllRead: () => void
}) {
  const [filter, setFilter] = useState<NotificationFilter>('All')
  const unreadCount = notifications.filter((item) => !item.read).length
  const filteredNotifications = notifications.filter((item) => matchesFilter(item, filter))

  return <section className="panel central-notifications">
    <div className="central-notifications-header">
      <div>
        <h2>Notifications &amp; Alerts</h2>
        <p>Sample event records and simulated notifications. No live alert feed is connected.</p>
      </div>
      {unreadCount > 0 && <button className="text-button" type="button" onClick={onMarkAllRead}>Mark all read ({unreadCount})</button>}
    </div>
    <div className="notification-filter-tabs" role="tablist" aria-label="Notification filters">
      {filters.map((item) => <button key={item} type="button" role="tab" aria-selected={filter === item} className={filter === item ? 'notification-filter-active' : ''} onClick={() => setFilter(item)}>{item}</button>)}
    </div>
    {filteredNotifications.length ? <div className="central-notification-list">
      {filteredNotifications.map((item) => <button key={item.id} className={`central-notification ${item.read ? '' : 'central-notification-unread'} ${item.level.startsWith('L4') ? 'central-notification-high' : ''}`} type="button" onClick={() => onOpen(item)}>
        <span className={`central-notification-icon ${item.level.startsWith('L4') ? 'central-notification-urgent' : ''}`}>{item.level.startsWith('L4') ? <ShieldCheck size={17} /> : item.source === 'motion' ? <Bell size={16} /> : <CircleAlert size={16} />}</span>
        <span className="central-notification-content">
          <span className="central-notification-title"><strong>{item.title}</strong><span className="notification-level">{item.level}</span></span>
          <span className="central-notification-meta"><span>{item.kind}</span><span><Clock3 size={12} />{timeLabel(item.timestamp)}</span></span>
          <span className="central-notification-detail">{item.detail}</span>
          <span className="central-notification-status">
            <span><Check size={12} /> Acknowledgement: {item.acknowledgementStatus}</span>
            <span>{item.deliveryStatus}</span>
          </span>
        </span>
        {!item.read && <span className="notification-unread-label">Unread</span>}
      </button>)}
    </div> : <div className="empty-state central-notifications-empty"><span><Search size={18} /></span><strong>No matching notifications</strong><p>Try another filter to view the available sample records.</p></div>}
    <p className="central-notifications-note">Delivery flags reflect sample event data only. Acknowledgement state and delivery integrations are not implemented.</p>
  </section>
}
