import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { CategoryIcon } from '../common/CategoryIcon';
import { ComplaintCategory, ComplaintPriority, ComplaintStatus, Complaint } from '../../types';
import {
  Search,
  Filter,
  PlusCircle,
  MapPin,
  Calendar,
  Clock,
  ChevronRight,
  Eye,
  MessageSquare,
  Building,
  Image as ImageIcon,
  RotateCcw,
} from 'lucide-react';

interface MyComplaintsViewProps {
  onOpenReport: () => void;
  onStartMessageWithHOD?: (complaint: Complaint) => void;
}

export const MyComplaintsView: React.FC<MyComplaintsViewProps> = ({
  onOpenReport,
  onStartMessageWithHOD,
}) => {
  const { currentUser, role } = useAuth();
  const { complaints, openComplaintDetails } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');

  // Show only complaints belonging to the logged-in student
  const myComplaints = complaints.filter(
    (c) =>
      currentUser &&
      (c.submitterId === currentUser.id ||
        (currentUser.id === 'STU1001' && c.submitterId === 'STU-2024-101'))
  );

  const filtered = myComplaints.filter((item) => {
    if (selectedStatus !== 'ALL' && item.status !== selectedStatus) return false;
    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
    if (selectedPriority !== 'ALL' && item.priority !== selectedPriority) return false;

    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      return (
        item.id.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        (item.classroomOrLab && item.classroomOrLab.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header with Title and Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {role === 'FACULTY' ? 'My Escalations & Reports' : 'My Campus Complaints'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review status, maintenance assignments, and resolution updates for your registered complaints.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenReport}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 transition cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{role === 'FACULTY' ? 'Report to HOD' : 'Report Problem'}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by Complaint ID (e.g. CC-2026-0001), category, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
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

        {/* Secondary Category & Priority Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Filters:</span>
          </span>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
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

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          >
            <option value="ALL">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Reset Filters */}
          {(searchTerm || selectedStatus !== 'ALL' || selectedCategory !== 'ALL' || selectedPriority !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedStatus('ALL');
                setSelectedCategory('ALL');
                setSelectedPriority('ALL');
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 ml-auto cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Complaints List Cards */}
      <div className="space-y-3.5">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No complaints found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {myComplaints.length === 0
                ? 'You have not submitted any complaints yet. Use the "Report Problem" button to register an issue.'
                : 'No complaints match the specified search or filter criteria. Try adjusting or clearing your filters.'}
            </p>
            {myComplaints.length === 0 && (
              <button
                type="button"
                onClick={onOpenReport}
                className="mt-4 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-600/30 inline-flex items-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Submit First Complaint</span>
              </button>
            )}
          </div>
        ) : (
          filtered.map((complaint) => (
            <div
              key={complaint.id}
              className="bg-white rounded-3xl border border-slate-200 hover:border-blue-400 shadow-xs hover:shadow-md transition-all duration-200 p-5 sm:p-6 overflow-hidden group"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                <div className="flex items-start gap-4">
                  <CategoryIcon
                    category={complaint.category}
                    showBackground
                    className="w-5 h-5"
                  />
                  <div className="space-y-1.5 flex-1">
                    {/* Top Badges Row: ID, Category, Priority, Status */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                        {complaint.id}
                      </span>
                      <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                        {complaint.category}
                      </span>
                      <PriorityBadge priority={complaint.priority} size="sm" />
                      <StatusBadge status={complaint.status} size="sm" />
                      {complaint.photoUrl && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          <ImageIcon className="w-3 h-3 text-slate-600" /> Photo attached
                        </span>
                      )}
                    </div>

                    {/* Complaint Title */}
                    <h3
                      onClick={() => openComplaintDetails(complaint)}
                      className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition cursor-pointer"
                    >
                      {complaint.title}
                    </h3>

                    {/* Description preview */}
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {complaint.description}
                    </p>

                    {/* Metadata: Location, Created Date, Updated Date */}
                    <div className="flex flex-wrap items-center gap-y-1.5 gap-x-5 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1.5 font-medium text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>
                          {complaint.location}
                          {complaint.classroomOrLab && complaint.classroomOrLab !== 'N/A' && (
                            <span className="text-slate-500 ml-1 font-normal">
                              ({complaint.classroomOrLab})
                            </span>
                          )}
                        </span>
                      </span>

                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Created: <strong className="text-slate-600">{new Date(complaint.createdAt).toLocaleDateString()}</strong></span>
                      </span>

                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Updated: <strong className="text-slate-600">{new Date(complaint.updatedAt).toLocaleDateString()}</strong></span>
                      </span>
                    </div>

                    {/* If Assigned: Officer preview */}
                    {complaint.assignedTeam && (
                      <div className="pt-1 text-[11px] text-emerald-800 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Assigned to {complaint.assignedTeam} {complaint.assignedTo ? `(${complaint.assignedTo})` : ''}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center lg:flex-col justify-end gap-2 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 shrink-0">
                  <button
                    type="button"
                    onClick={() => openComplaintDetails(complaint)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Details</span>
                  </button>

                  {onStartMessageWithHOD && (
                    <button
                      type="button"
                      onClick={() => onStartMessageWithHOD(complaint)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg flex items-center gap-1 transition cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Message HOD</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
