import React, { useState, useEffect } from 'react';
import { UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import {
  GraduationCap,
  Briefcase,
  ShieldCheck,
  Building2,
  Lock,
  ArrowRight,
  Sparkles,
  PhoneCall,
  Clock,
  Activity,
  CheckCircle2,
  Download,
} from 'lucide-react';

export const LandingLogin: React.FC = () => {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>('STUDENT');
  const [idInput, setIdInput] = useState('STU1001');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const [demoAccounts, setDemoAccounts] = useState<Record<string, { id: string; password: string }>>({
    STUDENT: { id: 'STU1001', password: '' },
    FACULTY: { id: 'FAC1001', password: '' },
    HOD: { id: 'HOD1001', password: '' },
  });

  // Sync configured demo credentials from server
  useEffect(() => {
    let isMounted = true;
    api.getDemoCredentials()
      .then((creds) => {
        if (isMounted && creds) {
          setDemoAccounts(creds);
          if (creds.STUDENT?.password) {
            setPasswordInput(creds.STUDENT.password);
          }
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMsg('');
    const cred = demoAccounts[role];
    if (cred) {
      setIdInput(cred.id);
      setPasswordInput(cred.password || '');
    } else {
      if (role === 'STUDENT') {
        setIdInput('STU1001');
      } else if (role === 'FACULTY') {
        setIdInput('FAC1001');
      } else {
        setIdInput('HOD1001');
      }
      setPasswordInput('');
    }
  };

  const handleDemoAccountClick = (role: UserRole) => {
    handleRoleSelect(role);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idInput.trim()) {
      setErrorMsg(`Please enter your ${selectedRole === 'STUDENT' ? 'Student ID' : selectedRole === 'FACULTY' ? 'Faculty ID' : 'HOD ID'}.`);
      return;
    }
    if (!passwordInput.trim()) {
      setErrorMsg('Please enter your password.');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await login(idInput.trim(), passwordInput, selectedRole);
      if (!res.success) {
        setErrorMsg(res.error || 'Invalid credentials. Please verify your ID and password.');
      }
    } catch {
      setErrorMsg('An unexpected error occurred during authentication. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  const getRolePlaceholder = () => {
    switch (selectedRole) {
      case 'STUDENT':
        return 'Enter Student ID (e.g. STU1001)';
      case 'FACULTY':
        return 'Enter Faculty ID (e.g. FAC1001)';
      case 'HOD':
        return 'Enter HOD ID (e.g. HOD1001)';
    }
  };

  const getRoleTitle = () => {
    switch (selectedRole) {
      case 'STUDENT':
        return 'Student ID';
      case 'FACULTY':
        return 'Faculty ID';
      case 'HOD':
        return 'HOD ID';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 text-slate-100 flex flex-col justify-between selection:bg-blue-500 selection:text-white">
      {/* Top Navigation Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center shadow-lg shadow-blue-500/25 ring-1 ring-white/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white font-mono">
                  CAMPUS<span className="text-sky-400">CARE</span>
                </span>
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Portal v2.6
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Problem Reporting & Maintenance System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <a
              href="/campus-care.zip"
              download="campus-care.zip"
              title="Download full project source code ZIP for Vercel deployment"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-200 hover:text-white font-medium transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>Download Project ZIP</span>
            </a>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300">
              <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
              <span>Campus Control Room: <strong className="text-white">+91 (0) 44-2250-9900</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px]">Systems Operational</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-14 flex flex-col justify-center">
        {/* Brand Tagline & Intro */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-semibold mb-4 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Integrated College Infrastructure Network</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight sm:leading-tight">
            One Campus. One Platform. <br />
            <span className="bg-gradient-to-r from-sky-400 via-blue-300 to-indigo-200 bg-clip-text text-transparent">
              Better Solutions.
            </span>
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Report facility concerns, lab breakdowns, and classroom infrastructure issues with transparency.
            Empowering students, faculty, and administration to build an exceptional campus environment.
          </p>
        </div>

        {/* 3 Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto w-full mb-8">
          {/* Student Role Card */}
          <button
            type="button"
            onClick={() => handleRoleSelect('STUDENT')}
            className={`group text-left p-6 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col justify-between ${
              selectedRole === 'STUDENT'
                ? 'bg-gradient-to-b from-blue-900/60 to-slate-900 border-sky-400 shadow-xl shadow-blue-500/15 ring-2 ring-sky-400/30 -translate-y-1'
                : 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-800 hover:border-slate-700'
            }`}
          >
            {selectedRole === 'STUDENT' && (
              <div className="absolute top-3 right-3 text-xs bg-sky-500 text-slate-950 font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5" /> Selected
              </div>
            )}
            <div>
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                  selectedRole === 'STUDENT'
                    ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/30'
                    : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700'
                }`}
              >
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1.5 flex items-center gap-2">
                Student Login
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Report classroom, laboratory, hostel, Wi-Fi or sanitation faults directly to college administration.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-sky-400">
              <span>Continue as Student</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Faculty Role Card */}
          <button
            type="button"
            onClick={() => handleRoleSelect('FACULTY')}
            className={`group text-left p-6 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col justify-between ${
              selectedRole === 'FACULTY'
                ? 'bg-gradient-to-b from-blue-900/60 to-slate-900 border-sky-400 shadow-xl shadow-blue-500/15 ring-2 ring-sky-400/30 -translate-y-1'
                : 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-800 hover:border-slate-700'
            }`}
          >
            {selectedRole === 'FACULTY' && (
              <div className="absolute top-3 right-3 text-xs bg-sky-500 text-slate-950 font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5" /> Selected
              </div>
            )}
            <div>
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                  selectedRole === 'FACULTY'
                    ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/30'
                    : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700'
                }`}
              >
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1.5 flex items-center gap-2">
                Faculty Login
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Escalate lab equipment breakdowns, seminar hall AV failures, and academic facility needs to HOD.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-sky-400">
              <span>Continue as Faculty</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* HOD Role Card */}
          <button
            type="button"
            onClick={() => handleRoleSelect('HOD')}
            className={`group text-left p-6 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col justify-between ${
              selectedRole === 'HOD'
                ? 'bg-gradient-to-b from-blue-900/60 to-slate-900 border-sky-400 shadow-xl shadow-blue-500/15 ring-2 ring-sky-400/30 -translate-y-1'
                : 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-800 hover:border-slate-700'
            }`}
          >
            {selectedRole === 'HOD' && (
              <div className="absolute top-3 right-3 text-xs bg-sky-500 text-slate-950 font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5" /> Selected
              </div>
            )}
            <div>
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                  selectedRole === 'HOD'
                    ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/30'
                    : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700'
                }`}
              >
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1.5 flex items-center gap-2">
                HOD Login
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Campus command center: Oversee all reports, assign technicians, monitor velocity, and resolve issues.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-sky-400">
              <span>Continue as HOD</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>

        {/* Selected Role Authentication Form Card */}
        <div className="max-w-xl mx-auto w-full bg-white text-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/40 border border-slate-100">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                {selectedRole} Portal Access
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 mt-2">
                Sign in to Campus Care
              </h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Active Selection</span>
              <span className="text-xs font-semibold text-slate-700 capitalize">
                {selectedRole.toLowerCase()} Account
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                {getRoleTitle()}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder={getRolePlaceholder()}
                  value={idInput}
                  onChange={(e) => setIdInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-xs text-blue-600 hover:text-blue-700 hover:underline font-semibold cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Enter {selectedRole} Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Pre-fill helper */}
          <div className="mt-6 pt-5 border-t border-slate-100 bg-slate-50/70 -mx-6 sm:-mx-8 -mb-6 sm:-mb-8 p-4 sm:p-5 rounded-b-3xl">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Demo Accounts</span>
              </div>
              <span className="text-[11px] text-slate-400">Click to auto-fill ID & demo password</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoAccountClick('STUDENT')}
                className={`px-2 py-2 rounded-xl text-xs font-semibold text-center border transition cursor-pointer flex flex-col items-center justify-center ${
                  selectedRole === 'STUDENT'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400'
                }`}
              >
                <span className="font-bold">Student</span>
                <span className={`text-[10px] font-mono ${selectedRole === 'STUDENT' ? 'text-blue-100' : 'text-blue-600 font-bold'}`}>
                  STU1001
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoAccountClick('FACULTY')}
                className={`px-2 py-2 rounded-xl text-xs font-semibold text-center border transition cursor-pointer flex flex-col items-center justify-center ${
                  selectedRole === 'FACULTY'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400'
                }`}
              >
                <span className="font-bold">Faculty</span>
                <span className={`text-[10px] font-mono ${selectedRole === 'FACULTY' ? 'text-blue-100' : 'text-indigo-600 font-bold'}`}>
                  FAC1001
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoAccountClick('HOD')}
                className={`px-2 py-2 rounded-xl text-xs font-semibold text-center border transition cursor-pointer flex flex-col items-center justify-center ${
                  selectedRole === 'HOD'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400'
                }`}
              >
                <span className="font-bold">HOD</span>
                <span className={`text-[10px] font-mono ${selectedRole === 'HOD' ? 'text-blue-100' : 'text-amber-600 font-bold'}`}>
                  HOD1001
                </span>
              </button>
            </div>
            <div className="mt-3 text-[11px] text-slate-500 text-center flex items-center justify-center gap-1.5">
              <Lock className="w-3 h-3 text-slate-400" />
              <span>Passwords are securely hashed with bcrypt and verified via server-side session.</span>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto w-full">
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 backdrop-blur-xs flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-sky-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">4.8h Avg Resolution</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Quick technician dispatch across academic blocks</p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 backdrop-blur-xs flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Live Tracking</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Step-by-step timeline from Pending to Resolved</p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 backdrop-blur-xs flex items-start gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">HOD Oversight</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Direct accountability and administrative remarks</p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 backdrop-blur-xs flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Dedicated Wings</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Electrical, Water, IT, Cleaning & Civil crews</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 text-slate-400 text-xs py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-200">CAMPUS CARE</span>
            <span>—</span>
            <span>One Campus. One Platform. Better Solutions.</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Campus Maintenance Directorate</span>
            <span>•</span>
            <span>Operational Hours: 24/7 Hotline</span>
          </div>
        </div>
      </footer>

      {/* Forgot Password Recovery Modal */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        initialId={idInput}
      />
    </div>
  );
};
