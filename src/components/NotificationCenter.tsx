import { Bell, Search } from 'lucide-react'
import type { DashboardNotification } from '../services/notificationService'

function timeLabel(timestamp: string) {
  return new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(new Date(timestamp))
}

export function NotificationCenter({ notifications, onOpen, onMarkAllRead }: { notifications: DashboardNotification[]; onOpen: (eventId: string) => void; onMarkAllRead: () => void }) {
  return <section className="notification-popover"><div className="notification-popover-head"><div><strong>Sample notifications</strong><small>{notifications.filter((item) => !item.read).length} unread · demo data</small></div><button className="text-button" onClick={onMarkAllRead}>Mark all read</button></div><div className="notification-items">{notifications.map((item) => <button key={item.id} className={`notification-item ${item.read ? '' : 'notification-unread'}`} onClick={() => onOpen(item.eventId)}><span className="notification-mark"><Bell size={14} /></span><span className="notification-copy"><strong>{item.kind}</strong><b>{item.title}</b><small>{item.detail} · {timeLabel(item.timestamp)}</small></span>{!item.read && <i />}</button>)}</div>{notifications.length === 0 && <div className="empty-state"><span><Search size={18} /></span><strong>No notifications</strong><p>Sample event notifications appear here.</p></div>}</section>
}
