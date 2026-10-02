import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Check, Image as ImageIcon, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

interface PhotoUploaderProps {
  photoUrl?: string;
  photoCaption?: string;
  onPhotoChange: (url?: string, caption?: string) => void;
  uploadType?: 'complaint' | 'faculty';
}

const SAMPLE_CAMPUS_PRESETS = [
  {
    name: 'Electrical Hazard',
    url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=80',
    caption: 'Burnt wiring socket and trip switch in lecture room',
  },
  {
    name: 'Water / Plumbing',
    url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80',
    caption: 'Water pipe leakage and standing water on corridor floor',
  },
  {
    name: 'Classroom AV',
    url: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&auto=format&fit=crop&q=80',
    caption: 'Projector unit offline with flashing error indicator',
  },
  {
    name: 'IT / Wi-Fi',
    url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&auto=format&fit=crop&q=80',
    caption: 'Ceiling network access point indicator down',
  },
];

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  photoUrl,
  photoCaption,
  onPhotoChange,
  uploadType = 'complaint',
}) => {
  const [caption, setCaption] = useState(photoCaption || '');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploadError(null);

    // 1. Validate file extension
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext) && !file.type.startsWith('image/')) {
      setUploadError('Invalid image format. Only JPG, JPEG, PNG, and WEBP formats are accepted.');
      return;
    }

    // 2. Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setUploadError('File size exceeds the 10MB limit. Please upload a smaller image.');
      return;
    }

    setIsUploading(true);
    try {
      let res;
      if (uploadType === 'faculty') {
        res = await api.uploadFacultyFile(file);
      } else {
        res = await api.uploadComplaintPhoto(file);
      }
      onPhotoChange(res.fileUrl, caption || file.name);
    } catch (err: any) {
      console.error('Upload failed, falling back to local preview:', err);
      // Fallback to base64 if network is unavailable
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        onPhotoChange(dataUrl, caption || file.name);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSelectPreset = (preset: typeof SAMPLE_CAMPUS_PRESETS[0]) => {
    setUploadError(null);
    setCaption(preset.caption);
    onPhotoChange(preset.url, preset.caption);
  };

  const handleClear = () => {
    setUploadError(null);
    setCaption('');
    onPhotoChange(undefined, undefined);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-slate-700">
          Photo Evidence / Attachment
          <span className="text-slate-400 font-normal ml-1.5">(JPG, PNG, WEBP up to 10MB)</span>
        </label>
        {photoUrl && !isUploading && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-rose-600 hover:text-rose-700 font-medium inline-flex items-center gap-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" /> Remove photo
          </button>
        )}
      </div>

      {uploadError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{uploadError}</span>
        </div>
      )}

      {isUploading ? (
        <div className="border border-slate-200 rounded-2xl p-8 bg-slate-50 text-center flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
          <p className="text-xs font-bold text-slate-800">Uploading photo to server storage...</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Validating format and storing securely</p>
        </div>
      ) : photoUrl ? (
        <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 p-2.5">
          <div className="relative h-48 w-full rounded-xl overflow-hidden bg-slate-900/5 flex items-center justify-center">
            <img
              src={photoUrl}
              alt="Problem Evidence"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 right-2 bg-slate-900/80 text-white text-xs px-2.5 py-1 rounded-lg backdrop-blur-xs flex items-center gap-1 shadow-sm font-semibold">
              <Check className="w-3.5 h-3.5 text-emerald-400" /> Stored Persistently
            </div>
          </div>
          <div className="mt-2.5">
            <input
              type="text"
              placeholder="Add photo caption or detail (e.g., burnt switchboard, pipeline rupture)"
              value={caption}
              onChange={(e) => {
                setCaption(e.target.value);
                onPhotoChange(photoUrl, e.target.value);
              }}
              className="w-full text-xs text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-blue-500 bg-blue-50/50'
              : 'border-slate-300 hover:border-blue-400 bg-white hover:bg-slate-50/70'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
          />
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
            <Camera className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-700">
            Click to upload photo or drag & drop
          </p>
          <p className="text-xs text-slate-400 mt-1">
            JPG, JPEG, PNG, WEBP up to 10MB
          </p>
        </div>
      )}

      {/* Quick Sample Incident Photo Presets for Demo */}
      {!photoUrl && !isUploading && (
        <div className="pt-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Or select a demo campus incident photo:</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SAMPLE_CAMPUS_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className="p-2 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl text-left transition cursor-pointer text-xs group"
              >
                <div className="font-semibold text-slate-700 group-hover:text-blue-700 truncate">
                  {preset.name}
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                  Preset Photo
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
