import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Complaint, ComplaintCategory, ComplaintPriority, ComplaintStatus } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { CategoryIcon } from '../common/CategoryIcon';
import {
  Search,
  Filter,
  PlusCircle,
  Eye,
  Building,
  MapPin,
  Calendar,
  Clock,
  MessageSquare,
  FileText,
  RotateCcw,
  Paperclip,
  Wrench,
  Table as TableIcon,
  LayoutGrid,
} from 'lucide-react';

interface FacultyMyReportsViewProps {
  onOpenReport: () => void;
  onStartMessageWithHOD?: (complaint: Complaint) => void;
}

const CATEGORIES: (ComplaintCategory | 'ALL')[] = [
  'ALL',
  'Electrical',
  'Water',
  'Cleaning',
  'Classroom',
  'Laboratory',
  'Internet',
  'Safety',
  'Other',
];

const PRIORITIES: (ComplaintPriority | 'ALL')[] = ['ALL', 'Critical', 'High', 'Medium', 'Low'];
const STATUSES: (ComplaintStatus | 'ALL')[] = ['ALL', 'Pending', 'Assigned', 'In Progress', 'Resolved'];

export const FacultyMyReportsView: React.FC<FacultyMyReportsViewProps> = ({
  onOpenReport,
  onStartMessageWithHOD,
}) => {
  const { currentUser } = useAuth();
  const { complaints, openComplaintDetails } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ComplaintStatus | 'ALL'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<ComplaintCategory | 'ALL'>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<ComplaintPriority | 'ALL'>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Show only reports created by logged in faculty member
  const facultyReports = complaints.filter(
    (c) =>
      currentUser &&
      (c.submitterId === currentUser.id ||
        (currentUser.id === 'FAC1001' && c.submitterId === 'FAC-CS-204') ||
        (c.submittedByRole === 'FACULTY' && c.submitterEmail === currentUser.email))
  );

  const filtered = facultyReports.filter((item) => {
    if (selectedStatus !== 'ALL' && item.status !== selectedStatus) return false;
    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
    if (selectedPriority !== 'ALL' && item.priority !== selectedPriority) return false;

    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase().trim();
      const matchId = item.id.toLowerCase().includes(q);
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchLoc = item.location.toLowerCase().includes(q);
      const matchRoom = item.classroomOrLab ? item.classroomOrLab.toLowerCase().includes(q) : false;
      const matchDept = item.submitterDepartment ? item.submitterDepartment.toLowerCase().includes(q) : false;
      return matchId || matchTitle || matchDesc || matchLoc || matchRoom || matchDept;
    }
    return true;
  });

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedStatus('ALL');
    setSelectedCategory('ALL');
    setSelectedPriority('ALL');
  };

  const hasActiveFilters =
    searchTerm !== '' ||
    selectedStatus !== 'ALL' ||
    selectedCategory !== 'ALL' ||
    selectedPriority !== 'ALL';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            My Academic Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track infrastructure maintenance escalations filed by you to HOD Operations.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* View mode toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenReport}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-2 transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report to HOD</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by Report ID (e.g. FR-2026-0001), category, location or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>

          {/* Status filter tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
            {STATUSES.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedStatus === st
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {st === 'ALL' ? 'All Status' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Category & Priority Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filters:
          </span>

          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as ComplaintCategory | 'ALL')}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
            title="Filter by Category"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'ALL' ? 'All Categories' : cat}
              </option>
            ))}
          </select>

          {/* Priority filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value as ComplaintPriority | 'ALL')}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
            title="Filter by Priority"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p === 'ALL' ? 'All Priorities' : `${p} Priority`}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold ml-auto flex items-center gap-1 cursor-pointer transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Reports List / Table Content */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No reports found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {facultyReports.length === 0
              ? 'You have not submitted any academic reports yet. Use the "Report to HOD" button to file an infrastructure request.'
              : 'No reports match your selected search or filter parameters.'}
          </p>
          {facultyReports.length === 0 ? (
            <button
              type="button"
              onClick={onOpenReport}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition cursor-pointer"
            >
              Submit First Report
            </button>
          ) : (
            <button
              type="button"
              onClick={resetFilters}
              className="mt-3 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* Professional Faculty Reports Table */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 whitespace-nowrap">Report ID</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Category</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Department</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Location</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Priority</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Created Date</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Updated Date</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 transition duration-150 group"
                  >
                    {/* Report ID */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openComplaintDetails(item)}
                        className="font-mono text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md border border-blue-200 transition cursor-pointer"
                        title="Click to view full details"
                      >
                        {item.id}
                      </button>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <CategoryIcon category={item.category} className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold text-slate-800">{item.category}</span>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 font-medium max-w-[180px] truncate" title={item.submitterDepartment}>
                      {item.submitterDepartment}
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-800 truncate max-w-[160px]" title={item.location}>
                        {item.classroomOrLab || item.location}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[160px]" title={item.location}>
                        {item.location}
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <PriorityBadge priority={item.priority} size="sm" />
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={item.status} size="sm" />
                    </td>

                    {/* Created Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 text-[11px]">
                      {new Date(item.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Updated Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                      {new Date(item.updatedAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openComplaintDetails(item)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Details</span>
                        </button>

                        {onStartMessageWithHOD && (
                          <button
                            type="button"
                            onClick={() => onStartMessageWithHOD(item)}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                            title="Message HOD regarding this report"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Message HOD</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Professional Faculty Reports Card View */
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-blue-400 shadow-xs transition duration-200 p-5 overflow-hidden group"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <CategoryIcon category={item.category} showBackground className="w-5 h-5 shrink-0" />
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                        {item.id}
                      </span>
                      <StatusBadge status={item.status} size="sm" />
                      <PriorityBadge priority={item.priority} size="sm" />
                      {item.documentName && (
                        <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Paperclip className="w-3 h-3 text-slate-400" />
                          <span>Document Attached</span>
                        </span>
                      )}
                    </div>

                    <h3
                      onClick={() => openComplaintDetails(item)}
                      className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition cursor-pointer"
                    >
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                      {item.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 mt-2.5">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Building className="w-3.5 h-3.5 text-blue-600" />
                        {item.classroomOrLab || 'Room N/A'}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {item.location}
                      </span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />
                        Created: {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        Updated: {new Date(item.updatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    {item.assignedTo && (
                      <div className="mt-3 text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-emerald-600" />
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

                  {onStartMessageWithHOD && (
                    <button
                      type="button"
                      onClick={() => onStartMessageWithHOD(item)}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                      title="Message HOD regarding this report"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Message HOD</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
