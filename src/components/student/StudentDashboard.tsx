import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { CategoryIcon } from '../common/CategoryIcon';
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  Wrench,
  AlertCircle,
  ChevronRight,
  Sparkles,
  MapPin,
  Calendar,
  Building,
  Bell,
  MessageSquare,
} from 'lucide-react';

interface StudentDashboardProps {
  setActiveTab: (tab: string) => void;
  onOpenReport: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  setActiveTab,
  onOpenReport,
}) => {
  const { currentUser } = useAuth();
  const { complaints, openComplaintDetails } = useData();

  const myComplaints = complaints.filter(
    (c) =>
      currentUser &&
      (c.submitterId === currentUser.id ||
        (currentUser.id === 'STU1001' && c.submitterId === 'STU-2024-101'))
  );

  const pending = myComplaints.filter((c) => c.status === 'Pending').length;
  const inProgress = myComplaints.filter(
    (c) => c.status === 'In Progress' || c.status === 'Assigned'
  ).length;
  const resolved = myComplaints.filter((c) => c.status === 'Resolved').length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-sky-300 text-xs font-semibold mb-3 border border-sky-400/20 backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Student Facility Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {currentUser?.name}!
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 mt-2 font-normal leading-relaxed">
              {currentUser?.department} • {currentUser?.semester} ({currentUser?.batch})
              <br />
              <span className="text-sky-300 font-mono text-xs">
                Hostel: {currentUser?.hostelBlock} • Room {currentUser?.roomNo}
              </span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenReport}
              className="px-5 py-3 rounded-2xl bg-white hover:bg-slate-100 text-blue-950 font-bold text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-blue-600" />
              <span>Report a Problem</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('complaints')}
              className="px-4 py-3 rounded-2xl bg-blue-950/40 hover:bg-blue-950/60 border border-white/20 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <span>View All Reports</span>
              <ChevronRight className="w-4 h-4 text-sky-400" />
            </button>
          </div>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />
        <div className="absolute right-1/3 -top-12 w-48 h-48 rounded-full bg-sky-400/10 blur-xl pointer-events-none" />
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Reported
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{myComplaints.length}</span>
            <span className="text-xs text-slate-500">tickets</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
              Pending Review
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-700">{pending}</span>
            <span className="text-xs text-slate-500">awaiting HOD</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              In Progress
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-indigo-700">{inProgress}</span>
            <span className="text-xs text-slate-500">technicians dispatched</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Resolved
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-700">{resolved}</span>
            <span className="text-xs text-emerald-600 font-semibold">100% closed</span>
          </div>
        </div>
      </div>

      {/* Main Grid: My Recent Complaints + Campus Live Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: My Active Complaints */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  My Active Complaints
                </h3>
                <p className="text-xs text-slate-500">
                  Track resolution progress and maintenance crew dispatches
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('complaints')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <span>View all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {myComplaints.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">No active complaints</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Everything looks good! Report any broken classroom or lab fixtures anytime.
                  </p>
                </div>
              ) : (
                myComplaints.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => openComplaintDetails(item)}
                    className="p-4 sm:p-5 hover:bg-slate-50/80 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    <div className="flex items-start gap-3.5">
                      <CategoryIcon
                        category={item.category}
                        showBackground
                        className="w-5 h-5"
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-700">
                            {item.id}
                          </span>
                          <StatusBadge status={item.status} size="sm" />
                          <PriorityBadge priority={item.priority} size="sm" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-800 mt-1 group-hover:text-blue-600 transition">
                          {item.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1.5">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {item.classroomOrLab} ({item.location})
                          </span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 text-xs">
                      {item.assignedTeam ? (
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] text-slate-400 block">Assigned:</span>
                          <span className="font-semibold text-slate-700 text-xs truncate max-w-[140px] block">
                            {item.assignedTeam}
                          </span>
                        </div>
                      ) : (
                        <span className="text-amber-600 text-xs font-medium">Under review</span>
                      )}
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-blue-600 transition" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Campus Maintenance Guidelines & Dispatch Notice */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Campus Reporting Rules</span>
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <span><strong>Emergency Hazards:</strong> Report live electric sparks, major water line breaks, or gas smells immediately with "Critical" priority.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <span><strong>Classroom & AV:</strong> Mention exact room number (e.g. Room 304) for rapid technician arrival.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <span><strong>Photo Upload:</strong> Attaching clear photos speeds up resolution time by ~40%.</span>
              </li>
            </ul>
          </div>

          {/* Quick Contact HOD widget */}
          <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white p-5 rounded-2xl shadow-md">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-400 mb-1">
              <MessageSquare className="w-4 h-4" />
              <span>Direct HOD Communication</span>
            </div>
            <h4 className="text-sm font-bold text-white">Have questions about an escalation?</h4>
            <p className="text-xs text-slate-300 mt-1">
              Communicate with Dr. S. Radhakrishnan (HOD Operations) via Campus Care internal messaging.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab('messages')}
              className="mt-3 w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Open Messages</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
