import React from 'react';
import { useData } from '../../context/DataContext';
import { ComplaintCategory, ComplaintPriority } from '../../types';
import { CategoryIcon } from '../common/CategoryIcon';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Clock,
  CheckCircle2,
  Building,
  ShieldAlert,
  GraduationCap,
  Briefcase,
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { complaints } = useData();

  const total = complaints.length;
  const resolved = complaints.filter((c) => c.status === 'Resolved').length;
  const inProgress = complaints.filter((c) => c.status === 'In Progress').length;
  const assigned = complaints.filter((c) => c.status === 'Assigned').length;
  const pending = complaints.filter((c) => c.status === 'Pending').length;

  const categories: ComplaintCategory[] = [
    'Electrical',
    'Water',
    'Cleaning',
    'Classroom',
    'Laboratory',
    'Internet',
    'Safety',
    'Other',
  ];

  const categoryCounts = categories.map((cat) => ({
    category: cat,
    count: complaints.filter((c) => c.category === cat).length,
  }));

  const priorities: ComplaintPriority[] = ['Critical', 'High', 'Medium', 'Low'];
  const priorityCounts = priorities.map((p) => ({
    priority: p,
    count: complaints.filter((c) => c.priority === p).length,
  }));

  const studentCount = complaints.filter((c) => c.submittedByRole === 'STUDENT').length;
  const facultyCount = complaints.filter((c) => c.submittedByRole === 'FACULTY').length;

  // Mock Campus Zone distribution based on complaint locations
  const zones = [
    { name: 'Aryabhata Academic Block', count: 3, percentage: 38 },
    { name: 'Science & Research Complex', count: 2, percentage: 25 },
    { name: 'Computer Center & IT Wing', count: 1, percentage: 12 },
    { name: 'Mechanical Workshops', count: 1, percentage: 12 },
    { name: 'Student Hostels & Quads', count: 1, percentage: 12 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Campus Infrastructure Analytics & Intelligence
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Comprehensive operational metrics on facility breakdown patterns, resolution speeds, and crew productivity.
        </p>
      </div>

      {/* Top High-level KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Avg Resolution Time</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">4.8 Hours</div>
          <span className="text-xs text-emerald-600 font-semibold mt-1 block">
            ↓ 1.2 hrs faster than last month
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Resolution Ratio</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-700 mt-2">
            {total > 0 ? Math.round((resolved / total) * 100) : 0}%
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            {resolved} closed out of {total} total
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Critical & High Severity</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-3xl font-black text-rose-700 mt-2">
            {complaints.filter((c) => c.priority === 'Critical' || c.priority === 'High').length}
          </div>
          <span className="text-xs text-rose-600 font-semibold mt-1 block">
            Dispatched on priority
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Submitter Ratio</span>
            <GraduationCap className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">
            {studentCount} : {facultyCount}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Students vs Faculty reports
          </span>
        </div>
      </div>

      {/* 2-Column Analytics Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span>Complaints by Category</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">{total} total</span>
          </div>

          <div className="space-y-3">
            {categoryCounts.map(({ category, count }) => {
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-semibold text-slate-700">
                      <CategoryIcon category={category} className="w-3.5 h-3.5" />
                      <span>{category}</span>
                    </div>
                    <span className="font-bold text-slate-900">
                      {count} <span className="text-slate-400 font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority & Severity Distribution */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <span>Severity Distribution</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {priorityCounts.map(({ priority, count }) => {
                const getColors = () => {
                  switch (priority) {
                    case 'Critical':
                      return 'bg-rose-50 text-rose-700 border-rose-200';
                    case 'High':
                      return 'bg-orange-50 text-orange-700 border-orange-200';
                    case 'Medium':
                      return 'bg-sky-50 text-sky-700 border-sky-200';
                    case 'Low':
                    default:
                      return 'bg-slate-50 text-slate-700 border-slate-200';
                  }
                };
                return (
                  <div
                    key={priority}
                    className={`p-3.5 rounded-2xl border text-center ${getColors()}`}
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wider block">
                      {priority}
                    </span>
                    <span className="text-2xl font-black mt-1 block">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Campus Zones Breakdown */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-sky-600" />
              <span>Breakdowns by Campus Complex</span>
            </h3>
            <div className="space-y-2.5">
              {zones.map((zone) => (
                <div key={zone.name} className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 font-medium">{zone.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full"
                        style={{ width: `${zone.percentage}%` }}
                      />
                    </div>
                    <span className="font-bold text-slate-900 font-mono w-6 text-right">
                      {zone.count}
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
