import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { UserRole } from '../../types';
import {
  Building2,
  Bell,
  LogOut,
  ChevronDown,
  PlusCircle,
  GraduationCap,
  Briefcase,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenReport: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ setActiveTab, onOpenReport }) => {
  const { currentUser, role, logout } = useAuth();
  const { notifications, unreadNotifsCount, markNotificationRead, markAllNotificationsRead, openComplaintDetails, complaints } = useData();

  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const getRoleBadge = () => {
    switch (role) {
      case 'STUDENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200">
            <GraduationCap className="w-3.5 h-3.5" /> Student
          </span>
        );
      case 'FACULTY':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
            <Briefcase className="w-3.5 h-3.5" /> Faculty
          </span>
        );
      case 'HOD':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <ShieldCheck className="w-3.5 h-3.5" /> HOD Administration
          </span>
        );
      default:
        return null;
    }
  };

  const handleNotificationClick = (notif: typeof notifications[0]) => {
    markNotificationRead(notif.id);
    setIsNotifDropdownOpen(false);
    if (notif.complaintId) {
      const target = complaints.find((c) => c.id === notif.complaintId);
      if (target) {
        openComplaintDetails(target);
        return;
      }
    }
    if (
      notif.type === 'message' ||
      notif.type === 'new_message' ||
      notif.title.toLowerCase().includes('message') ||
      notif.title.toLowerCase().includes('reply')
    ) {
      setActiveTab('messages');
    } else {
      setActiveTab('notifications');
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Tagline */}
        <div className="flex items-center gap-4">
          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-700 flex items-center justify-center text-white shadow-md shadow-blue-700/20 group-hover:bg-blue-800 transition">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-slate-900 font-mono">
                  CAMPUS<span className="text-blue-600">CARE</span>
                </span>
                {getRoleBadge()}
              </div>
              <p className="text-[10px] text-slate-500 font-medium hidden sm:block tracking-wide uppercase">
                One Campus • One Platform • Better Solutions
              </p>
            </div>
          </div>
        </div>

        {/* Center / Right Actions */}
        <div className="flex items-center gap-3">
          {/* Quick Role Switcher (For seamless testing across roles) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsRoleMenuOpen(!isRoleMenuOpen);
                setIsNotifDropdownOpen(false);
                setIsUserMenuOpen(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg cursor-pointer transition"
              title="Switch demo persona for testing"
            >
              <span className="hidden sm:inline text-slate-500">Switch Role:</span>
              <span className="font-bold text-blue-700 capitalize">{role?.toLowerCase()}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {isRoleMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1 text-[11px] font-bold uppercase text-slate-400">
                  Switch Active Persona
                </div>
                <p className="px-3 py-1 text-[11px] text-slate-500 border-b border-slate-100 mb-1">
                  Switching accounts logs out the current session and opens login for security.
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    setIsRoleMenuOpen(false);
                    await logout();
                  }}
                  className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2.5 hover:bg-slate-50 cursor-pointer ${
                    role === 'STUDENT' ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-slate-700'
                  }`}
                >
                  <GraduationCap className="w-4 h-4 text-sky-500" />
                  <div>
                    <div className="font-semibold">Student Account</div>
                    <div className="text-[10px] text-slate-400">Aryan Verma (STU1001)</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setIsRoleMenuOpen(false);
                    await logout();
                  }}
                  className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2.5 hover:bg-slate-50 cursor-pointer ${
                    role === 'FACULTY' ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-slate-700'
                  }`}
                >
                  <Briefcase className="w-4 h-4 text-indigo-500" />
                  <div>
                    <div className="font-semibold">Faculty Account</div>
                    <div className="text-[10px] text-slate-400">Dr. Ananya Sen (FAC1001)</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setIsRoleMenuOpen(false);
                    await logout();
                  }}
                  className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2.5 hover:bg-slate-50 cursor-pointer ${
                    role === 'HOD' ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-slate-700'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  <div>
                    <div className="font-semibold">HOD Command Center</div>
                    <div className="text-[10px] text-slate-400">Dr. S. Radhakrishnan (HOD1001)</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Quick Report Button (for Student & Faculty) */}
          {role !== 'HOD' && (
            <button
              type="button"
              onClick={onOpenReport}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-600/30 transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{role === 'FACULTY' ? 'Report to HOD' : 'Report Problem'}</span>
            </button>
          )}

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsNotifDropdownOpen(!isNotifDropdownOpen);
                setIsRoleMenuOpen(false);
                setIsUserMenuOpen(false);
              }}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            {isNotifDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in duration-100">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">Notifications</span>
                    {unreadNotifsCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-700 rounded-full">
                        {unreadNotifsCount} new
                      </span>
                    )}
                  </div>
                  {unreadNotifsCount > 0 && (
                    <button
                      type="button"
                      onClick={() => markAllNotificationsRead()}
                      className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-3.5 hover:bg-slate-50 transition cursor-pointer flex gap-3 ${
                          !notif.isRead ? 'bg-blue-50/40 font-medium' : ''
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {(notif.type === 'message' || notif.type === 'new_message' || notif.title.toLowerCase().includes('message')) ? (
                            <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                              <MessageSquare className="w-3.5 h-3.5" />
                            </div>
                          ) : (notif.type === 'resolved' || notif.title.toLowerCase().includes('resolved')) ? (
                            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </div>
                          ) : (notif.type === 'work_started' || notif.title.toLowerCase().includes('started')) ? (
                            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                              <Clock className="w-3.5 h-3.5" />
                            </div>
                          ) : (notif.type === 'assignment' || notif.title.toLowerCase().includes('assigned')) ? (
                            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                              <Building2 className="w-3.5 h-3.5" />
                            </div>
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                              <Bell className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-800 truncate">
                              {notif.title}
                            </span>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                              {new Date(notif.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                            {notif.message}
                          </p>
                          {notif.complaintId && (
                            <span className="inline-block mt-1 text-[10px] font-mono text-blue-600 hover:underline">
                              View {notif.complaintId} →
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsNotifDropdownOpen(false);
                      setActiveTab('notifications');
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                  >
                    View All Notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Button & Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsUserMenuOpen(!isUserMenuOpen);
                setIsNotifDropdownOpen(false);
                setIsRoleMenuOpen(false);
              }}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            >
              <img
                src={
                  currentUser?.avatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
                }
                alt={currentUser?.name}
                className="w-8 h-8 rounded-full object-cover border border-slate-300"
              />
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-slate-800 truncate max-w-[120px]">
                  {currentUser?.name}
                </div>
                <div className="text-[10px] text-slate-500 font-mono truncate max-w-[120px]">
                  {currentUser?.id}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in duration-100">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-xs text-slate-400">Signed in as</p>
                  <p className="text-sm font-bold text-slate-900 truncate">{currentUser?.name}</p>
                  <p className="text-xs text-blue-600 font-mono mt-0.5">{currentUser?.id}</p>
                  <p className="text-[11px] text-slate-500 mt-1">{currentUser?.department}</p>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('profile');
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                  >
                    <span>My Profile & Settings</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('messages');
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                  >
                    <span>Internal Communications</span>
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>

                <div className="border-t border-slate-100 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
