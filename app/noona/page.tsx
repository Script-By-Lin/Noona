'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Send, 
  Trash2,
  ChevronLeft,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { playNotificationSound } from '@/lib/audio';

interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  response: string;
  mood: string;
  created_at: string;
}

export default function NoonaReplyScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const userId = 'user-13-pro-max'; // standard identifier for game chats

  // Fetch Chat History
  const fetchChats = async () => {
    setChatLoading(true);
    try {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data);
      }
    } catch (e) {
      console.error('Error fetching chats:', e);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  // Realtime subscription setup
  useEffect(() => {
    const channel = supabase
      .channel('public:chats')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chats' }, (payload: any) => {
        const newRecord = payload.new as ChatMessage;
        setMessages(prev => {
          if (prev.some(m => m.id === newRecord.id)) return prev;
          
          // Deduplicate optimistic messages (by matching same response text)
          const optIndex = prev.findIndex(m => 
            m.id.length <= 10 && 
            ((newRecord.message && m.message === newRecord.message) || 
             (newRecord.response && !newRecord.message && m.response === newRecord.response))
          );
          
          if (optIndex !== -1) {
            return prev.map((m, idx) => idx === optIndex ? newRecord : m);
          }
          
          // Play chime if message contains Lynn's incoming message or gameplay choice
          if (newRecord.message) {
            playNotificationSound();
          }
          
          return [...prev, newRecord];
        });
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'chats' }, (payload: any) => {
        const oldRecord = payload.old as { id: string };
        setMessages(prev => prev.filter(m => m.id !== oldRecord.id));
      })
      .on('postgres_changes', { event: 'DELETE_ALL', schema: 'public', table: 'chats' }, () => {
        setMessages([]);
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  // Prevent Ctrl+F5 refresh
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.key === 'F5') || (e.ctrlKey && e.key === 'f5') || (e.ctrlKey && e.keyCode === 116)) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Send Manual Reply
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const replyText = inputMessage;
    setInputMessage('');

    // Check if there is an unanswered user message
    const unansweredIndex = [...messages].reverse().findIndex(m => m.message && !m.response);

    if (unansweredIndex !== -1) {
      // Find the message index in the original array
      const actualIndex = messages.length - 1 - unansweredIndex;
      const targetMsg = messages[actualIndex];

      // Optimistically update locally
      setMessages(prev => prev.map((m, idx) => idx === actualIndex ? { ...m, response: replyText } : m));

      // Save to Supabase / Mock Local Storage
      try {
        await supabase
          .from('chats')
          .insert({
            user_id: userId,
            message: targetMsg.message,
            response: replyText,
            mood: targetMsg.mood || 'deep'
          });
      } catch (err) {
        console.error('Failed to save manual reply:', err);
      }
    } else {
      // No unanswered user message, Noona starts a new message thread
      const tempId = Math.random().toString(36).substring(2, 9);
      const tempNoonaMsg: ChatMessage = {
        id: tempId,
        user_id: userId,
        message: '',
        response: replyText,
        mood: 'deep',
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, tempNoonaMsg]);

      try {
        await supabase
          .from('chats')
          .insert({
            user_id: userId,
            message: '',
            response: replyText,
            mood: 'deep'
          });
      } catch (err) {
        console.error('Failed to save new Noona message:', err);
      }
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', messageId);
      
      if (!error) {
        setMessages(prev => prev.filter(m => m.id !== messageId));
      } else {
        alert("Failed to delete message: " + error.message);
      }
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  };

  const clearChatHistory = async () => {
    if (confirm("Are you sure you want to clear the chat history?")) {
      try {
        const { error } = await supabase
          .from('chats')
          .delete()
          .eq('user_id', userId);
        
        if (!error) {
          setMessages([]);
          alert("Chat history cleared!");
        } else {
          alert("Failed to clear chat history: " + error.message);
        }
      } catch (err) {
        console.error("Failed to clear chat history:", err);
      }
    }
  };

  return (
    <div className="w-full h-[100dvh] bg-[#F0F4EF] flex justify-center items-center overflow-hidden relative">
      {/* Background Animated Blobs inside viewport container */}
      <div className="bg-blob w-52 h-52 bg-[#E7F5DC] top-12 left-[-20px] opacity-70" />
      <div className="bg-blob w-72 h-72 bg-[#F4FAF0] bottom-10 right-[-30px] opacity-70" style={{ animationDelay: '-5s' }} />
      <div className="bg-blob w-44 h-44 bg-[#eef8e8] top-[45%] right-[-10px] opacity-60" style={{ animationDelay: '-10s' }} />

      {/* Screen Content Wrapper (Centered smartphone frame on desktop, full screen on mobile) */}
      <div className="w-full md:max-w-[428px] h-full md:h-[92dvh] md:rounded-[48px] md:border-4 md:border-white/80 md:shadow-2xl bg-[#F0F4EF] flex flex-col overflow-hidden relative z-10">
        
        {/* Top Header Panel (Supports safe-area notch padding) */}
        <div className="bg-[#E7F5DC]/55 pb-4 pt-[calc(1rem+env(safe-area-inset-top))] px-5 rounded-b-[36px] flex items-center justify-between z-40 border-b border-[#cbe3bb]/20 shrink-0">
          <div className="flex items-center gap-1.5">
            <a 
              href="/"
              className="text-[#728156] hover:text-[#728156]/80 flex items-center gap-0.5 text-xs font-bold"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </a>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-sm font-extrabold tracking-tight text-[#728156] flex items-center gap-1">
              Noona ❤️
            </span>
            <span className="text-[9px] text-[#728156]/70 font-semibold">online</span>
          </div>
          
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button 
                onClick={clearChatHistory}
                className="p-1.5 rounded-full bg-red-50 hover:bg-red-100 text-red-500 transition border border-red-100"
                title="Reset Chat"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <span className="text-[9px] bg-[#728156] text-white px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
              Noona Panel
            </span>
          </div>
        </div>

        {/* Chat Feed Panel */}
        <div className="flex-1 flex flex-col justify-between overflow-hidden px-5">
          
          {/* Chat list */}
          <div className="flex-1 overflow-y-auto chat-scrollbar my-2 pr-1 space-y-3 min-h-0">
            {chatLoading ? (
              <div className="flex justify-center items-center h-full text-xs text-[#728156]/70">
                Loading conversations...
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-center p-4">
                <MessageCircle className="w-8 h-8 text-[#728156]/30 mb-2 animate-bounce" />
                <p className="text-xs font-semibold text-[#728156]/70">
                  No messages from Lynn yet. When Lynn plays the game or writes a message, it will show up here.
                </p>
              </div>
            ) : (
              messages.map((item) => {
                const isGameLetter = item.message && item.message.startsWith('[');
                
                if (isGameLetter) {
                  const match = item.message.match(/^\[(.*?)\]\s*([\s\S]*)$/);
                  const titleAndMood = match ? match[1] : "Game Letter";
                  const letterContent = match ? match[2] : item.message;

                  return (
                    <div key={item.id} className="flex justify-start items-center gap-2 w-full my-2">
                      <div className="w-[85%] rounded-[24px] bg-gradient-to-br from-[#E7F5DC]/45 to-[#F4FAF0]/90 border border-[#cbe3bb]/40 p-4 shadow-sm relative overflow-hidden">
                        {/* Decorative background outline */}
                        <div className="absolute top-1 right-1 opacity-[0.05] pointer-events-none">
                          <Heart className="w-16 h-16 fill-[#728156] text-[#728156]" />
                        </div>
                        
                        {/* Header badge */}
                        <div className="flex items-center gap-1.5 mb-2">
                          <Sparkles className="w-3.5 h-3.5 text-[#728156]/70" />
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#728156]/90 bg-[#E7F5DC] px-2 py-0.5 rounded-full border border-[#cbe3bb]/30">
                            🎮 {titleAndMood}
                          </span>
                        </div>

                        {/* Letter text with full newlines support */}
                        <p className="text-[#728156]/90 text-[11px] font-medium leading-relaxed whitespace-pre-line border-b border-[#728156]/10 pb-2 mb-2">
                          {letterContent}
                        </p>

                        {/* Choice badge */}
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span className="text-[#728156]/60">Lynn's Choice:</span>
                          <span className="bg-[#728156] text-white text-[10px] px-3 py-1 rounded-full shadow-inner-soft">
                            ❤️ {item.response}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteMessage(item.id)}
                        className="p-1 rounded-full text-red-400 hover:text-red-600 hover:bg-red-50 transition shrink-0"
                        title="Delete game record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                } else {
                  return (
                    <div key={item.id} className="flex flex-col gap-2">
                      {/* His message (Lynn is sender -> Left side of screen) */}
                      {item.message && (
                        <div className="flex justify-start items-center gap-2">
                          <div className="glass-card text-[#728156] text-xs font-medium px-4 py-2.5 rounded-2xl rounded-tl-sm max-w-[80%] border border-[#728156]/10 whitespace-pre-line">
                            {item.message}
                          </div>
                          {!item.response && (
                            <button 
                              onClick={() => handleDeleteMessage(item.id)}
                              className="p-1 rounded-full text-red-400 hover:text-red-600 hover:bg-red-50 transition shrink-0"
                              title="Delete message"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}

                      {/* Her response/reply (Noona is sender -> Right side of screen) */}
                      {item.response && (
                        <div className="flex justify-end items-center gap-2">
                          <button 
                            onClick={() => handleDeleteMessage(item.id)}
                            className="p-1 rounded-full text-red-400 hover:text-red-600 hover:bg-red-50 transition shrink-0"
                            title="Delete message"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <div className="bg-[#728156] text-white text-xs font-medium px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[80%] shadow-inner-soft border border-[#728156]/10 whitespace-pre-line">
                            {item.response}
                            {item.mood && (
                              <span className="block text-[8px] text-white/70 mt-1 capitalize text-right">
                                🌸 {item.mood}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input form (Supports bottom safe-area bezel offset) */}
          <form onSubmit={handleSendMessage} className="flex gap-2 items-center shrink-0 pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-[#728156]/10">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                messages.length > 0 && !messages[messages.length - 1].response
                  ? "Type reply to Lynn's last message..."
                  : "Type new message to Lynn..."
              }
              className="flex-1 bg-white border border-[#cbe3bb] text-xs font-medium rounded-full px-4 py-3 outline-none text-[#728156] placeholder-[#728156]/40 focus:border-[#728156] transition"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="w-10 h-10 rounded-full bg-[#728156] hover:bg-[#5e6c46] flex items-center justify-center text-white disabled:opacity-50 disabled:hover:bg-[#728156] transition shrink-0 shadow-soft"
            >
              <Send className="w-4 h-4 fill-transparent text-white" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
