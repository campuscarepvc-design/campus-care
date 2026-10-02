import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { CategoryIcon } from '../common/CategoryIcon';
import {
  ShieldCheck,
  Clock,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Users,
  ChevronRight,
  TrendingUp,
  MapPin,
  Building,
  UserCheck,
  Eye,
  Calendar,
} from 'lucide-react';

interface HODDashboardProps {
  setActiveTab: (tab: string) => void;
}

export const HODDashboard: React.FC<HODDashboardProps> = ({ setActiveTab }) => {
  const { currentUser } = useAuth();
  const {
    complaints,
    openComplaintDetails,
    openAssignModal,
    openStatusModal,
    openResolveModal,
    maintenanceTeams,
  } = useData();

  // 8 Official Live Statistics Cards as specified in user brief:
  // Total Complaints, Pending, Assigned, In Progress, Resolved, High Priority, Student Reports, Faculty Reports
  const totalComplaints = complaints.length;
  const pending = complaints.filter((c) => c.status === 'Pending').length;
  const assigned = complaints.filter((c) => c.status === 'Assigned').length;
  const inProgress = complaints.filter((c) => c.status === 'In Progress').length;
  const resolved = complaints.filter((c) => c.status === 'Resolved').length;
  const highPriority = complaints.filter(
    (c) => c.priority === 'High' || c.priority === 'Critical'
  ).length;
  const studentReports = complaints.filter(
    (c) => c.submittedByRole === 'STUDENT'
  ).length;
  const facultyReports = complaints.filter(
    (c) => c.submittedByRole === 'FACULTY'
  ).length;

  // Recent complaints sorted by newest first
  const recentComplaints = [...complaints]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const resolutionRate =
    totalComplaints > 0 ? Math.round((resolved / totalComplaints) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top HOD Command Header */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-sky-300 text-xs font-semibold mb-3 border border-sky-400/20 backdrop-blur-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>HOD Operations Command & Central Dispatch</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {currentUser?.name || 'Dr. S. Radhakrishnan'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 font-normal">
              {currentUser?.department || 'Campus Operations & Engineering'} • Central Administration Block, Room 102
              <br />
              <span className="text-sky-300 text-xs font-mono">
                System Status: Active • {pending} Complaints Pending Review
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('student-complaints')}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center gap-2 transition cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Student Complaints ({studentReports})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('assignments')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center gap-2 transition cursor-pointer"
            >
              <Wrench className="w-4 h-4 text-amber-400" />
              <span>Assignments ({assigned})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('faculty-reports')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center gap-2 transition cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4 text-purple-400" />
              <span>Faculty Reports ({facultyReports})</span>
            </button>
          </div>
        </div>

        {/* Decorative background flare */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-600/10 blur-3xl pointer-events-none" />
      </div>

      {/* 8 Live Statistics Cards as specified in user brief */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            HOD Overview Statistics
          </div>
          <span className="text-xs text-slate-400">Live operational data</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {/* 1. Total Complaints */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 transition">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              Total Complaints
            </span>
            <div className="mt-2 text-2xl font-black text-slate-900">{totalComplaints}</div>
            <span className="text-[10px] text-blue-600 font-semibold mt-1 block">Campus wide</span>
          </div>

          {/* 2. Pending */}
          <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs hover:border-amber-400 transition">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block truncate">
              Pending
            </span>
            <div className="mt-2 text-2xl font-black text-amber-700">{pending}</div>
            <span className="text-[10px] text-amber-600 font-medium mt-1 block">Needs review</span>
          </div>

          {/* 3. Assigned */}
          <div className="bg-white p-4 rounded-2xl border border-blue-200 bg-blue-50/20 shadow-xs hover:border-blue-400 transition">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block truncate">
              Assigned
            </span>
            <div className="mt-2 text-2xl font-black text-blue-700">{assigned}</div>
            <span className="text-[10px] text-blue-600 font-medium mt-1 block">To teams</span>
          </div>

          {/* 4. In Progress */}
          <div className="bg-white p-4 rounded-2xl border border-indigo-200 bg-indigo-50/20 shadow-xs hover:border-indigo-400 transition">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block truncate">
              In Progress
            </span>
            <div className="mt-2 text-2xl font-black text-indigo-700">{inProgress}</div>
            <span className="text-[10px] text-indigo-600 font-medium mt-1 block">Active repair</span>
          </div>

          {/* 5. Resolved */}
          <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs hover:border-emerald-400 transition">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block truncate">
              Resolved
            </span>
            <div className="mt-2 text-2xl font-black text-emerald-700">{resolved}</div>
            <span className="text-[10px] text-emerald-600 font-bold mt-1 block">{resolutionRate}% closed</span>
          </div>

          {/* 6. High Priority */}
          <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs hover:border-rose-400 transition">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block truncate">
              High Priority
            </span>
            <div className="mt-2 text-2xl font-black text-rose-700">{highPriority}</div>
            <span className="text-[10px] text-rose-600 font-bold mt-1 block">High & Critical</span>
          </div>

          {/* 7. Student Reports */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-sky-400 transition">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 block truncate">
              Student Reports
            </span>
            <div className="mt-2 text-2xl font-black text-sky-800">{studentReports}</div>
            <span className="text-[10px] text-slate-500 mt-1 block">Class & Hostels</span>
          </div>

          {/* 8. Faculty Reports */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-purple-400 transition">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block truncate">
              Faculty Reports
            </span>
            <div className="mt-2 text-2xl font-black text-purple-800">{facultyReports}</div>
            <span className="text-[10px] text-slate-500 mt-1 block">Labs & Research</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Complaints + Quick Dispatch & Maintenance Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Dedicated Recent Complaints Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Recent Complaints</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                    Latest {recentComplaints.length}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Latest facility problem reports submitted by campus students and faculty
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('student-complaints')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer transition"
              >
                <span>View all complaints</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {recentComplaints.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No complaints submitted yet.
                </div>
              ) : (
                recentComplaints.map((item) => (
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
                          <span className="text-xs text-slate-600 font-semibold truncate">
                            {item.submitterName}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            • {item.submitterDepartment}
                          </span>
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
                            {item.classroomOrLab || 'N/A'}
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

                        {/* Assigned info or note */}
                        {item.assignedTo && (
                          <div className="mt-2 text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5">
                            <Wrench className="w-3 h-3 text-emerald-600" />
                            <span>Assigned to: {item.assignedTo} ({item.assignedTeam})</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick HOD Actions */}
                    <div className="flex items-center gap-1.5 self-start sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => openAssignModal(item)}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                        title="Assign team"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Assign</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openStatusModal(item)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer"
                        title="Update status"
                      >
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Status</span>
                      </button>

                      {item.status !== 'Resolved' && (
                        <button
                          type="button"
                          onClick={() => openResolveModal(item)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="Mark as Resolved"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Resolve</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openComplaintDetails(item)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer transition"
                        title="View details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Velocity & Maintenance Duty Status */}
        <div className="space-y-4">
          {/* Resolution Velocity Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Resolution Velocity</span>
              </h3>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                {resolutionRate}% Resolved
              </span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mb-2">
              <div
                className="bg-gradient-to-r from-blue-600 to-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${resolutionRate}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>{resolved} of {totalComplaints} closed</span>
              <span>Avg turn-around: 4.8 hrs</span>
            </div>
          </div>

          {/* Maintenance Officers Status */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Duty Maintenance Teams</span>
              </h3>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>

            <div className="space-y-2.5">
              {maintenanceTeams.slice(0, 5).map((team) => (
                <div
                  key={team.id}
                  className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-800">{team.name}</div>
                    <div className="text-[11px] text-slate-500">{team.team}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded-md">
                      {team.activeWorkloads} active
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
