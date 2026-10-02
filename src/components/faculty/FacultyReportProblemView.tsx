import React, { useState } from 'react';
import { ComplaintCategory, ComplaintPriority } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { PhotoUploader } from '../common/PhotoUploader';
import { DocumentUploader } from '../common/DocumentUploader';
import { CategoryIcon } from '../common/CategoryIcon';
import {
  Send,
  Building,
  MapPin,
  CheckCircle2,
  FileText,
  Clock,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Briefcase,
} from 'lucide-react';

interface FacultyReportProblemViewProps {
  onNavigateToReports: () => void;
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

const PRIORITIES: { value: ComplaintPriority; label: string; desc: string; color: string }[] = [
  { value: 'Low', label: 'Low', desc: 'Minor maintenance or routine lab upkeep', color: 'border-slate-300 text-slate-700' },
  { value: 'Medium', label: 'Medium', desc: 'Regular academic facility attention needed', color: 'border-blue-300 text-blue-700' },
  { value: 'High', label: 'High', desc: 'Affects ongoing lectures or student laboratory practicals', color: 'border-amber-400 text-amber-700' },
  { value: 'Critical', label: 'Critical', desc: 'Immediate exam stoppage, safety hazard or power failure', color: 'border-rose-400 text-rose-700' },
];

export const FacultyReportProblemView: React.FC<FacultyReportProblemViewProps> = ({
  onNavigateToReports,
}) => {
  const { currentUser } = useAuth();
  const { createComplaint } = useData();

  const [category, setCategory] = useState<ComplaintCategory>('Laboratory');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState(
    currentUser?.department || 'Computer Science & Engineering'
  );
  const [location, setLocation] = useState('Aryabhata Academic Block, 2nd Floor');
  const [classroomOrLab, setClassroomOrLab] = useState('IoT & Embedded Systems Lab 2');
  const [priority, setPriority] = useState<ComplaintPriority>('High');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>();
  const [photoCaption, setPhotoCaption] = useState<string | undefined>();
  const [documentUrl, setDocumentUrl] = useState<string | undefined>();
  const [documentName, setDocumentName] = useState<string | undefined>();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [submittedReportId, setSubmittedReportId] = useState<string | null>(null);

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!category) {
      errors.category = 'Please select a report category.';
    }
    if (!description.trim()) {
      errors.description = 'Problem description is required.';
    } else if (description.trim().length < 10) {
      errors.description = 'Please provide at least 10 characters describing the problem.';
    }
    if (!department.trim()) {
      errors.department = 'Department name is required.';
    }
    if (!location.trim()) {
      errors.location = 'Facility location is required.';
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
      const title = `${category} report at ${location.trim()}${room !== 'N/A' ? ` (${room})` : ''}`;

      const created = await createComplaint({
        title,
        category,
        description: description.trim(),
        location: location.trim(),
        classroomOrLab: room,
        priority,
        photoUrl,
        photoCaption,
        documentUrl,
        documentName,
        submittedByRole: 'FACULTY',
        submitterId: currentUser?.id || 'FAC1001',
        submitterName: currentUser?.name || 'Dr. Ananya Sen',
        submitterEmail: currentUser?.email || 'fac1001@campuscare.edu',
        submitterDepartment: department.trim(),
      });

      setSubmittedReportId(created.id);
    } catch (err) {
      console.error(err);
      setValidationErrors({
        form: 'Failed to submit report. Please check your network connection and try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSubmittedReportId(null);
    setDescription('');
    setPhotoUrl(undefined);
    setPhotoCaption(undefined);
    setDocumentUrl(undefined);
    setDocumentName(undefined);
    setValidationErrors({});
  };

  // Successful submission confirmation view
  if (submittedReportId) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-10 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-md shadow-emerald-500/10">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Faculty Escalation Registered Successfully</span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Report Submitted to HOD Central Directorate
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
            Your academic facility report has been submitted to Dr. S. Radhakrishnan (HOD Operations) and recorded with initial status <strong>Pending</strong>.
          </p>

          <div className="my-6 p-4 rounded-2xl bg-blue-50/70 border border-blue-200 inline-block max-w-sm w-full">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Generated Faculty Report ID
            </span>
            <div className="font-mono text-2xl font-black text-blue-700">
              {submittedReportId}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Initial Status: <strong className="text-amber-700">Pending Review</strong>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={onNavigateToReports}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <span>View in My Reports</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleResetForm}
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              Submit Another Report
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-sky-300 text-xs font-semibold mb-3 border border-sky-400/20 backdrop-blur-xs">
            <Briefcase className="w-3.5 h-3.5 text-sky-400" />
            <span>Faculty Academic Escalation Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Report to HOD
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-xl">
            Register academic infrastructure issues, lab equipment breakdowns, lecture hall AV malfunctions, or research facility requirements directly to the Head of Department.
          </p>
        </div>
      </div>

      {/* Report Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
        {validationErrors.form && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationErrors.form}</span>
          </div>
        )}

        {/* 1. Report Category */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            1. Report Category <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-center gap-2.5 ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 text-blue-700 ring-2 ring-blue-600/20 shadow-xs font-bold'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <CategoryIcon category={cat} className="w-4 h-4 shrink-0" />
                  <span className="text-xs">{cat}</span>
                </button>
              );
            })}
          </div>
          {validationErrors.category && (
            <p className="text-xs text-rose-600 mt-1.5">{validationErrors.category}</p>
          )}
        </div>

        {/* 2. Problem Description */}
        <div>
          <label htmlFor="problemDesc" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            2. Problem Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="problemDesc"
            rows={4}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide a detailed description of the facility or equipment issue (e.g. In IoT Lab 2, 8 oscilloscope units and master voltage regulator trip whenever circuit analysis test benches are switched on...)"
            className={`w-full bg-slate-50 border rounded-2xl p-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 ${
              validationErrors.description ? 'border-rose-400' : 'border-slate-300'
            }`}
          />
          {validationErrors.description && (
            <p className="text-xs text-rose-600 mt-1">{validationErrors.description}</p>
          )}
        </div>

        {/* 3. Department, Location & Classroom/Lab Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Department */}
          <div>
            <label htmlFor="deptInput" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              3. Department <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="deptInput"
                type="text"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Computer Science & Engineering"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
              <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
            {validationErrors.department && (
              <p className="text-xs text-rose-600 mt-1">{validationErrors.department}</p>
            )}
          </div>

          {/* Location */}
          <div>
            <label htmlFor="locInput" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              4. Location <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="locInput"
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Aryabhata Academic Block, 2nd Floor"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
            {validationErrors.location && (
              <p className="text-xs text-rose-600 mt-1">{validationErrors.location}</p>
            )}
          </div>

          {/* Classroom / Lab */}
          <div>
            <label htmlFor="roomInput" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              5. Classroom / Lab
            </label>
            <div className="relative">
              <input
                id="roomInput"
                type="text"
                value={classroomOrLab}
                onChange={(e) => setClassroomOrLab(e.target.value)}
                placeholder="e.g. Seminar Hall 202 / IoT Lab"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
              <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>
        </div>

        {/* 4. Priority Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            6. Priority Level <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {PRIORITIES.map((p) => {
              const isSelected = priority === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 text-blue-700 ring-2 ring-blue-600/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-xs">{p.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">{p.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Photo Upload */}
        <div className="pt-2 border-t border-slate-100">
          <PhotoUploader
            photoUrl={photoUrl}
            photoCaption={photoCaption}
            onPhotoChange={(url, caption) => {
              setPhotoUrl(url);
              setPhotoCaption(caption);
            }}
          />
        </div>

        {/* 6. Document Upload */}
        <div className="pt-2 border-t border-slate-100">
          <DocumentUploader
            documentUrl={documentUrl}
            documentName={documentName}
            onDocumentChange={(url, name) => {
              setDocumentUrl(url);
              setDocumentName(name);
            }}
          />
        </div>

        {/* Submit Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Submitter: <strong className="text-slate-800">{currentUser?.name}</strong> ({currentUser?.id})
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Report</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
