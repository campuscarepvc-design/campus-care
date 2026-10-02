import React, { useState } from 'react';
import { Complaint, ComplaintStatus } from '../../types';
import { useData } from '../../context/DataContext';
import { StatusBadge } from '../common/StatusBadge';
import {
  X,
  CheckCircle2,
  Clock,
  Wrench,
  AlertCircle,
  FileText,
  Save,
  ShieldCheck,
} from 'lucide-react';

interface StatusUpdateModalProps {
  complaint: Complaint | null;
  initialMode?: 'STATUS' | 'RESOLVE';
  onClose: () => void;
}

export const StatusUpdateModal: React.FC<StatusUpdateModalProps> = ({
  complaint,
  initialMode = 'STATUS',
  onClose,
}) => {
  const { updateStatus } = useData();

  const [status, setStatus] = useState<ComplaintStatus>(
    initialMode === 'RESOLVE' ? 'Resolved' : complaint?.status || 'In Progress'
  );
  const [remarks, setRemarks] = useState(complaint?.hodRemarks || '');
  const [resolutionRemark, setResolutionRemark] = useState(
    complaint?.resolutionSummary || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!complaint) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Require resolution remark before resolving
    if (status === 'Resolved') {
      const finalRemark = resolutionRemark.trim() || remarks.trim();
      if (!finalRemark) {
        setErrorMsg('A resolution remark is required before marking this complaint as Resolved.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const finalRemark = status === 'Resolved'
        ? (resolutionRemark.trim() || remarks.trim())
        : (remarks.trim() || undefined);

      await updateStatus(complaint.id, {
        status,
        remarks: finalRemark,
        resolutionSummary: status === 'Resolved' ? finalRemark : undefined,
      });
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to update complaint status. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isResolving = status === 'Resolved';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-6 text-white relative ${isResolving ? 'bg-emerald-950' : 'bg-slate-900'}`}>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-slate-800/80 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-1">
            {isResolving ? (
              <span className="text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Resolve Complaint</span>
              </span>
            ) : (
              <span className="text-sky-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Status & Remarks Management</span>
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-white">
            {isResolving ? 'Mark Complaint as Resolved' : 'Update Complaint Status'}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Complaint <strong className="font-mono text-white">{complaint.id}</strong> • {complaint.title}
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[calc(85vh-160px)] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Status Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Select Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['Pending', 'Assigned', 'In Progress', 'Resolved'] as ComplaintStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatus(st)}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                    status === st
                      ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-600/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>{st}</span>
                  <StatusBadge status={st} size="sm" />
                </button>
              ))}
            </div>
          </div>

          {/* If Resolved: Mandatory Resolution Remark */}
          {isResolving ? (
            <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900">
                  Resolution Remark <span className="text-rose-600">* Required</span>
                </label>
                <span className="text-[10px] text-emerald-700 font-semibold">Will be logged in History</span>
              </div>
              <textarea
                required
                rows={3}
                placeholder="Detail the resolution work completed (e.g. Broken water line replaced and tested; corridor dried. Power restored to classroom 304 after capacitor replacement...)"
                value={resolutionRemark}
                onChange={(e) => setResolutionRemark(e.target.value)}
                className="w-full bg-white border border-emerald-300 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
              />
              <p className="text-[11px] text-emerald-800">
                This remark will update the complaint history, change updated date, and be visible to the student.
              </p>
            </div>
          ) : (
            /* General Official HOD Remarks */
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Official HOD Remarks / Notes
              </label>
              <textarea
                rows={3}
                placeholder="Add official administrative instructions, technician progress notes, or schedule adjustments..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>
          )}

          {/* Audit Notification Info */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-between">
            <span>Previous Status: <strong className="font-mono text-slate-800">{complaint.status}</strong></span>
            <span>New Status: <strong className="font-mono text-blue-700">{status}</strong></span>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2.5 rounded-xl text-white text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
                isResolving
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30'
              }`}
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isResolving ? 'Mark as Resolved' : 'Save Status Change'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
