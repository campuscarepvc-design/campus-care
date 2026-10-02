import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Complaint, ComplaintCategory, ComplaintPriority, ComplaintStatus } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { CategoryIcon } from '../common/CategoryIcon';
import {
  Search,
  Filter,
  Wrench,
  CheckCircle2,
  Eye,
  Building,
  MapPin,
  Calendar,
  MessageSquare,
  AlertCircle,
  Table as TableIcon,
  LayoutGrid,
  Clock,
  User,
  RotateCcw,
} from 'lucide-react';

interface HODComplaintsManagementProps {
  filterRole?: 'STUDENT' | 'FACULTY' | 'ALL';
  title?: string;
  subtitle?: string;
  onStartMessage?: (complaint: Complaint) => void;
}

const DEPARTMENTS = [
  'ALL',
  'Computer Science & Engineering',
  'Electronics & Communication',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical & Electronics',
  'Information Technology',
  'Campus Operations & Engineering',
];

export const HODComplaintsManagement: React.FC<HODComplaintsManagementProps> = ({
  filterRole = 'ALL',
  title = 'Student Campus Complaints',
  subtitle = 'Review, prioritize, assign, and resolve facility issues registered by college students.',
  onStartMessage,
}) => {
  const {
    complaints,
    openComplaintDetails,
    openAssignModal,
    openStatusModal,
    openResolveModal,
  } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Filter based on props & state
  const filtered = complaints.filter((item) => {
    if (filterRole !== 'ALL' && item.submittedByRole !== filterRole) return false;
    if (selectedStatus !== 'ALL' && item.status !== selectedStatus) return false;
    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
    if (selectedPriority !== 'ALL' && item.priority !== selectedPriority) return false;
    if (selectedDepartment !== 'ALL' && item.submitterDepartment !== selectedDepartment) return false;

    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase().trim();
      const matchId = item.id.toLowerCase().includes(q);
      const matchName = item.submitterName.toLowerCase().includes(q);
      const matchLocation =
        item.location.toLowerCase().includes(q) ||
        (item.classroomOrLab && item.classroomOrLab.toLowerCase().includes(q));
      const matchOther =
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.submitterDepartment.toLowerCase().includes(q);
      return matchId || matchName || matchLocation || matchOther;
    }
    return true;
  });

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedStatus('ALL');
    setSelectedCategory('ALL');
    setSelectedPriority('ALL');
    setSelectedDepartment('ALL');
  };

  const hasActiveFilters =
    searchTerm !== '' ||
    selectedStatus !== 'ALL' ||
    selectedCategory !== 'ALL' ||
    selectedPriority !== 'ALL' ||
    selectedDepartment !== 'ALL';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {title}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">{subtitle}</p>
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

          <span className="text-xs font-bold bg-blue-100 text-blue-800 px-3 py-1.5 rounded-xl border border-blue-200">
            {filtered.length} Complaints
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box: search by Complaint ID, student name, or location */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by Complaint ID (e.g. CC-2026-0001), student name, or location / room..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
            {['ALL', 'Pending', 'Assigned', 'In Progress', 'Resolved'].map((st) => (
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
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Multi-Filter Dropdowns: Category, Department, Priority */}
        <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filters:
          </span>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
            title="Filter by Category"
          >
            <option value="ALL">All Categories</option>
            <option value="Electrical">Electrical</option>
            <option value="Water">Water</option>
            <option value="Cleaning">Cleaning</option>
            <option value="Classroom">Classroom</option>
            <option value="Laboratory">Laboratory</option>
            <option value="Internet">Internet</option>
            <option value="Safety">Safety</option>
            <option value="Other">Other</option>
          </select>

          {/* Department Filter */}
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
            title="Filter by Department"
          >
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept === 'ALL' ? 'All Departments' : dept}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
            title="Filter by Priority"
          >
            <option value="ALL">All Priorities</option>
            <option value="Critical">Critical Priority</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
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

      {/* Complaints List / Table Content */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No complaints found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            No complaints match the chosen filters or search query.
          </p>
          {hasActiveFilters && (
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
        /* Professional Complaints Table */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 whitespace-nowrap">Complaint ID</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Student Name</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Department</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Category</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Location</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Priority</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Assigned Person</th>
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
                    {/* Complaint ID */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openComplaintDetails(item)}
                        className="font-mono text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md border border-blue-200 transition cursor-pointer"
                        title="Click to view details"
                      >
                        {item.id}
                      </button>
                    </td>

                    {/* Student Name */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{item.submitterName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {item.submitterId}
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 font-medium max-w-[180px] truncate" title={item.submitterDepartment}>
                      {item.submitterDepartment}
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <CategoryIcon category={item.category} className="w-3.5 h-3.5 text-blue-600" />
                        <span className="font-semibold text-slate-800">{item.category}</span>
                      </div>
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

                    {/* Assigned Person */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {item.assignedTo ? (
                        <div>
                          <div className="font-bold text-emerald-800 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>{item.assignedTo}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[140px]" title={item.assignedTeam}>
                            {item.assignedTeam}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          Unassigned
                        </span>
                      )}
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
                        {/* Assign Button */}
                        <button
                          type="button"
                          onClick={() => openAssignModal(item)}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs"
                          title="Assign to maintenance team"
                        >
                          <Wrench className="w-3 h-3" />
                          <span>Assign</span>
                        </button>

                        {/* Status / Remarks Button */}
                        <button
                          type="button"
                          onClick={() => openStatusModal(item)}
                          className="px-2.5 py-1 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                          title="Change status or add official remarks"
                        >
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>Status</span>
                        </button>

                        {/* Mark as Resolved button (if not resolved) */}
                        {item.status !== 'Resolved' && (
                          <button
                            type="button"
                            onClick={() => openResolveModal(item)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs"
                            title="Mark as Resolved"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Resolve</span>
                          </button>
                        )}

                        {/* Details View */}
                        <button
                          type="button"
                          onClick={() => openComplaintDetails(item)}
                          className="p-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition cursor-pointer"
                          title="View Full Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Message Student */}
                        {onStartMessage && (
                          <button
                            type="button"
                            onClick={() => onStartMessage(item)}
                            className="p-1 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                            title={`Message ${item.submitterName} (Ref: ${item.id})`}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
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
        /* Professional Complaints Card View */
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-blue-400 shadow-xs transition duration-200 p-5 overflow-hidden group"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <CategoryIcon
                    category={item.category}
                    showBackground
                    className="w-5 h-5 shrink-0"
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                        {item.id}
                      </span>
                      <StatusBadge status={item.status} size="sm" />
                      <PriorityBadge priority={item.priority} size="sm" />
                      <span className="text-xs font-bold text-slate-800">
                        {item.submitterName}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        • {item.submitterDepartment}
                      </span>
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

                    {/* Assigned Crew or HOD remarks */}
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                      {item.assignedTo ? (
                        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5">
                          <Wrench className="w-3 h-3 text-emerald-600" />
                          <span>Assigned: {item.assignedTo} ({item.assignedTeam})</span>
                        </div>
                      ) : (
                        <div className="bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          <span>Unassigned — Technician needed</span>
                        </div>
                      )}

                      {item.hodRemarks && (
                        <div className="bg-slate-50 border border-slate-200 text-slate-600 px-2.5 py-1 rounded-lg text-[11px] truncate max-w-md">
                          <strong>Remark:</strong> {item.hodRemarks}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* HOD Action Buttons for This Complaint */}
                <div className="flex flex-wrap lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-2 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 shrink-0">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openAssignModal(item)}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                      title="Assign Maintenance Team"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Assign</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openStatusModal(item)}
                      className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      title="Update Status / Add Remarks"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Status</span>
                    </button>

                    {item.status !== 'Resolved' && (
                      <button
                        type="button"
                        onClick={() => openResolveModal(item)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                        title="Mark as Resolved"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Resolve</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => openComplaintDetails(item)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>

                    {onStartMessage && (
                      <button
                        type="button"
                        onClick={() => onStartMessage(item)}
                        className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                        title={`Message ${item.submitterName}`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Message</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
