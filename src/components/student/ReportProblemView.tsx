import React, { useState } from 'react';
import { ComplaintCategory, ComplaintPriority } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { PhotoUploader } from '../common/PhotoUploader';
import { CategoryIcon } from '../common/CategoryIcon';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import {
  Send,
  AlertTriangle,
  Building,
  MapPin,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  FileText,
  Clock,
  PlusCircle,
} from 'lucide-react';

interface ReportProblemViewProps {
  onNavigateToComplaints: () => void;
}

const CATEGORIES: ComplaintCategory[] = [
  'Electrical',
  'Water',
  'Cleaning',
  'Classroom',
  'Laboratory',
  'Internet',
  'Safety',
  'Other',
];

const PRIORITIES: { value: ComplaintPriority; label: string; desc: string }[] = [
  { value: 'Low', label: 'Low', desc: 'Minor cosmetic issue or non-urgent repair' },
  { value: 'Medium', label: 'Medium', desc: 'Standard maintenance required' },
  { value: 'High', label: 'High', desc: 'Affecting classroom lectures or lab sessions' },
  { value: 'Critical', label: 'Critical', desc: 'Immediate safety hazard or total power/water breakdown' },
];

export const ReportProblemView: React.FC<ReportProblemViewProps> = ({
  onNavigateToComplaints,
}) => {
  const { currentUser, role } = useAuth();
  const { createComplaint } = useData();

  const [category, setCategory] = useState<ComplaintCategory>('Electrical');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [classroomOrLab, setClassroomOrLab] = useState('');
  const [priority, setPriority] = useState<ComplaintPriority>('Medium');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>();
  const [photoCaption, setPhotoCaption] = useState<string | undefined>();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [submittedComplaintId, setSubmittedComplaintId] = useState<string | null>(null);

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!category) {
      errors.category = 'Please select a problem category.';
    }
    if (!description.trim()) {
      errors.description = 'Problem description is required.';
    } else if (description.trim().length < 10) {
      errors.description = 'Please provide at least 10 characters describing the issue.';
    }
    if (!location.trim()) {
      errors.location = 'Campus location is required.';
    }
    if (!priority) {
      errors.priority = 'Please select a priority level.';
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validate();
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const room = classroomOrLab.trim() ? classroomOrLab.trim() : 'N/A';
      const title = `${category} issue at ${location.trim()}${room !== 'N/A' ? ` (${room})` : ''}`;

      const created = await createComplaint({
        title,
        category,
        description: description.trim(),
        location: location.trim(),
        classroomOrLab: room,
        priority,
        photoUrl,
        photoCaption,
        submittedByRole: (role as 'STUDENT' | 'FACULTY') || 'STUDENT',
        submitterId: currentUser?.id || 'STU1001',
        submitterName: currentUser?.name || 'Aryan Verma',
        submitterEmail: currentUser?.email || 'stu1001@campuscare.edu',
        submitterDepartment: currentUser?.department || 'Computer Science & Engineering',
      });

      setSubmittedComplaintId(created.id);
    } catch (err) {
      console.error(err);
      setValidationErrors({
        submit: 'Failed to record complaint. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setCategory('Electrical');
    setDescription('');
    setLocation('');
    setClassroomOrLab('');
    setPriority('Medium');
    setPhotoUrl(undefined);
    setPhotoCaption(undefined);
    setValidationErrors({});
    setSubmittedComplaintId(null);
  };

  // If complaint was just submitted, show professional confirmation card
  if (submittedComplaintId) {
    return (
      <div className="max-w-2xl mx-auto py-6 animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden text-center p-8 sm:p-10 space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full inline-block mb-3">
              Complaint Registered Successfully
            </span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight font-mono">
              {submittedComplaintId}
            </h2>
            <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
              Your problem has been recorded in the central campus system with status{' '}
              <strong className="text-amber-600 font-bold">Pending</strong>.
              The HOD Operations desk and duty maintenance crews have been notified.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-xs text-left max-w-md mx-auto space-y-2.5">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Complaint ID:</span>
              <span className="font-mono font-bold text-blue-700">{submittedComplaintId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Problem Category:</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <CategoryIcon category={category} className="w-3.5 h-3.5" />
                {category}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Location:</span>
              <span className="font-semibold text-slate-800">
                {location} {classroomOrLab ? `(${classroomOrLab})` : ''}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Initial Status:</span>
              <StatusBadge status="Pending" size="sm" />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Priority:</span>
              <PriorityBadge priority={priority} size="sm" />
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={onNavigateToComplaints}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <span>View in My Complaints</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report Another Problem</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Student Maintenance Portal</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Report Campus Problem
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Submit any facility defect, water fault, electrical hazard, or classroom breakdown. A unique Complaint ID will be generated upon submission.
        </p>
      </div>

      {/* Main Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        {validationErrors.submit && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{validationErrors.submit}</span>
          </div>
        )}

        {/* 1. Problem Category Dropdown */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            1. Problem Category <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          {validationErrors.category && (
            <p className="text-xs text-rose-600 mt-1 font-medium">{validationErrors.category}</p>
          )}

          {/* Quick Category Buttons for convenience */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-2 transition cursor-pointer ${
                  category === cat
                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CategoryIcon category={cat} className="w-3.5 h-3.5" />
                <span className="truncate">{cat}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Problem Description (Required multiline text field) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              2. Problem Description <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-slate-400">
              {description.length} characters
            </span>
          </div>
          <textarea
            required
            rows={4}
            placeholder="Describe the issue in detail (e.g. sparks emitted from ceiling switchboard, tap leaking continuously creating floor puddle, Wi-Fi router flashing red error...)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`w-full bg-slate-50 border rounded-xl p-3.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition ${
              validationErrors.description ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
            }`}
          />
          {validationErrors.description && (
            <p className="text-xs text-rose-600 mt-1 font-medium">{validationErrors.description}</p>
          )}
        </div>

        {/* 3. Location (Required) & 4. Classroom / Laboratory (Optional) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              3. Location <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="e.g. Aryabhata Academic Block, 2nd Floor"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={`w-full bg-slate-50 border rounded-xl pl-9 pr-3.5 py-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition ${
                  validationErrors.location ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                }`}
              />
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
            {validationErrors.location && (
              <p className="text-xs text-rose-600 mt-1 font-medium">{validationErrors.location}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                4. Classroom / Laboratory
              </label>
              <span className="text-[11px] text-slate-400 font-normal">(Optional)</span>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Room 304, IoT Lab 2, Washroom 2B"
                value={classroomOrLab}
                onChange={(e) => setClassroomOrLab(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3.5 py-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
              />
              <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>
        </div>

        {/* 5. Photo Upload (Allow image upload & show image preview before submission) */}
        <div>
          <PhotoUploader
            photoUrl={photoUrl}
            photoCaption={photoCaption}
            onPhotoChange={(url, cap) => {
              setPhotoUrl(url);
              setPhotoCaption(cap);
            }}
          />
        </div>

        {/* 6. Priority (Low, Medium, High, Critical) */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            6. Priority Level <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {PRIORITIES.map((p) => {
              const isSelected = priority === p.value;
              return (
                <div
                  key={p.value}
                  onClick={() => setPriority(p.value)}
                  className={`p-3 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-600/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900">{p.label}</span>
                    <PriorityBadge priority={p.value} size="sm" />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">{p.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submitter Info Card */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            Submitting as: <strong className="text-slate-800">{currentUser?.name}</strong>{' '}
            <span className="font-mono text-blue-700 font-bold">({currentUser?.id})</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            System will automatically assign: <span className="font-mono font-bold text-slate-700">CC-2026-XXXX</span>
          </div>
        </div>

        {/* 7. Submit Complaint Button */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onNavigateToComplaints}
            className="px-5 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Complaint</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
