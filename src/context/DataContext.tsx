import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Complaint,
  DashboardStats,
  Message,
  NotificationItem,
  MaintenanceOfficer,
  User,
} from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface DataContextType {
  complaints: Complaint[];
  stats: DashboardStats | null;
  notifications: NotificationItem[];
  messages: Message[];
  maintenanceTeams: MaintenanceOfficer[];
  allUsers: User[];
  isLoading: boolean;
  unreadNotifsCount: number;
  unreadMessagesCount: number;
  
  // Modals & Navigation helpers
  selectedComplaint: Complaint | null;
  openComplaintDetails: (complaint: Complaint) => void;
  closeComplaintDetails: () => void;
  
  assignModalComplaint: Complaint | null;
  openAssignModal: (complaint: Complaint) => void;
  closeAssignModal: () => void;
  
  statusModalComplaint: Complaint | null;
  statusModalMode: 'STATUS' | 'RESOLVE';
  openStatusModal: (complaint: Complaint) => void;
  openResolveModal: (complaint: Complaint) => void;
  closeStatusModal: () => void;

  isReportModalOpen: boolean;
  openReportModal: () => void;
  closeReportModal: () => void;

  // Actions
  refreshAll: () => Promise<void>;
  createComplaint: (payload: Partial<Complaint>) => Promise<Complaint>;
  assignComplaint: (
    id: string,
    data: {
      assignedTo: string;
      assignedTeam: string;
      targetResolutionDate?: string;
      hodRemarks?: string;
    }
  ) => Promise<Complaint>;
  updateStatus: (
    id: string,
    data: {
      status: string;
      remarks?: string;
      resolutionSummary?: string;
    }
  ) => Promise<Complaint>;
  sendMessage: (payload: Partial<Message>) => Promise<Message>;
  markMessageRead: (id: string) => Promise<void>;
  markThreadRead: (recipientId: string, senderId?: string) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [maintenanceTeams, setMaintenanceTeams] = useState<MaintenanceOfficer[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal states
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [assignModalComplaint, setAssignModalComplaint] = useState<Complaint | null>(null);
  const [statusModalComplaint, setStatusModalComplaint] = useState<Complaint | null>(null);
  const [statusModalMode, setStatusModalMode] = useState<'STATUS' | 'RESOLVE'>('STATUS');
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);

  const refreshAll = useCallback(async () => {
    try {
      const [fetchedComplaints, fetchedStats, fetchedTeams, fetchedUsers] = await Promise.all([
        api.getComplaints(),
        api.getStats(),
        api.getMaintenanceTeams(),
        api.getUsers(),
      ]);

      setComplaints(fetchedComplaints);
      setStats(fetchedStats);
      setMaintenanceTeams(fetchedTeams);
      setAllUsers(fetchedUsers);

      if (currentUser) {
        const [fetchedNotifs, fetchedMsgs] = await Promise.all([
          api.getNotifications(currentUser.id),
          api.getMessages({ userId: currentUser.id }),
        ]);
        setNotifications(fetchedNotifs);
        setMessages(fetchedMsgs);
      }
    } catch (e) {
      console.error('Error refreshing data', e);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Keep selected complaint in sync when list updates
  useEffect(() => {
    if (selectedComplaint) {
      const updated = complaints.find((c) => c.id === selectedComplaint.id);
      if (updated) setSelectedComplaint(updated);
    }
  }, [complaints, selectedComplaint]);

  const openComplaintDetails = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
  };
  const closeComplaintDetails = () => {
    setSelectedComplaint(null);
  };

  const openAssignModal = (complaint: Complaint) => {
    setAssignModalComplaint(complaint);
  };
  const closeAssignModal = () => {
    setAssignModalComplaint(null);
  };

  const openStatusModal = (complaint: Complaint) => {
    setStatusModalMode('STATUS');
    setStatusModalComplaint(complaint);
  };
  const openResolveModal = (complaint: Complaint) => {
    setStatusModalMode('RESOLVE');
    setStatusModalComplaint(complaint);
  };
  const closeStatusModal = () => {
    setStatusModalComplaint(null);
    setStatusModalMode('STATUS');
  };

  const openReportModal = () => setIsReportModalOpen(true);
  const closeReportModal = () => setIsReportModalOpen(false);

  const createComplaint = async (payload: Partial<Complaint>): Promise<Complaint> => {
    const created = await api.createComplaint(payload);
    await refreshAll();
    return created;
  };

  const assignComplaint = async (
    id: string,
    data: {
      assignedTo: string;
      assignedTeam: string;
      targetResolutionDate?: string;
      hodRemarks?: string;
    }
  ): Promise<Complaint> => {
    const updated = await api.assignComplaint(id, data);
    await refreshAll();
    return updated;
  };

  const updateStatus = async (
    id: string,
    data: {
      status: string;
      remarks?: string;
      resolutionSummary?: string;
    }
  ): Promise<Complaint> => {
    const updated = await api.updateComplaintStatus(id, data);
    await refreshAll();
    return updated;
  };

  const sendMessage = async (payload: Partial<Message>): Promise<Message> => {
    const sent = await api.sendMessage(payload);
    await refreshAll();
    return sent;
  };

  const matchesUser = (currentId?: string, targetId?: string): boolean => {
    if (!currentId || !targetId) return false;
    if (currentId === targetId) return true;
    if ((currentId === 'HOD1001' || currentId === 'HOD-ENG-001') && (targetId === 'HOD1001' || targetId === 'HOD-ENG-001')) return true;
    if ((currentId === 'STU1001' || currentId === 'STU-2024-101') && (targetId === 'STU1001' || targetId === 'STU-2024-101')) return true;
    if ((currentId === 'FAC1001' || currentId === 'FAC-CS-204') && (targetId === 'FAC1001' || targetId === 'FAC-CS-204')) return true;
    return false;
  };

  const markMessageRead = async (id: string): Promise<void> => {
    await api.markMessageRead(id);
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, isRead: true } : m)));
  };

  const markThreadRead = async (recipientId: string, senderId?: string): Promise<void> => {
    await api.markThreadRead(recipientId, senderId);
    setMessages((prev) =>
      prev.map((m) => {
        if (matchesUser(recipientId, m.recipientId) && (!senderId || matchesUser(senderId, m.senderId))) {
          return { ...m, isRead: true };
        }
        return m;
      })
    );
  };

  const markNotificationRead = async (id: string): Promise<void> => {
    await api.markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllNotificationsRead = async (): Promise<void> => {
    if (currentUser) {
      await api.markAllNotificationsRead(currentUser.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    }
  };

  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;
  const unreadMessagesCount = messages.filter(
    (m) => currentUser && matchesUser(currentUser.id, m.recipientId) && !m.isRead
  ).length;

  return (
    <DataContext.Provider
      value={{
        complaints,
        stats,
        notifications,
        messages,
        maintenanceTeams,
        allUsers,
        isLoading,
        unreadNotifsCount,
        unreadMessagesCount,
        selectedComplaint,
        openComplaintDetails,
        closeComplaintDetails,
        assignModalComplaint,
        openAssignModal,
        closeAssignModal,
        statusModalComplaint,
        statusModalMode,
        openStatusModal,
        openResolveModal,
        closeStatusModal,
        isReportModalOpen,
        openReportModal,
        closeReportModal,
        refreshAll,
        createComplaint,
        assignComplaint,
        updateStatus,
        sendMessage,
        markMessageRead,
        markThreadRead,
        markNotificationRead,
        markAllNotificationsRead,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within a DataProvider');
  return ctx;
};
