import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Paperclip, CheckCheck, Clock, Search, MessageSquare, 
  FileText, ExternalLink, Bot, UserCheck, UserX, Download, ChevronLeft
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { subscribeToRealtimeMessages, pushMessageToRealtimeDb } from '../firebase';

export default function ChatView() {
  const { currentUser, isTeacher, users, lang } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [allUserMessages, setAllUserMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [teacherActive, setTeacherActive] = useState(false);
  const messagesEndRef = useRef(null);
  const selectedContactRef = useRef(null);

  selectedContactRef.current = selectedContact;

  const eduBotUser = {
    id: 'bot-edutrack',
    name: lang === 'bn' ? 'স্টাডি অ্যাসিস্ট্যান্ট' : 'Study Assistant',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=250',
    title: lang === 'bn' ? 'অটোমেটিক স্টাডি হেল্প' : 'Automated Help',
    role: 'bot',
    isBot: true,
    isOnline: true
  };

  // Base chat partners: Everyone can chat with Everyone!
  // Admin <-> Teacher <-> Student <-> Parent
  useEffect(() => {
    if (!currentUser) return;
    
    // Get all other real accounts (excluding current user and bot)
    const otherUsers = (users || []).filter(u => u.id !== currentUser.id && u.id !== 'bot-edutrack');
    
    // Partner list includes bot and all other personas
    const partnerList = [eduBotUser, ...otherUsers];
    setContacts(partnerList);

    // Auto-select valid contact (avoid chatting with oneself after switching personas)
    setSelectedContact(prev => {
      if (!prev || prev.id === currentUser.id || !partnerList.some(p => p.id === prev.id)) {
        // Pick first human partner if available, otherwise bot
        return otherUsers[0] || eduBotUser;
      }
      return prev;
    });
  }, [currentUser?.id, users, lang]);

  // Fetch all messages for current user
  const loadAllUserMessages = async () => {
    if (!currentUser) return;
    try {
      const list = await api.getMessages(currentUser.id);
      if (Array.isArray(list)) {
        setAllUserMessages(list);
        
        // Count unread and emit to sidebar/navbar
        const totalUnread = list.filter(m => m.receiverId === currentUser.id && !m.isRead).length;
        window.dispatchEvent(new CustomEvent('edutrack_unread_messages_count', { detail: totalUnread }));

        // Update active thread
        if (selectedContactRef.current) {
          const currentPair = list.filter(m => 
            (m.senderId === currentUser.id && m.receiverId === selectedContactRef.current.id) ||
            (m.senderId === selectedContactRef.current.id && m.receiverId === currentUser.id)
          );
          setMessages(currentPair);

          // Mark unread as read
          const unreadForSelected = currentPair.filter(m => m.receiverId === currentUser.id && !m.isRead);
          for (const uMsg of unreadForSelected) {
            api.markMessageAsRead(uMsg.id).catch(() => {});
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
    const interval = setInterval(loadAllUserMessages, 1200);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  // Real-time Firebase Realtime Database listener
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = subscribeToRealtimeMessages((liveMsgs) => {
      if (Array.isArray(liveMsgs) && liveMsgs.length > 0) {
        const myLiveMsgs = liveMsgs.filter(m => m.receiverId === currentUser.id || m.senderId === currentUser.id);
        if (myLiveMsgs.length > 0) {
          loadAllUserMessages();
        }
      }
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [currentUser?.id]);

  // On contact change
  useEffect(() => {
    if (!selectedContact || !currentUser) return;
    setLoadingMessages(true);
    
    api.getMessages(currentUser.id, selectedContact.id).then(list => {
      setMessages(list);
      list.filter(m => m.receiverId === currentUser.id && !m.isRead).forEach(m => {
        api.markMessageAsRead(m.id).catch(() => {});
      });
    }).catch(err => {
      console.error('Fetch thread error:', err);
    }).finally(() => {
      setLoadingMessages(false);
    });
  }, [selectedContact?.id, currentUser?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend = inputText, attachmentName = null, attachmentUrl = null) => {
    const text = textToSend.trim();
    if (!text || !selectedContact || !currentUser) return;

    // ONLY bot-edutrack triggers AI answers. Human-to-human chats (Admin, Teacher, Student) never trigger bot!
    const isSendingToBot = selectedContact.id === 'bot-edutrack';

    const payload = {
      senderId: currentUser.id,
      receiverId: selectedContact.id,
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
        setTimeout(loadAllUserMessages, 500);
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

  const contactsWithMeta = contacts.map(contact => {
    const threadMsgs = allUserMessages.filter(m => 
      (m.senderId === currentUser?.id && m.receiverId === contact.id) ||
      (m.senderId === contact.id && m.receiverId === currentUser?.id)
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

  const sortedContacts = [...contactsWithMeta].sort((a, b) => {
    // 1. Any contact with unread messages comes first!
    if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
    if (b.unreadCount > 0 && a.unreadCount === 0) return 1;
    if (a.unreadCount !== b.unreadCount) return b.unreadCount - a.unreadCount;

    // 2. Contacts with recent conversation
    if (b.lastTimestamp !== a.lastTimestamp) {
      return b.lastTimestamp - a.lastTimestamp;
    }

    // 3. Fallback
    if (a.id === 'bot-edutrack') return -1;
    if (b.id === 'bot-edutrack') return 1;
    return (a.name || '').localeCompare(b.name || '');
  });

  const filteredContacts = sortedContacts.filter(c => 
    c.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (c.title && c.title.toLowerCase().includes(searchFilter.toLowerCase())) ||
    (c.lastText && c.lastText.toLowerCase().includes(searchFilter.toLowerCase()))
  );

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
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col md:flex-row h-[700px]">
      
      {/* LEFT: Contact List */}
      <div className={`w-full md:w-72 border-r border-slate-200 flex flex-col bg-slate-50/50 shrink-0 ${
        mobileShowChat ? 'hidden md:flex' : 'flex'
      }`}>
        
        {/* Search header */}
        <div className="p-3 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-slate-800 text-xs">
              {lang === 'bn' ? 'ইনবক্স ও মেসেজ' : 'Inbox'}
            </h3>
            <span className="text-[10px] text-slate-500 font-medium">
              {contacts.length} {lang === 'bn' ? 'জন' : 'people'}
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              placeholder={lang === 'bn' ? 'খুঁজুন...' : 'Search contacts...'}
              className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
            />
          </div>
        </div>

        {/* Contacts */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
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
                className={`w-full text-left p-3 transition flex items-center gap-2.5 ${
                  isSelected 
                    ? 'bg-slate-100 border-r-2 border-slate-900' 
                    : hasUnread
                      ? 'bg-blue-50/80 hover:bg-blue-100/70'
                      : 'hover:bg-slate-100/60'
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
                      <p className={`text-xs truncate ${hasUnread ? 'font-bold text-slate-900' : isSelected ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                        {contact.name}
                      </p>
                      <span className={`px-1 py-0.2 rounded text-[9px] font-semibold shrink-0 ${badge.cls}`}>
                        {badge.text}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-1">
                      {contact.lastTime || ''}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-1">
                    <p className={`text-[11px] truncate ${hasUnread ? 'font-semibold text-blue-900' : 'text-slate-500'}`}>
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

      {/* RIGHT: Active Chat Room */}
      <div className={`flex-1 flex flex-col bg-white overflow-hidden ${
        mobileShowChat ? 'flex' : 'hidden md:flex'
      }`}>
        {selectedContact ? (
          <>
            {/* Header */}
            <div className="px-3 sm:px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <button
                  onClick={() => setMobileShowChat(false)}
                  className="md:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition"
                  title={lang === 'bn' ? 'ফিরে যান' : 'Back'}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <img
                  src={selectedContact.avatar}
                  alt={selectedContact.name}
                  className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                />

                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>{selectedContact.name}</span>
                    <span className={`px-1.5 py-0.2 text-[10px] font-semibold rounded ${getRoleBadge(selectedContact.role).cls}`}>
                      {getRoleBadge(selectedContact.role).text}
                    </span>
                    {!isCurrentContactBot && (
                      <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {lang === 'bn' ? 'অনলাইন' : 'Active'}
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {selectedContact.title || selectedContact.email}
                  </p>
                </div>
              </div>

              {isTeacher && (
                <button
                  onClick={() => setTeacherActive(!teacherActive)}
                  className="px-2.5 py-1 rounded border border-slate-200 text-[11px] font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  {teacherActive ? (lang === 'bn' ? 'স্ট্যাটাস: অনলাইন' : 'Status: Online') : (lang === 'bn' ? 'স্ট্যাটাস: অফলাইন' : 'Status: Away')}
                </button>
              )}
            </div>

            {/* Offline Notice */}
            {isTeacherAway && (
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 text-[11px] text-slate-600 shrink-0">
                <span>{lang === 'bn' ? 'শিক্ষক বর্তমানে অফলাইনে আছেন। বার্তা পাঠিয়ে রাখতে পারেন।' : 'Teacher is currently away. You can leave a message.'}</span>
              </div>
            )}

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/40">
              {loadingMessages ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  <span>{lang === 'bn' ? 'মেসেজ লোড হচ্ছে...' : 'Loading messages...'}</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-1.5 text-xs">
                  <p className="font-medium text-slate-600">{lang === 'bn' ? 'কোনো বার্তা নেই' : 'No messages yet'}</p>
                  <p className="text-[11px] text-slate-400">{lang === 'bn' ? 'নিচে লিখে বার্তা পাঠান' : 'Type below to start conversation'}</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isMine = msg.senderId === currentUser.id;
                  const isBotMsg = msg.senderId === 'bot-edutrack' || msg.isBot;

                  return (
                    <div
                      key={msg.id || index}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-[75%] ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div
                          className={`rounded-lg px-3.5 py-2 text-xs sm:text-sm leading-relaxed ${
                            isMine
                              ? 'bg-slate-900 text-white'
                              : isBotMsg
                                ? 'bg-slate-800 text-slate-100'
                                : 'bg-white border border-slate-200 text-slate-800'
                          }`}
                        >
                          <p className="whitespace-pre-wrap font-sans">{msg.text}</p>

                          {msg.attachmentName && (
                            <div className="mt-2 p-1.5 rounded bg-black/10 border border-white/10 flex items-center justify-between gap-2 text-xs">
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

                      <div className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-400 px-1 font-mono">
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isMine && <CheckCheck className="w-3 h-3 text-slate-400" />}
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
                  const name = prompt(lang === 'bn' ? 'ফাইলের নাম:' : 'File name:', 'Notes.pdf');
                  if (name) {
                    handleSendMessage(`Attached file: ${name}`, name, '#doc');
                  }
                }}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder={lang === 'bn' ? `${selectedContact.name}-কে বার্তা পাঠান...` : `Message ${selectedContact.name}...`}
                className="flex-1 px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 text-slate-800"
              />

              <button
                type="submit"
                disabled={!inputText.trim()}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400 text-xs">
            {lang === 'bn' ? 'বার্তা দেখতে তালিকা থেকে কাউকে নির্বাচন করুন' : 'Select a conversation to start chatting'}
          </div>
        )}
      </div>

    </div>
  );
}
