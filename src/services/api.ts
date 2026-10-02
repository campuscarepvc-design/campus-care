import {
  Complaint,
  Message,
  NotificationItem,
  User,
  DashboardStats,
  MaintenanceOfficer,
} from '../types';
import {
  INITIAL_COMPLAINTS,
  INITIAL_MESSAGES,
  INITIAL_NOTIFICATIONS,
  DEMO_USERS,
  MAINTENANCE_TEAMS,
} from '../data/seedData';

// Local storage keys
const STORAGE_COMPLAINTS_KEY = 'campus_care_complaints_v1';
const STORAGE_MESSAGES_KEY = 'campus_care_messages_v1';
const STORAGE_NOTIFS_KEY = 'campus_care_notifs_v1';
const STORAGE_AUTH_TOKEN_KEY = 'campus_care_auth_token_v1';

let inMemoryToken: string | null = null;

export function getAuthToken(): string | null {
  if (inMemoryToken) return inMemoryToken;
  try {
    const stored = localStorage.getItem(STORAGE_AUTH_TOKEN_KEY);
    inMemoryToken = stored;
    return stored;
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null): void {
  inMemoryToken = token;
  try {
    if (token) {
      localStorage.setItem(STORAGE_AUTH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(STORAGE_AUTH_TOKEN_KEY);
    }
  } catch (e) {
    console.warn('LocalStorage error setting auth token', e);
  }
}

// Authenticated fetch wrapper injecting Bearer token
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const res = await fetch(url, {
    ...options,
    headers,
  });

  // If 401 Unauthorized received on any protected route (not login), broadcast session expiry
  if (res.status === 401 && !url.includes('/api/auth/login')) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('campuscare:unauthorized'));
    }
  }

  return res;
}

