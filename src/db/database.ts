import fs from 'fs';
import path from 'path';
import {
  DbUser,
  DbStudent,
  DbFaculty,
  DbHOD,
  DbComplaint,
  DbFacultyReport,
  DbMessage,
  DbNotification,
  DbComplaintHistory,
  DbReportHistory,
  DbAssignment,
  DatabaseSchema,
} from './schema';
import { hashPasswordSync, comparePasswordSync } from '../services/auth';
import {
  DEMO_USERS,
  INITIAL_COMPLAINTS,
  INITIAL_MESSAGES,
  INITIAL_NOTIFICATIONS,
} from '../data/seedData';
import {
  Complaint,
  DashboardStats,
  Message,
  NotificationItem,
  User,
  UserRole,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
} from '../types';

export interface IDatabase {
  // Users & Roles
  synchronizeDemoAccountHashes(stateToSync?: DatabaseSchema): boolean;
  getUsers(): Promise<DbUser[]>;
  getUserById(id: string): Promise<DbUser | undefined>;
  getUserByEmail(email: string): Promise<DbUser | undefined>;
  createUser(user: DbUser): Promise<DbUser>;
  updateUserPassword(userId: string, newHash: string, mustChangePassword?: boolean): Promise<DbUser | null>;
  setResetToken(userId: string, token: string, expiresAt: number): Promise<boolean>;
  verifyAndConsumeResetToken(userId: string, token: string): Promise<boolean>;
  getStudents(): Promise<DbStudent[]>;
  getStudentByUserId(userId: string): Promise<DbStudent | undefined>;
  getFaculty(): Promise<DbFaculty[]>;
  getFacultyByUserId(userId: string): Promise<DbFaculty | undefined>;
  getHOD(): Promise<DbHOD[]>;

  // Complaints (Student issues)
  getComplaints(filters?: {
    studentId?: string;
    category?: string;
    priority?: string;
    status?: string;
    search?: string;
  }): Promise<DbComplaint[]>;
  getComplaintById(complaintId: string): Promise<DbComplaint | undefined>;
  createComplaint(complaint: Partial<DbComplaint>): Promise<DbComplaint>;
  updateComplaint(
    complaintId: string,
    updates: Partial<DbComplaint>
  ): Promise<DbComplaint>;

  // Faculty Reports (Academic / lab issues)
  getFacultyReports(filters?: {
    facultyId?: string;
    category?: string;
    priority?: string;
    status?: string;
    search?: string;
  }): Promise<DbFacultyReport[]>;
  getFacultyReportById(reportId: string): Promise<DbFacultyReport | undefined>;
  createFacultyReport(report: Partial<DbFacultyReport>): Promise<DbFacultyReport>;
  updateFacultyReport(
    reportId: string,
    updates: Partial<DbFacultyReport>
  ): Promise<DbFacultyReport>;

  // Unified Complaints & Reports accessor for backward compatibility
  getAllTicketsUnified(filters?: {
    submitterId?: string;
    submittedByRole?: 'STUDENT' | 'FACULTY';
    category?: string;
    priority?: string;
    status?: string;
    search?: string;
  }): Promise<Complaint[]>;
  getUnifiedTicketById(id: string): Promise<Complaint | undefined>;

  // Assignments
  getAssignments(ticketId?: string): Promise<DbAssignment[]>;
  createAssignment(assignment: Partial<DbAssignment>): Promise<DbAssignment>;

  // Complaint History
  getComplaintHistory(complaintId: string): Promise<DbComplaintHistory[]>;
  addComplaintHistory(history: Partial<DbComplaintHistory>): Promise<DbComplaintHistory>;

  // Report History
  getReportHistory(reportId: string): Promise<DbReportHistory[]>;
  addReportHistory(history: Partial<DbReportHistory>): Promise<DbReportHistory>;

  // Messages
  getMessages(params?: {
    userId?: string;
    recipientId?: string;
    ticketId?: string;
  }): Promise<Message[]>;
  createMessage(payload: Partial<DbMessage>): Promise<Message>;
  markMessageRead(id: string): Promise<void>;
  markThreadRead(recipientId: string, senderId?: string): Promise<void>;

  // Notifications
  getNotifications(userId: string): Promise<NotificationItem[]>;
  createNotification(payload: Partial<DbNotification>): Promise<NotificationItem>;
  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;

  // Dashboard Stats
  getStats(): Promise<DashboardStats>;

  // Direct Schema Inspection
  exportDatabase(): Promise<DatabaseSchema>;
}

export class PersistentDatabase implements IDatabase {
  private dbPath: string;
  private state: DatabaseSchema;

  constructor(filePath?: string) {
    const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
    const dataDir = isVercel
      ? '/tmp/data'
      : path.resolve(process.cwd(), 'data');

    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch (err) {
        console.error('[DB] Error creating data directory:', err);
      }
    }

    const defaultDbFile = isVercel
      ? path.resolve(dataDir, 'campus_care_db.json')
      : path.resolve(process.cwd(), 'data', 'campus_care_db.json');

    // On Vercel, copy initial bundled database to /tmp if not already present
    if (isVercel && !fs.existsSync(defaultDbFile)) {
      const bundledDb = path.resolve(process.cwd(), 'data', 'campus_care_db.json');
      if (fs.existsSync(bundledDb)) {
        try {
          fs.copyFileSync(bundledDb, defaultDbFile);
        } catch {
          // If copy fails, fallback to seed generation
        }
      }
    }

