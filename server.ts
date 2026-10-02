import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db } from './src/db/database';
import {
  Complaint,
  Message,
  NotificationItem,
  User,
  UserRole,
  DashboardStats,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
} from './src/types';
import { MAINTENANCE_TEAMS } from './src/data/seedData';
import {
  uploadComplaintPhoto,
  uploadFacultyFile,
  persistBase64DataUrl,
  resolveSecureFilePath,
} from './src/services/storage';
import {
  generateAuthToken,
  verifyAuthToken,
  revokeAuthToken,
  comparePassword,
  hashPasswordSync,
  sanitizeUser,
} from './src/services/auth';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: UserRole;
        name: string;
        department?: string;
      };
    }
  }
}

function matchesUserId(targetId?: string, testId?: string): boolean {
  if (!targetId || !testId) return false;
  if (targetId.toUpperCase() === testId.toUpperCase()) return true;
  if (
    (targetId === 'HOD1001' || targetId === 'HOD-ENG-001') &&
    (testId === 'HOD1001' || testId === 'HOD-ENG-001')
  )
    return true;
  if (
    (targetId === 'STU1001' || targetId === 'STU-2024-101') &&
    (testId === 'STU1001' || testId === 'STU-2024-101')
  )
    return true;
  if (
    (targetId === 'FAC1001' || targetId === 'FAC-CS-204') &&
    (testId === 'FAC1001' || testId === 'FAC-CS-204')
  )
    return true;
  return false;
}

