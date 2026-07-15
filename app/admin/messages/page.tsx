"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, MessageSquare, Check, CheckCheck, Inbox, 
  Loader2, Phone, Mail, RefreshCw
} from 'lucide-react';

export default function MessagesCMS() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingReply, setSendingReply] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  
  // Local chat reply history store: { [messageId]: Array of reply messages }
  const [repliesStore, setRepliesStore] = useState<{ [key: string]: any[] }>({});
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    // Scroll to bottom of chat when a message or reply is added
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedMessageId, repliesStore]);

  async function loadMessages() {
    setLoading(true);
    try {
      const res = await fetch('/api/cms/messages?limit=50');
      const data = await res.json();
      if (data.success && data.messages) {
        const allMessages = data.messages;

        // Separate customer messages and admin replies
        const customerMsgs = [];
        const adminReplies = [];

        for (const msg of allMessages) {
          if (msg.email === 'admin@balajidhaba.com' || msg.name === 'Balaji Dhaba Admin') {
            adminReplies.push(msg);
          } else {
            customerMsgs.push(msg);
          }
        }

        // Group admin replies under the corresponding customer message by matching phone/email
        const newRepliesStore: { [key: string]: any[] } = {};
        for (const reply of adminReplies) {
          // Find the latest customer message with matching phone or email created before the reply
          const matchedCustomerMsg = customerMsgs
            .filter(cm => {
              const phoneMatch = reply.phone && cm.phone && reply.phone === cm.phone;
              const emailMatch = reply.email && cm.email && reply.email === cm.email;
              return (phoneMatch || emailMatch) && new Date(cm.createdAt) <= new Date(reply.createdAt);
            })
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

          if (matchedCustomerMsg) {
            if (!newRepliesStore[matchedCustomerMsg.id]) {
              newRepliesStore[matchedCustomerMsg.id] = [];
            }
            newRepliesStore[matchedCustomerMsg.id].push({
              id: reply.id,
              message: reply.message.replace(/^\[REPLY TO .*?\]:\s*/, ''), // Strip reply prefix
              createdAt: reply.createdAt,
              isAdmin: true
            });
          }
        }

        // Sort replies chronologically
        for (const msgId in newRepliesStore) {
          newRepliesStore[msgId].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        }

        // Process customer messages to determine if they have replies
        const processedCustomerMsgs = customerMsgs.map(cm => ({
          ...cm,
          isReplied: !!(newRepliesStore[cm.id] && newRepliesStore[cm.id].length > 0)
        }));

        setRepliesStore(newRepliesStore);
        setMessages(processedCustomerMsgs);

        if (processedCustomerMsgs.length > 0 && !selectedMessageId) {
          setSelectedMessageId(processedCustomerMsgs[0].id);
          markAsRead(processedCustomerMsgs[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to load inbox messages:', e);
    } finally {
      setLoading(false);
    }
  }

  const markAsRead = async (id: string) => {
    // Optimistic update
    setMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m));
    try {
      await fetch('/api/cms/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isRead: true })
      });
    } catch (e) {
      console.error('Failed to update message status:', e);
    }
  };

  const handleSelectMessage = (msg: any) => {
    setSelectedMessageId(msg.id);
    setReplyText(''); // always clear reply box when switching conversations
    if (!msg.isRead) {
      markAsRead(msg.id);
    }
  };

  // Build a WhatsApp deep link with phone + pre-filled message quoting the original query
  const buildWhatsAppUrl = (phone: string, customerName: string, originalMessage: string, replyBody: string) => {
    // Strip non-digits and ensure Indian country code prefix
    const digits = phone.replace(/\D/g, '');
    const normalized = digits.startsWith('91') ? digits : `91${digits}`;
    const text = `Hi ${customerName}! 👋\n\nRegarding your query:\n_"${originalMessage}"_\n\n${replyBody}\n\n— Balaji Dhaba Team`;
    return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedMessageId) return;

    const activeMsg = messages.find(m => m.id === selectedMessageId);
    if (!activeMsg) return;

    setSendingReply(true);
    const trimmedReply = replyText.trim();
    
    try {
      const res = await fetch('/api/cms/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Balaji Dhaba Admin',
          email: 'admin@balajidhaba.com',
          phone: activeMsg.phone,
          subject: `Re: ${activeMsg.subject || 'Inquiry'}`,
          message: `[REPLY TO ${activeMsg.name}]: ${trimmedReply}`
        })
      });

      const newReply = {
        id: `reply-${Date.now()}`,
        message: trimmedReply,
        createdAt: new Date().toISOString(),
        isAdmin: true
      };

      setRepliesStore(prev => ({
        ...prev,
        [selectedMessageId]: [...(prev[selectedMessageId] || []), newReply]
      }));

      setMessages(prev => prev.map(m => m.id === selectedMessageId ? { ...m, isReplied: true } : m));
      setReplyText('');
    } catch (err) {
      console.error('Failed to dispatch reply:', err);
    } finally {
      setSendingReply(false);
    }
  };

  // Filter messages based on search query
  const filteredMessages = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return messages.filter(m => 
      m.name.toLowerCase().includes(query) || 
      m.phone.includes(query) || 
      (m.email && m.email.toLowerCase().includes(query)) ||
      m.message.toLowerCase().includes(query)
    );
  }, [messages, searchQuery]);

  const activeMessage = useMemo(() => {
    return messages.find(m => m.id === selectedMessageId) || null;
  }, [messages, selectedMessageId]);

  return (
    <div className="space-y-6 animate-fadeIn font-sans">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-brand-dark/10 shadow-sm">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-accent flex items-center gap-2">
            <MessageSquare size={12} className="text-brand-accent" />
            Customer Relations Hub
          </span>
          <h1 className="font-display text-2xl font-black text-brand-dark mt-2">
            Unified Customer Inbox
          </h1>
          <p className="text-xs text-brand-dark/65 mt-1">
            Manage inquiries, view contact form submissions, and respond to guests in real-time.
          </p>
        </div>

        <button 
          onClick={loadMessages}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-brand-dark/15 hover:border-brand-accent text-brand-dark hover:text-brand-accent text-[10px] font-bold uppercase transition-all shadow-sm"
        >
          <RefreshCw size={12} />
          <span>Refresh Inbox</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-brand-dark/10 shadow-sm">
          <Loader2 className="animate-spin text-brand-accent mb-4" size={48} />
          <p className="font-display text-base font-bold text-brand-dark">Loading inbox message streams...</p>
        </div>
      ) : (
        /* Split Pane Container */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 h-[75vh] items-stretch rounded-3xl border border-zinc-200 shadow-lg overflow-hidden bg-white">
          
          {/* Left Panel: Preview List */}
          <div className="lg:col-span-4 bg-white flex flex-col h-full border-r border-zinc-200">
            {/* WhatsApp Style List Header */}
            <div className="p-4 bg-[#f0f2f5] flex justify-between items-center border-b border-zinc-150">
              <span className="font-display font-black text-sm text-[#111b21] uppercase tracking-wide">Chats</span>
              <span className="text-[10px] bg-brand-accent/10 text-brand-accent px-2 py-0.5 rounded-full font-bold">
                {filteredMessages.length} Conversations
              </span>
            </div>

            {/* Search Bar */}
            <div className="p-2.5 bg-white border-b border-zinc-100 flex items-center gap-2">
              <div className="bg-[#f0f2f5] flex items-center gap-3 px-3 py-1.5 rounded-full flex-1 border border-transparent focus-within:border-zinc-300 transition-all">
                <Search size={14} className="text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search by name, phone or text..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs text-[#111b21] focus:outline-none placeholder-zinc-400"
                />
              </div>
            </div>

            {/* Scrollable list — padded card grid, scrolls up when full */}
            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 no-scrollbar">
              {filteredMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center text-zinc-400">
                  <Inbox size={32} className="mb-2 text-zinc-300" />
                  <span className="text-xs font-semibold">No messages found</span>
                </div>
              ) : (
                filteredMessages.map((msg) => {
                  const isSelected = msg.id === selectedMessageId;
                  const isWebForm = !!msg.email;
                  const replies = repliesStore[msg.id] || [];
                  const isReplied = msg.isReplied || replies.length > 0;
                  
                  // Helper to get initials
                  const initials = msg.name
                    ? msg.name.trim().split(" ").slice(0, 2).map((n: string) => n[0]).join("").toUpperCase()
                    : "?";
                  
                  // Deterministic color
                  const colors = [
                    'bg-emerald-100 text-emerald-800',
                    'bg-sky-100 text-sky-800',
                    'bg-amber-100 text-amber-800',
                    'bg-indigo-100 text-indigo-800',
                    'bg-rose-100 text-rose-800',
                    'bg-teal-100 text-teal-800'
                  ];
                  const colorIdx = (msg.name?.length || 0) % colors.length;
                  const avatarClass = colors[colorIdx];

                  return (
                    <div
                      key={msg.id}
                      className={`transition-all duration-200 rounded-xl ${
                        isSelected
                          ? 'shadow-lg scale-[1.015] z-10 relative'
                          : 'shadow-none scale-100 z-0'
                      }`}
                    >
                    <button
                      onClick={() => handleSelectMessage(msg)}
                      className={`w-full p-3.5 text-left flex items-start gap-3 transition-all duration-200 cursor-pointer rounded-xl border ${
                        isSelected 
                          ? 'bg-white border-[#00a884] ring-1 ring-[#00a884]/30 shadow-md' 
                          : 'bg-white border-zinc-100 hover:border-zinc-200 hover:bg-zinc-50'
                      }`}
                    >
                      {/* Avatar Circle */}
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${avatarClass}`}>
                        {initials}
                      </div>

                      {/* Info Panel */}
                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-center w-full mb-0.5">
                          <span className="font-bold text-xs text-[#111b21] truncate max-w-[130px]">
                            {msg.name}
                          </span>
                          <span className="text-[9px] text-zinc-400 shrink-0 font-medium">
                            {new Date(msg.createdAt).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).split(',')[1]?.trim() || "Now"}
                          </span>
                        </div>

                        <p className="text-[11px] text-zinc-500 truncate pr-2">
                          {msg.message}
                        </p>

                        <div className="flex items-center justify-between w-full mt-1.5">
                          <span className={`text-[8px] px-1.5 py-0.5 rounded font-extrabold uppercase border ${
                            isSelected 
                              ? 'bg-[#00a884]/10 border-[#00a884]/30 text-[#00a884]' 
                              : 'bg-zinc-50 border-zinc-200 text-zinc-500'
                          }`}>
                            {isWebForm ? 'Web Form' : 'WhatsApp'}
                          </span>

                          <div className="flex items-center gap-1">
                            {isReplied ? (
                              <span className="text-[8px] font-extrabold uppercase flex items-center gap-0.5 text-emerald-600">
                                <CheckCheck size={10} />
                                Replied
                              </span>
                            ) : !msg.isRead ? (
                              <span className="w-2 h-2 rounded-full bg-[#00a884] animate-pulse" title="Unread" />
                            ) : (
                              <span className="text-[8px] uppercase font-bold text-zinc-400">Read</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Panel: Active Chat Window (WhatsApp Beige wallpaper style) */}
          <div className="lg:col-span-8 bg-[#efeae2] flex flex-col h-full overflow-hidden relative">
            {/* Tiled overlay pattern simulation */}
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(#111b21_1px,transparent_1px)] [background-size:16px_16px]" />

            {activeMessage ? (
              <>
                {/* Active Chat Header: WhatsApp Web Gray Header style */}
                <div className="p-3 bg-[#f0f2f5] border-b border-zinc-200 flex justify-between items-center z-10 relative">
                  <div className="flex items-center gap-3">
                    {/* Header Avatar */}
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs bg-zinc-200 text-zinc-700 shadow-sm uppercase">
                      {activeMessage.name ? activeMessage.name.trim().split(" ").slice(0, 2).map((n: string) => n[0]).join("").toUpperCase() : "?"}
                    </div>
                    
                    <div className="space-y-0.5">
                      <h3 className="font-bold text-sm text-[#111b21] leading-tight">{activeMessage.name}</h3>
                      <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-medium">
                        <span className="flex items-center gap-0.5">
                          <Phone size={10} className="text-zinc-400" />
                          {activeMessage.phone}
                        </span>
                        {activeMessage.email && (
                          <span className="flex items-center gap-0.5">
                            <Mail size={10} className="text-zinc-400" />
                            {activeMessage.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="text-[8px] font-extrabold bg-[#00a884]/10 text-[#00a884] border border-[#00a884]/20 px-2 py-0.5 rounded-full uppercase">
                    {activeMessage.email ? 'Web Form Sub' : 'WhatsApp'}
                  </span>
                </div>

                {/* Messages Stream: Scrollable conversation bubble area */}
                <div className="flex-grow overflow-y-auto p-6 space-y-4 z-10 relative">
                  {/* Incoming Client Query Bubble (White WhatsApp style) */}
                  <div className="flex justify-start max-w-[85%]">
                    <div className="bg-white text-[#111b21] rounded-lg rounded-tl-none p-3 shadow-sm relative space-y-1">
                      {activeMessage.subject && (
                        <div className="font-bold text-[9px] uppercase tracking-wider text-brand-accent/80 mb-0.5">
                          Subject: {activeMessage.subject}
                        </div>
                      )}
                      <p className="text-[12px] font-sans leading-relaxed pr-6">{activeMessage.message}</p>
                      
                      <div className="text-[8px] text-zinc-400 text-right font-medium block mt-1">
                        {new Date(activeMessage.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </div>
                    </div>
                  </div>

                  {/* Outgoing Reply History (Soft Light Green WhatsApp style) */}
                  {(repliesStore[activeMessage.id] || []).map((reply: any) => (
                    <div key={reply.id} className="flex justify-end max-w-[85%] ml-auto">
                      <div className="bg-[#d9fdd3] text-[#111b21] rounded-lg rounded-tr-none p-3 shadow-sm relative space-y-1">
                        <p className="text-[12px] font-sans leading-relaxed text-left pr-8">{reply.message}</p>
                        
                        <div className="text-[8px] text-zinc-400 flex items-center justify-end gap-1 mt-1 font-medium select-none">
                          <span>{new Date(reply.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                          <CheckCheck size={12} className="text-[#53bdeb]" />
                        </div>
                      </div>
                    </div>
                  ))}

                  <div ref={chatEndRef} />
                </div>

                {/* Bottom Reply Bar: WhatsApp redirect style */}
                <div className="p-3 bg-[#f0f2f5] border-t border-zinc-200 flex gap-2 items-center z-10 relative">
                  <input
                    type="text"
                    placeholder={`Type a reply to ${activeMessage.name.split(" ")[0]}...`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && replyText.trim() && activeMessage.phone) {
                        window.open(buildWhatsAppUrl(activeMessage.phone, activeMessage.name, activeMessage.message, replyText.trim()), '_blank');
                        setReplyText('');
                      }
                    }}
                    className="w-full bg-white border border-transparent focus:border-zinc-200 rounded-full px-4 py-2 text-xs text-[#111b21] focus:outline-none placeholder-zinc-400 shadow-sm"
                  />

                  {/* WhatsApp Open Button */}
                  <button
                    type="button"
                    disabled={!replyText.trim() || !activeMessage.phone}
                    onClick={() => {
                      if (!replyText.trim() || !activeMessage.phone) return;
                      window.open(buildWhatsAppUrl(activeMessage.phone, activeMessage.name, activeMessage.message, replyText.trim()), '_blank');
                      setReplyText('');
                    }}
                    title={activeMessage.phone ? `Open WhatsApp chat with ${activeMessage.name}` : 'No phone number available'}
                    className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-md transition-all disabled:opacity-40 cursor-pointer bg-[#25D366] hover:bg-[#1ebe5d] active:scale-95"
                  >
                    {/* Official WhatsApp logo SVG */}
                    <svg viewBox="0 0 32 32" width="22" height="22" fill="white" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16 2C8.28 2 2 8.28 2 16c0 2.46.66 4.76 1.8 6.76L2 30l7.44-1.76A13.93 13.93 0 0016 30c7.72 0 14-6.28 14-14S23.72 2 16 2zm0 25.4a11.37 11.37 0 01-5.8-1.58l-.42-.25-4.42 1.05 1.1-4.28-.28-.44A11.4 11.4 0 014.6 16C4.6 9.7 9.7 4.6 16 4.6S27.4 9.7 27.4 16 22.3 27.4 16 27.4zm6.26-8.54c-.34-.17-2.02-1-2.34-1.1-.32-.12-.54-.17-.77.17-.23.34-.88 1.1-1.08 1.33-.2.22-.4.25-.74.08-.34-.17-1.44-.53-2.74-1.7-1.01-.9-1.7-2.01-1.9-2.35-.2-.34-.02-.52.15-.69.15-.15.34-.4.51-.6.17-.2.22-.34.33-.57.12-.23.06-.43-.03-.6-.08-.17-.76-1.84-1.05-2.52-.27-.65-.55-.56-.76-.57h-.65c-.23 0-.6.08-.91.4-.31.32-1.18 1.15-1.18 2.8s1.2 3.25 1.37 3.47c.17.22 2.37 3.62 5.74 5.08.8.34 1.43.55 1.92.7.8.25 1.54.22 2.12.13.65-.1 2.02-.83 2.3-1.62.28-.8.28-1.48.2-1.62-.09-.14-.3-.22-.64-.4z"/>
                    </svg>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center text-zinc-400 z-10 relative">
                <MessageSquare size={48} className="text-zinc-300 mb-2" />
                <span className="text-sm font-semibold">Select a conversation thread to start</span>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
