import React, { useState } from 'react';
import { Complaint, MaintenanceOfficer } from '../../types';
import { useData } from '../../context/DataContext';
import {
  X,
  Wrench,
  Calendar,
  FileText,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Phone,
  Building,
  User,
} from 'lucide-react';

interface AssignComplaintModalProps {
  complaint: Complaint | null;
  onClose: () => void;
}

const DEPARTMENT_TEAMS = [
  'Electrical Maintenance Wing',
  'Water Supply & Plumbing Cell',
  'Campus Wi-Fi & IT Networks',
  'Sanitation & Hygiene Services',
  'Civil & Structural Maintenance',
  'Computer Science Lab Staff',
  'Mechanical Workshop Technicians',
  'Electronics Lab Technicians',
];

export const AssignComplaintModal: React.FC<AssignComplaintModalProps> = ({
  complaint,
  onClose,
}) => {
  const { assignComplaint, maintenanceTeams, allUsers } = useData();

  const [responsiblePerson, setResponsiblePerson] = useState<string>(
    maintenanceTeams[0]?.name || 'Kumar Rajan'
  );
  const [departmentTeam, setDepartmentTeam] = useState<string>(
    maintenanceTeams[0]?.team || 'Electrical Maintenance Wing'
  );
  const [expectedCompletionDate, setExpectedCompletionDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [assignmentRemarks, setAssignmentRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!complaint) return null;

  const handleSelectQuickOfficer = (team: MaintenanceOfficer) => {
    setResponsiblePerson(team.name);
    setDepartmentTeam(team.team);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!responsiblePerson.trim()) {
      setErrorMsg('Please specify the Responsible Person.');
      return;
    }
    if (!departmentTeam.trim()) {
      setErrorMsg('Please specify the Department/Team.');
      return;
    }
    if (!expectedCompletionDate) {
      setErrorMsg('Please select an Expected Completion Date.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await assignComplaint(complaint.id, {
        assignedTo: responsiblePerson.trim(),
        assignedTeam: departmentTeam.trim(),
        targetResolutionDate: expectedCompletionDate,
        hodRemarks: assignmentRemarks.trim() || undefined,
      });
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to assign complaint. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150"
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
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
            <Wrench className="w-4 h-4" />
            <span>HOD Operations Assignment</span>
          </div>
          <h2 className="text-xl font-bold text-white">
            Assign Complaint
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Complaint <strong className="font-mono text-white">{complaint.id}</strong> • {complaint.title}
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[calc(85vh-160px)] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Complaint Context Summary */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="font-mono font-bold text-blue-700">{complaint.id}</span>
              <span className="font-semibold text-slate-700">{complaint.category}</span>
            </div>
            <div className="text-slate-700 font-bold">{complaint.title}</div>
            <div className="text-slate-500 text-[11px]">
              Location: <strong>{complaint.location}</strong> {complaint.classroomOrLab ? `(${complaint.classroomOrLab})` : ''}
            </div>
            <div className="text-slate-500 text-[11px]">
              Student: <strong>{complaint.submitterName}</strong> ({complaint.submitterDepartment})
            </div>
          </div>

          {/* Quick Maintenance Crew Preset Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Duty Maintenance Personnel
            </label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {maintenanceTeams.map((team) => {
                const isSelected = responsiblePerson === team.name;
                return (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => handleSelectQuickOfficer(team)}
                    className={`p-2.5 rounded-xl border text-left text-xs transition cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 text-blue-700 ring-2 ring-blue-600/20 font-bold'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-bold truncate">{team.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">{team.team}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Field 1: Responsible Person */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Responsible Person <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="e.g. Kumar Rajan / Prof. Suresh Rao"
                value={responsiblePerson}
                onChange={(e) => setResponsiblePerson(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Form Field 2: Department/Team */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Department / Team <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                list="departmentTeamsList"
                placeholder="e.g. Electrical Maintenance Wing"
                value={departmentTeam}
                onChange={(e) => setDepartmentTeam(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
              <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <datalist id="departmentTeamsList">
                {DEPARTMENT_TEAMS.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Form Field 3: Expected Completion Date */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Expected Completion Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={expectedCompletionDate}
                onChange={(e) => setExpectedCompletionDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Form Field 4: Assignment Remarks */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Assignment Remarks
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Inspect ceiling electrical box; replace burnt switch and restore power before afternoon classes..."
              value={assignmentRemarks}
              onChange={(e) => setAssignmentRemarks(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
            <span>Complaint status will automatically change from <strong>Pending</strong> to <strong>Assigned</strong>.</span>
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
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Assign & Update Status</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
