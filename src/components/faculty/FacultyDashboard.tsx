import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { CategoryIcon } from '../common/CategoryIcon';
import {
  Send,
  Building,
  CheckCircle2,
  Clock,
  Wrench,
  AlertCircle,
  ChevronRight,
  Sparkles,
  MapPin,
  Calendar,
  MessageSquare,
  Bell,
  Eye,
  Paperclip,
  CheckCheck,
} from 'lucide-react';

interface FacultyDashboardProps {
  setActiveTab: (tab: string) => void;
  onOpenReport: () => void;
}

export const FacultyDashboard: React.FC<FacultyDashboardProps> = ({
  setActiveTab,
  onOpenReport,
}) => {
  const { currentUser } = useAuth();
  const { complaints, openComplaintDetails, notifications, markNotificationRead } = useData();

  // Faculty specific reports
  const myReports = complaints.filter(
    (c) =>
      currentUser &&
      (c.submitterId === currentUser.id ||
        (currentUser.id === 'FAC1001' && c.submitterId === 'FAC-CS-204') ||
        (c.submittedByRole === 'FACULTY' && c.submitterEmail === currentUser.email))
  );

  // Statistics calculation as requested in user brief:
  // - Total Reports
  // - Pending Reports
  // - Assigned Reports
  // - In Progress Reports
  // - Resolved Reports
  const totalReports = myReports.length;
  const pendingReports = myReports.filter((c) => c.status === 'Pending').length;
  const assignedReports = myReports.filter((c) => c.status === 'Assigned').length;
  const inProgressReports = myReports.filter((c) => c.status === 'In Progress').length;
  const resolvedReports = myReports.filter((c) => c.status === 'Resolved').length;

  // Recent reports
  const recentReports = [...myReports]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Faculty notifications
  const facultyNotifications = notifications.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3 border border-indigo-400/20 backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Faculty Academic Facility Directorate</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {currentUser?.name || 'Dr. Ananya Sen'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 font-normal leading-relaxed">
              {currentUser?.designation || 'Associate Professor'} • {currentUser?.department}
              <br />
              <span className="text-sky-300 font-mono text-xs">
                {currentUser?.cabinNo || 'Faculty Block 2'} • Direct HOD Liaison Active
              </span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenReport}
              className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Report to HOD</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('complaints')}
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <span>My Reports</span>
              <ChevronRight className="w-4 h-4 text-sky-400" />
            </button>
          </div>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
      </div>

      {/* 5 Official Faculty Statistics Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Faculty Infrastructure Metrics
          </div>
          <span className="text-xs text-slate-400">Live escalation telemetry</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* 1. Total Reports */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 transition">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total Reports
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Building className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-black text-slate-900">{totalReports}</span>
              <span className="text-[11px] text-slate-500 block mt-0.5">filed by you</span>
            </div>
          </div>

          {/* 2. Pending Reports */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs hover:border-amber-400 transition">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                Pending Reports
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-black text-amber-700">{pendingReports}</span>
              <span className="text-[11px] text-amber-600 block mt-0.5">awaiting triage</span>
            </div>
          </div>

          {/* 3. Assigned Reports */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-blue-200 bg-blue-50/20 shadow-xs hover:border-blue-400 transition">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                Assigned Reports
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <Wrench className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-black text-blue-700">{assignedReports}</span>
              <span className="text-[11px] text-blue-600 block mt-0.5">crew dispatched</span>
            </div>
          </div>

          {/* 4. In Progress Reports */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-indigo-200 bg-indigo-50/20 shadow-xs hover:border-indigo-400 transition">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                In Progress Reports
              </span>
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-black text-indigo-700">{inProgressReports}</span>
              <span className="text-[11px] text-indigo-600 block mt-0.5">active repair</span>
            </div>
          </div>

          {/* 5. Resolved Reports */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs hover:border-emerald-400 transition">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                Resolved Reports
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-black text-emerald-700">{resolvedReports}</span>
              <span className="text-[11px] text-emerald-600 block mt-0.5">completed & closed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Reports + Notifications Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Recent Reports Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Recent Reports</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                    Latest {recentReports.length}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Academic laboratory, classroom, and infrastructure tickets submitted to HOD
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('complaints')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer transition"
              >
                <span>View all reports</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {recentReports.length === 0 ? (
                <div className="p-10 text-center text-xs text-slate-400">
                  <Building className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-600">No reports filed yet</p>
                  <p className="text-slate-400 mt-1">
                    Click "Report to HOD" to submit your first academic infrastructure request.
                  </p>
                </div>
              ) : (
                recentReports.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 sm:p-5 hover:bg-slate-50/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <CategoryIcon
                        category={item.category}
                        showBackground
                        className="w-5 h-5 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                            {item.id}
                          </span>
                          <StatusBadge status={item.status} size="sm" />
                          <PriorityBadge priority={item.priority} size="sm" />
                          {item.documentName && (
                            <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Paperclip className="w-3 h-3 text-slate-400" />
                              <span>Doc Attached</span>
                            </span>
                          )}
                        </div>

                        <h4
                          onClick={() => openComplaintDetails(item)}
                          className="text-sm font-bold text-slate-900 hover:text-blue-600 transition cursor-pointer truncate"
                          title={item.title}
                        >
                          {item.title}
                        </h4>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Building className="w-3.5 h-3.5 text-blue-600" />
                            {item.classroomOrLab || 'Room N/A'}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {item.location}
                          </span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {item.assignedTo && (
                          <div className="mt-2 text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5">
                            <Wrench className="w-3 h-3 text-emerald-600" />
                            <span>Assigned to: {item.assignedTo} ({item.assignedTeam})</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => openComplaintDetails(item)}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('messages')}
                        className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition cursor-pointer"
                        title="Message HOD regarding this report"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Notifications Section */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-600" />
                <span>Notifications</span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab('notifications')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer transition"
              >
                <span>View all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {facultyNotifications.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No notifications yet.
                </div>
              ) : (
                facultyNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (!notif.isRead) markNotificationRead(notif.id);
                    }}
                    className={`p-3.5 transition text-xs ${
                      notif.isRead ? 'bg-white opacity-80' : 'bg-blue-50/40 hover:bg-blue-50/70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                        )}
                        <span>{notif.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Date(notif.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="text-slate-600 mt-1 leading-snug">
                      {notif.message}
                    </p>

                    {notif.complaintId && (
                      <span className="font-mono text-[10px] text-blue-700 font-bold mt-1.5 inline-block bg-blue-100/60 px-2 py-0.5 rounded">
                        {notif.complaintId}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick HOD Contact protocol */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-blue-50 to-slate-50 border border-blue-100 text-xs space-y-2">
            <div className="font-bold text-blue-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span>HOD Escalation Protocol</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Dr. S. Radhakrishnan (HOD Operations) prioritizes lab coursework and seminar breakdowns. Track ticket status or message directly for classroom buffer assistance.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab('messages')}
              className="w-full mt-2 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
              <span>Send Message to HOD</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
