import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  MessageSquare,
  Bell,
  User,
  Users,
  BarChart3,
  Wrench,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenReport: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onOpenReport }) => {
  const { role, currentUser, logout } = useAuth();
  const { unreadNotifsCount, unreadMessagesCount, complaints } = useData();

  const pendingCount = complaints.filter((c) => c.status === 'Pending').length;
  const myComplaintsCount = complaints.filter(
    (c) => currentUser && c.submitterId === currentUser.id
  ).length;

  const renderNavButton = (
    id: string,
    label: string,
    icon: React.ReactNode,
    badge?: number | string,
    badgeColor: string = 'bg-blue-100 text-blue-700'
  ) => {
    const isActive = activeTab === id;
    return (
      <button
        key={id}
        type="button"
        onClick={() => setActiveTab(id)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
          isActive
            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 font-bold'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className={isActive ? 'text-white' : 'text-slate-500'}>{icon}</span>
          <span>{label}</span>
        </div>
        {badge !== undefined && (
          <span
            className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
              isActive ? 'bg-white/20 text-white' : badgeColor
            }`}
          >
            {badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col justify-between p-4 shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        {/* Navigation Category */}
        <div>
          <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase px-3 mb-2">
            Main Menu
          </div>
          <div className="space-y-1">
            {role === 'STUDENT' && (
              <>
                {renderNavButton('dashboard', 'Dashboard', <LayoutDashboard className="w-4 h-4" />)}
                {renderNavButton(
                  'report',
                  'Report Problem',
                  <PlusCircle className="w-4 h-4 text-blue-500" />
                )}
                {renderNavButton(
                  'complaints',
                  'My Complaints',
                  <FileText className="w-4 h-4" />,
                  myComplaintsCount
                )}
                {renderNavButton(
                  'messages',
                  'Messages to HOD',
                  <MessageSquare className="w-4 h-4" />,
                  unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
                  'bg-emerald-100 text-emerald-700'
                )}
                {renderNavButton(
                  'notifications',
                  'Notifications',
                  <Bell className="w-4 h-4" />,
                  unreadNotifsCount > 0 ? unreadNotifsCount : undefined,
                  'bg-rose-100 text-rose-700'
                )}
                {renderNavButton('profile', 'Student Profile', <User className="w-4 h-4" />)}
              </>
            )}

            {role === 'FACULTY' && (
              <>
                {renderNavButton('dashboard', 'Dashboard', <LayoutDashboard className="w-4 h-4" />)}
                {renderNavButton(
                  'report',
                  'Report to HOD',
                  <Send className="w-4 h-4 text-indigo-500" />
                )}
                {renderNavButton(
                  'complaints',
                  'My Reports',
                  <FileText className="w-4 h-4" />,
                  myComplaintsCount
                )}
                {renderNavButton(
                  'messages',
                  'Messages',
                  <MessageSquare className="w-4 h-4" />,
                  unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
                  'bg-emerald-100 text-emerald-700'
                )}
                {renderNavButton(
                  'notifications',
                  'Notifications',
                  <Bell className="w-4 h-4" />,
                  unreadNotifsCount > 0 ? unreadNotifsCount : undefined,
                  'bg-rose-100 text-rose-700'
                )}
                {renderNavButton('profile', 'Faculty Profile', <User className="w-4 h-4" />)}

                {/* Faculty Logout Button */}
                <button
                  type="button"
                  onClick={() => logout()}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Logout</span>
                </button>
              </>
            )}

            {role === 'HOD' && (
              <>
                {renderNavButton('dashboard', 'Dashboard', <LayoutDashboard className="w-4 h-4" />)}
                {renderNavButton(
                  'student-complaints',
                  'Student Complaints',
                  <FileText className="w-4 h-4" />,
                  complaints.filter((c) => c.submittedByRole === 'STUDENT').length
                )}
                {renderNavButton(
                  'faculty-reports',
                  'Faculty Reports',
                  <AlertCircle className="w-4 h-4" />,
                  complaints.filter((c) => c.submittedByRole === 'FACULTY').length
                )}
                {renderNavButton(
                  'assignments',
                  'Assignments',
                  <Wrench className="w-4 h-4" />,
                  pendingCount > 0 ? `${pendingCount} new` : undefined,
                  'bg-amber-100 text-amber-800'
                )}
                {renderNavButton(
                  'messages',
                  'Messages',
                  <MessageSquare className="w-4 h-4" />,
                  unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
                  'bg-emerald-100 text-emerald-700'
                )}
                {renderNavButton(
                  'notifications',
                  'Notifications',
                  <Bell className="w-4 h-4" />,
                  unreadNotifsCount > 0 ? unreadNotifsCount : undefined,
                  'bg-rose-100 text-rose-700'
                )}
                {renderNavButton('analytics', 'Analytics', <BarChart3 className="w-4 h-4" />)}
                {renderNavButton('users', 'Users', <Users className="w-4 h-4" />)}
                {renderNavButton('profile', 'Profile', <User className="w-4 h-4" />)}
                
                {/* Logout Button */}
                <button
                  type="button"
                  onClick={() => logout()}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Logout</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Quick Campus Assistance Widget */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-b from-blue-50 to-slate-50 border border-blue-100/80">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-900 mb-1">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>24/7 Facility Desk</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-snug">
            Emergency breakdown? Call campus dispatch extension: <span className="font-bold text-slate-800">Ext. 404</span>
          </p>
          <div className="mt-2 text-[10px] text-blue-700 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Maintenance teams active
          </div>
        </div>
      </div>

      {/* User Status Footer */}
      <div className="pt-4 border-t border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div className="text-[11px] text-slate-500">
            Connected as <strong className="text-slate-700">{role}</strong>
          </div>
        </div>
      </div>
    </aside>
  );
};
