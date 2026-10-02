import React from 'react';
import { UserRole } from '../../types';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';

interface AccessDeniedViewProps {
  currentRole: UserRole | null;
  attemptedTab: string;
  onReturnToDashboard: () => void;
}

export const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({
  currentRole,
  attemptedTab,
  onReturnToDashboard,
}) => {
  const getForbiddenMessage = () => {
    if (currentRole === 'STUDENT') {
      return 'Student accounts do not have permission to view Faculty escalations or HOD administrative management consoles.';
    }
    if (currentRole === 'FACULTY') {
      return 'Faculty accounts do not have permission to access HOD dispatch, student complaint governance, or analytics consoles.';
    }
    return 'You do not have the required permissions to view this section.';
  };

  const getDashboardLabel = () => {
    switch (currentRole) {
      case 'STUDENT':
        return 'Return to Student Dashboard';
      case 'FACULTY':
        return 'Return to Faculty Dashboard';
      case 'HOD':
        return 'Return to HOD Command Center';
      default:
        return 'Return to Dashboard';
    }
  };

  return (
    <div className="min-h-[500px] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-lg w-full p-8 text-center space-y-5 animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
          <ShieldAlert className="w-9 h-9" />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold font-mono uppercase tracking-wider mb-2">
            <Lock className="w-3.5 h-3.5" />
            <span>403 — Protected Route</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Access Denied
          </h2>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            {getForbiddenMessage()}
          </p>
        </div>

        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 font-mono text-left space-y-1">
          <div className="flex justify-between">
            <span>Attempted Route:</span>
            <span className="font-bold text-slate-800">/{attemptedTab}</span>
          </div>
          <div className="flex justify-between">
            <span>Current Role:</span>
            <span className="font-bold text-blue-700">{currentRole}</span>
          </div>
          <div className="flex justify-between">
            <span>Enforcement:</span>
            <span className="text-emerald-700 font-semibold">Role-Based Access Control (RBAC)</span>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onReturnToDashboard}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{getDashboardLabel()}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
