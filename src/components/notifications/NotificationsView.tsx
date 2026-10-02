import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { NotificationItem } from '../../types';
import {
  Bell,
  CheckCircle2,
  Building,
  Clock,
  MessageSquare,
  AlertCircle,
  CheckCheck,
  ExternalLink,
  Filter,
  Check,
  Send,
  Wrench,
  Sparkles,
} from 'lucide-react';

interface NotificationsViewProps {
  onSelectComplaint?: (id: string) => void;
  onNavigateToMessages?: () => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  onSelectComplaint,
  onNavigateToMessages,
}) => {
  const { currentUser, role } = useAuth();
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    complaints,
    openComplaintDetails,
  } = useData();

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'UNREAD' | 'TICKETS' | 'MESSAGES'>('ALL');

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (activeFilter === 'UNREAD') return !item.isRead;
      if (activeFilter === 'MESSAGES') {
        return item.type === 'message' || item.type === 'new_message' || item.title.toLowerCase().includes('message') || item.title.toLowerCase().includes('reply');
      }
      if (activeFilter === 'TICKETS') {
        return item.type !== 'message' && item.type !== 'new_message' && !item.title.toLowerCase().includes('message');
      }
      return true;
    });
  }, [notifications, activeFilter]);

  const handleItemClick = (notif: NotificationItem) => {
    markNotificationRead(notif.id);
    if (notif.complaintId) {
      const target = complaints.find((c) => c.id === notif.complaintId);
      if (target) {
        openComplaintDetails(target);
        return;
      }
    }
    if ((notif.type === 'message' || notif.type === 'new_message' || notif.title.toLowerCase().includes('message')) && onNavigateToMessages) {
      onNavigateToMessages();
    }
  };

  const getNotificationIcon = (type: string, title: string) => {
    const t = (type || '').toLowerCase();
    const tit = (title || '').toLowerCase();

    if (t === 'message' || t === 'new_message' || tit.includes('message') || tit.includes('reply')) {
      return (
        <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-xs shrink-0">
          <MessageSquare className="w-5 h-5" />
        </div>
      );
    }
    if (t === 'resolved' || tit.includes('resolved')) {
      return (
        <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      );
    }
    if (t === 'work_started' || tit.includes('work started')) {
      return (
        <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shadow-xs shrink-0">
          <Wrench className="w-5 h-5" />
        </div>
      );
    }
    if (t === 'assignment' || tit.includes('assigned')) {
      return (
        <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-xs shrink-0">
          <Building className="w-5 h-5" />
        </div>
      );
    }
    if (t === 'complaint_received' || t === 'report_received' || tit.includes('received')) {
      return (
        <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center shadow-xs shrink-0">
          <CheckCheck className="w-5 h-5" />
        </div>
      );
    }
    if (t === 'new_complaint' || t === 'new_report' || t === 'alert' || tit.includes('new')) {
      return (
        <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shadow-xs shrink-0">
          <AlertCircle className="w-5 h-5" />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center shadow-xs shrink-0">
        <Bell className="w-5 h-5" />
      </div>
    );
  };

  const getNotificationBadge = (type: string, title: string) => {
    const t = (type || '').toLowerCase();
    const tit = (title || '').toLowerCase();

    if (t === 'message' || t === 'new_message' || tit.includes('message')) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 uppercase tracking-wider font-mono">
          Message
        </span>
      );
    }
    if (t === 'resolved' || tit.includes('resolved')) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider font-mono">
          Resolved
        </span>
      );
    }
    if (t === 'work_started' || tit.includes('work started')) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 uppercase tracking-wider font-mono">
          In Progress
        </span>
      );
    }
    if (t === 'assignment' || tit.includes('assigned')) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 uppercase tracking-wider font-mono">
          Assigned
        </span>
      );
    }
    if (t === 'complaint_received' || t === 'report_received' || tit.includes('received')) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200 uppercase tracking-wider font-mono">
          Received
        </span>
      );
    }
    if (t === 'new_complaint' || t === 'new_report' || t === 'alert' || tit.includes('new')) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 uppercase tracking-wider font-mono">
          New Ticket
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200 uppercase tracking-wider font-mono">
        Status Update
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Notification Center
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold animate-pulse">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time status alerts, assignment dispatches, and administrative messages.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllNotificationsRead()}
            className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shadow-xs"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveFilter('ALL')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeFilter === 'ALL'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <span>All</span>
          <span className="text-[10px] opacity-80">({notifications.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('UNREAD')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeFilter === 'UNREAD'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <span>Unread</span>
          <span className="text-[10px] opacity-80">({unreadCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('TICKETS')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeFilter === 'TICKETS'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <span>Tickets & Maintenance</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('MESSAGES')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeFilter === 'MESSAGES'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <span>Messages & Replies</span>
        </button>
      </div>

      {/* Notifications List Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden divide-y divide-slate-100">
        {filteredNotifications.length === 0 ? (
          <div className="p-16 text-center text-xs text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">No notifications in this filter</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Automated notifications are triggered whenever ticket status changes, repairs start, tickets are resolved, or messages are exchanged.
            </p>
          </div>
        ) : (
          filteredNotifications.map((item) => (
            <div
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={`p-5 hover:bg-slate-50 transition cursor-pointer flex items-start gap-4 ${
                !item.isRead ? 'bg-blue-50/40' : ''
              }`}
            >
              {/* Type Icon */}
              {getNotificationIcon(item.type, item.title)}

              {/* Notification Body */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">
                      {item.title}
                    </h4>
                    {getNotificationBadge(item.type, item.title)}
                    {!item.isRead && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                    )}
                  </div>

                  <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(item.timestamp).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-normal">
                  {item.message}
                </p>

                {/* Footer details & actions */}
                <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                  {item.complaintId ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleItemClick(item);
                      }}
                      className="text-xs font-mono font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <span>Ticket: {item.complaintId}</span>
                      <ExternalLink className="w-3 h-3 text-blue-600" />
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400">System Notification</span>
                  )}

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.isRead ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {item.isRead ? 'Read' : 'New'}
                    </span>

                    {!item.isRead && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          markNotificationRead(item.id);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
