import React, { useState } from 'react';
import { ComplaintCategory, ComplaintPriority } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { PhotoUploader } from '../common/PhotoUploader';
import { CategoryIcon } from '../common/CategoryIcon';
import {
  X,
  AlertTriangle,
  Building,
  MapPin,
  CheckCircle2,
  Sparkles,
  Send,
  Zap,
} from 'lucide-react';

interface ReportProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessComplaint?: (id: string) => void;
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
  { value: 'Low', label: 'Low', desc: 'Cosmetic or minor inconvenience', color: 'border-slate-300 text-slate-700' },
  { value: 'Medium', label: 'Medium', desc: 'Standard maintenance required', color: 'border-sky-300 text-sky-700' },
  { value: 'High', label: 'High', desc: 'Impacting ongoing classes or labs', color: 'border-orange-300 text-orange-700' },
  { value: 'Critical', label: 'Critical', desc: 'Safety hazard or total outage', color: 'border-rose-400 text-rose-700' },
];

export const ReportProblemModal: React.FC<ReportProblemModalProps> = ({
  isOpen,
  onClose,
  onSuccessComplaint,
}) => {
  const { currentUser, role } = useAuth();
  const { createComplaint } = useData();

  const [category, setCategory] = useState<ComplaintCategory>('Electrical');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Aryabhata Academic Block, 2nd Floor');
  const [classroomOrLab, setClassroomOrLab] = useState('Room 204');
  const [priority, setPriority] = useState<ComplaintPriority>('High');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>();
  const [photoCaption, setPhotoCaption] = useState<string | undefined>();
  
  // Faculty specific fields (if faculty is using this modal)
  const [courseOrClassAffected, setCourseOrClassAffected] = useState('');
  const [estimatedAffectedStudents, setEstimatedAffectedStudents] = useState<number | ''>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successId, setSuccessId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !location.trim()) {
      setErrorMsg('Please fill in all required fields (Description and Location).');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const room = classroomOrLab.trim() ? classroomOrLab.trim() : 'N/A';
      const generatedTitle = title.trim() || `${category} breakdown at ${location.trim()}${room !== 'N/A' ? ` (${room})` : ''}`;

      const created = await createComplaint({
        title: generatedTitle,
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
        courseOrClassAffected: courseOrClassAffected || undefined,
        estimatedAffectedStudents: estimatedAffectedStudents ? Number(estimatedAffectedStudents) : undefined,
      });

      setSuccessId(created.id);
      if (onSuccessComplaint) {
        onSuccessComplaint(created.id);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to submit complaint. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('Electrical');
    setPriority('High');
    setPhotoUrl(undefined);
    setPhotoCaption(undefined);
    setSuccessId(null);
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Success Modal View */}
        {successId ? (
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Complaint Registered Successfully
              </span>
              <h3 className="text-2xl font-black text-slate-900 mt-3 font-mono">
                {successId}
              </h3>
              <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
                Your report has been logged in Campus Care with status{' '}
                <strong className="text-amber-600 font-semibold">Pending</strong>.
                The HOD operations cell and maintenance teams have been notified.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-left max-w-md mx-auto space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Complaint ID:</span>
                <span className="font-mono font-bold text-slate-800">{successId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Category:</span>
                <span className="font-semibold text-slate-800">{category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Location:</span>
                <span className="font-semibold text-slate-800">{classroomOrLab} ({location})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Priority Level:</span>
                <span className="font-bold text-rose-600">{priority}</span>
              </div>
            </div>

            <div className="pt-3 flex justify-center gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition cursor-pointer"
              >
                Done / Back to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-6 relative">
              <button
                type="button"
                onClick={onClose}
                className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4" />
                <span>
                  {role === 'FACULTY' ? 'Faculty Infrastructure Escalation' : 'Student Problem Report'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Report Campus Problem
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Fill the details below to dispatch maintenance teams with assigned complaint ID.
              </p>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[calc(85vh-160px)] overflow-y-auto">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Category Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  1. Problem Category <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                        category === cat
                          ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-600/20 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <CategoryIcon category={cat} className="w-4 h-4" />
                      <span>{cat}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & Priority Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Short Title / Summary
                  </label>
                  <input
                    type="text"
                    placeholder={`e.g. ${category} issue in Classroom`}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Priority <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as ComplaintPriority)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  >
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Priority</option>
                    <option value="Critical">Critical (Immediate)</option>
                  </select>
                </div>
              </div>

              {/* Location & Classroom/Lab Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Campus Block / Building Location <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sir C.V. Raman Science Wing, 2nd Floor"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Classroom / Lab / Room No. <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Room 304, IoT Lab 2, Restroom 2B"
                      value={classroomOrLab}
                      onChange={(e) => setClassroomOrLab(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                    <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Detailed Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe what is broken, what symptoms you noticed (sparks, leak, noise, offline error), and any safety precautions taken..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>

              {/* Faculty Specific Fields (if Faculty reporting) */}
              {role === 'FACULTY' && (
                <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
                  <div className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                    Academic Impact Context
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Course / Practical Class Impacted
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. CS302 - Data Structures Lab"
                        value={courseOrClassAffected}
                        onChange={(e) => setCourseOrClassAffected(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Estimated Students Affected
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 60"
                        value={estimatedAffectedStudents}
                        onChange={(e) =>
                          setEstimatedAffectedStudents(
                            e.target.value === '' ? '' : Number(e.target.value)
                          )
                        }
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Photo Upload Component */}
              <PhotoUploader
                photoUrl={photoUrl}
                photoCaption={photoCaption}
                onPhotoChange={(url, cap) => {
                  setPhotoUrl(url);
                  setPhotoCaption(cap);
                }}
              />

              {/* Submitter Info Preview */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between text-slate-600">
                <div>
                  Submitting as: <strong className="text-slate-800">{currentUser?.name}</strong>{' '}
                  <span className="text-slate-400 font-mono">({currentUser?.id})</span>
                </div>
                <div className="text-[11px] text-blue-600 font-semibold">
                  Unique ID (CC-2026-XXXX) will be generated
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Complaint</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