    this.dbPath = isVercel
      ? defaultDbFile
      : (filePath || process.env.DATABASE_FILE_PATH || defaultDbFile);

    this.state = this.loadOrInitialize();
  }

  private getEnvPasswordForRole(role: UserRole): string | undefined {
    if (role === 'STUDENT') return process.env.STUDENT_DEFAULT_PASSWORD;
    if (role === 'FACULTY') return process.env.FACULTY_DEFAULT_PASSWORD;
    if (role === 'HOD') return process.env.HOD_DEFAULT_PASSWORD;
    return undefined;
  }

  public synchronizeDemoAccountHashes(stateToSync?: DatabaseSchema): boolean {
    const targetState = stateToSync || this.state;
    if (!targetState || !Array.isArray(targetState.users)) return false;

    let modified = false;
    const studentEnv = process.env.STUDENT_DEFAULT_PASSWORD;
    const facultyEnv = process.env.FACULTY_DEFAULT_PASSWORD;
    const hodEnv = process.env.HOD_DEFAULT_PASSWORD;

    targetState.users.forEach((u: DbUser) => {
      let targetEnvPwd: string | undefined;

      if (u.role === 'STUDENT' && (u.id === 'STU1001' || u.id === 'STU-2024-101')) {
        targetEnvPwd = studentEnv;
      } else if (u.role === 'FACULTY' && (u.id === 'FAC1001' || u.id === 'FAC-CS-204')) {
        targetEnvPwd = facultyEnv;
      } else if (u.role === 'HOD' && (u.id === 'HOD1001' || u.id === 'HOD-ENG-001')) {
        targetEnvPwd = hodEnv;
      }

      if (targetEnvPwd && targetEnvPwd.trim().length > 0) {
        const cleanPwd = targetEnvPwd.trim();
        const matchesCurrent = u.passwordHash
          ? comparePasswordSync(cleanPwd, u.passwordHash)
          : false;

        if (!matchesCurrent) {
          console.log(`[DB] Synchronizing demo account password hash for ${u.id} (${u.role}) from environment variable`);
          u.passwordHash = hashPasswordSync(cleanPwd);
          u.isActive = true;
          u.mustChangePassword = false;
          modified = true;
        }
      }
    });

    if (modified) {
      this.persistSync(targetState);
    }
    return modified;
  }

  private matchesUser(targetId?: string, testId?: string): boolean {
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

  private loadOrInitialize(): DatabaseSchema {
    let loadedState: DatabaseSchema | null = null;

    if (fs.existsSync(this.dbPath)) {
      try {
        const raw = fs.readFileSync(this.dbPath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (
          parsed &&
          Array.isArray(parsed.users) &&
          Array.isArray(parsed.complaints)
        ) {
          console.log(`[DB] Successfully loaded persistent database from ${this.dbPath}`);
          loadedState = parsed;
        }
      } catch (err) {
        console.error('[DB] Error reading persistent database, reinitializing with seed data:', err);
      }
    }

    if (!loadedState) {
      console.log(`[DB] Initializing fresh persistent database with complete seed data at ${this.dbPath}`);
      loadedState = this.generateSeedState();
    }

    // Safely synchronize demo accounts password hashes with current environment variables
    this.synchronizeDemoAccountHashes(loadedState);

    this.persistSync(loadedState);
    return loadedState;
  }

  private persistSync(stateToSave?: DatabaseSchema) {
    try {
      const data = JSON.stringify(stateToSave || this.state, null, 2);
      fs.writeFileSync(this.dbPath, data, 'utf-8');
    } catch (err) {
      console.error('[DB] Error persisting database file:', err);
    }
  }

  private generateSeedState(): DatabaseSchema {
    const now = new Date().toISOString();

    // 1. Users
    const users: DbUser[] = Object.values(DEMO_USERS).map((u) => {
      const envPwd = this.getEnvPasswordForRole(u.role);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        department: u.department,
        avatarUrl: u.avatar,
        phone: u.phone,
        passwordHash: envPwd ? hashPasswordSync(envPwd.trim()) : '',
        isActive: true,
        mustChangePassword: false,
        createdAt: now,
        updatedAt: now,
      };
    });

    // 2. Students
    const students: DbStudent[] = [
      {
        userId: 'STU1001',
        studentId: 'STU1001',
        department: 'Computer Science & Engineering',
        semester: '6th Semester',
        batch: '2023-2027',
        hostelBlock: 'Bhabha Hostel (Block A)',
        roomNo: 'A-314',
      },
      {
        userId: 'STU-2024-101',
        studentId: 'STU-2024-101',
        department: 'Computer Science & Engineering',
        semester: '6th Semester',
        batch: '2023-2027',
        hostelBlock: 'Bhabha Hostel (Block A)',
        roomNo: 'A-314',
      },
      {
        userId: 'STU-2024-102',
        studentId: 'STU-2024-102',
        department: 'Electronics & Communication',
        semester: '4th Semester',
        batch: '2024-2028',
        hostelBlock: 'Kalpana Chawla Hall',
        roomNo: 'K-208',
      },
    ];

    // 3. Faculty
    const faculty: DbFaculty[] = [
      {
        userId: 'FAC1001',
        facultyId: 'FAC1001',
        department: 'Computer Science & Engineering',
        designation: 'Associate Professor',
        cabinNo: 'Faculty Block 2, Cabin 210',
      },
      {
        userId: 'FAC-CS-204',
        facultyId: 'FAC-CS-204',
        department: 'Computer Science & Engineering',
        designation: 'Associate Professor',
        cabinNo: 'Faculty Block 2, Cabin 210',
      },
      {
        userId: 'FAC-MECH-301',
        facultyId: 'FAC-MECH-301',
        department: 'Mechanical Engineering',
        designation: 'Professor & Workshop Head',
        cabinNo: 'Mechanical Block, Room 104',
      },
    ];

    // 4. HOD
    const hod: DbHOD[] = [
      {
        userId: 'HOD1001',
        hodId: 'HOD1001',
        department: 'Campus Operations & Engineering',
        officeLocation: 'Admin Tower, Room 102',
      },
      {
        userId: 'HOD-ENG-001',
        hodId: 'HOD-ENG-001',
        department: 'Campus Operations & Engineering',
        officeLocation: 'Admin Tower, Room 102',
      },
    ];

    // 5 & 6. Complaints & Faculty Reports
    const complaints: DbComplaint[] = [];
    const facultyReports: DbFacultyReport[] = [];
    const complaintHistory: DbComplaintHistory[] = [];
    const reportHistory: DbReportHistory[] = [];
    const assignments: DbAssignment[] = [];

    INITIAL_COMPLAINTS.forEach((item) => {
      if (item.submittedByRole === 'FACULTY') {
        const rep: DbFacultyReport = {
          reportId: item.id,
          facultyId: item.submitterId,
          facultyName: item.submitterName,
          title: item.title,
          category: item.category,
          description: item.description,
          department: item.submitterDepartment || 'General',
          location: item.location,
          classroomLab: item.classroomOrLab,
          priority: item.priority,
          photoUrl: item.photoUrl,
          photoCaption: item.photoCaption,
          documentUrl: item.documentUrl,
          documentName: item.documentName,
          courseOrClassAffected: item.courseOrClassAffected,
          estimatedAffectedStudents: item.estimatedAffectedStudents,
          status: item.status,
          assignedTo: item.assignedTo,
          assignedTeam: item.assignedTeam,
          targetResolutionDate: item.targetResolutionDate,
          hodRemarks: item.hodRemarks,
          resolutionSummary: item.resolutionSummary,
          resolvedAt: item.resolvedAt,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        };
        facultyReports.push(rep);

        // Seed history
        if (item.actionLogs && item.actionLogs.length > 0) {
          item.actionLogs.forEach((log) => {
            reportHistory.push({
              id: log.id,
              reportId: item.id,
              action: log.action,
              previousStatus: log.previousStatus,
              newStatus: log.newStatus,
              remark: log.remark || log.notes,
              updatedBy: log.updatedBy || log.actorName,
              actorRole: log.actorRole,
              createdAt: log.timestamp,
            });
          });
        }

        // Seed assignment
        if (item.assignedTo || item.assignedTeam) {
          assignments.push({
            id: `ASG-${item.id}`,
            reportId: item.id,
            assignedTo: item.assignedTo || 'Assigned Crew',
            assignedTeam: item.assignedTeam,
            assignedBy: 'Dr. S. Radhakrishnan (HOD)',
            expectedCompletionDate: item.targetResolutionDate,
            remarks: item.hodRemarks,
            createdAt: item.updatedAt,
          });
        }
      } else {
        const comp: DbComplaint = {
          complaintId: item.id,
          studentId: item.submitterId,
          studentName: item.submitterName,
          title: item.title,
          category: item.category,
          description: item.description,
          department: item.submitterDepartment || 'General',
          location: item.location,
          classroomLab: item.classroomOrLab,
          priority: item.priority,
          photoUrl: item.photoUrl,
          photoCaption: item.photoCaption,
          status: item.status,
          assignedTo: item.assignedTo,
          assignedTeam: item.assignedTeam,
          targetResolutionDate: item.targetResolutionDate,
          hodRemarks: item.hodRemarks,
          resolutionSummary: item.resolutionSummary,
          resolvedAt: item.resolvedAt,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        };
        complaints.push(comp);

        // Seed history
        if (item.actionLogs && item.actionLogs.length > 0) {
          item.actionLogs.forEach((log) => {
            complaintHistory.push({
              id: log.id,
              complaintId: item.id,
              action: log.action,
              previousStatus: log.previousStatus,
              newStatus: log.newStatus,
              remark: log.remark || log.notes,
              updatedBy: log.updatedBy || log.actorName,
              actorRole: log.actorRole,
              createdAt: log.timestamp,
            });
          });
        }

        // Seed assignment
        if (item.assignedTo || item.assignedTeam) {
          assignments.push({
            id: `ASG-${item.id}`,
            complaintId: item.id,
            assignedTo: item.assignedTo || 'Assigned Crew',
            assignedTeam: item.assignedTeam,
            assignedBy: 'Dr. S. Radhakrishnan (HOD)',
            expectedCompletionDate: item.targetResolutionDate,
            remarks: item.hodRemarks,
            createdAt: item.updatedAt,
          });
        }
      }
    });

    // 7. Messages
    const messages: DbMessage[] = INITIAL_MESSAGES.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      senderName: m.senderName,
      senderRole: m.senderRole,
      receiverId: m.recipientId,
      receiverName: m.recipientName,
      receiverRole: m.recipientRole,
      message: m.content,
      complaintId: m.complaintId?.startsWith('FR') ? undefined : m.complaintId,
      reportId: m.complaintId?.startsWith('FR') ? m.complaintId : undefined,
      createdAt: m.timestamp,
      readAt: m.isRead ? m.timestamp : undefined,
      isRead: m.isRead,
    }));

    // 8. Notifications
    const notifications: DbNotification[] = INITIAL_NOTIFICATIONS.map((n) => ({
      id: n.id,
      userId: n.userId,
      type: n.type,
      title: n.title,
      message: n.message,
      complaintId: n.complaintId?.startsWith('FR') ? undefined : n.complaintId,
      reportId: n.complaintId?.startsWith('FR') ? n.complaintId : undefined,
      createdAt: n.timestamp,
      readAt: n.isRead ? n.timestamp : undefined,
      isRead: n.isRead,
    }));

    return {
      users,
      students,
      faculty,
      hod,
      complaints,
      facultyReports,
      messages,
      notifications,
      complaintHistory,
      reportHistory,
      assignments,
    };
  }

  // ==================== USERS & ROLES ====================
  async getUsers(): Promise<DbUser[]> {
    return [...this.state.users];
  }

  async getUserById(id: string): Promise<DbUser | undefined> {
    const trimmed = id.trim().toUpperCase();
    return this.state.users.find(
      (u) =>
        u.id.toUpperCase() === trimmed || this.matchesUser(u.id, trimmed)
    );
  }

  async getUserByEmail(email: string): Promise<DbUser | undefined> {
    const cleanEmail = email.trim().toLowerCase();
    return this.state.users.find((u) => u.email.trim().toLowerCase() === cleanEmail);
  }

  async updateUserPassword(
    userId: string,
    newHash: string,
    mustChangePassword: boolean = false
  ): Promise<DbUser | null> {
    const trimmed = userId.trim().toUpperCase();
    const user = this.state.users.find(
      (u) => u.id.toUpperCase() === trimmed || this.matchesUser(u.id, trimmed)
    );
    if (!user) return null;
    user.passwordHash = newHash;
    user.mustChangePassword = mustChangePassword;
    user.resetToken = undefined;
    user.resetTokenExpiresAt = undefined;
    user.updatedAt = new Date().toISOString();
    this.persistSync();
    return user;
  }

  async setResetToken(userId: string, token: string, expiresAt: number): Promise<boolean> {
    const trimmed = userId.trim().toUpperCase();
    const user = this.state.users.find(
      (u) => u.id.toUpperCase() === trimmed || this.matchesUser(u.id, trimmed)
    );
    if (!user) return false;
    user.resetToken = token;
    user.resetTokenExpiresAt = expiresAt;
    user.updatedAt = new Date().toISOString();
    this.persistSync();
    return true;
  }

  async verifyAndConsumeResetToken(userId: string, token: string): Promise<boolean> {
    const trimmed = userId.trim().toUpperCase();
    const user = this.state.users.find(
      (u) => u.id.toUpperCase() === trimmed || this.matchesUser(u.id, trimmed)
    );
    if (!user || !user.resetToken || !user.resetTokenExpiresAt) return false;
    if (Date.now() > user.resetTokenExpiresAt) {
      user.resetToken = undefined;
      user.resetTokenExpiresAt = undefined;
      this.persistSync();
      return false;
    }
    if (user.resetToken.toUpperCase() !== token.toUpperCase().trim()) {
      return false;
    }
    return true;
  }

  async createUser(user: DbUser): Promise<DbUser> {
    const existing = this.state.users.findIndex((u) => u.id === user.id);
    if (existing !== -1) {
      this.state.users[existing] = user;
    } else {
      this.state.users.push(user);
    }
    this.persistSync();
    return user;
  }

  async getStudents(): Promise<DbStudent[]> {
    return [...this.state.students];
  }

  async getStudentByUserId(userId: string): Promise<DbStudent | undefined> {
    return this.state.students.find((s) => this.matchesUser(s.userId, userId));
  }

  async getFaculty(): Promise<DbFaculty[]> {
    return [...this.state.faculty];
  }

  async getFacultyByUserId(userId: string): Promise<DbFaculty | undefined> {
    return this.state.faculty.find((f) => this.matchesUser(f.userId, userId));
  }

  async getHOD(): Promise<DbHOD[]> {
    return [...this.state.hod];
  }

  // ==================== COMPLAINTS ====================
  async getComplaints(filters?: {
    studentId?: string;
    category?: string;
    priority?: string;
    status?: string;
    search?: string;
  }): Promise<DbComplaint[]> {
    let result = [...this.state.complaints];

    if (filters?.studentId) {
      result = result.filter((c) =>
        this.matchesUser(filters.studentId, c.studentId)
      );
    }

    if (filters?.category && filters.category !== 'ALL') {
      result = result.filter((c) => c.category === filters.category);
    }

    if (filters?.priority && filters.priority !== 'ALL') {
      result = result.filter((c) => c.priority === filters.priority);
    }

    if (filters?.status && filters.status !== 'ALL') {
      result = result.filter((c) => c.status === filters.status);
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (c) =>
          c.complaintId.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q) ||
          c.classroomLab.toLowerCase().includes(q) ||
          (c.studentName && c.studentName.toLowerCase().includes(q))
      );
    }

    result.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return result;
  }

  async getComplaintById(complaintId: string): Promise<DbComplaint | undefined> {
    return this.state.complaints.find((c) => c.complaintId === complaintId);
  }

  generateUniqueComplaintId(): string {
    const currentYear = new Date().getFullYear();
    let maxSeq = 0;
    for (const c of this.state.complaints) {
      const m = c.complaintId.match(/^CC-\d{4}-(\d+)$/);
      if (m) {
        const val = parseInt(m[1], 10);
        if (val > maxSeq) maxSeq = val;
      }
    }
    const nextSeq = maxSeq + 1;
    return `CC-${currentYear}-${String(nextSeq).padStart(4, '0')}`;
  }

  async createComplaint(complaint: Partial<DbComplaint>): Promise<DbComplaint> {
    const now = new Date().toISOString();
    const complaintId = complaint.complaintId || this.generateUniqueComplaintId();

    const newComplaint: DbComplaint = {
      complaintId,
      studentId: complaint.studentId || 'STU1001',
      studentName: complaint.studentName || 'Student',
      title:
        complaint.title ||
        `${complaint.category || 'Issue'} at ${complaint.location || 'Campus'}`,
      category: (complaint.category || 'Other') as ComplaintCategory,
      description: complaint.description || '',
      department: complaint.department || 'General',
      location: complaint.location || 'Campus',
      classroomLab: complaint.classroomLab || 'N/A',
      priority: (complaint.priority || 'Medium') as ComplaintPriority,
      photoUrl: complaint.photoUrl,
      photoCaption: complaint.photoCaption,
      status: 'Pending',
      createdAt: now,
      updatedAt: now,
    };

    this.state.complaints.unshift(newComplaint);

    // Initial audit log in ComplaintHistory
    await this.addComplaintHistory({
      id: `LOG-${Date.now()}-init`,
      complaintId,
      action: 'Complaint Registered',
      previousStatus: undefined,
      newStatus: 'Pending',
      remark: `Complaint submitted with priority ${newComplaint.priority}. Location: ${newComplaint.location} (${newComplaint.classroomLab})`,
      updatedBy: newComplaint.studentName,
      actorRole: 'STUDENT',
      createdAt: now,
    });

    this.persistSync();
    return newComplaint;
  }

  async updateComplaint(
    complaintId: string,
    updates: Partial<DbComplaint>
  ): Promise<DbComplaint> {
    const index = this.state.complaints.findIndex(
      (c) => c.complaintId === complaintId
    );
    if (index === -1) {
      throw new Error(`Complaint ${complaintId} not found`);
    }

    const current = this.state.complaints[index];
    const now = new Date().toISOString();

    const updated: DbComplaint = {
      ...current,
      ...updates,
      updatedAt: now,
    };

    this.state.complaints[index] = updated;
    this.persistSync();
    return updated;
  }

  // ==================== FACULTY REPORTS ====================
  async getFacultyReports(filters?: {
    facultyId?: string;
    category?: string;
    priority?: string;
    status?: string;
    search?: string;
  }): Promise<DbFacultyReport[]> {
    let result = [...this.state.facultyReports];

    if (filters?.facultyId) {
      result = result.filter((r) =>
        this.matchesUser(filters.facultyId, r.facultyId)
      );
    }

    if (filters?.category && filters.category !== 'ALL') {
      result = result.filter((r) => r.category === filters.category);
    }

    if (filters?.priority && filters.priority !== 'ALL') {
      result = result.filter((r) => r.priority === filters.priority);
    }

    if (filters?.status && filters.status !== 'ALL') {
      result = result.filter((r) => r.status === filters.status);
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (r) =>
          r.reportId.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.location.toLowerCase().includes(q) ||
          r.classroomLab.toLowerCase().includes(q) ||
          (r.facultyName && r.facultyName.toLowerCase().includes(q))
      );
    }

    result.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return result;
  }

  async getFacultyReportById(
    reportId: string
  ): Promise<DbFacultyReport | undefined> {
    return this.state.facultyReports.find((r) => r.reportId === reportId);
  }

  generateUniqueReportId(): string {
    const currentYear = new Date().getFullYear();
    let maxSeq = 0;
    for (const r of this.state.facultyReports) {
      const m = r.reportId.match(/^FR-\d{4}-(\d+)$/);
      if (m) {
        const val = parseInt(m[1], 10);
        if (val > maxSeq) maxSeq = val;
      }
    }
    const nextSeq = maxSeq + 1;
    return `FR-${currentYear}-${String(nextSeq).padStart(4, '0')}`;
  }

  async createFacultyReport(
    report: Partial<DbFacultyReport>
  ): Promise<DbFacultyReport> {
    const now = new Date().toISOString();
    const reportId = report.reportId || this.generateUniqueReportId();

    const newReport: DbFacultyReport = {
      reportId,
      facultyId: report.facultyId || 'FAC1001',
      facultyName: report.facultyName || 'Faculty Member',
      title:
        report.title ||
        `${report.category || 'Report'} at ${report.location || 'Department'}`,
      category: (report.category || 'Laboratory') as ComplaintCategory,
      description: report.description || '',
      department: report.department || 'Computer Science & Engineering',
      location: report.location || 'Faculty Wing',
      classroomLab: report.classroomLab || 'N/A',
      priority: (report.priority || 'Medium') as ComplaintPriority,
      photoUrl: report.photoUrl,
      photoCaption: report.photoCaption,
      documentUrl: report.documentUrl,
      documentName: report.documentName,
      courseOrClassAffected: report.courseOrClassAffected,
      estimatedAffectedStudents: report.estimatedAffectedStudents,
      status: 'Pending',
      createdAt: now,
      updatedAt: now,
    };

    this.state.facultyReports.unshift(newReport);

    // Initial audit log in ReportHistory
    await this.addReportHistory({
      id: `LOG-${Date.now()}-init-fac`,
      reportId,
      action: 'Faculty Report Filed to HOD',
      previousStatus: undefined,
      newStatus: 'Pending',
      remark: `Faculty infrastructure report filed with priority ${newReport.priority}. Location: ${newReport.location} (${newReport.classroomLab})`,
      updatedBy: newReport.facultyName,
      actorRole: 'FACULTY',
      createdAt: now,
    });

    this.persistSync();
    return newReport;
  }

  async updateFacultyReport(
    reportId: string,
    updates: Partial<DbFacultyReport>
  ): Promise<DbFacultyReport> {
    const index = this.state.facultyReports.findIndex(
      (r) => r.reportId === reportId
    );
    if (index === -1) {
      throw new Error(`Faculty Report ${reportId} not found`);
    }

    const current = this.state.facultyReports[index];
    const now = new Date().toISOString();

    const updated: DbFacultyReport = {
      ...current,
      ...updates,
      updatedAt: now,
    };

    this.state.facultyReports[index] = updated;
    this.persistSync();
    return updated;
  }

  // ==================== UNIFIED TICKETS (COMPATIBILITY) ====================
  async getAllTicketsUnified(filters?: {
    submitterId?: string;
    submittedByRole?: 'STUDENT' | 'FACULTY';
    category?: string;
    priority?: string;
    status?: string;
    search?: string;
  }): Promise<Complaint[]> {
    const complaints = await this.getComplaints();
    const reports = await this.getFacultyReports();

    let unified: Complaint[] = [];

    // Map student complaints to Complaint model with actionLogs
    complaints.forEach((c) => {
      const logs = this.state.complaintHistory
        .filter((h) => h.complaintId === c.complaintId)
        .map((h) => ({
          id: h.id,
          timestamp: h.createdAt,
          actorName: h.updatedBy,
          actorRole: (h.actorRole as UserRole) || 'STUDENT',
          action: h.action,
          previousStatus: h.previousStatus as ComplaintStatus | undefined,
          newStatus: h.newStatus as ComplaintStatus | undefined,
          remark: h.remark,
          notes: h.remark,
          updatedBy: h.updatedBy,
        }));

      unified.push({
        id: c.complaintId,
        title: c.title,
        category: c.category,
        description: c.description,
        location: c.location,
        classroomOrLab: c.classroomLab,
        priority: c.priority,
        status: c.status,
        photoUrl: c.photoUrl,
        photoCaption: c.photoCaption,
        submittedByRole: 'STUDENT',
        submitterId: c.studentId,
        submitterName: c.studentName || 'Student',
        submitterEmail: `${c.studentId.toLowerCase()}@campuscare.edu`,
        submitterDepartment: c.department,
        assignedTo: c.assignedTo,
        assignedTeam: c.assignedTeam,
        targetResolutionDate: c.targetResolutionDate,
        hodRemarks: c.hodRemarks,
        resolutionSummary: c.resolutionSummary,
        resolvedAt: c.resolvedAt,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        actionLogs: logs,
      });
    });

    // Map faculty reports to Complaint model with actionLogs
    reports.forEach((r) => {
      const logs = this.state.reportHistory
        .filter((h) => h.reportId === r.reportId)
        .map((h) => ({
          id: h.id,
          timestamp: h.createdAt,
          actorName: h.updatedBy,
          actorRole: (h.actorRole as UserRole) || 'FACULTY',
          action: h.action,
          previousStatus: h.previousStatus as ComplaintStatus | undefined,
          newStatus: h.newStatus as ComplaintStatus | undefined,
          remark: h.remark,
          notes: h.remark,
          updatedBy: h.updatedBy,
        }));

      unified.push({
        id: r.reportId,
        title: r.title,
        category: r.category,
        description: r.description,
        location: r.location,
        classroomOrLab: r.classroomLab,
        priority: r.priority,
        status: r.status,
        photoUrl: r.photoUrl,
        photoCaption: r.photoCaption,
        documentUrl: r.documentUrl,
        documentName: r.documentName,
        courseOrClassAffected: r.courseOrClassAffected,
        estimatedAffectedStudents: r.estimatedAffectedStudents,
        submittedByRole: 'FACULTY',
        submitterId: r.facultyId,
        submitterName: r.facultyName || 'Faculty Member',
        submitterEmail: `${r.facultyId.toLowerCase()}@campuscare.edu`,
        submitterDepartment: r.department,
        assignedTo: r.assignedTo,
        assignedTeam: r.assignedTeam,
        targetResolutionDate: r.targetResolutionDate,
        hodRemarks: r.hodRemarks,
        resolutionSummary: r.resolutionSummary,
        resolvedAt: r.resolvedAt,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        actionLogs: logs,
      });
    });

    // Apply filters
    if (filters?.submitterId) {
      unified = unified.filter((item) =>
        this.matchesUser(filters.submitterId, item.submitterId)
      );
    }

    if (filters?.submittedByRole) {
      unified = unified.filter(
        (item) => item.submittedByRole === filters.submittedByRole
      );
    }

    if (filters?.category && filters.category !== 'ALL') {
      unified = unified.filter((item) => item.category === filters.category);
    }

    if (filters?.priority && filters.priority !== 'ALL') {
      unified = unified.filter((item) => item.priority === filters.priority);
    }

    if (filters?.status && filters.status !== 'ALL') {
      unified = unified.filter((item) => item.status === filters.status);
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase();
      unified = unified.filter(
        (item) =>
          item.id.toLowerCase().includes(q) ||
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q) ||
          item.classroomOrLab.toLowerCase().includes(q) ||
          item.submitterName.toLowerCase().includes(q)
      );
    }

    unified.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return unified;
  }

  async getUnifiedTicketById(id: string): Promise<Complaint | undefined> {
    const list = await this.getAllTicketsUnified();
    return list.find((item) => item.id === id);
  }

  // ==================== ASSIGNMENTS ====================
  async getAssignments(ticketId?: string): Promise<DbAssignment[]> {
    if (ticketId) {
      return this.state.assignments.filter(
        (a) => a.complaintId === ticketId || a.reportId === ticketId
      );
    }
    return [...this.state.assignments];
  }

  async createAssignment(
    assignment: Partial<DbAssignment>
  ): Promise<DbAssignment> {
    const now = new Date().toISOString();
    const newAssignment: DbAssignment = {
      id: assignment.id || `ASG-${Date.now()}`,
      complaintId: assignment.complaintId,
      reportId: assignment.reportId,
      assignedTo: assignment.assignedTo || 'Assigned Crew',
      assignedTeam: assignment.assignedTeam,
      assignedBy: assignment.assignedBy || 'Dr. S. Radhakrishnan (HOD)',
      expectedCompletionDate: assignment.expectedCompletionDate,
      remarks: assignment.remarks,
      createdAt: now,
    };

    this.state.assignments.unshift(newAssignment);
    this.persistSync();
    return newAssignment;
  }

  // ==================== COMPLAINT & REPORT HISTORY ====================
  async getComplaintHistory(complaintId: string): Promise<DbComplaintHistory[]> {
    return this.state.complaintHistory
      .filter((h) => h.complaintId === complaintId)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
  }

  async addComplaintHistory(
    history: Partial<DbComplaintHistory>
  ): Promise<DbComplaintHistory> {
    const now = new Date().toISOString();
    const entry: DbComplaintHistory = {
      id: history.id || `LOG-${Date.now()}`,
      complaintId: history.complaintId || '',
      action: history.action || 'Updated',
      previousStatus: history.previousStatus,
      newStatus: history.newStatus,
      remark: history.remark,
      updatedBy: history.updatedBy || 'System',
      actorRole: history.actorRole,
      createdAt: now,
    };
    this.state.complaintHistory.push(entry);
    this.persistSync();
    return entry;
  }

  async getReportHistory(reportId: string): Promise<DbReportHistory[]> {
    return this.state.reportHistory
      .filter((h) => h.reportId === reportId)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
  }

  async addReportHistory(
    history: Partial<DbReportHistory>
  ): Promise<DbReportHistory> {
    const now = new Date().toISOString();
    const entry: DbReportHistory = {
      id: history.id || `LOG-${Date.now()}`,
      reportId: history.reportId || '',
      action: history.action || 'Updated',
      previousStatus: history.previousStatus,
      newStatus: history.newStatus,
      remark: history.remark,
      updatedBy: history.updatedBy || 'System',
      actorRole: history.actorRole,
      createdAt: now,
    };
    this.state.reportHistory.push(entry);
    this.persistSync();
    return entry;
  }

  // ==================== MESSAGES ====================
  async getMessages(params?: {
    userId?: string;
    recipientId?: string;
    ticketId?: string;
  }): Promise<Message[]> {
    let result = [...this.state.messages];

    if (params?.userId) {
      result = result.filter(
        (m) =>
          this.matchesUser(params.userId, m.senderId) ||
          this.matchesUser(params.userId, m.receiverId)
      );
    }

    if (params?.recipientId) {
      result = result.filter(
        (m) =>
          this.matchesUser(params.recipientId, m.senderId) ||
          this.matchesUser(params.recipientId, m.receiverId)
      );
    }

    if (params?.ticketId) {
      result = result.filter(
        (m) =>
          m.complaintId === params.ticketId || m.reportId === params.ticketId
      );
    }

    result.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Map to Message interface for frontend
    return result.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      senderName: m.senderName,
      senderRole: m.senderRole,
      recipientId: m.receiverId,
      recipientName: m.receiverName,
      recipientRole: m.receiverRole,
      complaintId: m.complaintId || m.reportId,
      content: m.message,
      timestamp: m.createdAt,
      isRead: m.isRead,
    }));
  }

  async createMessage(payload: Partial<DbMessage>): Promise<Message> {
    const now = new Date().toISOString();
    const id = payload.id || `MSG-${Date.now()}`;

    const newMsg: DbMessage = {
      id,
      senderId: payload.senderId || 'STU1001',
      senderName: payload.senderName || 'Sender',
      senderRole: payload.senderRole || 'STUDENT',
      receiverId: payload.receiverId || 'HOD1001',
      receiverName: payload.receiverName || 'Recipient',
      receiverRole: payload.receiverRole || 'HOD',
      message: payload.message || '',
      complaintId: payload.complaintId,
      reportId: payload.reportId,
      createdAt: now,
      isRead: false,
    };

    this.state.messages.push(newMsg);
    this.persistSync();

    return {
      id: newMsg.id,
      senderId: newMsg.senderId,
      senderName: newMsg.senderName,
      senderRole: newMsg.senderRole,
      recipientId: newMsg.receiverId,
      recipientName: newMsg.receiverName,
      recipientRole: newMsg.receiverRole,
      complaintId: newMsg.complaintId || newMsg.reportId,
      content: newMsg.message,
      timestamp: newMsg.createdAt,
      isRead: newMsg.isRead,
    };
  }

  async markMessageRead(id: string): Promise<void> {
    const now = new Date().toISOString();
    const target = this.state.messages.find((m) => m.id === id);
    if (target) {
      target.isRead = true;
      target.readAt = now;
      this.persistSync();
    }
  }

  async markThreadRead(recipientId: string, senderId?: string): Promise<void> {
    const now = new Date().toISOString();
    let updated = false;

    this.state.messages.forEach((m) => {
      if (
        this.matchesUser(recipientId, m.receiverId) &&
        (!senderId || this.matchesUser(senderId, m.senderId))
      ) {
        if (!m.isRead) {
          m.isRead = true;
          m.readAt = now;
          updated = true;
        }
      }
    });

    if (updated) {
      this.persistSync();
    }
  }

  // ==================== NOTIFICATIONS ====================
  async getNotifications(userId: string): Promise<NotificationItem[]> {
    const notifs = this.state.notifications.filter((n) =>
      this.matchesUser(userId, n.userId)
    );

    notifs.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return notifs.map((n) => ({
      id: n.id,
      userId: n.userId,
      title: n.title,
      message: n.message,
      complaintId: n.complaintId || n.reportId,
      timestamp: n.createdAt,
      isRead: n.isRead,
      type: n.type as any,
    }));
  }

  async createNotification(
    payload: Partial<DbNotification>
  ): Promise<NotificationItem> {
    const now = new Date().toISOString();
    const id = payload.id || `NOTIF-${Date.now()}`;

    const newNotif: DbNotification = {
      id,
      userId: payload.userId || 'HOD1001',
      type: payload.type || 'alert',
      title: payload.title || 'Notification',
      message: payload.message || '',
      complaintId: payload.complaintId,
      reportId: payload.reportId,
      createdAt: now,
      isRead: false,
    };

    this.state.notifications.unshift(newNotif);
    this.persistSync();

    return {
      id: newNotif.id,
      userId: newNotif.userId,
      title: newNotif.title,
      message: newNotif.message,
      complaintId: newNotif.complaintId || newNotif.reportId,
      timestamp: newNotif.createdAt,
      isRead: newNotif.isRead,
      type: newNotif.type as any,
    };
  }

  async markNotificationRead(id: string): Promise<void> {
    const target = this.state.notifications.find((n) => n.id === id);
    if (target) {
      target.isRead = true;
      target.readAt = new Date().toISOString();
      this.persistSync();
    }
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    const now = new Date().toISOString();
    let updated = false;

    this.state.notifications.forEach((n) => {
      if (this.matchesUser(userId, n.userId) && !n.isRead) {
        n.isRead = true;
        n.readAt = now;
        updated = true;
      }
    });

    if (updated) {
      this.persistSync();
    }
  }

  // ==================== DASHBOARD STATS ====================
  async getStats(): Promise<DashboardStats> {
    const complaints = this.state.complaints;
    const reports = this.state.facultyReports;

    const studentReports = complaints.length;
    const facultyReportsCount = reports.length;
    const totalComplaints = studentReports + facultyReportsCount;

    let pending = 0;
    let assigned = 0;
    let inProgress = 0;
    let resolved = 0;
    let highPriority = 0;

    const processItem = (
      status: ComplaintStatus,
      priority: ComplaintPriority
    ) => {
      if (status === 'Pending') pending++;
      else if (status === 'Assigned') assigned++;
      else if (status === 'In Progress') inProgress++;
      else if (status === 'Resolved') resolved++;

      if (priority === 'High' || priority === 'Critical') {
        highPriority++;
      }
    };

    complaints.forEach((c) => processItem(c.status, c.priority));
    reports.forEach((r) => processItem(r.status, r.priority));

    return {
      totalComplaints,
      pending,
      assigned,
      inProgress,
      resolved,
      highPriority,
      studentReports,
      facultyReports: facultyReportsCount,
      averageResolutionHours: 4.8,
      resolutionRatePercentage:
        totalComplaints > 0 ? Math.round((resolved / totalComplaints) * 100) : 0,
    };
  }

  async exportDatabase(): Promise<DatabaseSchema> {
    return JSON.parse(JSON.stringify(this.state));
  }
}

// Export singleton instance
export const db: IDatabase = new PersistentDatabase();
