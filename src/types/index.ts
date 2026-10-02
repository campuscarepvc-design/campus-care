export type UserRole = 'STUDENT' | 'FACULTY' | 'HOD';

export type ComplaintCategory =
  | 'Electrical'
  | 'Water'
  | 'Cleaning'
  | 'Classroom'
  | 'Laboratory'
  | 'Internet'
  | 'Safety'
  | 'Other';

export type ComplaintPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type ComplaintStatus = 'Pending' | 'Assigned' | 'In Progress' | 'Resolved';

export interface User {
  id: string; // e.g., 'STU-2024-8841', 'FAC-CS-104', 'HOD-ENG-001'
  name: string;
  email: string;
  role: UserRole;
  department: string;
  avatar?: string;
  phone?: string;
  // Student specific
  batch?: string;
  semester?: string;
  hostelBlock?: string;
  roomNo?: string;
  // Faculty specific
  designation?: string;
  cabinNo?: string;
  coursesTaught?: string[];
  // HOD specific
  officeRoom?: string;
  // Security
  mustChangePassword?: boolean;
}

export interface MaintenanceOfficer {
  id: string;
  name: string;
  team: string; // e.g., 'Electrical Maintenance Wing', 'Sanitation & Water', 'Campus IT & Networks'
  phone: string;
  available: boolean;
  activeWorkloads: number;
}

export interface ComplaintActionLog {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: UserRole | 'MAINTENANCE';
  action: string;
  notes?: string;
  remark?: string;
  previousStatus?: ComplaintStatus;
  newStatus?: ComplaintStatus;
  updatedBy?: string;
}

export interface Complaint {
  id: string; // e.g., 'CC-2026-0001'
  title: string;
  category: ComplaintCategory;
  description: string;
  location: string; // e.g. "Aryabhata Academic Block, 3rd Floor"
  classroomOrLab: string; // e.g. "Room 304" or "IoT Lab 2"
  priority: ComplaintPriority;
  status: ComplaintStatus;
  photoUrl?: string;
  photoCaption?: string;
  documentUrl?: string;
  documentName?: string;
  
  // Submitter details
  submittedByRole: 'STUDENT' | 'FACULTY';
  submitterId: string;
  submitterName: string;
  submitterEmail: string;
  submitterDepartment: string;
  
  // Faculty specific metadata if reported by faculty
  courseOrClassAffected?: string;
  estimatedAffectedStudents?: number;
  
  // Assignment & Resolution
  assignedTo?: string; // Officer Name
  assignedTeam?: string; // Team
  assignedAt?: string;
  targetResolutionDate?: string;
  hodRemarks?: string;
  resolutionSummary?: string;
  resolvedAt?: string;
  
  createdAt: string;
  updatedAt: string;
  actionLogs: ComplaintActionLog[];
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  recipientId: string;
  recipientName: string;
  recipientRole: UserRole;
  complaintId?: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  complaintId?: string;
  timestamp: string;
  isRead: boolean;
  type:
    | 'status_change'
    | 'assignment'
    | 'message'
    | 'alert'
    | 'complaint_received'
    | 'report_received'
    | 'work_started'
    | 'resolved'
    | 'new_complaint'
    | 'new_report'
    | 'new_message'
    | 'status_update'
    | string;
}

export interface DashboardStats {
  totalComplaints: number;
  pending: number;
  assigned: number;
  inProgress: number;
  resolved: number;
  highPriority: number;
  studentReports: number;
  facultyReports: number;
  averageResolutionHours: number;
  resolutionRatePercentage: number;
}
