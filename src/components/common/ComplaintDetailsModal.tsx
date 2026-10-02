import React from 'react';
import { Complaint, UserRole, ComplaintStatus } from '../../types';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { CategoryIcon } from './CategoryIcon';
import {
  X,
  MapPin,
  Calendar,
  User,
  Wrench,
  Clock,
  CheckCircle2,
  MessageSquare,
  ShieldAlert,
  ArrowRight,
  FileText,
  Building,
  History,
  Check,
  ExternalLink,
} from 'lucide-react';

interface ComplaintDetailsModalProps {
  complaint: Complaint | null;
  onClose: () => void;
  currentUserRole: UserRole | null;
  onOpenAssign?: (complaint: Complaint) => void;
  onOpenStatusUpdate?: (complaint: Complaint) => void;
  onOpenResolve?: (complaint: Complaint) => void;
  onStartMessageWithHOD?: (complaint: Complaint) => void;
  onStartMessageWithStudent?: (complaint: Complaint) => void;
}

const STATUS_STEPS: ComplaintStatus[] = ['Pending', 'Assigned', 'In Progress', 'Resolved'];

export const ComplaintDetailsModal: React.FC<ComplaintDetailsModalProps> = ({
  complaint,
  onClose,
  currentUserRole,
  onOpenAssign,
  onOpenStatusUpdate,
  onOpenResolve,
  onStartMessageWithHOD,
  onStartMessageWithStudent,
}) => {
  if (!complaint) return null;

  const currentStatusIndex = STATUS_STEPS.indexOf(complaint.status);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="font-mono text-xs font-bold px-3 py-1 rounded-md bg-blue-500 text-white shadow-xs">
              {complaint.id}
            </span>
            <StatusBadge status={complaint.status} size="sm" />
            <PriorityBadge priority={complaint.priority} size="sm" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-start gap-2.5">
            <CategoryIcon category={complaint.category} className="w-6 h-6 text-sky-400 mt-1 shrink-0" />
            <span>{complaint.title}</span>
          </h2>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-sky-400" />
              <span>Created Date: <strong>{new Date(complaint.createdAt).toLocaleString()}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span>Updated Date: <strong>{new Date(complaint.updatedAt).toLocaleString()}</strong></span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[calc(85vh-200px)] overflow-y-auto">
          {/* Visual Status Timeline (Pending → Assigned → In Progress → Resolved) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>Visual Status Progression Timeline</span>
            </h4>

            <div className="relative flex items-center justify-between">
              {/* Connecting background bar */}
              <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-slate-200 -z-0" />
              {/* Active fill bar */}
              <div
                className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-blue-600 transition-all duration-500 -z-0"
                style={{
                  width: `${(Math.max(0, currentStatusIndex) / (STATUS_STEPS.length - 1)) * 90}%`,
                }}
              />

              {STATUS_STEPS.map((step, idx) => {
                const isPassed = idx < currentStatusIndex;
                const isCurrent = idx === currentStatusIndex;
                return (
                  <div key={step} className="relative z-10 flex flex-col items-center">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition shadow-xs ${
                        isPassed
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                          : isCurrent
                          ? 'bg-blue-600 text-white ring-4 ring-blue-100 animate-pulse'
                          : 'bg-white border-2 border-slate-300 text-slate-400'
                      }`}
                    >
                      {isPassed ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
                    </div>
                    <span
                      className={`text-[11px] font-bold mt-2 whitespace-nowrap ${
                        isCurrent
                          ? 'text-blue-700'
                          : isPassed
                          ? 'text-emerald-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Details Overview Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Category
              </span>
              <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-slate-800">
                <CategoryIcon category={complaint.category} className="w-4 h-4 text-blue-600" />
                <span>{complaint.category}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Priority
              </span>
              <div className="mt-1">
                <PriorityBadge priority={complaint.priority} size="sm" />
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Location
              </span>
              <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-slate-800 truncate" title={complaint.location}>
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{complaint.location}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Classroom / Lab
              </span>
              <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-slate-800 truncate">
                <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{complaint.classroomOrLab || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Problem Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Problem Description
            </h4>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm text-slate-700 leading-relaxed font-normal">
              {complaint.description}
            </div>
          </div>

          {/* Uploaded Photo Evidence */}
          {complaint.photoUrl && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Uploaded Photo Evidence
                </h4>
                <div className="flex items-center gap-2">
                  <a
                    href={complaint.photoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1 hover:underline"
                  >
                    <span>View Full Image</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <span className="text-slate-300">•</span>
                  <a
                    href={`${complaint.photoUrl}${complaint.photoUrl.includes('?') ? '&' : '?'}download=true`}
                    download
                    className="text-xs text-slate-600 hover:text-slate-800 font-semibold inline-flex items-center gap-1 hover:underline"
                  >
                    <span>Download</span>
                  </a>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-900/5">
                <img
                  src={complaint.photoUrl}
                  alt={complaint.photoCaption || 'Evidence'}
                  className="w-full max-h-72 object-cover"
                />
                {complaint.photoCaption && (
                  <div className="p-3 bg-white border-t border-slate-200 text-xs text-slate-600 font-medium">
                    <span className="font-bold text-slate-800">Caption: </span>
                    {complaint.photoCaption}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Uploaded Document */}
          {(complaint.documentName || complaint.documentUrl) && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Uploaded Supporting Document
              </h4>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800 truncate">
                      {complaint.documentName || 'Attached_Document.pdf'}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Official supporting escalation document attached
                    </div>
                  </div>
                </div>
                {complaint.documentUrl && (
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={complaint.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-xs font-bold text-blue-700 transition"
                    >
                      View
                    </a>
                    <a
                      href={`${complaint.documentUrl}${complaint.documentUrl.includes('?') ? '&' : '?'}download=true`}
                      download
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
                    >
                      Download
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submitter & Assigned Person */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Submitter Info */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {complaint.submittedByRole === 'FACULTY' ? 'Reported By Faculty' : 'Reported By Student'}
                </span>
                {currentUserRole === 'HOD' && onStartMessageWithStudent && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onStartMessageWithStudent(complaint);
                    }}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Message {complaint.submittedByRole === 'FACULTY' ? 'Faculty' : 'Student'}</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                  {complaint.submitterName.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    {complaint.submitterName}
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    {complaint.submittedByRole === 'FACULTY' ? 'Faculty ID: ' : 'Student ID: '}
                    <strong>{complaint.submitterId}</strong>
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Department: <strong>{complaint.submitterDepartment}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Assigned Person */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Assigned Person / Wing
              </span>
              {complaint.assignedTo || complaint.assignedTeam ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {complaint.assignedTo || 'Assigned Officer'}
                    </div>
                    <div className="text-xs text-emerald-700 font-semibold">
                      {complaint.assignedTeam}
                    </div>
                    {complaint.targetResolutionDate && (
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Target: {new Date(complaint.targetResolutionDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-2 text-xs text-slate-500 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>Awaiting HOD assignment to maintenance team</span>
                </div>
              )}
            </div>
          </div>

          {/* Official HOD Remarks & Resolution Summary */}
          {(complaint.hodRemarks || complaint.resolutionSummary) && (
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wider">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>HOD Administrative Notes</span>
              </div>
              {complaint.hodRemarks && (
                <p className="text-xs text-slate-700 leading-relaxed">
                  <strong className="text-slate-900">Instructions / Remarks: </strong>
                  {complaint.hodRemarks}
                </p>
              )}
              {complaint.resolutionSummary && (
                <div className="mt-2 pt-2 border-t border-blue-200/60">
                  <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Resolution Summary</span>
                  </div>
                  <p className="text-xs text-slate-700 mt-1">
                    {complaint.resolutionSummary}
                  </p>
                  {complaint.resolvedAt && (
                    <span className="text-[10px] text-slate-500 block mt-1">
                      Completed on {new Date(complaint.resolvedAt).toLocaleString()}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Complaint History with Date/time, Status, Remark, Updated by */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-blue-600" />
              <span>Complaint History</span>
            </h4>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-4">Date / Time</th>
                      <th className="py-2.5 px-4">Action</th>
                      <th className="py-2.5 px-4">Previous Status</th>
                      <th className="py-2.5 px-4">New Status</th>
                      <th className="py-2.5 px-4">Remark</th>
                      <th className="py-2.5 px-4">Updated By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {complaint.actionLogs && complaint.actionLogs.length > 0 ? (
                      complaint.actionLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-4 whitespace-nowrap text-slate-500 font-medium">
                            {new Date(log.timestamp).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-2.5 px-4 whitespace-nowrap font-bold text-slate-800">
                            {log.action}
                          </td>
                          <td className="py-2.5 px-4 whitespace-nowrap">
                            {log.previousStatus ? (
                              <StatusBadge status={log.previousStatus} size="sm" />
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 whitespace-nowrap">
                            {log.newStatus ? (
                              <StatusBadge status={log.newStatus} size="sm" />
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-slate-600 max-w-xs truncate" title={log.remark || log.notes || ''}>
                            {log.remark || log.notes || '—'}
                          </td>
                          <td className="py-2.5 px-4 whitespace-nowrap text-slate-700">
                            <span className="font-semibold">{log.updatedBy || log.actorName}</span>
                            {!log.updatedBy && (
                              <span className="text-[10px] text-slate-400 block font-mono">
                                ({log.actorRole})
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-4 text-center text-slate-400">
                          No history entries recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Complaint Tracking: <strong className="font-mono text-slate-800">{complaint.id}</strong>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {currentUserRole !== 'HOD' && onStartMessageWithHOD && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onStartMessageWithHOD(complaint);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Message HOD regarding this</span>
              </button>
            )}

            {currentUserRole === 'HOD' && (
              <>
                {onOpenAssign && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAssign(complaint);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Assign Team</span>
                  </button>
                )}

                {onOpenStatusUpdate && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenStatusUpdate(complaint);
                    }}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Status / Remarks</span>
                  </button>
                )}

                {onOpenResolve && complaint.status !== 'Resolved' && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenResolve(complaint);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark as Resolved</span>
                  </button>
                )}

                {onStartMessageWithStudent && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onStartMessageWithStudent(complaint);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    title={`Send reply to ${complaint.submitterName}`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Message Student</span>
                  </button>
                )}
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-white text-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
