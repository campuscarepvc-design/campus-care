import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';

// Storage root and subdirectories
const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
export const UPLOADS_ROOT = isVercel
  ? '/tmp/uploads'
  : path.resolve(process.cwd(), 'uploads');
export const COMPLAINTS_UPLOADS_DIR = path.join(UPLOADS_ROOT, 'complaints');
export const FACULTY_UPLOADS_DIR = path.join(UPLOADS_ROOT, 'faculty-reports');

// Ensure upload directories exist synchronously on startup
export function ensureUploadDirectoriesExist() {
  [UPLOADS_ROOT, COMPLAINTS_UPLOADS_DIR, FACULTY_UPLOADS_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`[Storage] Initialized persistent upload directory: ${dir}`);
      } catch (err) {
        console.error(`[Storage] Failed to create directory ${dir}:`, err);
      }
    }
  });
}

ensureUploadDirectoriesExist();

// Allowed image formats: JPG, JPEG, PNG, WEBP
const ALLOWED_IMAGE_MIMES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];
const ALLOWED_IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];

// Allowed document formats: PDF, Word (DOC, DOCX), Excel (XLS, XLSX), Text, CSV
const ALLOWED_DOC_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
];
const ALLOWED_DOC_EXTS = [
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.txt',
  '.csv',
];

// Dangerous executable extensions strictly forbidden
const FORBIDDEN_EXTS = [
  '.exe',
  '.bat',
  '.cmd',
  '.sh',
  '.php',
  '.js',
  '.ts',
  '.py',
  '.rb',
  '.vbs',
  '.ps1',
  '.jar',
  '.bin',
  '.html',
  '.htm',
  '.svg',
];

// Helper: generate collision-resistant safe filename
function generateSafeFilename(prefix: string, originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const timestamp = Date.now();
  const randomHex = crypto.randomBytes(8).toString('hex');
  return `${prefix}-${timestamp}-${randomHex}${ext}`;
}

// Multer storage for student complaint photos
const complaintStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, COMPLAINTS_UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const filename = generateSafeFilename('complaint', file.originalname);
    cb(null, filename);
  },
});

export const uploadComplaintPhoto = multer({
  storage: complaintStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (FORBIDDEN_EXTS.includes(ext)) {
      return cb(new Error('Security violation: Executable or script files are strictly prohibited.'));
    }
    if (!ALLOWED_IMAGE_MIMES.includes(file.mimetype) || !ALLOWED_IMAGE_EXTS.includes(ext)) {
      return cb(new Error('Invalid file type. Only JPG, JPEG, PNG, and WEBP image formats are accepted.'));
    }
    cb(null, true);
  },
});

// Multer storage for faculty photos and documents
const facultyStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, FACULTY_UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const isDoc = ALLOWED_DOC_EXTS.includes(path.extname(file.originalname).toLowerCase());
    const prefix = isDoc ? 'faculty-doc' : 'faculty-photo';
    const filename = generateSafeFilename(prefix, file.originalname);
    cb(null, filename);
  },
});

export const uploadFacultyFile = multer({
  storage: facultyStorage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit for documents & high-res images
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (FORBIDDEN_EXTS.includes(ext)) {
      return cb(new Error('Security violation: Executable or script files are strictly prohibited.'));
    }
    const isAllowedImage = ALLOWED_IMAGE_MIMES.includes(file.mimetype) && ALLOWED_IMAGE_EXTS.includes(ext);
    const isAllowedDoc = ALLOWED_DOC_MIMES.includes(file.mimetype) || ALLOWED_DOC_EXTS.includes(ext);

    if (!isAllowedImage && !isAllowedDoc) {
      return cb(new Error('Invalid file type. Accepted: JPG, JPEG, PNG, WEBP, PDF, Word DOC/DOCX, Excel XLS/XLSX, TXT.'));
    }
    cb(null, true);
  },
});

// Fallback: decode base64 dataUrl and store persistently to disk
export function persistBase64DataUrl(
  dataUrl: string,
  targetFolder: 'complaints' | 'faculty-reports',
  prefix: string,
  suggestedName?: string
): { fileUrl: string; fileName: string } | null {
  if (!dataUrl || !dataUrl.startsWith('data:')) {
    return null;
  }

  try {
    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return null;
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    let ext = '.jpg';
    if (mimeType === 'image/png') ext = '.png';
    else if (mimeType === 'image/webp') ext = '.webp';
    else if (mimeType === 'application/pdf') ext = '.pdf';
    else if (mimeType === 'application/msword') ext = '.doc';
    else if (mimeType.includes('wordprocessingml')) ext = '.docx';

    const filename = `${prefix}-${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    const targetDir = targetFolder === 'complaints' ? COMPLAINTS_UPLOADS_DIR : FACULTY_UPLOADS_DIR;
    const destPath = path.join(targetDir, filename);

    fs.writeFileSync(destPath, buffer);
    console.log(`[Storage] Persisted base64 upload to disk: ${destPath}`);

    return {
      fileUrl: `/api/files/${targetFolder}/${filename}`,
      fileName: suggestedName || filename,
    };
  } catch (err) {
    console.error('[Storage] Error saving base64 data to disk:', err);
    return null;
  }
}

// Secure file retrieval with directory traversal prevention
export function resolveSecureFilePath(
  folder: 'complaints' | 'faculty-reports',
  filename: string
): { fullPath: string; mimeType: string } | null {
  // Prevent path traversal
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return null;
  }

  const safeFilename = path.basename(filename);
  const targetDir = folder === 'complaints' ? COMPLAINTS_UPLOADS_DIR : FACULTY_UPLOADS_DIR;
  const fullPath = path.join(targetDir, safeFilename);

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  // Derive MIME type safely
  const ext = path.extname(safeFilename).toLowerCase();
  let mimeType = 'application/octet-stream';
  if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
  else if (ext === '.png') mimeType = 'image/png';
  else if (ext === '.webp') mimeType = 'image/webp';
  else if (ext === '.pdf') mimeType = 'application/pdf';
  else if (ext === '.doc') mimeType = 'application/msword';
  else if (ext === '.docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  else if (ext === '.xls') mimeType = 'application/vnd.ms-excel';
  else if (ext === '.xlsx') mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  else if (ext === '.txt') mimeType = 'text/plain';
  else if (ext === '.csv') mimeType = 'text/csv';

  return { fullPath, mimeType };
}