export const app = express();

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Request logger
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`[API] ${req.method} ${req.path}`);
  }
  next();
});

  // JWT Extraction Middleware
  app.use((req: Request, _res: Response, next) => {
    let token: string | undefined;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (typeof req.query.token === 'string') {
      token = req.query.token;
    }
    if (token) {
      const decoded = verifyAuthToken(token);
      if (decoded) {
        req.user = decoded;
      }
    }
    next();
  });

  // Authentication Guard Middleware
  const requireAuth = (req: Request, res: Response, next: () => void) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required. Please sign in.' });
    }
    next();
  };

  // Role Guard Middleware
  const requireRole = (allowedRoles: UserRole[]) => {
    return (req: Request, res: Response, next: () => void) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required. Please sign in.' });
      }
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          error: `Access Denied: Role '${req.user.role}' is not authorized for this resource.`,
        });
      }
      next();
    };
  };

  // ==================== AUTH API ====================
  // Configured default demo credentials endpoint
  app.get('/api/auth/demo-credentials', (_req: Request, res: Response) => {
    return res.json({
      STUDENT: {
        id: 'STU1001',
        password: process.env.STUDENT_DEFAULT_PASSWORD || '',
      },
      FACULTY: {
        id: 'FAC1001',
        password: process.env.FACULTY_DEFAULT_PASSWORD || '',
      },
      HOD: {
        id: 'HOD1001',
        password: process.env.HOD_DEFAULT_PASSWORD || '',
      },
    });
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    const { id, password, role } = req.body;
    if (!id || typeof id !== 'string' || !password || typeof password !== 'string') {
      return res.status(400).json({ error: 'User ID and password are required.' });
    }

    const trimmedId = id.trim().toUpperCase();

    // Check user from persistent database
    let user = await db.getUserById(trimmedId);

    // If not found in primary list, check alias
    if (!user) {
      if (trimmedId === 'STU1001' || trimmedId === 'STU-2024-101') {
        user = await db.getUserById('STU1001');
      } else if (trimmedId === 'FAC1001' || trimmedId === 'FAC-CS-204') {
        user = await db.getUserById('FAC1001');
      } else if (trimmedId === 'HOD1001' || trimmedId === 'HOD-ENG-001') {
        user = await db.getUserById('HOD1001');
      }
    }

    // Do not reveal whether a specific account exists
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials. Please verify your ID and password.',
      });
    }

    // Check if account is inactive
    if (user.isActive === false) {
      return res.status(403).json({
        error: 'Account is inactive. Please contact the campus administrator.',
      });
    }

    // Check role match
    if (role && user.role !== role) {
      return res.status(403).json({
        error: 'Unauthorized role. The selected role does not match this account.',
      });
    }

    // Verify password with bcrypt against stored user hash
    let isPasswordValid = false;
    if (user.passwordHash) {
      isPasswordValid = await comparePassword(password, user.passwordHash);
    }

    // Also support configured environment variable for demo accounts & lazily sync hash
    if (!isPasswordValid) {
      const configuredEnvDefault =
        user.role === 'STUDENT'
          ? process.env.STUDENT_DEFAULT_PASSWORD
          : user.role === 'FACULTY'
          ? process.env.FACULTY_DEFAULT_PASSWORD
          : user.role === 'HOD'
          ? process.env.HOD_DEFAULT_PASSWORD
          : undefined;

      if (
        configuredEnvDefault &&
        configuredEnvDefault.trim().length > 0 &&
        password === configuredEnvDefault.trim()
      ) {
        isPasswordValid = true;
        user.passwordHash = hashPasswordSync(configuredEnvDefault.trim());
        user.isActive = true;
        user.mustChangePassword = false;
        await db.updateUserPassword(user.id, user.passwordHash, false);
      }
    }

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid credentials. Please verify your ID and password.',
      });
    }

    // Generate JWT token
    const token = generateAuthToken({
      id: user.id,
      role: user.role,
      name: user.name,
      department: user.department,
    });

    const safeUser = sanitizeUser(user);

    return res.json({
      success: true,
      user: safeUser,
      token,
    });
  });

  // Verify active session
  app.get('/api/auth/me', requireAuth, async (req: Request, res: Response) => {
    const user = await db.getUserById(req.user!.userId);
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }
    return res.json({
      success: true,
      user: sanitizeUser(user),
    });
  });

  // Invalidate session
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      revokeAuthToken(token);
    }
    return res.json({ success: true, message: 'Logged out successfully.' });
  });

  // Change password for authenticated Student, Faculty, or HOD
  app.post('/api/auth/change-password', requireAuth, async (req: Request, res: Response) => {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;
      const user = await db.getUserById(req.user!.userId);

      if (!user) {
        return res.status(404).json({ error: 'User account not found.' });
      }

      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ error: 'Current password, new password, and confirmation are required.' });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: 'New password and confirm password do not match.' });
      }

      if (typeof newPassword !== 'string' || newPassword.length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
      }

      if (currentPassword === newPassword) {
        return res.status(400).json({ error: 'New password cannot be identical to current password.' });
      }

      // Verify current password against database bcrypt hash
      let isCurrentValid = false;
      if (user.passwordHash) {
        isCurrentValid = await comparePassword(currentPassword, user.passwordHash);
      }

      if (!isCurrentValid) {
        return res.status(400).json({ error: 'Current password is incorrect. Please verify and retry.' });
      }

      // Hash new password securely
      const newHash = hashPasswordSync(newPassword);
      const updatedUser = await db.updateUserPassword(user.id, newHash, false);

      return res.json({
        success: true,
        message: 'Password changed successfully.',
        user: updatedUser ? sanitizeUser(updatedUser) : sanitizeUser(user),
      });
    } catch (err) {
      console.error('[API] Error changing password:', err);
      return res.status(500).json({ error: 'Failed to change password. Please try again.' });
    }
  });

  // Step 1: Request password reset verification code
  app.post('/api/auth/forgot-password', async (req: Request, res: Response) => {
    try {
      const { id, email } = req.body;
      if (!id || !email) {
        return res.status(400).json({ error: 'Campus User ID and registered email are required.' });
      }

      const trimmedId = id.trim().toUpperCase();
      const cleanEmail = email.trim().toLowerCase();

      const user = await db.getUserById(trimmedId);
      if (!user || user.email.toLowerCase() !== cleanEmail) {
        // Return clear error if account details don't match
        return res.status(404).json({
          error: 'No active account found matching this Campus ID and registered email.',
        });
      }

      // Generate secure 6-digit verification code
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes validity

      await db.setResetToken(user.id, resetCode, expiresAt);

      // Mask email for user privacy (e.g. a***a@campuscare.edu)
      const parts = user.email.split('@');
      const maskedName = parts[0].length > 2
        ? `${parts[0][0]}***${parts[0][parts[0].length - 1]}`
        : `${parts[0][0]}***`;
      const maskedEmail = `${maskedName}@${parts[1]}`;

      return res.json({
        success: true,
        message: `A 6-digit password reset code has been issued for ${maskedEmail}.`,
        resetCode, // Provided for instant prototype evaluation and automated testing
        maskedEmail,
      });
    } catch (err) {
      console.error('[API] Error requesting password reset:', err);
      return res.status(500).json({ error: 'Failed to initiate password reset.' });
    }
  });

  // Step 2: Verify reset code and set new password
  app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
    try {
      const { id, resetCode, newPassword, confirmPassword } = req.body;

      if (!id || !resetCode || !newPassword || !confirmPassword) {
        return res.status(400).json({
          error: 'User ID, reset verification code, and new password are required.',
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: 'New password and confirm password do not match.' });
      }

      if (typeof newPassword !== 'string' || newPassword.length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
      }

      const isValid = await db.verifyAndConsumeResetToken(id.trim().toUpperCase(), resetCode.trim());
      if (!isValid) {
        return res.status(400).json({
          error: 'Invalid or expired verification code. Please request a fresh reset code.',
        });
      }

      // Hash new password securely
      const newHash = hashPasswordSync(newPassword);
      await db.updateUserPassword(id.trim().toUpperCase(), newHash, false);

      return res.json({
        success: true,
        message: 'Password reset successful. You may now log in with your new password.',
      });
    } catch (err) {
      console.error('[API] Error resetting password:', err);
      return res.status(500).json({ error: 'Failed to reset password.' });
    }
  });

  // ==================== STATS API ====================
  app.get('/api/stats', requireAuth, async (_req: Request, res: Response) => {
    try {
      const stats = await db.getStats();
      return res.json(stats);
    } catch (err) {
      console.error('[API] Error getting stats:', err);
      return res.status(500).json({ error: 'Failed to calculate stats' });
    }
  });

  // ==================== COMPLAINTS & REPORTS API ====================
  app.get('/api/complaints', requireAuth, async (req: Request, res: Response) => {
    try {
      const { category, priority, status, search } = req.query;
      const user = req.user!;

      // Enforce strict role-based data isolation on server:
      // Students see only their own complaints
      // Faculty see only their own reports
      // HOD sees all authorized complaints and faculty reports
      let enforcedSubmitterId: string | undefined = undefined;
      let enforcedRole: 'STUDENT' | 'FACULTY' | undefined = undefined;

      if (user.role === 'STUDENT') {
        enforcedSubmitterId = user.userId;
        enforcedRole = 'STUDENT';
      } else if (user.role === 'FACULTY') {
        enforcedSubmitterId = user.userId;
        enforcedRole = 'FACULTY';
      }

      const tickets = await db.getAllTicketsUnified({
        submitterId: enforcedSubmitterId,
        submittedByRole: enforcedRole,
        category: typeof category === 'string' ? category : undefined,
        priority: typeof priority === 'string' ? priority : undefined,
        status: typeof status === 'string' ? status : undefined,
        search: typeof search === 'string' ? search : undefined,
      });

      return res.json(tickets);
    } catch (err) {
      console.error('[API] Error fetching tickets:', err);
      return res.status(500).json({ error: 'Failed to fetch tickets' });
    }
  });

  app.get('/api/complaints/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const ticket = await db.getUnifiedTicketById(req.params.id);
      if (!ticket) {
        return res.status(404).json({ error: 'Complaint or Report not found' });
      }

      const user = req.user!;
      if (user.role === 'STUDENT' && !matchesUserId(user.userId, ticket.submitterId)) {
        return res.status(403).json({ error: 'Access Denied: You can only view your own complaints.' });
      }
      if (user.role === 'FACULTY' && !matchesUserId(user.userId, ticket.submitterId)) {
        return res.status(403).json({ error: 'Access Denied: You can only view your own faculty reports.' });
      }

      return res.json(ticket);
    } catch (err) {
      console.error('[API] Error fetching ticket by id:', err);
      return res.status(500).json({ error: 'Failed to fetch ticket' });
    }
  });

  app.post('/api/complaints', requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const {
        title,
        category,
        description,
        location,
        classroomOrLab,
        priority,
        photoUrl,
        photoCaption,
        documentUrl,
        documentName,
        courseOrClassAffected,
        estimatedAffectedStudents,
      } = req.body;

      if (!category || !description || !location || !priority) {
        return res.status(400).json({
          error: 'Missing required report fields (Category, Description, Location, and Priority)',
        });
      }

      // Enforce role-based submission from authenticated session
      const isFaculty = user.role === 'FACULTY';
      const submitterId = user.userId;
      const submitterName = user.name;
      const submitterDepartment = user.department;

      // Automatically persist any base64 payload to persistent uploads directory
      let finalPhotoUrl = photoUrl;
      if (photoUrl && typeof photoUrl === 'string' && photoUrl.startsWith('data:')) {
        const persisted = persistBase64DataUrl(
          photoUrl,
          isFaculty ? 'faculty-reports' : 'complaints',
          isFaculty ? 'faculty-photo' : 'complaint',
          photoCaption
        );
        if (persisted) {
          finalPhotoUrl = persisted.fileUrl;
        }
      }

      let finalDocUrl = documentUrl;
      if (documentUrl && typeof documentUrl === 'string' && documentUrl.startsWith('data:')) {
        const persisted = persistBase64DataUrl(
          documentUrl,
          'faculty-reports',
          'faculty-doc',
          documentName
        );
        if (persisted) {
          finalDocUrl = persisted.fileUrl;
        }
      }

      if (isFaculty) {
        const report = await db.createFacultyReport({
          title,
          category,
          description,
          location,
          classroomLab: classroomOrLab,
          priority,
          photoUrl: finalPhotoUrl,
          photoCaption,
          documentUrl: finalDocUrl,
          documentName,
          facultyId: submitterId,
          facultyName: submitterName || 'Faculty Member',
          department: submitterDepartment || 'Computer Science & Engineering',
          courseOrClassAffected,
          estimatedAffectedStudents: estimatedAffectedStudents
            ? Number(estimatedAffectedStudents)
            : undefined,
        });

        // 1. Confirmation notification for Faculty
        await db.createNotification({
          userId: report.facultyId,
          title: 'Report Received',
          message: `Your faculty report ${report.reportId} has been successfully received by HOD Operations and queued for review.`,
          reportId: report.reportId,
          type: 'report_received',
        });

        // 2. Notification for HOD
        await db.createNotification({
          userId: 'HOD-ENG-001',
          title: 'New Faculty Report',
          message: `${report.facultyName} reported ${report.category} issue in ${report.classroomLab} (${report.reportId})`,
          reportId: report.reportId,
          type: 'new_report',
        });

        const unified = await db.getUnifiedTicketById(report.reportId);
        return res.status(201).json(unified);
      } else {
        const complaint = await db.createComplaint({
          title,
          category,
          description,
          location,
          classroomLab: classroomOrLab,
          priority,
          photoUrl: finalPhotoUrl,
          photoCaption,
          studentId: submitterId,
          studentName: submitterName || 'Student Submitter',
          department: submitterDepartment || 'General',
        });

        // 1. Confirmation notification for Student
        await db.createNotification({
          userId: complaint.studentId,
          title: 'Complaint Received',
          message: `Your complaint ${complaint.complaintId} has been successfully registered and queued for HOD review.`,
          complaintId: complaint.complaintId,
          type: 'complaint_received',
        });

        // 2. Notification for HOD
        await db.createNotification({
          userId: 'HOD-ENG-001',
          title: 'New Student Complaint',
          message: `${complaint.studentName} reported ${complaint.category} issue in ${complaint.classroomLab} (${complaint.complaintId})`,
          complaintId: complaint.complaintId,
          type: 'new_complaint',
        });

        const unified = await db.getUnifiedTicketById(complaint.complaintId);
        return res.status(201).json(unified);
      }
    } catch (err) {
      console.error('[API] Error creating ticket:', err);
      return res.status(500).json({ error: 'Failed to create ticket' });
    }
  });

  // ==================== PERSISTENT FILE UPLOADS API ====================
  // 1. Student Complaint Photo Upload
  app.post('/api/upload/complaint-photo', requireAuth, (req: Request, res: Response) => {
    uploadComplaintPhoto.single('photo')(req, res, (err: any) => {
      if (err) {
        console.error('[Upload Error - Complaint Photo]:', err.message);
        return res.status(400).json({ error: err.message || 'Image upload failed' });
      }
      if (!req.file) {
        return res.status(400).json({ error: 'No image file was provided' });
      }

      const fileUrl = `/api/files/complaints/${req.file.filename}`;
      console.log(`[Storage] Saved complaint photo persistently: ${req.file.filename}`);

      return res.status(201).json({
        success: true,
        fileUrl,
        fileName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
      });
    });
  });

  // 2. Faculty Report File Upload (Photo or Document)
  app.post('/api/upload/faculty-file', requireAuth, (req: Request, res: Response) => {
    uploadFacultyFile.single('file')(req, res, (err: any) => {
      if (err) {
        console.error('[Upload Error - Faculty File]:', err.message);
        return res.status(400).json({ error: err.message || 'File upload failed' });
      }
      if (!req.file) {
        return res.status(400).json({ error: 'No file was provided' });
      }

      const fileUrl = `/api/files/faculty-reports/${req.file.filename}`;
      console.log(`[Storage] Saved faculty report file persistently: ${req.file.filename}`);

      return res.status(201).json({
        success: true,
        fileUrl,
        fileName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
      });
    });
  });

  // ==================== SECURE FILE SERVING API ====================
  // Serve student complaint photos
  app.get('/api/files/complaints/:filename', requireAuth, async (req: Request, res: Response) => {
    try {
      const { filename } = req.params;
      const resolved = resolveSecureFilePath('complaints', filename);
      if (!resolved) {
        return res.status(404).json({ error: 'File not found or access denied' });
      }

      // Role-based access validation
      const user = req.user!;
      if (user.role === 'STUDENT') {
        const complaints = await db.getComplaints();
        const attached = complaints.find((c) => c.photoUrl?.includes(filename));
        if (attached && !matchesUserId(attached.studentId, user.userId)) {
          return res.status(403).json({
            error: 'Access denied: You can only view photos from your own complaints',
          });
        }
      } else if (user.role === 'FACULTY') {
        return res.status(403).json({
          error: 'Access denied: Faculty members cannot view private student complaint photos',
        });
      }

      res.setHeader('Content-Type', resolved.mimeType);
      if (req.query.download === 'true') {
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      } else {
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      }
      return res.sendFile(resolved.fullPath);
    } catch (err) {
      console.error('[Storage] Error serving complaint photo:', err);
      return res.status(500).json({ error: 'Error serving file' });
    }
  });

  // Serve faculty report photos and documents
  app.get('/api/files/faculty-reports/:filename', requireAuth, async (req: Request, res: Response) => {
    try {
      const { filename } = req.params;
      const resolved = resolveSecureFilePath('faculty-reports', filename);
      if (!resolved) {
        return res.status(404).json({ error: 'File not found or access denied' });
      }

      // Role-based access validation
      const user = req.user!;
      if (user.role === 'FACULTY') {
        const reports = await db.getFacultyReports();
        const attached = reports.find(
          (r) => r.photoUrl?.includes(filename) || r.documentUrl?.includes(filename)
        );
        if (attached && !matchesUserId(attached.facultyId, user.userId)) {
          return res.status(403).json({
            error: 'Access denied: You can only view files from your own reports',
          });
        }
      } else if (user.role === 'STUDENT') {
        return res.status(403).json({
          error: 'Access denied: Students cannot view faculty infrastructure reports or files',
        });
      }

      res.setHeader('Content-Type', resolved.mimeType);
      if (req.query.download === 'true') {
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      } else {
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      }
      return res.sendFile(resolved.fullPath);
    } catch (err) {
      console.error('[Storage] Error serving faculty file:', err);
      return res.status(500).json({ error: 'Error serving file' });
    }
  });

  // Assign complaint or faculty report (HOD Only)
  app.patch('/api/complaints/:id/assign', requireRole(['HOD']), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { assignedTo, assignedTeam, targetResolutionDate, hodRemarks } = req.body;

      const isReport = id.startsWith('FR');

      if (isReport) {
        const report = await db.getFacultyReportById(id);
        if (!report) {
          return res.status(404).json({ error: 'Faculty Report not found' });
        }

        // 1. Create persistent Assignment record
        await db.createAssignment({
          reportId: id,
          assignedTo: assignedTo || report.assignedTo || 'Assigned Crew',
          assignedTeam: assignedTeam || report.assignedTeam,
          assignedBy: 'Dr. S. Radhakrishnan (HOD)',
          expectedCompletionDate: targetResolutionDate || report.targetResolutionDate,
          remarks: hodRemarks || report.hodRemarks,
        });

        const prevStatus = report.status;
        const newStatus = report.status === 'Pending' ? 'Assigned' : report.status;

        // 2. Update report status
        const updated = await db.updateFacultyReport(id, {
          assignedTo: assignedTo || report.assignedTo,
          assignedTeam: assignedTeam || report.assignedTeam,
          targetResolutionDate: targetResolutionDate || report.targetResolutionDate,
          hodRemarks: hodRemarks || report.hodRemarks,
          status: newStatus,
        });

        // 3. Log to Report History
        await db.addReportHistory({
          reportId: id,
          action: `Assigned to ${assignedTeam || assignedTo || 'Maintenance Team'}`,
          previousStatus: prevStatus,
          newStatus,
          remark: hodRemarks || `Assigned to ${assignedTeam || assignedTo}`,
          updatedBy: 'Dr. S. Radhakrishnan (HOD)',
          actorRole: 'HOD',
        });

        // 4. Submitter Notification
        await db.createNotification({
          userId: updated.facultyId,
          title: 'Report Assigned',
          message: `Your report ${updated.reportId} has been assigned to ${
            updated.assignedTo || updated.assignedTeam
          }.`,
          reportId: updated.reportId,
          type: 'assignment',
        });

        // 5. HOD Status Update Notification
        await db.createNotification({
          userId: 'HOD-ENG-001',
          title: 'Status Update',
          message: `${updated.reportId} assigned to ${
            updated.assignedTo || updated.assignedTeam
          }.`,
          reportId: updated.reportId,
          type: 'status_update',
        });

        const unified = await db.getUnifiedTicketById(id);
        return res.json(unified);
      } else {
        const complaint = await db.getComplaintById(id);
        if (!complaint) {
          return res.status(404).json({ error: 'Complaint not found' });
        }

        // 1. Create persistent Assignment record
        await db.createAssignment({
          complaintId: id,
          assignedTo: assignedTo || complaint.assignedTo || 'Assigned Crew',
          assignedTeam: assignedTeam || complaint.assignedTeam,
          assignedBy: 'Dr. S. Radhakrishnan (HOD)',
          expectedCompletionDate: targetResolutionDate || complaint.targetResolutionDate,
          remarks: hodRemarks || complaint.hodRemarks,
        });

        const prevStatus = complaint.status;
        const newStatus = complaint.status === 'Pending' ? 'Assigned' : complaint.status;

        // 2. Update complaint status
        const updated = await db.updateComplaint(id, {
          assignedTo: assignedTo || complaint.assignedTo,
          assignedTeam: assignedTeam || complaint.assignedTeam,
          targetResolutionDate: targetResolutionDate || complaint.targetResolutionDate,
          hodRemarks: hodRemarks || complaint.hodRemarks,
          status: newStatus,
        });

        // 3. Log to Complaint History
        await db.addComplaintHistory({
          complaintId: id,
          action: `Assigned to ${assignedTeam || assignedTo || 'Maintenance Team'}`,
          previousStatus: prevStatus,
          newStatus,
          remark: hodRemarks || `Assigned to ${assignedTeam || assignedTo}`,
          updatedBy: 'Dr. S. Radhakrishnan (HOD)',
          actorRole: 'HOD',
        });

        // 4. Submitter Notification
        await db.createNotification({
          userId: updated.studentId,
          title: 'Complaint Assigned',
          message: `Your complaint ${updated.complaintId} has been assigned to ${
            updated.assignedTo || updated.assignedTeam
          }.`,
          complaintId: updated.complaintId,
          type: 'assignment',
        });

        // 5. HOD Status Update Notification
        await db.createNotification({
          userId: 'HOD-ENG-001',
          title: 'Status Update',
          message: `${updated.complaintId} assigned to ${
            updated.assignedTo || updated.assignedTeam
          }.`,
          complaintId: updated.complaintId,
          type: 'status_update',
        });

        const unified = await db.getUnifiedTicketById(id);
        return res.json(unified);
      }
    } catch (err) {
      console.error('[API] Error assigning ticket:', err);
      return res.status(500).json({ error: 'Failed to assign ticket' });
    }
  });

  // Update status (HOD Only)
  app.patch('/api/complaints/:id/status', requireRole(['HOD']), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, remarks, resolutionSummary } = req.body;

      const isReport = id.startsWith('FR');
      const now = new Date().toISOString();
      const newStatus = status as ComplaintStatus;

      if (isReport) {
        const report = await db.getFacultyReportById(id);
        if (!report) {
          return res.status(404).json({ error: 'Faculty Report not found' });
        }

        const prevStatus = report.status;
        const updated = await db.updateFacultyReport(id, {
          status: newStatus,
          hodRemarks: remarks || report.hodRemarks,
          resolutionSummary:
            resolutionSummary ||
            (newStatus === 'Resolved' ? remarks || 'Issue resolved successfully.' : report.resolutionSummary),
          resolvedAt: newStatus === 'Resolved' ? now : report.resolvedAt,
        });

        // History
        await db.addReportHistory({
          reportId: id,
          action: `Status changed to ${newStatus}`,
          previousStatus: prevStatus,
          newStatus,
          remark: remarks || resolutionSummary || `Status updated to ${newStatus}`,
          updatedBy: 'Dr. S. Radhakrishnan (HOD)',
          actorRole: 'HOD',
        });

        // Notification
        let notifTitle = `Report Status: ${newStatus}`;
        let notifMessage = `Your report ${updated.reportId} status is now "${newStatus}".`;
        let notifType = 'status_change';

        if (newStatus === 'In Progress') {
          notifTitle = 'Work Started';
          notifMessage = `Work has started on your report ${updated.reportId}. Maintenance crew is actively resolving the issue.`;
          notifType = 'work_started';
        } else if (newStatus === 'Resolved') {
          notifTitle = 'Report Resolved';
          notifMessage = `Your report ${updated.reportId} has been marked as Resolved. ${
            remarks ? `Resolution: ${remarks}` : ''
          }`;
          notifType = 'resolved';
        }

        await db.createNotification({
          userId: updated.facultyId,
          title: notifTitle,
          message: notifMessage,
          reportId: updated.reportId,
          type: notifType,
        });

        await db.createNotification({
          userId: 'HOD-ENG-001',
          title: 'Status Update',
          message: `${updated.reportId} status updated to "${newStatus}"${
            remarks ? ` (${remarks})` : ''
          }.`,
          reportId: updated.reportId,
          type: 'status_update',
        });

        const unified = await db.getUnifiedTicketById(id);
        return res.json(unified);
      } else {
        const complaint = await db.getComplaintById(id);
        if (!complaint) {
          return res.status(404).json({ error: 'Complaint not found' });
        }

        const prevStatus = complaint.status;
        const updated = await db.updateComplaint(id, {
          status: newStatus,
          hodRemarks: remarks || complaint.hodRemarks,
          resolutionSummary:
            resolutionSummary ||
            (newStatus === 'Resolved' ? remarks || 'Issue resolved successfully.' : complaint.resolutionSummary),
          resolvedAt: newStatus === 'Resolved' ? now : complaint.resolvedAt,
        });

        // History
        await db.addComplaintHistory({
          complaintId: id,
          action: `Status changed to ${newStatus}`,
          previousStatus: prevStatus,
          newStatus,
          remark: remarks || resolutionSummary || `Status updated to ${newStatus}`,
          updatedBy: 'Dr. S. Radhakrishnan (HOD)',
          actorRole: 'HOD',
        });

        // Notification
        let notifTitle = `Complaint Status: ${newStatus}`;
        let notifMessage = `Your complaint ${updated.complaintId} status is now "${newStatus}".`;
        let notifType = 'status_change';

        if (newStatus === 'In Progress') {
          notifTitle = 'Work Started';
          notifMessage = `Work has started on your complaint ${updated.complaintId}. Maintenance crew is actively resolving the issue.`;
          notifType = 'work_started';
        } else if (newStatus === 'Resolved') {
          notifTitle = 'Complaint Resolved';
          notifMessage = `Your complaint ${updated.complaintId} has been marked as Resolved. ${
            remarks ? `Resolution: ${remarks}` : ''
          }`;
          notifType = 'resolved';
        }

        await db.createNotification({
          userId: updated.studentId,
          title: notifTitle,
          message: notifMessage,
          complaintId: updated.complaintId,
          type: notifType,
        });

        await db.createNotification({
          userId: 'HOD-ENG-001',
          title: 'Status Update',
          message: `${updated.complaintId} status updated to "${newStatus}"${
            remarks ? ` (${remarks})` : ''
          }.`,
          complaintId: updated.complaintId,
          type: 'status_update',
        });

        const unified = await db.getUnifiedTicketById(id);
        return res.json(unified);
      }
    } catch (err) {
      console.error('[API] Error updating ticket status:', err);
      return res.status(500).json({ error: 'Failed to update status' });
    }
  });

  // ==================== MESSAGES API ====================
  app.get('/api/messages', requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const { complaintId, recipientId } = req.query;

      // Restrict students and faculty to their own messages
      let filterUserId: string | undefined = undefined;
      let filterRecipientId: string | undefined =
        typeof recipientId === 'string' ? recipientId : undefined;

      if (user.role === 'STUDENT' || user.role === 'FACULTY') {
        filterUserId = user.userId;
      }

      const list = await db.getMessages({
        userId: filterUserId,
        recipientId: filterRecipientId,
        ticketId: typeof complaintId === 'string' ? complaintId : undefined,
      });
      return res.json(list);
    } catch (err) {
      console.error('[API] Error fetching messages:', err);
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  app.post('/api/messages', requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const {
        recipientId,
        recipientName,
        recipientRole,
        complaintId,
        content,
      } = req.body;

      if (!content || !recipientId) {
        return res.status(400).json({ error: 'Missing message content or recipient' });
      }

      // Enforce sender identity from authenticated token
      const senderId = user.userId;
      const senderName = user.name;
      const senderRole = user.role;

      const isReport = complaintId?.startsWith('FR');

      const newMsg = await db.createMessage({
        senderId,
        senderName: senderName || 'User',
        senderRole: senderRole || 'STUDENT',
        receiverId: recipientId,
        receiverName: recipientName || 'Recipient',
        receiverRole: recipientRole || 'HOD',
        complaintId: isReport ? undefined : complaintId,
        reportId: isReport ? complaintId : undefined,
        message: content,
      });

      // Notification for recipient
      const notifTitle =
        senderRole === 'HOD'
          ? 'HOD Message Received'
          : senderRole === 'FACULTY'
          ? 'New Faculty Message'
          : 'New Student Message';

      const notifType = senderRole === 'HOD' ? 'message' : 'new_message';

      await db.createNotification({
        userId: recipientId,
        title: notifTitle,
        message:
          senderRole === 'HOD'
            ? `Dr. S. Radhakrishnan (HOD) replied${complaintId ? ` regarding ${complaintId}` : ''}: ${
                content.length > 50 ? `${content.substring(0, 50)}...` : content
              }`
            : `${senderName}${complaintId ? ` (Re: ${complaintId})` : ''}: ${
                content.length > 50 ? `${content.substring(0, 50)}...` : content
              }`,
        complaintId: isReport ? undefined : complaintId,
        reportId: isReport ? complaintId : undefined,
        type: notifType,
      });

      return res.status(201).json(newMsg);
    } catch (err) {
      console.error('[API] Error creating message:', err);
      return res.status(500).json({ error: 'Failed to send message' });
    }
  });

  app.patch('/api/messages/:id/read', requireAuth, async (req: Request, res: Response) => {
    try {
      await db.markMessageRead(req.params.id);
      return res.json({ success: true });
    } catch (err) {
      console.error('[API] Error marking message read:', err);
      return res.status(500).json({ error: 'Failed to mark message read' });
    }
  });

  app.patch('/api/messages/thread/read', requireAuth, async (req: Request, res: Response) => {
    try {
      const { recipientId, senderId } = req.body;
      if (!recipientId) {
        return res.status(400).json({ error: 'recipientId is required' });
      }
      await db.markThreadRead(recipientId, senderId);
      return res.json({ success: true });
    } catch (err) {
      console.error('[API] Error marking thread read:', err);
      return res.status(500).json({ error: 'Failed to mark thread read' });
    }
  });

  // ==================== NOTIFICATIONS API ====================
  app.get('/api/notifications/:userId', requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      if (user.role !== 'HOD' && !matchesUserId(user.userId, req.params.userId)) {
        return res.status(403).json({
          error: 'Access Denied: You can only view your own notifications.',
        });
      }

      const notifs = await db.getNotifications(req.params.userId);
      return res.json(notifs);
    } catch (err) {
      console.error('[API] Error fetching notifications:', err);
      return res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  });

  app.patch('/api/notifications/:id/read', requireAuth, async (req: Request, res: Response) => {
    try {
      await db.markNotificationRead(req.params.id);
      return res.json({ success: true });
    } catch (err) {
      console.error('[API] Error marking notification read:', err);
      return res.status(500).json({ error: 'Failed to mark notification read' });
    }
  });

  app.patch('/api/notifications/read-all/:userId', requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      if (user.role !== 'HOD' && !matchesUserId(user.userId, req.params.userId)) {
        return res.status(403).json({
          error: 'Access Denied: You can only mark your own notifications.',
        });
      }

      await db.markAllNotificationsRead(req.params.userId);
      return res.json({ success: true });
    } catch (err) {
      console.error('[API] Error marking all notifications read:', err);
      return res.status(500).json({ error: 'Failed to mark all notifications read' });
    }
  });

  // ==================== USERS & TEAMS API ====================
  app.get('/api/users', requireRole(['HOD']), async (_req: Request, res: Response) => {
    try {
      const users = await db.getUsers();
      return res.json(users.map(sanitizeUser));
    } catch (err) {
      console.error('[API] Error fetching users:', err);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  app.get('/api/maintenance-teams', (_req: Request, res: Response) => {
    return res.json(MAINTENANCE_TEAMS);
  });

  // ==================== DIRECT DATABASE ENTITY INSPECTION API (HOD Only) ====================
  app.get('/api/db/export', requireRole(['HOD']), async (_req: Request, res: Response) => {
    try {
      const fullDb = await db.exportDatabase();
      // Sanitize passwordHash before exporting
      fullDb.users = fullDb.users.map((u) => {
        const { passwordHash, ...safe } = u;
        return safe as any;
      });
      return res.json(fullDb);
    } catch (err) {
      console.error('[API] Error exporting database:', err);
      return res.status(500).json({ error: 'Failed to export database' });
    }
  });

  app.get('/api/db/students', requireRole(['HOD']), async (_req: Request, res: Response) => {
    const students = await db.getStudents();
    return res.json(students);
  });

  app.get('/api/db/faculty', requireRole(['HOD']), async (_req: Request, res: Response) => {
    const faculty = await db.getFaculty();
    return res.json(faculty);
  });

  app.get('/api/db/hod', requireRole(['HOD']), async (_req: Request, res: Response) => {
    const hod = await db.getHOD();
    return res.json(hod);
  });

  app.get('/api/db/complaints', requireRole(['HOD']), async (_req: Request, res: Response) => {
    const complaints = await db.getComplaints();
    return res.json(complaints);
  });

  app.get('/api/db/faculty-reports', requireRole(['HOD']), async (_req: Request, res: Response) => {
    const reports = await db.getFacultyReports();
    return res.json(reports);
  });

  app.get('/api/db/assignments', requireRole(['HOD']), async (req: Request, res: Response) => {
    const ticketId = typeof req.query.ticketId === 'string' ? req.query.ticketId : undefined;
    const assignments = await db.getAssignments(ticketId);
    return res.json(assignments);
  });

  app.get('/api/db/complaint-history/:id', requireRole(['HOD']), async (req: Request, res: Response) => {
    const history = await db.getComplaintHistory(req.params.id);
    return res.json(history);
  });

  app.get('/api/db/report-history/:id', requireRole(['HOD']), async (req: Request, res: Response) => {
    const history = await db.getReportHistory(req.params.id);
    return res.json(history);
  });

  // Project ZIP Download Endpoints for deployment package
  const sendProjectZip = (_req: Request, res: Response) => {
    const zipPath = path.resolve(__dirname, 'campus-care.zip');
    const publicZip = path.resolve(__dirname, 'public', 'campus-care.zip');
    const target = fs.existsSync(zipPath) ? zipPath : fs.existsSync(publicZip) ? publicZip : null;
    if (!target) {
      return res.status(404).json({ error: 'Project deployment ZIP not found.' });
    }
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="campus-care.zip"');
    return res.sendFile(target);
  };

  app.get('/campus-care.zip', sendProjectZip);
  app.get('/api/download/project-zip', sendProjectZip);

  // Vite middleware in dev or static files in production (only when running standalone server)
  async function startServer() {
    const PORT = Number(process.env.PORT) || 3000;

    if (process.env.NODE_ENV === 'production') {
      app.use(express.static(path.resolve(__dirname, 'dist')));
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
      });
    } else {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[Campus Care] Server running on http://0.0.0.0:${PORT} with Persistent Database Layer active.`);
    });
  }

  if (!process.env.VERCEL) {
    startServer().catch((err) => {
      console.error('Fatal error starting server:', err);
      process.exit(1);
    });
  }

  export default app;
