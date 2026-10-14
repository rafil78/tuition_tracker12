import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Paperclip, CheckCheck, Clock, Search, MessageSquare, 
  FileText, ExternalLink, Bot, UserCheck, UserX, Download, ChevronLeft,
  Users, Sparkles, BookOpen, ShieldCheck, Info, X, Video
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { subscribeToRealtimeMessages, pushMessageToRealtimeDb } from '../firebase';

export default function ChatView({ initialBatchId = null }) {
  const { currentUser, isTeacher, users, lang } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [batchGroups, setBatchGroups] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [allUserMessages, setAllUserMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [teacherActive, setTeacherActive] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  
  const messagesEndRef = useRef(null);
  const selectedContactRef = useRef(null);

  selectedContactRef.current = selectedContact;

  const eduBotUser = {
    id: 'bot-edutrack',
    name: lang === 'bn' ? 'স্টাডি অ্যাসিস্ট্যান্ট (EduBot)' : 'Study Assistant',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=250',
    title: lang === 'bn' ? 'অটোমেটিক ডাউট সলভার' : 'Automated Help',
    role: 'bot',
    isBot: true,
    isOnline: true
  };

  // 1. Fetch batch groups the current user belongs to
  const loadBatchGroups = async () => {
    if (!currentUser) return;
    try {
      const groups = await api.getBatchGroups(currentUser.id);
      if (Array.isArray(groups)) {
        setBatchGroups(groups);

        // If initialBatchId provided, auto-select that batch group
        if (initialBatchId) {
          const target = groups.find(g => g.classId === initialBatchId || g.id === initialBatchId || g.id === `batch-${initialBatchId}`);
          if (target) {
            setSelectedContact(target);
            setMobileShowChat(true);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load batch groups:', err);
    }
  };

  // 2. Base 1-on-1 chat partners
  useEffect(() => {
    if (!currentUser) return;
    
    loadBatchGroups();

    const otherUsers = (users || []).filter(u => u.id !== currentUser.id && u.id !== 'bot-edutrack');
    const partnerList = [eduBotUser, ...otherUsers];
    setContacts(partnerList);

    // Auto-select initial contact if none chosen yet
    setSelectedContact(prev => {
      if (prev) return prev;
      if (initialBatchId) return null; // wait for batchGroups
      return partnerList[0] || eduBotUser;
    });
  }, [currentUser?.id, users, lang, initialBatchId]);

  // 3. Fetch all messages for current user (1-on-1 + Batch Groups)
  const loadAllUserMessages = async () => {
    if (!currentUser) return;
    try {
      const list = await api.getMessages(currentUser.id);
      if (Array.isArray(list)) {
        setAllUserMessages(list);
        
        // Count unread direct messages
        const totalUnread = list.filter(m => m.receiverId === currentUser.id && !m.isRead).length;
        window.dispatchEvent(new CustomEvent('edutrack_unread_messages_count', { detail: totalUnread }));

        // Update active thread
        if (selectedContactRef.current) {
          const active = selectedContactRef.current;
          let currentThread = [];

          if (active.isGroup || active.classId) {
            // Batch group thread
            currentThread = list.filter(m => 
              m.classId === active.classId || 
              m.receiverId === active.id || 
              m.receiverId === `batch-${active.classId}` ||
              m.groupId === active.id
            );
          } else {
            // 1-on-1 thread
            currentThread = list.filter(m => 
              !m.isGroup &&
              ((m.senderId === currentUser.id && m.receiverId === active.id) ||
               (m.senderId === active.id && m.receiverId === currentUser.id))
            );
          }

          setMessages(currentThread);

          // Mark unread as read
          const unreadMsgs = currentThread.filter(m => m.receiverId === currentUser.id && !m.isRead);
          for (const uMsg of unreadMsgs) {
            api.markMessageRead(uMsg.id).catch(() => {});
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load user messages:', err.message);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    loadAllUserMessages();
    const interval = setInterval(loadAllUserMessages, 1500);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  // Real-time Firebase Realtime Database listener
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = subscribeToRealtimeMessages((liveMsgs) => {
      if (Array.isArray(liveMsgs) && liveMsgs.length > 0) {
        loadAllUserMessages();
      }
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [currentUser?.id]);

  // On contact or batch selection change
  useEffect(() => {
    if (!selectedContact || !currentUser) return;
    setLoadingMessages(true);
    
    if (selectedContact.isGroup || selectedContact.classId) {
      api.getMessages(null, null, selectedContact.classId).then(list => {
        setMessages(Array.isArray(list) ? list : []);
      }).catch(err => {
        console.error('Fetch batch group messages error:', err);
      }).finally(() => {
        setLoadingMessages(false);
      });
    } else {
      api.getMessages(currentUser.id, selectedContact.id).then(list => {
        setMessages(Array.isArray(list) ? list : []);
        list.filter(m => m.receiverId === currentUser.id && !m.isRead).forEach(m => {
          api.markMessageRead(m.id).catch(() => {});
        });
      }).catch(err => {
        console.error('Fetch thread error:', err);
      }).finally(() => {
        setLoadingMessages(false);
      });
    }
  }, [selectedContact?.id, currentUser?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend = inputText, attachmentName = null, attachmentUrl = null) => {
    const text = textToSend.trim();
    if (!text || !selectedContact || !currentUser) return;

    const isGroup = !!selectedContact.isGroup || !!selectedContact.classId;
    const isSendingToBot = !isGroup && selectedContact.id === 'bot-edutrack';

    const payload = {
      senderId: currentUser.id,
      receiverId: isGroup ? selectedContact.id : selectedContact.id,
      classId: isGroup ? selectedContact.classId : null,
      isGroup,
      text,
      attachmentName,
      attachmentUrl,
      triggerBot: isSendingToBot,
      isDoubt: isSendingToBot
    };

    try {
      const newMsg = await api.sendMessage(payload);
      pushMessageToRealtimeDb(newMsg);

      setMessages(prev => [...prev, newMsg]);
      setAllUserMessages(prev => [...prev, newMsg]);
      setInputText('');

      if (isSendingToBot) {
        setTimeout(loadAllUserMessages, 600);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const formatMsgTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Contacts with metadata
  const contactsWithMeta = contacts.map(contact => {
    const threadMsgs = allUserMessages.filter(m => 
      !m.isGroup &&
      ((m.senderId === currentUser?.id && m.receiverId === contact.id) ||
       (m.senderId === contact.id && m.receiverId === currentUser?.id))
    );
    const lastMsg = threadMsgs.length > 0 ? threadMsgs[threadMsgs.length - 1] : null;
    const unreadCount = threadMsgs.filter(m => m.receiverId === currentUser?.id && !m.isRead).length;
    const lastTimestamp = lastMsg ? new Date(lastMsg.createdAt).getTime() : 0;

    return {
      ...contact,
      lastMsg,
      unreadCount,
      lastTimestamp,
      lastText: lastMsg ? lastMsg.text : null,
      lastTime: lastMsg ? formatMsgTime(lastMsg.createdAt) : null
    };
  });

  // Batch groups with metadata
  const batchGroupsWithMeta = batchGroups.map(group => {
    const groupMsgs = allUserMessages.filter(m => 
      m.classId === group.classId || 
      m.receiverId === group.id || 
      m.receiverId === `batch-${group.classId}` ||
      m.groupId === group.id
    );
    const lastMsg = groupMsgs.length > 0 ? groupMsgs[groupMsgs.length - 1] : group.lastMsg;
    const lastTimestamp = lastMsg ? new Date(lastMsg.createdAt).getTime() : 0;

    return {
      ...group,
      lastMsg,
      lastTimestamp,
      lastText: lastMsg ? lastMsg.text : (lang === 'bn' ? 'ব্যাচ গ্রুপে স্বাগতম' : 'Welcome to batch group'),
      lastTime: lastMsg ? formatMsgTime(lastMsg.createdAt) : null
    };
  });

  const filteredBatchGroups = batchGroupsWithMeta.filter(g => 
    g.title?.toLowerCase().includes(searchFilter.toLowerCase()) ||
    g.subject?.toLowerCase().includes(searchFilter.toLowerCase()) ||
    g.teacher?.name?.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const filteredContacts = contactsWithMeta.filter(c => 
    c.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (c.title && c.title.toLowerCase().includes(searchFilter.toLowerCase())) ||
    (c.lastText && c.lastText.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  const isCurrentGroup = !!selectedContact?.isGroup || !!selectedContact?.classId;
  const isCurrentContactBot = selectedContact?.id === 'bot-edutrack';
  const isTeacherAway = currentUser?.role === 'student' && selectedContact?.role === 'teacher' && !teacherActive;

  const getRoleBadge = (role) => {
    if (role === 'admin') return { text: lang === 'bn' ? 'অ্যাডমিন' : 'Admin', cls: 'bg-purple-100 text-purple-800' };
    if (role === 'teacher') return { text: lang === 'bn' ? 'শিক্ষক' : 'Teacher', cls: 'bg-blue-100 text-blue-800' };
    if (role === 'parent') return { text: lang === 'bn' ? 'অভিভাবক' : 'Parent', cls: 'bg-amber-100 text-amber-800' };
    if (role === 'bot') return { text: 'Bot', cls: 'bg-slate-100 text-slate-800' };
    return { text: lang === 'bn' ? 'শিক্ষার্থী' : 'Student', cls: 'bg-emerald-100 text-emerald-800' };
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col md:flex-row h-[740px] shadow-sm">
      
      {/* LEFT SIDEBAR: Batch Groups & Direct Contacts */}
      <div className={`w-full md:w-80 border-r border-slate-200 flex flex-col bg-slate-50/70 shrink-0 ${
        mobileShowChat ? 'hidden md:flex' : 'flex'
      }`}>
        
        {/* Search header */}
        <div className="p-3.5 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              <span>{lang === 'bn' ? 'গ্রুপ ও মেসেজ ইনবক্স' : 'Messages & Groups'}</span>
            </h3>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
              {batchGroups.length + contacts.length}
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              placeholder={lang === 'bn' ? 'ব্যাচ বা কন্টাক্ট খুঁজুন...' : 'Search groups or contacts...'}
              className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          
          {/* SECTION 1: BATCH GROUP CHATS */}
          <div className="p-2 space-y-1">
            <div className="px-2 py-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1 text-indigo-700">
                <Users className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'আমার ব্যাচ গ্রুপসমূহ' : 'Batch Groups'}</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">({filteredBatchGroups.length})</span>
            </div>

            {filteredBatchGroups.length === 0 ? (
              <div className="px-3 py-3 text-center bg-white rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                <p className="text-[11px]">
                  {lang === 'bn' ? 'কোনো ব্যাচ গ্রুপে যুক্ত নেই' : 'No active batch groups'}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {lang === 'bn' ? 'ব্যাচে এনরোল করলে এখানে গ্রুপ দেখতে পাবেন।' : 'Enroll in a batch to join group chat.'}
                </p>
              </div>
            ) : (
              filteredBatchGroups.map(group => {
                const isSelected = selectedContact?.id === group.id;

                return (
                  <button
                    key={group.id}
                    onClick={() => {
                      setSelectedContact(group);
                      setMobileShowChat(true);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl transition flex items-center gap-2.5 ${
                      isSelected 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                        : 'hover:bg-indigo-50/60 bg-white border border-slate-200/80 shadow-xs'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${
                        isSelected 
                          ? 'bg-white/20 text-white' 
                          : 'bg-indigo-100 text-indigo-700'
                      }`}>
                        <Users className="w-5 h-5" />
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                          {group.title}
                        </p>
                        <span className={`text-[10px] font-mono shrink-0 ml-1 ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                          {group.lastTime || ''}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-[11px] truncate ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                          {group.lastText}
                        </p>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          👥 {group.memberCount}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* SECTION 2: DIRECT 1-ON-1 CHATS */}
          <div className="p-2 space-y-1">
            <div className="px-2 py-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1 text-slate-600">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'ব্যক্তিগত চ্যাট (Direct)' : 'Direct Messages'}</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">({filteredContacts.length})</span>
            </div>

            {filteredContacts.map(contact => {
              const isSelected = selectedContact?.id === contact.id;
              const hasUnread = contact.unreadCount > 0;
              const badge = getRoleBadge(contact.role);

              return (
                <button
                  key={contact.id}
                  onClick={() => {
                    setSelectedContact(contact);
                    setMobileShowChat(true);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl transition flex items-center gap-2.5 ${
                    isSelected 
                      ? 'bg-slate-900 text-white shadow-md' 
                      : hasUnread
                        ? 'bg-blue-50/80 hover:bg-blue-100/70 border border-blue-200'
                        : 'hover:bg-slate-100/70'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={contact.avatar}
                      alt={contact.name}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200"
                    />
                    <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-white rounded-full ${
                      contact.role === 'teacher' && !teacherActive ? 'bg-amber-400' : 'bg-emerald-500'
                    }`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className={`text-xs truncate ${hasUnread ? 'font-bold text-slate-900' : isSelected ? 'font-semibold text-white' : 'font-semibold text-slate-800'}`}>
                          {contact.name}
                        </p>
                        <span className={`px-1 py-0.2 rounded text-[9px] font-semibold shrink-0 ${
                          isSelected ? 'bg-white/20 text-white' : badge.cls
                        }`}>
                          {badge.text}
                        </span>
                      </div>
                      <span className={`text-[10px] font-mono shrink-0 ml-1 ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                        {contact.lastTime || ''}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-[11px] truncate ${isSelected ? 'text-slate-300' : hasUnread ? 'font-semibold text-blue-900' : 'text-slate-500'}`}>
                        {contact.lastText ? (
                          <span>{contact.lastMsg?.senderId === currentUser?.id ? (lang === 'bn' ? 'আমি: ' : 'You: ') : ''}{contact.lastText}</span>
                        ) : (
                          contact.title || badge.text
                        )}
                      </p>

                      {hasUnread && (
                        <span className="px-1.5 py-0.2 bg-red-600 text-white rounded-full text-[10px] font-bold shrink-0 animate-pulse">
                          {contact.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

        </div>
      </div>

      {/* RIGHT: Active Chat Room */}
      <div className={`flex-1 flex flex-col bg-white overflow-hidden ${
        mobileShowChat ? 'flex' : 'hidden md:flex'
      }`}>
        {selectedContact ? (
          <>
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-white shrink-0 shadow-xs">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <button
                  onClick={() => setMobileShowChat(false)}
                  className="md:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition"
                  title={lang === 'bn' ? 'ফিরে যান' : 'Back'}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {isCurrentGroup ? (
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm font-black">
                    <Users className="w-5 h-5" />
                  </div>
                ) : (
                  <img
                    src={selectedContact.avatar}
                    alt={selectedContact.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                  />
                )}

                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>{selectedContact.title || selectedContact.name}</span>
                    
                    {isCurrentGroup ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                        {lang === 'bn' ? 'ব্যাচ গ্রুপ' : 'Batch Group'}
                      </span>
                    ) : (
                      <span className={`px-1.5 py-0.2 text-[10px] font-semibold rounded ${getRoleBadge(selectedContact.role).cls}`}>
                        {getRoleBadge(selectedContact.role).text}
                      </span>
                    )}

                    {!isCurrentContactBot && !isCurrentGroup && (
                      <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {lang === 'bn' ? 'অনলাইন' : 'Active'}
                      </span>
                    )}
                  </h4>

                  <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                    {isCurrentGroup ? (
                      <>
                        <span className="font-semibold text-indigo-600">{selectedContact.subject}</span>
                        <span>•</span>
                        <span>শিক্ষক: {selectedContact.teacher?.name || 'ড. রশিদুল করিম'}</span>
                      </>
                    ) : (
                      selectedContact.title || selectedContact.email
                    )}
                  </p>
                </div>
              </div>

              {/* Right Action buttons */}
              <div className="flex items-center gap-2">
                {isCurrentGroup && (
                  <button
                    onClick={() => setShowMembersModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition border border-indigo-200/60"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>{selectedContact.memberCount || 4} {lang === 'bn' ? 'জন সদস্য' : 'Members'}</span>
                  </button>
                )}

                {isCurrentGroup && selectedContact.zoomLink && (
                  <button
                    onClick={() => window.open(selectedContact.zoomLink, '_blank')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Zoom</span>
                  </button>
                )}

                {isTeacher && !isCurrentGroup && (
                  <button
                    onClick={() => setTeacherActive(!teacherActive)}
                    className="px-2.5 py-1 rounded-xl border border-slate-200 text-[11px] font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    {teacherActive ? (lang === 'bn' ? 'অনলাইন' : 'Online') : (lang === 'bn' ? 'অফলাইন' : 'Away')}
                  </button>
                )}
              </div>
            </div>

            {/* Teacher Offline Notice in 1-on-1 */}
            {isTeacherAway && !isCurrentGroup && (
              <div className="bg-amber-50/80 border-b border-amber-200/60 px-4 py-2 text-[11px] text-amber-900 shrink-0 flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{lang === 'bn' ? 'শিক্ষক বর্তমানে অফলাইনে আছেন। বার্তা পাঠিয়ে রাখতে পারেন।' : 'Teacher is currently away. You can leave a message.'}</span>
              </div>
            )}

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
              {loadingMessages ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  <span>{lang === 'bn' ? 'মেসেজ লোড হচ্ছে...' : 'Loading messages...'}</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 text-xs">
                  <div className="w-12 h-12 bg-white rounded-2xl border border-slate-200 flex items-center justify-center shadow-xs">
                    <MessageSquare className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="font-bold text-slate-700">
                    {isCurrentGroup ? (lang === 'bn' ? 'ব্যাচ গ্রুপে এখনো কোনো মেসেজ নেই' : 'No messages in this batch group yet') : (lang === 'bn' ? 'কোনো বার্তা নেই' : 'No messages yet')}
                  </p>
                  <p className="text-[11px] text-slate-400 text-center max-w-xs">
                    {isCurrentGroup 
                      ? (lang === 'bn' ? 'ব্যাচ ক্লাসের পড়াশোনা ও নোট নিয়ে শিক্ষক ও সহপাঠীদের সাথে আলোচনা শুরু করুন!' : 'Say hello to your tutor and classmates!')
                      : (lang === 'bn' ? 'নিচে লিখে বার্তা পাঠান' : 'Type below to start conversation')
                    }
                  </p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isMine = msg.senderId === currentUser.id;
                  const isBotMsg = msg.senderId === 'bot-edutrack' || msg.isBot;
                  const isSystemNotice = msg.isSystemNotice || isBotMsg;

                  // Find sender info
                  const sender = msg.sender || (users || []).find(u => u.id === msg.senderId) || (msg.senderId === currentUser.id ? currentUser : null);
                  const isSenderTeacher = sender?.role === 'teacher';
                  const senderName = sender?.name || (isMine ? currentUser.name : 'সদস্য');
                  const senderAvatar = sender?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250';

                  // System / Announcement message display
                  if (isSystemNotice) {
                    return (
                      <div key={msg.id || index} className="flex justify-center my-2 animate-fadeIn">
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-900 rounded-2xl px-4 py-2 text-xs flex items-center gap-2 max-w-lg shadow-xs">
                          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                          <span className="leading-relaxed font-medium">{msg.text}</span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id || index}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} space-y-1`}
                    >
                      {/* Sender identity in Group Chat */}
                      {isCurrentGroup && !isMine && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 px-1">
                          <span className="font-bold text-slate-800">{senderName}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            isSenderTeacher ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isSenderTeacher ? (lang === 'bn' ? '👨‍🏫 শিক্ষক' : 'Teacher') : (lang === 'bn' ? '🎓 শিক্ষার্থী' : 'Student')}
                          </span>
                        </div>
                      )}

                      <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-[75%] ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* Avatar */}
                        {!isMine && (
                          <img 
                            src={senderAvatar} 
                            alt={senderName} 
                            className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0 mb-1" 
                          />
                        )}

                        <div
                          className={`rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                            isMine
                              ? 'bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-br-xs'
                              : isSenderTeacher
                                ? 'bg-blue-50/80 border border-blue-200 text-blue-950 rounded-bl-xs'
                                : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap font-sans">{msg.text}</p>

                          {msg.attachmentName && (
                            <div className="mt-2 p-1.5 rounded-lg bg-black/10 border border-white/10 flex items-center justify-between gap-2 text-xs">
                              <span className="truncate text-[11px]">{msg.attachmentName}</span>
                              {msg.attachmentUrl && (
                                <a href={msg.attachmentUrl} target="_blank" rel="noreferrer" className="hover:underline">
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-[10px] text-slate-400 px-1 font-mono">
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isMine && <CheckCheck className="w-3 h-3 text-indigo-400" />}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
            >
              <button
                type="button"
                onClick={() => {
                  const name = prompt(lang === 'bn' ? 'নোট ফাইলের নাম:' : 'File name:', 'Calculus-Lecture-Notes.pdf');
                  if (name) {
                    handleSendMessage(`Attached file: ${name}`, name, '#doc');
                  }
                }}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
                title="ফাইল এটাচ করুন"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder={
                  isCurrentGroup 
                    ? (lang === 'bn' ? `"${selectedContact.title}" ব্যাচ গ্রুপে মেসেজ লিখুন...` : `Message batch group...`)
                    : (lang === 'bn' ? `${selectedContact.name}-কে বার্তা পাঠান...` : `Message ${selectedContact.name}...`)
                }
                className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-800 transition-colors"
              />

              <button
                type="submit"
                disabled={!inputText.trim()}
                className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
              >
                <span>{lang === 'bn' ? 'পাঠান' : 'Send'}</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400 text-xs">
            {lang === 'bn' ? 'বার্তা দেখতে বামপাশের তালিকা থেকে কোনো ব্যাচ বা কন্টাক্ট সিলেক্ট করুন' : 'Select a batch group or conversation to start chatting'}
          </div>
        )}
      </div>

      {/* BATCH GROUP MEMBERS MODAL */}
      {showMembersModal && isCurrentGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>{lang === 'bn' ? 'ব্যাচ গ্রুপ সদস্যবৃন্দ' : 'Batch Group Members'}</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">{selectedContact.title}</p>
              </div>
              <button 
                onClick={() => setShowMembersModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Members List */}
            <div className="space-y-3 max-h-80 overflow-y-auto">
              
              {/* Teacher item */}
              <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img 
                    src={selectedContact.teacher?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'} 
                    alt="Teacher" 
                    className="w-10 h-10 rounded-xl object-cover ring-2 ring-blue-500/20" 
                  />
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">{selectedContact.teacher?.name || 'ড. রশিদুল করিম'}</h5>
                    <p className="text-[11px] text-slate-500">{selectedContact.teacher?.title || 'উচ্চতর গণিত ও পদার্থবিজ্ঞান বিশেষজ্ঞ'}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full">
                  {lang === 'bn' ? 'ব্যাচ শিক্ষক' : 'Tutor'}
                </span>
              </div>

              {/* Enrolled Students */}
              <div className="space-y-1.5 pt-1">
                <h6 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
                  {lang === 'bn' ? 'ভর্তিকৃত শিক্ষার্থী' : 'Enrolled Students'} ({selectedContact.enrolledStudents?.length || 0})
                </h6>

                {(selectedContact.enrolledStudents || []).length === 0 ? (
                  <p className="text-xs text-slate-400 italic px-2 py-2">
                    {lang === 'bn' ? 'এখনো কোনো শিক্ষার্থী এনরোল করেনি।' : 'No enrolled students yet.'}
                  </p>
                ) : (
                  (selectedContact.enrolledStudents || []).map(student => (
                    <div key={student.id} className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img 
                          src={student.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250'} 
                          alt={student.name} 
                          className="w-8 h-8 rounded-full object-cover" 
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-800">{student.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{student.grade || student.title || 'শিক্ষার্থী'}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                        {lang === 'bn' ? 'এনরোল্ড' : 'Enrolled'}
                      </span>
                    </div>
                  ))
                )}
              </div>

            </div>

            <button
              onClick={() => setShowMembersModal(false)}
              className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition"
            >
              {lang === 'bn' ? 'ঠিক আছে' : 'Close'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
