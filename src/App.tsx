/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { LandingLogin } from './components/auth/LandingLogin';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';

// Student Views
import { StudentDashboard } from './components/student/StudentDashboard';
import { MyComplaintsView } from './components/student/MyComplaintsView';
import { ReportProblemModal } from './components/student/ReportProblemModal';
import { ReportProblemView } from './components/student/ReportProblemView';

// Faculty Views
import { FacultyDashboard } from './components/faculty/FacultyDashboard';
import { FacultyReportProblemView } from './components/faculty/FacultyReportProblemView';
import { FacultyMyReportsView } from './components/faculty/FacultyMyReportsView';

// HOD Views
import { HODDashboard } from './components/hod/HODDashboard';
import { HODComplaintsManagement } from './components/hod/HODComplaintsManagement';
import { AnalyticsView } from './components/hod/AnalyticsView';
import { UserDirectoryView } from './components/hod/UserDirectoryView';

// Common Views & Modals
import { ComplaintDetailsModal } from './components/common/ComplaintDetailsModal';
import { AssignComplaintModal } from './components/hod/AssignComplaintModal';
import { StatusUpdateModal } from './components/hod/StatusUpdateModal';
import { InternalMessagingView } from './components/messaging/InternalMessagingView';
import { NotificationsView } from './components/notifications/NotificationsView';
import { ProfileView } from './components/profile/ProfileView';

import { Complaint } from './types';
import { AccessDeniedView } from './components/common/AccessDeniedView';
import { ForceChangePasswordModal } from './components/auth/ForceChangePasswordModal';

// Allowed tabs per role for route protection
const ROLE_ALLOWED_ROUTES: Record<string, string[]> = {
  STUDENT: ['dashboard', 'complaints', 'report', 'messages', 'notifications', 'profile'],
  FACULTY: ['dashboard', 'complaints', 'my-reports', 'report', 'messages', 'notifications', 'profile'],
  HOD: [
    'dashboard',
    'student-complaints',
    'faculty-reports',
    'assignments',
    'assign-complaints',
    'analytics',
    'users',
    'messages',
    'notifications',
    'profile',
  ],
};

