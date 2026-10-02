import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { User, Message, Complaint } from '../../types';
import {
  Send,
  MessageSquare,
  Sparkles,
  Building,
  GraduationCap,
  Briefcase,
  ShieldCheck,
  Check,
  CheckCheck,
  Clock,
  ExternalLink,
  Search,
  Filter,
  CheckCircle2,
} from 'lucide-react';

interface InternalMessagingViewProps {
  initialComplaintContext?: Complaint | null;
}

export const InternalMessagingView: React.FC<InternalMessagingViewProps> = ({
  initialComplaintContext,
}) => {
  const { currentUser, role } = useAuth();
  const {
    messages,
    sendMessage,
    markMessageRead,
    markThreadRead,
    allUsers,
    complaints,
    openComplaintDetails,
  } = useData();

  // Active filter tab for HOD
  const [hodFilterTab, setHodFilterTab] = useState<'ALL' | 'STUDENT' | 'FACULTY'>('ALL');
  const [searchContact, setSearchContact] = useState('');

  // Helper for alias matching (e.g. HOD1001 <-> HOD-ENG-001)
  const matchesUser = (currentId?: string, targetId?: string): boolean => {
    if (!currentId || !targetId) return false;
    if (currentId === targetId) return true;
    if (
      (currentId === 'HOD1001' || currentId === 'HOD-ENG-001') &&
      (targetId === 'HOD1001' || targetId === 'HOD-ENG-001')
    )
      return true;
    if (
      (currentId === 'STU1001' || currentId === 'STU-2024-101') &&
      (targetId === 'STU1001' || targetId === 'STU-2024-101')
    )
      return true;
    if (
      (currentId === 'FAC1001' || currentId === 'FAC-CS-204') &&
      (targetId === 'FAC1001' || targetId === 'FAC-CS-204')
    )
      return true;
    return false;
  };

  // For HOD, allow selecting between Students & Faculty
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>(() => {
    if (initialComplaintContext) {
      return initialComplaintContext.submitterId;
    }
    if (role === 'HOD') {
      return 'STU1001';
    }
    return 'HOD-ENG-001';
  });

  const [messageText, setMessageText] = useState('');
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | undefined>(
    initialComplaintContext?.id
  );
  const [isSending, setIsSending] = useState(false);

  // Sync when initialComplaintContext prop changes
  useEffect(() => {
    if (initialComplaintContext) {
      setSelectedRecipientId(initialComplaintContext.submitterId);
      setSelectedComplaintId(initialComplaintContext.id);
    }
  }, [initialComplaintContext]);

  // List of potential chat partners
  const students = useMemo(() => allUsers.filter((u) => u.role === 'STUDENT'), [allUsers]);
  const faculties = useMemo(() => allUsers.filter((u) => u.role === 'FACULTY'), [allUsers]);
  const hodUser = useMemo(
    () =>
      allUsers.find((u) => u.role === 'HOD') || {
        id: 'HOD-ENG-001',
        name: 'Dr. S. Radhakrishnan',
        role: 'HOD',
        department: 'Campus Operations & Engineering',
      },
    [allUsers]
  );

  // Determine active conversation partner
  const activeRecipient: User = useMemo(() => {
    if (role !== 'HOD') {
      return hodUser as User;
    }
    const found = allUsers.find((u) => matchesUser(u.id, selectedRecipientId));
    return (
      found ||
      students[0] || {
        id: 'STU1001',
        name: 'Student',
        role: 'STUDENT',
        department: 'Engineering',
      }
    );
  }, [role, hodUser, allUsers, selectedRecipientId, students]);

  // Filter messages belonging to the active conversation thread
  const threadMessages = useMemo(() => {
    if (!currentUser || !activeRecipient) return [];
    return messages.filter((m) => {
      const isCurrentUserSender =
        matchesUser(currentUser.id, m.senderId) && matchesUser(activeRecipient.id, m.recipientId);
      const isCurrentUserRecipient =
        matchesUser(activeRecipient.id, m.senderId) && matchesUser(currentUser.id, m.recipientId);
      return isCurrentUserSender || isCurrentUserRecipient;
    });
  }, [messages, currentUser, activeRecipient]);

  // Auto-mark incoming messages in active thread as read
  useEffect(() => {
    if (currentUser && activeRecipient) {
      const hasUnread = threadMessages.some(
        (m) => matchesUser(currentUser.id, m.recipientId) && !m.isRead
      );
      if (hasUnread) {
        markThreadRead(currentUser.id, activeRecipient.id);
      }
    }
  }, [threadMessages, currentUser, activeRecipient, markThreadRead]);

  // Handle Send Message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !currentUser || !activeRecipient) return;

    setIsSending(true);
    try {
      await sendMessage({
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderRole: currentUser.role,
        recipientId: activeRecipient.id,
        recipientName: activeRecipient.name,
        recipientRole: activeRecipient.role,
        complaintId: selectedComplaintId || undefined,
        content: messageText.trim(),
      });
      setMessageText('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  // Get ticket options that can be attached by current user or recipient
  const userTickets = useMemo(() => {
    if (role === 'STUDENT' && currentUser) {
      return complaints.filter((c) => matchesUser(currentUser.id, c.submitterId));
    }
    if (role === 'FACULTY' && currentUser) {
      return complaints.filter((c) => matchesUser(currentUser.id, c.submitterId));
    }
    if (role === 'HOD' && activeRecipient) {
      return complaints.filter((c) => matchesUser(activeRecipient.id, c.submitterId));
    }
    return [];
  }, [role, currentUser, activeRecipient, complaints]);

  // Quick reply templates
  const quickTemplates =
    role === 'HOD'
      ? [
          'Technician has been dispatched to inspect your reported room.',
          'Please confirm if the issue is now functioning properly.',
          'Due to parts order delay, ETA is pushed to tomorrow morning.',
          'The work has been verified and ticket marked resolved.',
        ]
      : role === 'FACULTY'
      ? [
          'Could we get an approximate ETA for technician arrival?',
          'Lecture has been temporarily shifted to adjacent seminar hall.',
          'Thank you Sir, the maintenance team successfully resolved the issue.',
          'Please expedite as student lab examination starts tomorrow.',
        ]
      : [
          'Could we get an approximate ETA for technician arrival?',
          'Class has been temporarily shifted to adjacent lecture hall.',
          'Thank you Sir, the maintenance team successfully resolved it!',
          'Issue is recurring; requesting another inspection please.',
        ];

  // For HOD: calculate unread messages per contact
  const getUnreadCountForContact = (contactId: string) => {
    if (!currentUser) return 0;
    return messages.filter(
      (m) =>
        matchesUser(currentUser.id, m.recipientId) &&
        matchesUser(contactId, m.senderId) &&
        !m.isRead
    ).length;
  };

  // Filtered contacts list for HOD
  const filteredContacts = useMemo(() => {
    let list: User[] = [];
    if (hodFilterTab === 'ALL') {
      list = [...students, ...faculties];
    } else if (hodFilterTab === 'STUDENT') {
      list = students;
    } else {
      list = faculties;
    }

    if (searchContact.trim()) {
      const q = searchContact.toLowerCase();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.id.toLowerCase().includes(q) ||
          u.department?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [hodFilterTab, searchContact, students, faculties]);

  // Total unread for HOD tabs
  const studentUnreadTotal = useMemo(() => {
    if (!currentUser || role !== 'HOD') return 0;
    return messages.filter(
      (m) =>
        matchesUser(currentUser.id, m.recipientId) &&
        m.senderRole === 'STUDENT' &&
        !m.isRead
    ).length;
  }, [messages, currentUser, role]);

  const facultyUnreadTotal = useMemo(() => {
    if (!currentUser || role !== 'HOD') return 0;
    return messages.filter(
      (m) =>
        matchesUser(currentUser.id, m.recipientId) &&
        m.senderRole === 'FACULTY' &&
        !m.isRead
    ).length;
  }, [messages, currentUser, role]);

  // Open related complaint modal
  const handleOpenTicketDetails = (ticketId: string) => {
    const target = complaints.find((c) => c.id === ticketId);
    if (target) {
      openComplaintDetails(target);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Internal Campus Communications</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
              Direct & Transparent
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {role === 'HOD'
              ? 'Official communication bridge with students and faculty regarding infrastructure complaints and reports.'
              : role === 'FACULTY'
              ? 'Direct, auditable communication channel between Faculty and HOD Administration regarding academic facilities.'
              : 'Direct, auditable communication channel between Students and HOD Administration.'}
          </p>
        </div>

        {/* Status chip */}
        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Real-time Communication Active</span>
        </div>
      </div>

      {/* Main Messaging Interface */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[620px]">
        {/* Left Column: Conversations / Contact Directory */}
        <div className="w-full md:w-80 lg:w-96 border-r border-slate-200 bg-slate-50/70 p-4 shrink-0 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {role === 'HOD' ? 'Campus Contacts' : 'Recipient Profile'}
              </span>
              {role === 'HOD' && (
                <span className="text-[11px] text-slate-400 font-medium">
                  {filteredContacts.length} available
                </span>
              )}
            </div>

            {role !== 'HOD' ? (
              // Student & Faculty view: HOD Profile & Details Card
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-white border border-blue-200 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-700 text-white flex items-center justify-center font-bold shadow-md shadow-blue-700/20">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">
                        {hodUser.name}
                      </div>
                      <div className="text-xs text-blue-700 font-semibold">
                        Head of Department (HOD)
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Campus Operations & Maintenance
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Office:</span>
                      <span className="font-semibold text-slate-700">Admin Tower, Room 102</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Support Hours:</span>
                      <span className="font-semibold text-slate-700">8:30 AM – 6:00 PM</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Response Speed:</span>
                      <span className="font-bold text-emerald-700">Under 15 mins</span>
                    </div>
                  </div>
                </div>

                {/* My Active Tickets Quick Reference */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 text-xs space-y-2">
                  <div className="font-bold text-slate-800 flex items-center justify-between">
                    <span>{role === 'FACULTY' ? 'My Faculty Reports' : 'My Complaints'}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                      {userTickets.length} registered
                    </span>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {userTickets.length === 0 ? (
                      <p className="text-[11px] text-slate-400">No active tickets filed yet.</p>
                    ) : (
                      userTickets.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => {
                            setSelectedComplaintId(t.id);
                            openComplaintDetails(t);
                          }}
                          className={`p-2 rounded-xl border text-[11px] transition cursor-pointer flex items-center justify-between ${
                            selectedComplaintId === t.id
                              ? 'bg-blue-50 border-blue-300 text-blue-800 font-semibold'
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <span className="font-mono font-bold block">{t.id}</span>
                            <span className="truncate block text-[10px] text-slate-500">
                              {t.category} • {t.location}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white border border-slate-200 shrink-0">
                            {t.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // HOD view: Tabbed and searchable contact directory
              <div className="space-y-3">
                {/* Tabs: All / Students / Faculty */}
                <div className="grid grid-cols-3 gap-1 p-1 bg-slate-200/70 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setHodFilterTab('ALL')}
                    className={`py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${
                      hodFilterTab === 'ALL'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>All</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setHodFilterTab('STUDENT')}
                    className={`py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${
                      hodFilterTab === 'STUDENT'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-blue-700'
                    }`}
                  >
                    <span>Students</span>
                    {studentUnreadTotal > 0 && (
                      <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] flex items-center justify-center font-bold">
                        {studentUnreadTotal}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setHodFilterTab('FACULTY')}
                    className={`py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${
                      hodFilterTab === 'FACULTY'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-indigo-700'
                    }`}
                  >
                    <span>Faculty</span>
                    {facultyUnreadTotal > 0 && (
                      <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] flex items-center justify-center font-bold">
                        {facultyUnreadTotal}
                      </span>
                    )}
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name, ID, department..."
                    value={searchContact}
                    onChange={(e) => setSearchContact(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>

                {/* Contacts List */}
                <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
                  {filteredContacts.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No contacts match search filter.
                    </div>
                  ) : (
                    filteredContacts.map((contact) => {
                      const isSelected = matchesUser(selectedRecipientId, contact.id);
                      const unread = getUnreadCountForContact(contact.id);
                      const isStudent = contact.role === 'STUDENT';

                      // Find last message in thread
                      const lastMsg = messages
                        .filter(
                          (m) =>
                            (matchesUser(contact.id, m.senderId) &&
                              matchesUser(currentUser?.id, m.recipientId)) ||
                            (matchesUser(currentUser?.id, m.senderId) &&
                              matchesUser(contact.id, m.recipientId))
                        )
                        .slice(-1)[0];

                      return (
                        <button
                          key={contact.id}
                          type="button"
                          onClick={() => {
                            setSelectedRecipientId(contact.id);
                            // Clear ticket or set default
                            const contactTickets = complaints.filter((c) =>
                              matchesUser(contact.id, c.submitterId)
                            );
                            if (contactTickets.length > 0) {
                              setSelectedComplaintId(contactTickets[0].id);
                            } else {
                              setSelectedComplaintId(undefined);
                            }
                          }}
                          className={`w-full p-2.5 rounded-2xl border text-left flex items-start gap-3 transition cursor-pointer relative ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                              : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : isStudent
                                ? 'bg-sky-100 text-sky-700'
                                : 'bg-purple-100 text-purple-700'
                            }`}
                          >
                            {isStudent ? (
                              <GraduationCap className="w-4 h-4" />
                            ) : (
                              <Briefcase className="w-4 h-4" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold truncate">
                                {contact.name}
                              </span>
                              {unread > 0 && (
                                <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[9px] font-bold rounded-full">
                                  {unread} new
                                </span>
                              )}
                            </div>
                            <div
                              className={`text-[10px] truncate ${
                                isSelected ? 'text-blue-100' : 'text-slate-400'
                              }`}
                            >
                              {contact.id} • {contact.department}
                            </div>
                            {lastMsg && (
                              <p
                                className={`text-[10px] truncate mt-1 ${
                                  isSelected ? 'text-blue-100 font-medium' : 'text-slate-500'
                                }`}
                              >
                                {lastMsg.content}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 p-3 rounded-2xl bg-white border border-slate-200 text-[11px] text-slate-500">
            <div className="font-semibold text-slate-700 mb-0.5">Administrative Audit</div>
            All internal communications are permanently synchronized with campus ticketing logs.
          </div>
        </div>

        {/* Right Column: Active Thread, History & Input */}
        <div className="flex-1 flex flex-col justify-between bg-white">
          {/* Active Conversation Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/60 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                {activeRecipient?.role === 'HOD' ? (
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                ) : activeRecipient?.role === 'FACULTY' ? (
                  <Briefcase className="w-5 h-5 text-indigo-400" />
                ) : (
                  <GraduationCap className="w-5 h-5 text-sky-400" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 truncate">
                    {activeRecipient?.name}
                  </h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono ${
                      activeRecipient?.role === 'HOD'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : activeRecipient?.role === 'FACULTY'
                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                        : 'bg-sky-100 text-sky-800 border border-sky-200'
                    }`}
                  >
                    {activeRecipient?.role}
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  {activeRecipient?.id} • {activeRecipient?.department}
                </div>
              </div>
            </div>

            {/* Ticket attachment control & Mark Read action */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Ticket selector dropdown */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 shadow-2xs">
                <label
                  htmlFor="msgTicketRefSelect"
                  className="text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                >
                  {role === 'FACULTY' ? 'Report Ref:' : 'Ticket Ref:'}
                </label>
                <select
                  id="msgTicketRefSelect"
                  value={selectedComplaintId || ''}
                  onChange={(e) => setSelectedComplaintId(e.target.value || undefined)}
                  className="text-xs font-mono font-bold text-blue-700 bg-transparent focus:outline-none cursor-pointer max-w-[170px]"
                >
                  <option value="">None (General Inquiry)</option>
                  {userTickets.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.id} ({t.category})
                    </option>
                  ))}
                </select>
                {selectedComplaintId && (
                  <button
                    type="button"
                    onClick={() => handleOpenTicketDetails(selectedComplaintId)}
                    className="p-1 rounded-md text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition cursor-pointer"
                    title={`Open details for ${selectedComplaintId}`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* HOD / Student Mark Thread As Read Button if thread has unread messages */}
              {threadMessages.some(
                (m) => matchesUser(currentUser?.id, m.recipientId) && !m.isRead
              ) && (
                <button
                  type="button"
                  onClick={() => {
                    if (currentUser && activeRecipient) {
                      markThreadRead(currentUser.id, activeRecipient.id);
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  title="Mark all messages in this thread as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark Thread Read</span>
                </button>
              )}
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="p-6 overflow-y-auto space-y-4 max-h-[460px] flex-1 bg-slate-50/30">
            {threadMessages.length === 0 ? (
              <div className="p-16 text-center text-xs text-slate-400">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-700">No message history yet</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Type a message below to start official communication regarding facility tickets and maintenance schedules.
                </p>
              </div>
            ) : (
              threadMessages.map((msg) => {
                const isMe = currentUser && matchesUser(currentUser.id, msg.senderId);
                const isIncomingUnread = !isMe && !msg.isRead;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    {/* Header: Sender & Receiver & Date/Time */}
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-1 px-1">
                      <span className="font-bold text-slate-700">{msg.senderName}</span>
                      <span className="font-mono text-slate-400">({msg.senderRole})</span>
                      <span>→</span>
                      <span className="text-slate-500">{msg.recipientName}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(msg.timestamp).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Chat Bubble */}
                    <div
                      className={`max-w-lg p-4 rounded-2xl text-xs leading-relaxed shadow-xs ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-br-xs'
                          : 'bg-white text-slate-800 rounded-bl-xs border border-slate-200 shadow-2xs'
                      }`}
                    >
                      {/* Attached Ticket Reference Header */}
                      {msg.complaintId && (
                        <div
                          className={`mb-2 pb-2 border-b flex items-center justify-between text-[11px] font-mono font-bold ${
                            isMe ? 'border-blue-400/40 text-blue-100' : 'border-slate-100 text-blue-700'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span>Re: {msg.complaintId}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenTicketDetails(msg.complaintId!)}
                            className={`flex items-center gap-1 text-[10px] underline font-sans font-semibold cursor-pointer ${
                              isMe ? 'text-blue-100 hover:text-white' : 'text-blue-600 hover:text-blue-800'
                            }`}
                          >
                            <span>Open Details</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {/* Content */}
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>

                    {/* Read / Unread Status Footer */}
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1 px-1">
                      {isMe ? (
                        <span className="flex items-center gap-1 font-semibold">
                          {msg.isRead ? (
                            <>
                              <CheckCheck className="w-3.5 h-3.5 text-blue-600 inline" />
                              <span className="text-blue-600">Read</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5 text-slate-400 inline" />
                              <span>Delivered</span>
                            </>
                          )}
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.2 rounded font-bold ${
                              msg.isRead
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {msg.isRead ? 'Read' : 'Unread'}
                          </span>

                          {/* Individual Mark as Read button if unread */}
                          {isIncomingUnread && (
                            <button
                              type="button"
                              onClick={() => markMessageRead(msg.id)}
                              className="text-blue-600 hover:underline font-semibold cursor-pointer"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Presets Bar */}
          <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center gap-2 overflow-x-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Presets:
            </span>
            {quickTemplates.map((tpl, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setMessageText(tpl)}
                className="px-3 py-1 rounded-full bg-white hover:bg-blue-50 border border-slate-200 text-[11px] text-slate-600 hover:text-blue-700 whitespace-nowrap transition cursor-pointer shadow-2xs font-medium"
              >
                {tpl}
              </button>
            ))}
          </div>

          {/* Input & Send Form */}
          <form
            onSubmit={handleSend}
            className="p-4 border-t border-slate-200 bg-white flex items-center gap-3"
          >
            <div className="flex-1 relative">
              <input
                type="text"
                required
                placeholder={
                  selectedComplaintId
                    ? `Reply to ${activeRecipient?.name} regarding ${selectedComplaintId}...`
                    : `Send official message to ${activeRecipient?.name}...`
                }
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={isSending || !messageText.trim()}
              className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-md shadow-blue-600/20 cursor-pointer disabled:opacity-50 flex items-center gap-2 shrink-0"
            >
              {isSending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
