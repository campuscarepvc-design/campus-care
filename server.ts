import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  Complaint,
  Message,
  NotificationItem,
  User,
  DashboardStats,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus
} from './src/types';
import {
  DEMO_USERS,
  INITIAL_COMPLAINTS,
  INITIAL_MESSAGES,
  INITIAL_NOTIFICATIONS,
  MAINTENANCE_TEAMS
} from './src/data/seedData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory persistent database store initialized with seed data
let users: Record<string, User> = { ...DEMO_USERS };
let complaints: Complaint[] = [...INITIAL_COMPLAINTS];
let messages: Message[] = [...INITIAL_MESSAGES];
let notifications: NotificationItem[] = [...INITIAL_NOTIFICATIONS];

function generateComplaintId(): string {
  const currentYear = new Date().getFullYear();
  let maxSeq = 0;
  for (const c of complaints) {
    const m = c.id.match(/^CC-\d{4}-(\d+)$/);
    if (m) {
      const val = parseInt(m[1], 10);
      if (val > maxSeq) maxSeq = val;
    }
  }
  const nextSeq = maxSeq + 1;
  return `CC-${currentYear}-${String(nextSeq).padStart(4, '0')}`;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Request logger
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.path}`);
    }
    next();
  });

  // ==================== AUTH API ====================
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { id, password, role } = req.body;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const trimmedId = id.trim().toUpperCase();

    // Map exact requested demo accounts
    let user: User | undefined;

    if (trimmedId === 'STU1001' || trimmedId === 'STU-2024-101') {
      if (role && role !== 'STUDENT') {
        return res.status(403).json({
          error: `Access Denied: ID ${trimmedId} belongs to Student role. Please select Student Login.`,
        });
      }
      user = users['STU1001'] || users['STU-2024-101'];
    } else if (trimmedId === 'FAC1001' || trimmedId === 'FAC-CS-204') {
      if (role && role !== 'FACULTY') {
        return res.status(403).json({
          error: `Access Denied: ID ${trimmedId} belongs to Faculty role. Please select Faculty Login.`,
        });
      }
      user = users['FAC1001'] || users['FAC-CS-204'];
    } else if (trimmedId === 'HOD1001' || trimmedId === 'HOD-ENG-001') {
      if (role && role !== 'HOD') {
        return res.status(403).json({
          error: `Access Denied: ID ${trimmedId} belongs to HOD role. Please select HOD Login.`,
        });
      }
      user = users['HOD1001'] || users['HOD-ENG-001'];
    } else {
      // General user matching
      user = Object.values(users).find(
        (u) => u.id.toUpperCase() === trimmedId
      );

      if (user && role && user.role !== role) {
        return res.status(403).json({
          error: `Access Denied: ID ${trimmedId} is registered as ${user.role}, not ${role}.`,
        });
      }

      if (!user) {
        // Dynamic provision based on role
        if (role === 'STUDENT' && (trimmedId.startsWith('STU') || trimmedId.startsWith('S'))) {
          user = {
            id: trimmedId,
            name: `Student (${trimmedId})`,
            email: `${trimmedId.toLowerCase()}@campuscare.edu`,
            role: 'STUDENT',
            department: 'Computer Science & Engineering',
            batch: '2023-2027',
            semester: '6th Semester',
            hostelBlock: 'Bhabha Hostel (Block A)',
            roomNo: 'A-314',
            phone: '+91 98231 44550',
          };
          users[user.id] = user;
        } else if (role === 'FACULTY' && (trimmedId.startsWith('FAC') || trimmedId.startsWith('F'))) {
          user = {
            id: trimmedId,
            name: `Prof. (${trimmedId})`,
            email: `${trimmedId.toLowerCase()}@campuscare.edu`,
            role: 'FACULTY',
            department: 'Computer Science & Engineering',
            designation: 'Faculty Member',
            cabinNo: 'Faculty Block 2, Cabin 210',
            phone: '+91 98450 77123',
          };
          users[user.id] = user;
        } else if (role === 'HOD' && (trimmedId.startsWith('HOD') || trimmedId.startsWith('ADMIN'))) {
          user = users['HOD1001'] || users['HOD-ENG-001'];
        }
      }
    }

    if (!user) {
      return res.status(401).json({
        error: `Invalid credentials. Please verify your ${role || 'User'} ID or use demo account: ${
          role === 'STUDENT' ? 'STU1001' : role === 'FACULTY' ? 'FAC1001' : 'HOD1001'
        }.`,
      });
    }

    return res.json({
      success: true,
      user,
      token: `cc_token_${user.id}_${Date.now()}`,
    });
  });

  // ==================== STATS API ====================
  app.get('/api/stats', (_req: Request, res: Response) => {
    const totalComplaints = complaints.length;
    const pending = complaints.filter((c) => c.status === 'Pending').length;
    const assigned = complaints.filter((c) => c.status === 'Assigned').length;
    const inProgress = complaints.filter((c) => c.status === 'In Progress').length;
    const resolved = complaints.filter((c) => c.status === 'Resolved').length;
    const highPriority = complaints.filter(
      (c) => c.priority === 'High' || c.priority === 'Critical'
    ).length;
    const studentReports = complaints.filter((c) => c.submittedByRole === 'STUDENT').length;
    const facultyReports = complaints.filter((c) => c.submittedByRole === 'FACULTY').length;

    const stats: DashboardStats = {
      totalComplaints,
      pending,
      assigned,
      inProgress,
      resolved,
      highPriority,
      studentReports,
      facultyReports,
      averageResolutionHours: 4.8,
      resolutionRatePercentage:
        totalComplaints > 0 ? Math.round((resolved / totalComplaints) * 100) : 0,
    };

    return res.json(stats);
  });

  // ==================== COMPLAINTS API ====================
  app.get('/api/complaints', (req: Request, res: Response) => {
    const { role, submitterId, category, priority, status, search, submittedByRole } = req.query;

    let filtered = [...complaints];

    if (submitterId && typeof submitterId === 'string') {
      filtered = filtered.filter(
        (c) =>
          c.submitterId === submitterId ||
          (submitterId === 'STU1001' && c.submitterId === 'STU-2024-101') ||
          (submitterId === 'FAC1001' && c.submitterId === 'FAC-CS-204')
      );
    }

    if (submittedByRole && typeof submittedByRole === 'string') {
      filtered = filtered.filter((c) => c.submittedByRole === submittedByRole);
    }

    if (category && typeof category === 'string' && category !== 'ALL') {
      filtered = filtered.filter((c) => c.category === category);
    }

    if (priority && typeof priority === 'string' && priority !== 'ALL') {
      filtered = filtered.filter((c) => c.priority === priority);
    }

    if (status && typeof status === 'string' && status !== 'ALL') {
      filtered = filtered.filter((c) => c.status === status);
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q) ||
          c.classroomOrLab.toLowerCase().includes(q) ||
          c.submitterName.toLowerCase().includes(q)
      );
    }

    // Sort newest first
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.json(filtered);
  });

  app.get('/api/complaints/:id', (req: Request, res: Response) => {
    const complaint = complaints.find((c) => c.id === req.params.id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }
    return res.json(complaint);
  });

  app.post('/api/complaints', (req: Request, res: Response) => {
    const {
      title,
      category,
      description,
      location,
      classroomOrLab,
      priority,
      photoUrl,
      photoCaption,
      submittedByRole,
      submitterId,
      submitterName,
      submitterEmail,
      submitterDepartment,
      courseOrClassAffected,
      estimatedAffectedStudents,
    } = req.body;

    if (!category || !description || !location || !priority) {
      return res.status(400).json({ error: 'Missing required complaint fields (Category, Description, Location, and Priority)' });
    }

    const newId = generateComplaintId();
    const now = new Date().toISOString();
    const room = classroomOrLab && classroomOrLab.trim() ? classroomOrLab.trim() : 'N/A';

    const newComplaint: Complaint = {
      id: newId,
      title: title || `${category} issue at ${location}${room !== 'N/A' ? ` (${room})` : ''}`,
      category: category as ComplaintCategory,
      description: description.trim(),
      location: location.trim(),
      classroomOrLab: room,
      priority: priority as ComplaintPriority,
      status: 'Pending',
      photoUrl: photoUrl || undefined,
      photoCaption: photoCaption || undefined,
      submittedByRole: (submittedByRole as 'STUDENT' | 'FACULTY') || 'STUDENT',
      submitterId: submitterId || 'STU-2024-101',
      submitterName: submitterName || 'Campus User',
      submitterEmail: submitterEmail || 'user@campuscare.edu',
      submitterDepartment: submitterDepartment || 'General',
      courseOrClassAffected,
      estimatedAffectedStudents: estimatedAffectedStudents ? Number(estimatedAffectedStudents) : undefined,
      createdAt: now,
      updatedAt: now,
      actionLogs: [
        {
          id: `LOG-${Date.now()}-1`,
          timestamp: now,
          actorName: submitterName || 'User',
          actorRole: submittedByRole || 'STUDENT',
          action: `${submittedByRole === 'FACULTY' ? 'Faculty Report Filed to HOD' : 'Problem Reported'}`,
          notes: `Priority: ${priority}. Location: ${location} (${classroomOrLab})`,
        },
      ],
    };

    complaints.unshift(newComplaint);

    // Create notification for HOD
    notifications.unshift({
      id: `NOTIF-${Date.now()}`,
      userId: 'HOD-ENG-001',
      title: `New ${priority} Priority Complaint`,
      message: `${newComplaint.submitterName} reported ${newComplaint.category} issue in ${newComplaint.classroomOrLab} (${newId})`,
      complaintId: newId,
      timestamp: now,
      isRead: false,
      type: 'alert',
    });

    return res.status(201).json(newComplaint);
  });

  // Assign complaint
  app.patch('/api/complaints/:id/assign', (req: Request, res: Response) => {
    const { id } = req.params;
    const { assignedTo, assignedTeam, targetResolutionDate, hodRemarks } = req.body;

    const index = complaints.findIndex((c) => c.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const now = new Date().toISOString();
    const current = complaints[index];

    const updated: Complaint = {
      ...current,
      assignedTo: assignedTo || current.assignedTo,
      assignedTeam: assignedTeam || current.assignedTeam,
      targetResolutionDate: targetResolutionDate || current.targetResolutionDate,
      hodRemarks: hodRemarks || current.hodRemarks,
      status: current.status === 'Pending' ? 'Assigned' : current.status,
      updatedAt: now,
      actionLogs: [
        ...current.actionLogs,
        {
          id: `LOG-${Date.now()}`,
          timestamp: now,
          actorName: 'Dr. S. Radhakrishnan',
          actorRole: 'HOD',
          action: `Assigned to ${assignedTeam || assignedTo}`,
          previousStatus: current.status,
          newStatus: current.status === 'Pending' ? 'Assigned' : current.status,
          remark: hodRemarks || `Assigned to ${assignedTeam || assignedTo}`,
          notes: hodRemarks || `Assigned to ${assignedTeam || assignedTo}`,
          updatedBy: 'Dr. S. Radhakrishnan (HOD)',
        },
      ],
    };

    complaints[index] = updated;

    // Notify submitter
    notifications.unshift({
      id: `NOTIF-${Date.now()}`,
      userId: updated.submitterId,
      title: 'Complaint Assigned',
      message: `Your complaint ${updated.id} has been assigned to ${updated.assignedTeam || updated.assignedTo}.`,
      complaintId: updated.id,
      timestamp: now,
      isRead: false,
      type: 'assignment',
    });

    return res.json(updated);
  });

  // Update status (e.g. In Progress, Resolved)
  app.patch('/api/complaints/:id/status', (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, remarks, resolutionSummary } = req.body;

    const index = complaints.findIndex((c) => c.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const now = new Date().toISOString();
    const current = complaints[index];
    const newStatus = status as ComplaintStatus;

    const updated: Complaint = {
      ...current,
      status: newStatus,
      hodRemarks: remarks || current.hodRemarks,
      resolutionSummary: resolutionSummary || (newStatus === 'Resolved' ? (remarks || 'Issue resolved successfully.') : current.resolutionSummary),
      resolvedAt: newStatus === 'Resolved' ? now : current.resolvedAt,
      updatedAt: now,
      actionLogs: [
        ...current.actionLogs,
        {
          id: `LOG-${Date.now()}`,
          timestamp: now,
          actorName: 'Dr. S. Radhakrishnan',
          actorRole: 'HOD',
          action: `Status changed to ${newStatus}`,
          previousStatus: current.status,
          newStatus,
          remark: remarks || resolutionSummary || `Status updated to ${newStatus}`,
          notes: remarks || resolutionSummary || undefined,
          updatedBy: 'Dr. S. Radhakrishnan (HOD)',
        },
      ],
    };

    complaints[index] = updated;

    // Notify submitter
    notifications.unshift({
      id: `NOTIF-${Date.now()}`,
      userId: updated.submitterId,
      title: `Complaint ${newStatus}`,
      message: `Your complaint ${updated.id} status is now "${newStatus}". ${remarks ? `Note: ${remarks}` : ''}`,
      complaintId: updated.id,
      timestamp: now,
      isRead: false,
      type: 'status_change',
    });

    return res.json(updated);
  });

  // ==================== MESSAGES API ====================
  app.get('/api/messages', (req: Request, res: Response) => {
    const { userId, recipientId, complaintId } = req.query;

    let filtered = [...messages];

    if (userId && typeof userId === 'string') {
      filtered = filtered.filter((m) => m.senderId === userId || m.recipientId === userId);
    }

    if (recipientId && typeof recipientId === 'string') {
      filtered = filtered.filter((m) => m.senderId === recipientId || m.recipientId === recipientId);
    }

    if (complaintId && typeof complaintId === 'string') {
      filtered = filtered.filter((m) => m.complaintId === complaintId);
    }

    filtered.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return res.json(filtered);
  });

  app.post('/api/messages', (req: Request, res: Response) => {
    const { senderId, senderName, senderRole, recipientId, recipientName, recipientRole, complaintId, content } = req.body;

    if (!content || !senderId || !recipientId) {
      return res.status(400).json({ error: 'Missing message content or participants' });
    }

    const now = new Date().toISOString();
    const newMsg: Message = {
      id: `MSG-${Date.now()}`,
      senderId,
      senderName: senderName || 'User',
      senderRole: senderRole || 'STUDENT',
      recipientId,
      recipientName: recipientName || 'Recipient',
      recipientRole: recipientRole || 'HOD',
      complaintId: complaintId || undefined,
      content,
      timestamp: now,
      isRead: false,
    };

    messages.push(newMsg);

    // Create notification for recipient
    notifications.unshift({
      id: `NOTIF-${Date.now()}`,
      userId: recipientId,
      title: `New Message from ${senderName}`,
      message: content.length > 60 ? `${content.substring(0, 60)}...` : content,
      complaintId,
      timestamp: now,
      isRead: false,
      type: 'message',
    });

    return res.status(201).json(newMsg);
  });

  // ==================== NOTIFICATIONS API ====================
  app.get('/api/notifications/:userId', (req: Request, res: Response) => {
    const { userId } = req.params;
    const userNotifs = notifications.filter((n) => n.userId === userId);
    userNotifs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return res.json(userNotifs);
  });

  app.patch('/api/notifications/:id/read', (req: Request, res: Response) => {
    const { id } = req.params;
    const notif = notifications.find((n) => n.id === id);
    if (notif) {
      notif.isRead = true;
    }
    return res.json({ success: true, notif });
  });

  app.patch('/api/notifications/read-all/:userId', (req: Request, res: Response) => {
    const { userId } = req.params;
    notifications.forEach((n) => {
      if (n.userId === userId) {
        n.isRead = true;
      }
    });
    return res.json({ success: true });
  });

  // ==================== USERS & TEAMS API ====================
  app.get('/api/users', (_req: Request, res: Response) => {
    return res.json(Object.values(users));
  });

  app.get('/api/maintenance-teams', (_req: Request, res: Response) => {
    return res.json(MAINTENANCE_TEAMS);
  });

  // Vite middleware in dev or static files in production
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
    console.log(`[Campus Care] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
