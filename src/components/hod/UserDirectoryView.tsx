import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { UserRole } from '../../types';
import {
  Users,
  Search,
  GraduationCap,
  Briefcase,
  ShieldCheck,
  Wrench,
  Mail,
  Phone,
  Building,
} from 'lucide-react';

export const UserDirectoryView: React.FC = () => {
  const { allUsers, maintenanceTeams } = useData();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  const filteredUsers = allUsers.filter((u) => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q) ||
        u.department.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'STUDENT':
        return <GraduationCap className="w-4 h-4 text-sky-600" />;
      case 'FACULTY':
        return <Briefcase className="w-4 h-4 text-indigo-600" />;
      case 'HOD':
        return <ShieldCheck className="w-4 h-4 text-amber-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Campus Users Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered students, academic faculty, and maintenance dispatch personnel.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs">
            {allUsers.length} Academic Users • {maintenanceTeams.length} Maintenance Officers
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by user name, ID, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>

        <div className="flex items-center gap-1">
          {['ALL', 'STUDENT', 'FACULTY', 'HOD'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                roleFilter === r
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {r === 'ALL' ? 'All Roles' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Academic Users Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:border-blue-300 transition space-y-3"
          >
            <div className="flex items-start gap-3">
              <img
                src={
                  user.avatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
                }
                alt={user.name}
                className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-xs"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-slate-900 truncate">
                    {user.name}
                  </span>
                  {getRoleIcon(user.role)}
                </div>
                <div className="font-mono text-xs text-blue-700 font-bold mt-0.5">
                  {user.id}
                </div>
                <div className="text-[11px] text-slate-500 truncate mt-0.5">
                  {user.department}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-2 truncate">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{user.phone}</span>
                </div>
              )}
              {user.hostelBlock && (
                <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                  <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    Hostel: {user.hostelBlock}, Room {user.roomNo}
                  </span>
                </div>
              )}
              {user.cabinNo && (
                <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                  <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{user.cabinNo}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Maintenance Personnel Section */}
      <div className="mt-8 space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Wrench className="w-4 h-4 text-blue-600" />
          <span>Campus Maintenance Lead Technicians</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {maintenanceTeams.map((team) => (
            <div
              key={team.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">{team.name}</div>
                  <div className="text-xs text-slate-500">{team.team}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{team.phone}</div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
                Available
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
