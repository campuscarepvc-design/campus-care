import { UserRole, ComplaintCategory, ComplaintPriority, ComplaintStatus } from '../types';

/**
 * DATABASE ENTITIES & RELATIONSHIPS
 * Campus Care Application Persistent Storage Layer
 */

// 1. Users
export interface DbUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  avatarUrl?: string;
  phone?: string;
  passwordHash?: string;
  isActive?: boolean;
  mustChangePassword?: boolean;
  resetToken?: string;
  resetTokenExpiresAt?: number;
  createdAt: string;
  updatedAt: string;
}

// 2. Students
export interface DbStudent {
  userId: string;
  studentId: string;
  department: string;
  semester: string;
  batch?: string;
  hostelBlock?: string;
  roomNo?: string;
}

// 3. Faculty
export interface DbFaculty {
  userId: string;
  facultyId: string;
  department: string;
  designation: string;
  cabinNo?: string;
}

// 4. HOD
export interface DbHOD {
  userId: string;
  hodId: string;
  department: string;
  officeLocation?: string;
}

// 5. Complaints (Student problem tickets)
export interface DbComplaint {
  complaintId: string;
  studentId: string;
  studentName?: string;
  title: string;
  category: ComplaintCategory;
  description: string;
  department: string;
  location: string;
  classroomLab: string;
  priority: ComplaintPriority;
  photoUrl?: string;
  photoCaption?: string;
  status: ComplaintStatus;
  assignedTo?: string;
  assignedTeam?: string;
  targetResolutionDate?: string;
  hodRemarks?: string;
  resolutionSummary?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// 6. Faculty Reports (Academic / lab infrastructure reports filed by faculty)
export interface DbFacultyReport {
  reportId: string;
  facultyId: string;
  facultyName?: string;
  title: string;
  category: ComplaintCategory;
  description: string;
  department: string;
  location: string;
  classroomLab: string;
  priority: ComplaintPriority;
  photoUrl?: string;
  photoCaption?: string;
  documentUrl?: string;
  documentName?: string;
  courseOrClassAffected?: string;
  estimatedAffectedStudents?: number;
  status: ComplaintStatus;
  assignedTo?: string;
  assignedTeam?: string;
  targetResolutionDate?: string;
  hodRemarks?: string;
  resolutionSummary?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// 7. Messages
export interface DbMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  receiverId: string;
  receiverName: string;
  receiverRole: UserRole;
  message: string;
  complaintId?: string;
  reportId?: string;
  createdAt: string;
  readAt?: string;
  isRead: boolean;
}

// 8. Notifications
export interface DbNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  complaintId?: string;
  reportId?: string;
  createdAt: string;
  readAt?: string;
  isRead: boolean;
}

// 9. Complaint History
export interface DbComplaintHistory {
  id: string;
  complaintId: string;
  action: string;
  previousStatus?: string;
  newStatus?: string;
  remark?: string;
  updatedBy: string;
  actorRole?: string;
  createdAt: string;
}

// 10. Report History
export interface DbReportHistory {
  id: string;
  reportId: string;
  action: string;
  previousStatus?: string;
  newStatus?: string;
  remark?: string;
  updatedBy: string;
  actorRole?: string;
  createdAt: string;
}

// 11. Assignments
export interface DbAssignment {
  id: string;
  complaintId?: string;
  reportId?: string;
  assignedTo: string;
  assignedTeam?: string;
  assignedBy: string;
  expectedCompletionDate?: string;
  remarks?: string;
  createdAt: string;
}

// Complete Database Schema Container
export interface DatabaseSchema {
  users: DbUser[];
  students: DbStudent[];
  faculty: DbFaculty[];
  hod: DbHOD[];
  complaints: DbComplaint[];
  facultyReports: DbFacultyReport[];
  messages: DbMessage[];
  notifications: DbNotification[];
  complaintHistory: DbComplaintHistory[];
  reportHistory: DbReportHistory[];
  assignments: DbAssignment[];
}