function getLocalComplaints(): Complaint[] {
  try {
    const raw = localStorage.getItem(STORAGE_COMPLAINTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('LocalStorage error reading complaints', e);
  }
  return [...INITIAL_COMPLAINTS];
}

function saveLocalComplaints(data: Complaint[]) {
  try {
    localStorage.setItem(STORAGE_COMPLAINTS_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('LocalStorage error writing complaints', e);
  }
}

function getLocalMessages(): Message[] {
  try {
    const raw = localStorage.getItem(STORAGE_MESSAGES_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('LocalStorage error reading messages', e);
  }
  return [...INITIAL_MESSAGES];
}

function saveLocalMessages(data: Message[]) {
  try {
    localStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('LocalStorage error writing messages', e);
  }
}

function getLocalNotifications(): NotificationItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_NOTIFS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('LocalStorage error reading notifications', e);
  }
  return [...INITIAL_NOTIFICATIONS];
}

function saveLocalNotifications(data: NotificationItem[]) {
  try {
    localStorage.setItem(STORAGE_NOTIFS_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('LocalStorage error writing notifications', e);
  }
}

export const api = {
  // Authentication: Secure login with no permissive fallback
  async login(
    id: string,
    password?: string,
    role?: string
  ): Promise<{ success: boolean; user: User; token: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, password, role }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.token) {
        setAuthToken(data.token);
      }
      return data;
    }

    const errData = await res.json().catch(() => null);
    const errorMessage =
      errData?.error || 'Invalid credentials. Please verify your ID and password.';
    throw new Error(errorMessage);
  },

  // Active Session Verification
  async getMe(): Promise<User | null> {
    const token = getAuthToken();
    if (!token) return null;

    try {
      const res = await authFetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        return data.user || null;
      }
      return null;
    } catch {
      return null;
    }
  },

  // Logout session invalidation
  async logout(): Promise<void> {
    try {
      await authFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    } finally {
      setAuthToken(null);
    }
  },

  // Change password for logged-in user
  async changePassword(payload: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<{ success: boolean; message: string; user?: User }> {
    const res = await authFetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.error || 'Failed to change password. Please check your current password.');
    }
    return data;
  },

  // Forgot password request
  async forgotPassword(payload: {
    id: string;
    email: string;
  }): Promise<{ success: boolean; message: string; resetCode?: string; maskedEmail?: string }> {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.error || 'Unable to process reset request. Please verify your ID and email.');
    }
    return data;
  },

  // Reset password submission with code
  async resetPassword(payload: {
    id: string;
    resetCode: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.error || 'Failed to reset password. Please check your verification code.');
    }
    return data;
  },

  // Fetch configured demo accounts credentials from backend
  async getDemoCredentials(): Promise<Record<string, { id: string; password: string }>> {
    try {
      const res = await fetch('/api/auth/demo-credentials');
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return {
      STUDENT: { id: 'STU1001', password: 'student@2026' },
      FACULTY: { id: 'FAC1001', password: 'faculty@2026' },
      HOD: { id: 'HOD1001', password: 'hod@admin2026' },
    };
  },

  // Stats
  async getStats(): Promise<DashboardStats> {
    try {
      const res = await authFetch('/api/stats');
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback to calculation from local storage
    }

    const complaints = getLocalComplaints();
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

    return {
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
  },

  // Complaints
  async getComplaints(params?: {
    role?: string;
    submitterId?: string;
    submittedByRole?: string;
    category?: string;
    priority?: string;
    status?: string;
    search?: string;
  }): Promise<Complaint[]> {
    try {
      const query = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v) query.append(k, v);
        });
      }
      const res = await authFetch(`/api/complaints?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        saveLocalComplaints(data);
        return data;
      }
    } catch {
      // Fallback
    }

    let items = getLocalComplaints();
    if (params?.submitterId) {
      items = items.filter((c) => c.submitterId === params.submitterId);
    }
    if (params?.submittedByRole) {
      items = items.filter((c) => c.submittedByRole === params.submittedByRole);
    }
    if (params?.category && params.category !== 'ALL') {
      items = items.filter((c) => c.category === params.category);
    }
    if (params?.priority && params.priority !== 'ALL') {
      items = items.filter((c) => c.priority === params.priority);
    }
    if (params?.status && params.status !== 'ALL') {
      items = items.filter((c) => c.status === params.status);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q) ||
          c.classroomOrLab.toLowerCase().includes(q) ||
          c.submitterName.toLowerCase().includes(q)
      );
    }
    return items;
  },

  async getComplaintById(id: string): Promise<Complaint | null> {
    try {
      const res = await authFetch(`/api/complaints/${encodeURIComponent(id)}`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    const all = getLocalComplaints();
    return all.find((c) => c.id === id) || null;
  },

  async createComplaint(payload: Partial<Complaint>): Promise<Complaint> {
    try {
      const res = await authFetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const created = await res.json();
        const all = getLocalComplaints();
        all.unshift(created);
        saveLocalComplaints(all);
        return created;
      }
      const err = await res.json().catch(() => null);
      if (err?.error) throw new Error(err.error);
    } catch (e: any) {
      if (e?.message && !e.message.includes('Failed to fetch')) {
        throw e;
      }
    }

    const all = getLocalComplaints();
    let maxNum = 0;
    for (const c of all) {
      const match = c.id.match(/^CC-\d{4}-(\d+)$/);
      if (match) {
        const val = parseInt(match[1], 10);
        if (val > maxNum) maxNum = val;
      }
    }
    const newId = `CC-${new Date().getFullYear()}-${String(maxNum + 1).padStart(4, '0')}`;
    const now = new Date().toISOString();
    const room =
      payload.classroomOrLab && payload.classroomOrLab.trim()
        ? payload.classroomOrLab.trim()
        : 'N/A';

    const created: Complaint = {
      id: newId,
      title:
        payload.title ||
        `${payload.category} Issue at ${payload.location || 'Campus'}${
          room !== 'N/A' ? ` (${room})` : ''
        }`,
      category: payload.category || 'Other',
      description: payload.description || '',
      location: payload.location || '',
      classroomOrLab: room,
      priority: payload.priority || 'Medium',
      status: 'Pending',
      photoUrl: payload.photoUrl,
      photoCaption: payload.photoCaption,
      submittedByRole: payload.submittedByRole || 'STUDENT',
      submitterId: payload.submitterId || 'STU1001',
      submitterName: payload.submitterName || 'Student Submitter',
      submitterEmail: payload.submitterEmail || 'student@campuscare.edu',
      submitterDepartment: payload.submitterDepartment || 'Computer Science & Engineering',
      courseOrClassAffected: payload.courseOrClassAffected,
      estimatedAffectedStudents: payload.estimatedAffectedStudents,
      createdAt: now,
      updatedAt: now,
      actionLogs: [
        {
          id: `LOG-${Date.now()}`,
          timestamp: now,
          actorName: payload.submitterName || 'User',
          actorRole: payload.submittedByRole || 'STUDENT',
          action: 'Report Submitted',
          notes: `Priority: ${payload.priority}. Location: ${payload.location}`,
        },
      ],
    };

    all.unshift(created);
    saveLocalComplaints(all);
    return created;
  },

  async assignComplaint(
    id: string,
    data: {
      assignedTo: string;
      assignedTeam: string;
      targetResolutionDate?: string;
      hodRemarks?: string;
    }
  ): Promise<Complaint> {
    try {
      const res = await authFetch(`/api/complaints/${encodeURIComponent(id)}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        const all = getLocalComplaints().map((c) => (c.id === id ? updated : c));
        saveLocalComplaints(all);
        return updated;
      }
      const err = await res.json().catch(() => null);
      if (err?.error) throw new Error(err.error);
    } catch (e: any) {
      if (e?.message && !e.message.includes('Failed to fetch')) {
        throw e;
      }
    }

    const all = getLocalComplaints();
    const index = all.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Complaint not found');

    const now = new Date().toISOString();
    const target = all[index];
    const updated: Complaint = {
      ...target,
      assignedTo: data.assignedTo,
      assignedTeam: data.assignedTeam,
      targetResolutionDate: data.targetResolutionDate,
      hodRemarks: data.hodRemarks,
      status: target.status === 'Pending' ? 'Assigned' : target.status,
      updatedAt: now,
      actionLogs: [
        ...target.actionLogs,
        {
          id: `LOG-${Date.now()}`,
          timestamp: now,
          actorName: 'Dr. S. Radhakrishnan',
          actorRole: 'HOD',
          action: `Assigned to ${data.assignedTeam || data.assignedTo}`,
          previousStatus: target.status,
          newStatus: target.status === 'Pending' ? 'Assigned' : target.status,
          remark: data.hodRemarks || `Assigned to ${data.assignedTeam || data.assignedTo}`,
          notes: data.hodRemarks,
          updatedBy: 'Dr. S. Radhakrishnan (HOD)',
        },
      ],
    };
    all[index] = updated;
    saveLocalComplaints(all);
    return updated;
  },

  async updateComplaintStatus(
    id: string,
    data: {
      status: string;
      remarks?: string;
      resolutionSummary?: string;
    }
  ): Promise<Complaint> {
    try {
      const res = await authFetch(`/api/complaints/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        const all = getLocalComplaints().map((c) => (c.id === id ? updated : c));
        saveLocalComplaints(all);
        return updated;
      }
      const err = await res.json().catch(() => null);
      if (err?.error) throw new Error(err.error);
    } catch (e: any) {
      if (e?.message && !e.message.includes('Failed to fetch')) {
        throw e;
      }
    }

    const all = getLocalComplaints();
    const index = all.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Complaint not found');

    const now = new Date().toISOString();
    const target = all[index];
    const updated: Complaint = {
      ...target,
      status: data.status as any,
      hodRemarks: data.remarks || target.hodRemarks,
      resolutionSummary:
        data.resolutionSummary ||
        (data.status === 'Resolved' ? data.remarks : target.resolutionSummary),
      resolvedAt: data.status === 'Resolved' ? now : target.resolvedAt,
      updatedAt: now,
      actionLogs: [
        ...target.actionLogs,
        {
          id: `LOG-${Date.now()}`,
          timestamp: now,
          actorName: 'Dr. S. Radhakrishnan',
          actorRole: 'HOD',
          action: `Status changed to ${data.status}`,
          previousStatus: target.status,
          newStatus: data.status as any,
          remark: data.remarks || data.resolutionSummary || `Status changed to ${data.status}`,
          notes: data.remarks,
          updatedBy: 'Dr. S. Radhakrishnan (HOD)',
        },
      ],
    };
    all[index] = updated;
    saveLocalComplaints(all);
    return updated;
  },

  // Messages
  async getMessages(params?: { userId?: string; complaintId?: string }): Promise<Message[]> {
    try {
      const query = new URLSearchParams();
      if (params?.userId) query.append('userId', params.userId);
      if (params?.complaintId) query.append('complaintId', params.complaintId);
      const res = await authFetch(`/api/messages?${query.toString()}`);
      if (res.ok) {
        const msgs = await res.json();
        saveLocalMessages(msgs);
        return msgs;
      }
    } catch {
      // Fallback
    }

    let all = getLocalMessages();
    if (params?.userId) {
      all = all.filter((m) => m.senderId === params.userId || m.recipientId === params.userId);
    }
    if (params?.complaintId) {
      all = all.filter((m) => m.complaintId === params.complaintId);
    }
    return all;
  },

  async sendMessage(payload: Partial<Message>): Promise<Message> {
    try {
      const res = await authFetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const msg = await res.json();
        const all = getLocalMessages();
        all.push(msg);
        saveLocalMessages(all);
        return msg;
      }
      const err = await res.json().catch(() => null);
      if (err?.error) throw new Error(err.error);
    } catch (e: any) {
      if (e?.message && !e.message.includes('Failed to fetch')) {
        throw e;
      }
    }

    const all = getLocalMessages();
    const newMsg: Message = {
      id: `MSG-${Date.now()}`,
      senderId: payload.senderId || 'STU1001',
      senderName: payload.senderName || 'Sender',
      senderRole: payload.senderRole || 'STUDENT',
      recipientId: payload.recipientId || 'HOD-ENG-001',
      recipientName: payload.recipientName || 'HOD',
      recipientRole: payload.recipientRole || 'HOD',
      complaintId: payload.complaintId,
      content: payload.content || '',
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    all.push(newMsg);
    saveLocalMessages(all);
    return newMsg;
  },

  async markMessageRead(id: string): Promise<void> {
    try {
      await authFetch(`/api/messages/${encodeURIComponent(id)}/read`, { method: 'PATCH' });
    } catch {
      // Fallback
    }
    const all = getLocalMessages().map((m) => (m.id === id ? { ...m, isRead: true } : m));
    saveLocalMessages(all);
  },

  async markThreadRead(recipientId: string, senderId?: string): Promise<void> {
    try {
      await authFetch('/api/messages/thread/read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId, senderId }),
      });
    } catch {
      // Fallback
    }
    const matches = (a: string, b: string) =>
      a === b ||
      ((a === 'HOD1001' || a === 'HOD-ENG-001') && (b === 'HOD1001' || b === 'HOD-ENG-001')) ||
      ((a === 'STU1001' || a === 'STU-2024-101') && (b === 'STU1001' || b === 'STU-2024-101')) ||
      ((a === 'FAC1001' || a === 'FAC-CS-204') && (b === 'FAC1001' || b === 'FAC-CS-204'));

    const all = getLocalMessages().map((m) => {
      if (matches(recipientId, m.recipientId) && (!senderId || matches(senderId, m.senderId))) {
        return { ...m, isRead: true };
      }
      return m;
    });
    saveLocalMessages(all);
  },

  // Notifications
  async getNotifications(userId: string): Promise<NotificationItem[]> {
    try {
      const res = await authFetch(`/api/notifications/${encodeURIComponent(userId)}`);
      if (res.ok) {
        const notifs = await res.json();
        return notifs;
      }
    } catch {
      // Fallback
    }

    return getLocalNotifications().filter((n) => n.userId === userId);
  },

  async markNotificationRead(id: string): Promise<void> {
    try {
      await authFetch(`/api/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' });
    } catch {
      // Fallback
    }
    const all = getLocalNotifications().map((n) => (n.id === id ? { ...n, isRead: true } : n));
    saveLocalNotifications(all);
  },

  async markAllNotificationsRead(userId: string): Promise<void> {
    try {
      await authFetch(`/api/notifications/read-all/${encodeURIComponent(userId)}`, {
        method: 'PATCH',
      });
    } catch {
      // Fallback
    }
    const all = getLocalNotifications().map((n) =>
      n.userId === userId ? { ...n, isRead: true } : n
    );
    saveLocalNotifications(all);
  },

  // Users: Protected for HOD only (returns empty array for Student/Faculty)
  async getUsers(): Promise<User[]> {
    try {
      const res = await authFetch('/api/users');
      if (res.ok) return await res.json();
      if (res.status === 403 || res.status === 401) {
        return [];
      }
    } catch {
      // Fallback
    }
    return [];
  },

  async getMaintenanceTeams(): Promise<MaintenanceOfficer[]> {
    try {
      const res = await authFetch('/api/maintenance-teams');
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return MAINTENANCE_TEAMS;
  },

  // Persistent File Uploads
  async uploadComplaintPhoto(
    file: File
  ): Promise<{ fileUrl: string; fileName: string; size: number }> {
    const formData = new FormData();
    formData.append('photo', file);

    const res = await authFetch('/api/upload/complaint-photo', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(err.error || 'Failed to upload photo');
    }

    return await res.json();
  },

  async uploadFacultyFile(
    file: File
  ): Promise<{ fileUrl: string; fileName: string; size: number }> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await authFetch('/api/upload/faculty-file', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(err.error || 'Failed to upload file');
    }

    return await res.json();
  },
};