const MainAppContent: React.FC = () => {
  const { isAuthenticated, role, isCheckingAuth } = useAuth();
  const {
    selectedComplaint,
    closeComplaintDetails,
    assignModalComplaint,
    closeAssignModal,
    statusModalComplaint,
    statusModalMode,
    closeStatusModal,
    openAssignModal,
    openStatusModal,
    openResolveModal,
    isReportModalOpen,
    openReportModal,
    closeReportModal,
  } = useData();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [messagingComplaintContext, setMessagingComplaintContext] = useState<Complaint | null>(null);

  // When role changes, automatically direct to their specific dashboard
  React.useEffect(() => {
    if (role) {
      setActiveTab('dashboard');
    }
  }, [role]);

  // Loading state while verifying server session
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold tracking-wider uppercase font-mono text-slate-300">
            Verifying Campus Care Session...
          </span>
        </div>
      </div>
    );
  }

  // If not logged in, show Landing / Role Selection screen
  if (!isAuthenticated) {
    return <LandingLogin />;
  }

  const handleStartMessage = (complaint: Complaint) => {
    setMessagingComplaintContext(complaint);
    setActiveTab('messages');
  };

  // Route protection validation
  const allowedRoutes = role ? ROLE_ALLOWED_ROUTES[role] || [] : [];
  const isRouteAllowed = allowedRoutes.includes(activeTab);

  const renderActiveView = () => {
    // If route is forbidden for current role, block and show AccessDeniedView
    if (!isRouteAllowed) {
      return (
        <AccessDeniedView
          currentRole={role}
          attemptedTab={activeTab}
          onReturnToDashboard={() => setActiveTab('dashboard')}
        />
      );
    }

    // Shared authorized views across roles
    if (activeTab === 'messages') {
      return (
        <InternalMessagingView
          initialComplaintContext={messagingComplaintContext}
        />
      );
    }
    if (activeTab === 'notifications') {
      return (
        <NotificationsView
          onNavigateToMessages={() => setActiveTab('messages')}
        />
      );
    }
    if (activeTab === 'profile') {
      return <ProfileView />;
    }

    // Role-specific protected routing
    if (role === 'STUDENT') {
      switch (activeTab) {
        case 'dashboard':
          return (
            <StudentDashboard
              setActiveTab={setActiveTab}
              onOpenReport={() => setActiveTab('report')}
            />
          );
        case 'report':
          return (
            <ReportProblemView
              onNavigateToComplaints={() => setActiveTab('complaints')}
            />
          );
        case 'complaints':
          return (
            <MyComplaintsView
              onOpenReport={() => setActiveTab('report')}
              onStartMessageWithHOD={handleStartMessage}
            />
          );
        default:
          return (
            <StudentDashboard
              setActiveTab={setActiveTab}
              onOpenReport={() => setActiveTab('report')}
            />
          );
      }
    }

    if (role === 'FACULTY') {
      switch (activeTab) {
        case 'dashboard':
          return (
            <FacultyDashboard
              setActiveTab={setActiveTab}
              onOpenReport={() => setActiveTab('report')}
            />
          );
        case 'report':
          return (
            <FacultyReportProblemView
              onNavigateToReports={() => setActiveTab('complaints')}
            />
          );
        case 'complaints':
        case 'my-reports':
          return (
            <FacultyMyReportsView
              onOpenReport={() => setActiveTab('report')}
              onStartMessageWithHOD={handleStartMessage}
            />
          );
        default:
          return (
            <FacultyDashboard
              setActiveTab={setActiveTab}
              onOpenReport={() => setActiveTab('report')}
            />
          );
      }
    }

    if (role === 'HOD') {
      switch (activeTab) {
        case 'dashboard':
          return <HODDashboard setActiveTab={setActiveTab} />;
        case 'student-complaints':
          return (
            <HODComplaintsManagement
              filterRole="STUDENT"
              title="Student Campus Complaints"
              subtitle="Review, prioritize, assign, and resolve facility issues registered by college students."
              onStartMessage={handleStartMessage}
            />
          );
        case 'faculty-reports':
          return (
            <HODComplaintsManagement
              filterRole="FACULTY"
              title="Faculty Academic Infrastructure Reports"
              subtitle="Escalations regarding labs, research equipment, lecture hall AV, and classroom facilities."
              onStartMessage={handleStartMessage}
            />
          );
        case 'assignments':
        case 'assign-complaints':
          return (
            <HODComplaintsManagement
              filterRole="ALL"
              title="Assignments & Maintenance Dispatch"
              subtitle="Dispatch duty maintenance crews (Electrical, Plumbing, IT, Sanitation, Civil) to open campus tickets."
              onStartMessage={handleStartMessage}
            />
          );
        case 'analytics':
          return <AnalyticsView />;
        case 'users':
          return <UserDirectoryView />;
        default:
          return <HODDashboard setActiveTab={setActiveTab} />;
      }
    }

    return (
      <StudentDashboard
        setActiveTab={setActiveTab}
        onOpenReport={openReportModal}
      />
    );
  };

  const handleOpenReport = () => {
    if (role === 'STUDENT' || role === 'FACULTY') {
      setActiveTab('report');
    } else {
      openReportModal();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenReport={handleOpenReport}
      />

      {/* Main Container with Sidebar + Content */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenReport={handleOpenReport}
        />

        {/* Dynamic Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-full">
          {renderActiveView()}
        </main>
      </div>

      {/* Report Problem Modal (Student & Faculty) */}
      <ReportProblemModal
        isOpen={isReportModalOpen}
        onClose={closeReportModal}
        onSuccessComplaint={() => {
          setActiveTab('complaints');
        }}
      />

      {/* Complaint Details Modal */}
      <ComplaintDetailsModal
        complaint={selectedComplaint}
        onClose={closeComplaintDetails}
        currentUserRole={role}
        onOpenAssign={openAssignModal}
        onOpenStatusUpdate={openStatusModal}
        onOpenResolve={openResolveModal}
        onStartMessageWithHOD={handleStartMessage}
        onStartMessageWithStudent={handleStartMessage}
      />

      {/* HOD Assign Modal */}
      <AssignComplaintModal
        complaint={assignModalComplaint}
        onClose={closeAssignModal}
      />

      {/* HOD Status Update & Resolution Modal */}
      <StatusUpdateModal
        complaint={statusModalComplaint}
        initialMode={statusModalMode}
        onClose={closeStatusModal}
      />

      {/* Force Change Password Modal for default accounts */}
      <ForceChangePasswordModal />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <MainAppContent />
      </DataProvider>
    </AuthProvider>
  );
}
