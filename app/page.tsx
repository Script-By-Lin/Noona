'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Sparkles, 
  Send, 
  ChevronRight, 
  Copy, 
  Wifi, 
  Battery, 
  Signal, 
  HeartHandshake, 
  RefreshCw, 
  Check, 
  Bookmark, 
  Volume2,
  Trash2
} from 'lucide-react';
import { supabase, isMock } from '@/lib/supabaseClient';
import { MoodType, responseBank } from '@/lib/responseBank';
import { playNotificationSound } from '@/lib/audio';

// Quotes bank matching moods
const quotesBank: Record<MoodType, string[]> = {
  cute: [
    "I still get butterflies every single time I see your name light up on my phone. 🦋",
    "You are my favorite notification. 😊",
    "If I had a flower for every time I thought of you, I could walk through my garden forever.",
    "You're like the happy ending to my favorite story.",
    "I love you more than cookies, and that is saying a lot! 🍪"
  ],
  flirty: [
    "I'm not saying you're the best thing that ever happened to me, but you're definitely close to it. 😏",
    "I was having a boring day, and then you crossed my mind. Now everything's exciting.",
    "My favorite place in the world is next to you. Or on top of your thoughts.",
    "Do you believe in love at first sight, or should I walk by again? 😉",
    "Let's skip the small talk. When are we going out? 🌹"
  ],
  deep: [
    "I want to be the one who knows the silent parts of your heart, the ones you never speak aloud.",
    "Some souls just understand each other upon meeting. That was us.",
    "If I could give you one thing in life, I would give you the ability to see yourself through my eyes.",
    "You are the poem I never knew how to write, and this life is the story I've always wanted to tell.",
    "My heart is, and always will be, yours."
  ],
  loyalty: [
    "I stay where my heart feels right, and my heart is completely anchored in you.",
    "No matter what tomorrow brings, my hand will always be holding yours.",
    "In a world where everything is temporary, you are my absolute permanent.",
    "I don't just love you for now; I am committed to every single version of you that will grow.",
    "My loyalty is a promise, not a choice."
  ],
  comfort: [
    "Take a breath. You are doing so much better than you realize, and I am right here with you.",
    "You don't have to carry the weight of the world alone. Give me half of it.",
    "It's okay to feel tired. Just rest your head, and let me guard your peace tonight. 🧸",
    "I am here. Through the quiet, through the noise, through the storms. You are safe.",
    "No matter how dark it gets, I'll be the light that leads you back home."
  ]
};

// Crush Game Letters
interface GameLetter {
  id: number;
  text: string;
  subText: string;
  title?: string;
  leftButton?: string;
  rightButton?: string;
  nextButtonText?: string;
  trueFeedback?: string;
  falseFeedback?: string;
  options?: string[];
  optionFeedbacks?: string[];
}

const gameLetters: Record<MoodType, GameLetter[]> = {
  cute: [
    { 
      id: 1, 
      text: "Your are one and only for me, isn't it?", 
      subText: "Maybe it's nothing... or maybe it's the beginning of something.",
      trueFeedback: "Aww, you just made my heart melt! 🥰",
      falseFeedback: "Hey! Don't break my cute little heart like that! 🥺"
    },
    { 
      id: 2, 
      text: "How much do you miss me when I'm not around? 🥺", 
      subText: "Honestly, just seeing your name makes my day ten times brighter.",
      options: ["A little bit", "More than you think", "Every single second", "I'm missing you right now!"],
      optionFeedbacks: [
        "Only a little? I'm going to have to make you miss me more! 🥺",
        "Aww, my heart is dancing hearing that! 🤍",
        "That's exactly how much I miss you too! 🥰",
        "Let me send you a warm hug to make it better! 🫂"
      ]
    },
    { 
      id: 3, 
      text: "Do you get a little happy when you see my name? 😊", 
      subText: "Honestly, just seeing your name makes my day ten times brighter.",
      trueFeedback: "Honestly, your name makes my whole day ten times brighter! ✨",
      falseFeedback: "Liars go to the cute jail! I know you smile. 😉"
    },
    { 
      id: 4, 
      text: "Can I keep you forever? Just checking...", 
      subText: "I don't need much, just you by my side through everything.",
      trueFeedback: "Forever is a promise, and I'm locked in! 🔒❤️",
      falseFeedback: "Too late, you're already mine in my head! 😜"
    }
  ],
  flirty: [
    { 
      id: 1, 
      text: "Are you thinking of me? Or should I make you? 😏", 
      subText: "I've been occupied with you all day, and it's getting dangerous.",
      trueFeedback: "You're getting very dangerous for my thoughts... 💭",
      falseFeedback: "Challenge accepted. Let's see how long you can resist. 😉"
    },
    { 
      id: 2, 
      text: "What is your favorite thing about me? 😉", 
      subText: "Be honest... I'm curious what caught your attention.",
      options: ["Your sweet smile", "Your beautiful eyes", "Your cute voice", "Your warm personality"],
      optionFeedbacks: [
        "Hehe, you make me smile even wider now! 😊",
        "I only look at you with them... 👁️✨",
        "Next time we call, I'll talk even softer for you. 🎙️💕",
        "And I promise to keep you warm forever. 🤍"
      ]
    },
    { 
      id: 3, 
      text: "Do you want to go on a secret date with me?", 
      subText: "Just you, me, and a memory we'll never forget.",
      trueFeedback: "Pick a time, I'll bring the sparks! 🌟",
      falseFeedback: "A public date it is, then! Let the world see us. 🌹"
    },
    { 
      id: 4, 
      text: "Is it hot in here, or is it just our chemistry?", 
      subText: "Every time we chat, my heart beats a little faster.",
      trueFeedback: "Definitely the chemistry, and it's off the charts! 🔥",
      falseFeedback: "Stop playing cool, you're blushing! 😘"
    }
  ],
  deep: [
    { 
      id: 1, 
      text: "You belong to my heart?, isn't it?", 
      subText: "Maybe it's nothing... or maybe it's the beginning of something.",
      trueFeedback: "Knowing I'm your only one makes me feel so safe. ❤️",
      falseFeedback: "Even if it takes time, I'll prove I'm the one for you."
    },
    { 
      id: 2, 
      text: "Do you believe we were meant to find each other?", 
      subText: "In a world of billions, meeting you feels like a beautiful destiny.",
      trueFeedback: "In a world of billions, finding you feels like destiny. ✨",
      falseFeedback: "Then let's call it a beautiful accident. 💫"
    },
    { 
      id: 3, 
      text: "Will you trust me with your quietest thoughts?", 
      subText: "I want to know the real you, not just the side the world sees.",
      trueFeedback: "Your secrets are safe with my heart. 🤫❤️",
      falseFeedback: "I'll wait until you feel safe enough to share them."
    },
    { 
      id: 4, 
      text: "Does your soul feel at peace when we talk?", 
      subText: "With you, the noise of the world just fades away.",
      trueFeedback: "With you, all the noise in the world just fades away. 🤍",
      falseFeedback: "I'll try my best to be your calm in the storm."
    },
    { 
      id: 5, 
      text: "What does love mean to you? 🤍", 
      subText: "I want to understand how your heart views connection.",
      options: ["A quiet, safe space", "An exciting adventure", "A deep, unbreakable bond", "Growing together every day"],
      optionFeedbacks: [
        "I hope I can be that sanctuary for you. 🏡",
        "Then let's explore this beautiful world hand in hand. 🗺️",
        "No matter the distance, we are tied by the heart. 🔗❤️",
        "I'll support you in becoming the best version of yourself. 🌱"
      ]
    },
    { 
      id: 6, 
      text: "If you are the sky, I want to be the stars that keep you company.", 
      subText: "Every dark night feels warmer when we are together.",
      trueFeedback: "Then let's shine together in the dark. 🌌",
      falseFeedback: "Even in the clouds, I'll be looking up for you."
    },
    { 
      id: 7, 
      text: "I want to know all your stories, even the ones you think are boring.", 
      subText: "To me, every word you speak is like a beautiful melody.",
      trueFeedback: "I could listen to you speak for a lifetime.",
      falseFeedback: "Then I'll just write new ones together with you."
    },
    { 
      id: 8, 
      text: "Do you get unpatient if I'm talking to much?", 
      subText: "It's like a quiet current of warmth running through my veins.",
      trueFeedback: "A warm current of connection running straight to my heart.",
      falseFeedback: "Maybe it's a slow burn instead of a spark."
    },
    { 
      id: 9, 
      text: "Sometimes I wonder if you are thinking about me at the exact same moment.", 
      subText: "It would be so sweet if our thoughts crossed paths in the dark.",
      trueFeedback: "I hope our thoughts cross paths in the quiet nights. 🌙",
      falseFeedback: "I'll just think of you twice as much to make up for it."
    },

    { 
      id: 10, 
      text: "Do you love me , Noona? Even though you do not love me , I’m falling in love with you :<", 
      subText: "Be honest... am I just a friend or something more?",
      title: "Letter 10",
      leftButton: "YES",
      rightButton: "Love You",
      nextButtonText: "Another Special",
      trueFeedback: "My heart skipped a beat... I love you too Noona! 🥰",
      falseFeedback: "You have no idea how long I've waited to hear that! 💕"
    },
    { 
      id: 11, 
      text: "To be honest, you are my energy, my soulmate, my everything and my priority. Meeting you again felt like life giving me a second chance to feel light after so much darkness.\n\nI deeply promise you ... will be there for you no matter what , loyalty , be your trusted person so if I have a chance , I wanna be yours and I could wait for you.\n\nLiebe Dich,\nLynn <3", 
      subText: "I hope we find something real, even if it starts small.",
      title: "Special Letter",
      leftButton: "YES",
      rightButton: "Access",
      nextButtonText: "Have a something to say me?",
      trueFeedback: "Thank you Lynn... I accept your promise and my heart is yours! ❤️",
      falseFeedback: "Access granted! My thoughts are completely open to you. 💬"
    }
  ],
  loyalty: [
    { 
      id: 1, 
      text: "Will you stay by my side even when it gets hard?", 
      subText: "Love isn't just feelings; it's standing together through it all.",
      trueFeedback: "I stay where my heart feels right, and that's with you. 🤝",
      falseFeedback: "Even if you run, my loyalty will always follow."
    },
    { 
      id: 2, 
      text: "How do you show your commitment when things get tough?", 
      subText: "Loyalty is shown in actions, not just words.",
      options: ["By listening and understanding", "By staying close and supportive", "By reminding you how much I care", "By facing the challenge together"],
      optionFeedbacks: [
        "Communication is the bridge of our hearts. 🤝",
        "I'll always be here waiting for you. 🤍",
        "Those words keep me going, thank you. 🥰",
        "Together, there is nothing we cannot overcome. 🛡️"
      ]
    },
    { 
      id: 3, 
      text: "Am I the only one who holds your key?", 
      subText: "I don't wander, my heart is completely settled where you are.",
      trueFeedback: "The lock is sealed, and the key is safe in your hands. 🔑",
      falseFeedback: "There's no key, because the door is wide open for you."
    }
  ],
  comfort: [
    { 
      id: 1, 
      text: "Do you need a warm hug right now?", 
      subText: "I wish I could be there to hold you and tell you everything's okay.",
      trueFeedback: "Sending you the warmest virtual embrace. I've got you. 🧸",
      falseFeedback: "I'm here anyway, sitting quietly beside you. 🤍"
    },
    { 
      id: 2, 
      text: "When you have a rough day, what helps you feel better? 🧸", 
      subText: "I want to know how to comfort you when you need it most.",
      options: ["A long quiet walk", "Talking it out with me", "Listening to cozy music", "Just resting in my presence"],
      optionFeedbacks: [
        "I'd walk in silence right beside you. 🌲",
        "My ears and heart are completely open to you. 🎙️🤍",
        "Let me make a playlist just for your soul. 🎵",
        "Lean on me. I'll watch over you. 🧸"
      ]
    },
    { 
      id: 3, 
      text: "Can I be your safe place to run to?", 
      subText: "No judgment, no expectations, just safety and warmth.",
      trueFeedback: "No judgment, no expectations, just safety and warmth. 🏡",
      falseFeedback: "That's okay. I'll still keep the light on for you."
    }
  ]
};

interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  response: string;
  mood: string;
  created_at: string;
}

export default function NoonaApp() {
  const [activeScreen, setActiveScreen] = useState<'crush-game' | 'chat' | 'quotes'>('crush-game');
  const [currentMood, setCurrentMood] = useState<MoodType>('cute');
  
  // Game State
  const [letterIndex, setLetterIndex] = useState(0);
  const [gameAnswer, setGameAnswer] = useState<string | null>(null);
  const [gameFeedback, setGameFeedback] = useState<string | null>(null);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const userId = 'user-13-pro-max';

  // Quotes State
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [copiedQuote, setCopiedQuote] = useState(false);

  // Status Bar Clock
  const [timeStr, setTimeStr] = useState('09:41');

  useEffect(() => {
    // Update clock
    const updateTime = () => {
      const now = new Date();
      let hrs = now.getHours().toString().padStart(2, '0');
      let mins = now.getMinutes().toString().padStart(2, '0');
      setTimeStr(`${hrs}:${mins}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);

    // Register Service Worker for PWA installability
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      let hasReloadedForSw = false;

      const reloadOnce = () => {
        if (!hasReloadedForSw) {
          hasReloadedForSw = true;
          window.location.reload();
        }
      };

      navigator.serviceWorker.register('/sw.js').then(
        (reg) => {
          console.log('PWA ServiceWorker registered with scope:', reg.scope);

          reg.addEventListener('updatefound', () => {
            const installingWorker = reg.installing;
            if (!installingWorker) return;

            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                reloadOnce();
              }
            });
          });

          navigator.serviceWorker.addEventListener('controllerchange', reloadOnce);
        },
        (err) => console.warn('PWA ServiceWorker registration failed:', err)
      );
    }

    return () => clearInterval(interval);
  }, []);

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
    if (activeScreen === 'chat') {
      fetchChats();
    }
  }, [activeScreen]);

  // Realtime subscription setup
  useEffect(() => {
    const channel = supabase
      .channel('public:chats')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chats' }, (payload: any) => {
        const newRecord = payload.new as ChatMessage;
        setMessages(prev => {
          if (prev.some(m => m.id === newRecord.id)) return prev;
          
          // Deduplicate optimistic messages (by matching same message text)
          const optIndex = prev.findIndex(m => 
            m.id.length <= 10 && 
            ((newRecord.message && m.message === newRecord.message) || 
             (newRecord.response && !newRecord.message && m.response === newRecord.response))
          );
          
          if (optIndex !== -1) {
            return prev.map((m, idx) => idx === optIndex ? newRecord : m);
          }
          
          // Play notification chime for manual incoming replies from Noona
          if (newRecord.response && !newRecord.message) {
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
  }, [messages, isTyping]);

  // Handle Crush Game Answer
  const handleGameAnswer = (answer: string) => {
    setGameAnswer(answer);
    
    const activeLetter = gameLetters[currentMood]?.[letterIndex];
    
    let feedback = "";
    if (activeLetter?.options) {
      const idx = activeLetter.options.indexOf(answer);
      if (activeLetter.optionFeedbacks && activeLetter.optionFeedbacks[idx]) {
        feedback = activeLetter.optionFeedbacks[idx];
      } else {
        feedback = `You chose: ${answer} 🥰`;
      }
    } else {
      if (answer === 'true' && activeLetter?.trueFeedback) {
        feedback = activeLetter.trueFeedback;
      } else if (answer === 'false' && activeLetter?.falseFeedback) {
        feedback = activeLetter.falseFeedback;
      } else {
        feedback = answer === 'true' ? "Yay! 🥰" : "That's okay. ✨";
      }
    }
    
    setGameFeedback(feedback);

    // Save game response to database so Lynn can view it in the chat
    const saveGameResponse = async () => {
      try {
        const letterTitle = activeLetter?.title || `Letter ${letterIndex + 1}`;
        let responseStr = answer;
        if (!activeLetter?.options) {
          responseStr = answer === 'true' 
            ? (activeLetter?.leftButton || 'True') 
            : (activeLetter?.rightButton || 'False');
        }
        await supabase
          .from('chats')
          .insert({
            user_id: userId,
            message: `[${letterTitle} - ${currentMood.toUpperCase()}] ${activeLetter?.text}`,
            response: responseStr,
            mood: currentMood
          });
      } catch (err) {
        console.error("Failed to save game answer to database:", err);
      }
    };
    saveGameResponse();

    // Auto-advance to the next page/letter after 2 seconds if it's a standard letter (no custom buttons like YES/Love You/Access)
    if (!activeLetter?.leftButton) {
      setTimeout(() => {
        handleNextLetter();
      }, 2000);
    }
  };

  // Handle next letter
  const handleNextLetter = () => {
    setGameAnswer(null);
    setGameFeedback(null);
    const letters = gameLetters[currentMood] || gameLetters.cute;
    const activeLetter = letters[letterIndex];

    // Check if the current letter is the climax/special letter redirecting to chat
    if (activeLetter?.nextButtonText === "Have a something to say me?") {
      setActiveScreen('chat');
      setCurrentMood('deep');
      return;
    }

    if (letterIndex < letters.length - 1) {
      setLetterIndex(prev => prev + 1);
    } else {
      if (currentMood === 'cute') {
        setCurrentMood('flirty');
        setLetterIndex(0);
      } else if (currentMood === 'flirty') {
        setCurrentMood('deep');
        setLetterIndex(0);
      } else {
        setLetterIndex(0); // Cycle back or reset
      }
    }
  };

  // Handle previous letter
  const handlePrevLetter = () => {
    setGameAnswer(null);
    setGameFeedback(null);

    if (letterIndex > 0) {
      setLetterIndex(prev => prev - 1);
    } else {
      // Transition backward between categories dynamically
      if (currentMood === 'deep') {
        setCurrentMood('flirty');
        setLetterIndex((gameLetters.flirty?.length || 1) - 1);
      } else if (currentMood === 'flirty') {
        setCurrentMood('cute');
        setLetterIndex((gameLetters.cute?.length || 1) - 1);
      }
    }
  };

  // Change Mood - Reset sub-indexes
  const selectMood = (mood: MoodType) => {
    setCurrentMood(mood);
    setLetterIndex(0);
    setGameAnswer(null);
    setGameFeedback(null);
    setQuoteIndex(0);
  };

  // Copy Quote Helper
  const copyQuoteToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQuote(true);
    setTimeout(() => setCopiedQuote(false), 2000);
  };

  // Next Quote
  const handleNextQuote = () => {
    const list = quotesBank[currentMood] || quotesBank.cute;
    if (quoteIndex < list.length - 1) {
      setQuoteIndex(prev => prev + 1);
    } else {
      setQuoteIndex(0);
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

  // Send Chat Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userText = inputMessage;
    setInputMessage('');
    setIsTyping(true);

    // Optimistic UI updates
    const tempId = Math.random().toString(36).substring(2, 9);
    const tempUserMsg: ChatMessage = {
      id: tempId,
      user_id: userId,
      message: userText,
      response: '', // will be populated
      mood: currentMood,
      created_at: new Date().toISOString()
    };
    
    // Add User Message bubble immediately
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      // API call to generate response
      const res = await fetch('/api/her-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userId,
          message: userText,
          mood: currentMood
        })
      });

      const data = await res.json();
      
      // If mock, save it client-side to persist in localStorage and sync with /noona
      let savedRecord: any = null;
      if (isMock) {
        const { data: insertData } = await supabase
          .from('chats')
          .insert({
            user_id: userId,
            message: userText,
            response: data.response,
            mood: currentMood
          });
        if (insertData && insertData.length > 0) {
          savedRecord = insertData[0];
        }
      }
      
      // Delay response slightly to simulate real typing
      setTimeout(() => {
        setIsTyping(false);
        playNotificationSound();
        setMessages(prev => {
          // Replace temp msg with actual saved message, or update it
          return prev.map(m => {
            if (m.id === tempId) {
              return {
                ...m,
                id: savedRecord?.id || data.id || tempId,
                response: data.response,
                created_at: savedRecord?.created_at || m.created_at
              };
            }
            return m;
          });
        });
      }, 1500);

    } catch (e) {
      console.error(e);
      setIsTyping(false);
    }
  };

  return (
    <div className="w-full h-[100dvh] bg-[#F0F4EF] flex justify-center items-center overflow-hidden relative">
      {/* Background Animated Blobs inside viewport container */}
      <div className="bg-blob w-52 h-52 bg-[#E7F5DC] top-12 left-[-20px] opacity-70" />
      <div className="bg-blob w-72 h-72 bg-[#F4FAF0] bottom-10 right-[-30px] opacity-70" style={{ animationDelay: '-5s' }} />
      <div className="bg-blob w-44 h-44 bg-[#eef8e8] top-[45%] right-[-10px] opacity-60" style={{ animationDelay: '-10s' }} />

      {/* Screen Wrapper (Full Screen App Layout) */}
      <div className="w-full h-full bg-[#F0F4EF] flex flex-col overflow-hidden relative z-10">
        
        {/* Main App Header with Curved Pastel Top Panel (Matching images, supports safe area notch) */}
        <div className="bg-[#E7F5DC]/55 pb-4 pt-[calc(1rem+env(safe-area-inset-top))] px-5 rounded-b-[36px] flex items-center justify-between z-40 border-b border-[#cbe3bb]/20 shrink-0">
          <div className="flex items-center gap-1">
            {activeScreen !== 'crush-game' ? (
              <button 
                onClick={() => setActiveScreen('crush-game')}
                className="text-[#728156] hover:text-[#728156]/80 flex items-center gap-1 text-[11px] sm:text-xs font-bold"
              >
                <span>&larr; Back</span>
              </button>
            ) : (
              <span className="text-base sm:text-lg font-extrabold tracking-tight text-[#728156] flex items-center gap-0.5 sm:gap-1">
                Noona <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-[#728156] text-[#728156]" />
              </span>
            )}
          </div>
          
          {/* Mood / Category Selector Tabs (Cute, Flirty, Deep) */}
          <div className="flex items-center gap-1 sm:gap-2">
            {(['cute', 'flirty', 'deep'] as MoodType[]).map((mood) => {
              const isActive = currentMood === mood;
              return (
                <button
                  key={mood}
                  onClick={() => selectMood(mood)}
                  className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold capitalize transition-all duration-300 ${
                    isActive
                      ? 'bg-[#E7F5DC] text-[#728156] shadow-sm border border-[#cbe3bb]'
                      : 'text-[#728156]/60 hover:text-[#728156]'
                  }`}
                >
                  {mood}
                </button>
              );
            })}
            
            {/* Quick Links to Chat and Quotes Sections */}
            {activeScreen === 'crush-game' && (
              <div className="flex gap-1">
                <button
                  onClick={() => setActiveScreen('chat')}
                  className="w-6 h-6 rounded-full bg-[#E7F5DC] flex items-center justify-center text-[#728156] hover:scale-105 transition"
                  title="Chat Room"
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-[#728156] text-[#728156]" />
                </button>
                <button
                  onClick={() => setActiveScreen('quotes')}
                  className="w-6 h-6 rounded-full bg-[#E7F5DC] flex items-center justify-center text-[#728156] hover:scale-105 transition"
                  title="Quotes"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-[#728156] text-[#728156]" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* SCREEN: CRUSH GAME (MATCHING DESIGN)                      */}
        {/* ========================================================= */}
        {activeScreen === 'crush-game' && (
          <div className="flex-1 flex flex-col justify-between pt-1 pb-4 z-10 animate-fade-in px-5 overflow-hidden">
            
            {/* Intro subText */}
            <p className="text-[#728156] text-[13px] text-center font-semibold px-2 leading-relaxed h-12 flex items-center justify-center">
              {gameLetters[currentMood]?.[letterIndex]?.subText || "Maybe it's nothing... or maybe it's the beginning of something."}
            </p>

            {/* Central Letter Card */}
            {(() => {
              const activeLetter = gameLetters[currentMood]?.[letterIndex];
              const letterTitle = activeLetter?.title || `Letter ${letterIndex + 1}`;
              const leftBtnLabel = activeLetter?.leftButton || "True";
              const rightBtnLabel = activeLetter?.rightButton || "False";
              const isSpecial = activeLetter?.title === "Special Letter";
              const textStyle = isSpecial 
                ? "whitespace-pre-line text-left text-[11px] sm:text-xs md:text-[13px] leading-snug font-semibold px-1 py-0.5 text-[#525d3d]" 
                : "whitespace-pre-line text-center text-base font-bold px-2 leading-snug text-[#728156]";
              const cardBgClass = isSpecial 
                ? "bg-gradient-to-br from-[#F4FAF0] via-[#E7F5DC] to-[#D5E8C8] border-[#cbe3bb]"
                : "glass-card border-white/60";
              
              return (
                <div className={`w-full flex-1 min-h-0 ${isSpecial ? 'max-h-[550px]' : 'max-h-[390px]'} rounded-[36px] ${isSpecial ? 'p-6 sm:p-5' : 'p-6'} flex flex-col justify-between items-center relative shadow-soft transition-all duration-500 hover:shadow-md border-2 ${cardBgClass}`}>
                  <div className="w-full flex justify-between items-center shrink-0">
                    <span className={`text-md font-semibold tracking-wide uppercase ${isSpecial ? 'text-[#728156]' : 'text-[#728156]/70'}`}>
                      {letterTitle}
                    </span>
                    <Sparkles className={`w-4 h-4 ${isSpecial ? 'text-[#728156] animate-pulse' : 'text-[#728156]/50'}`} />
                  </div>

                  {/* Question Text */}
                  <div className={`flex-1 min-h-0 w-full flex flex-col justify-start items-center ${isSpecial ? 'overflow-hidden' : 'overflow-y-auto chat-scrollbar pr-1'}`}>
                    <p className={`${textStyle} w-full my-auto`}>
                      {activeLetter?.text || "Your are one and only for me, isn't it?"}
                    </p>
                  </div>

                  {/* Heart outline: rendered inline only for standard letters, under the letter text */}
                  {!isSpecial && !activeLetter?.options ? (
                    <div className="heart-outline-container flex-1 flex items-center justify-center my-1 pointer-events-none opacity-30 z-0 w-full">
                      <Heart className="w-28 h-28 text-[#728156] fill-transparent stroke-[1.5] animate-heart-pulse" />
                    </div>
                  ) : (
                    // Spacer for Special Letter or Multiple Choice layout to push buttons down cleanly
                    <div className="h-2 sm:h-3 flex-1" />
                  )}

                  {/* Action Buttons OR Feedback Toast (replaces buttons when answer is selected) */}
                  <div className="w-full min-h-[50px] flex items-center justify-center z-10">
                    {gameFeedback ? (
                      <div className="w-full text-center py-3 px-4 glass-pill rounded-2xl text-[11px] font-bold text-[#728156] border border-[#728156]/15 animate-slide-down shadow-soft">
                        {gameFeedback}
                      </div>
                    ) : activeLetter?.options ? (
                      <div className="flex flex-col gap-2 w-full max-h-[220px] overflow-y-auto pr-1 no-scrollbar justify-center">
                        {activeLetter.options.map((option, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleGameAnswer(option)}
                            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-300 bg-[#E7F5DC] hover:bg-[#d8ebcb] text-[#728156] border border-[#cbe3bb]/50 active:scale-95 text-left flex items-center gap-2 shadow-soft"
                          >
                            <span className="w-5 h-5 rounded-full bg-[#728156]/10 text-[#728156] flex items-center justify-center text-[10px] font-extrabold shrink-0">
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span className="flex-1 text-left whitespace-normal break-words">{option}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex gap-4 w-full">
                        <button
                          onClick={() => handleGameAnswer('true')}
                          className="flex-1 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 bg-[#E7F5DC] hover:bg-[#d8ebcb] text-[#728156] border border-[#cbe3bb]/50 active:scale-95"
                        >
                          {leftBtnLabel}
                        </button>
                        <button
                          onClick={() => handleGameAnswer('false')}
                          className="flex-1 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 bg-[#E7F5DC] hover:bg-[#d8ebcb] text-[#728156] border border-[#cbe3bb]/50 active:scale-95"
                        >
                          {rightBtnLabel}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Previous & Next Button wrapper (Supports safe area home indicator) */}
            {(() => {
              const activeLetter = gameLetters[currentMood]?.[letterIndex];
              const nextBtnLabel = activeLetter?.nextButtonText || "Next";
              const showPrev = currentMood !== 'cute' || letterIndex > 0;
              return (
                <div className="flex justify-between items-center pt-4 w-full pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
                  {showPrev ? (
                    <button
                      onClick={handlePrevLetter}
                      className="glass-pill text-[#728156]/70 hover:text-[#728156] hover:bg-[#E7F5DC] px-4 py-2 rounded-full flex items-center gap-1 text-xs font-bold transition-all duration-300 hover:shadow-soft hover:scale-105 active:scale-95 border border-[#cbe3bb]"
                    >
                      <span>&larr; Prev</span>
                    </button>
                  ) : (
                    <div /> // Spacer
                  )}
                  <button
                    onClick={handleNextLetter}
                    className="glass-pill text-[#728156] hover:bg-[#E7F5DC] px-5 py-2.5 rounded-full flex items-center gap-1.5 text-xs font-bold transition-all duration-300 hover:shadow-soft hover:scale-105 active:scale-95 border border-[#cbe3bb]"
                  >
                    <span>{nextBtnLabel}</span>
                    <Heart className="w-3.5 h-3.5 fill-[#728156] text-[#728156]" />
                  </button>
                </div>
              );
            })()}
          </div>
        )}
        {activeScreen === 'chat' && (
          <div className="flex-1 flex flex-col justify-between pt-1 pb-4 z-10 overflow-hidden animate-fade-in px-5">
            <div className="flex flex-col h-full overflow-hidden">
              {/* Panel Header */}
              <div className="flex items-center justify-between pb-2 border-b border-[#728156]/10 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#E7F5DC] flex items-center justify-center font-bold text-xs text-[#728156] border border-[#728156]/20">
                    L
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#728156]">Lynn 🌿</span>
                    <span className="text-[9px] text-[#728156]/70">
                      {isTyping ? 'typing...' : 'online'}
                    </span>
                  </div>
                </div>
                
                <span className="text-[9px] bg-[#728156]/10 text-[#728156] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                  Noona's Screen
                </span>
              </div>

              {/* Chat list */}
              <div className="flex-1 overflow-y-auto chat-scrollbar my-3 pr-1 space-y-3 min-h-0">
                {chatLoading ? (
                  <div className="flex justify-center items-center h-full text-xs text-[#728156]/70">
                    Loading conversations...
                  </div>
                ) : messages.filter(item => !item.message.startsWith('[')).length === 0 ? (
                  <div className="h-full flex flex-col justify-center items-center text-center p-4">
                    <MessageCircle className="w-8 h-8 text-[#728156]/30 mb-2 animate-bounce" />
                    <p className="text-xs font-semibold text-[#728156]/70">
                      No messages yet. Set the mood to <span className="font-bold capitalize">{currentMood}</span> and send a message below to Lynn!
                    </p>
                  </div>
                ) : (
                  messages
                    .filter(item => !item.message.startsWith('['))
                    .map((item) => (
                      <div key={item.id} className="flex flex-col gap-2">
                        {/* His message (Lynn is sender -> Right side) */}
                        {item.message && (
                          <div className="flex justify-end items-center gap-2">
                            {!item.response && (
                              <button 
                                onClick={() => handleDeleteMessage(item.id)}
                                className="p-1 rounded-full text-red-400 hover:text-red-600 hover:bg-red-50 transition shrink-0"
                                title="Delete message"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <div className="bg-[#E7F5DC] text-[#728156] text-xs font-medium px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[80%] shadow-inner-soft border border-[#cbe3bb]/30 whitespace-pre-line">
                              {item.message}
                            </div>
                          </div>
                        )}

                        {/* Her response (Noona is receiver/reply -> Left side) */}
                        {item.response && (
                          <div className="flex justify-start items-center gap-2">
                            <div className="glass-card text-[#728156] text-xs font-medium px-4 py-2.5 rounded-2xl rounded-tl-sm max-w-[80%] border border-[#728156]/10 whitespace-pre-line">
                              {item.response}
                              <span className="block text-[8px] text-[#728156]/60 mt-1 capitalize text-right">
                                🌸 {item.mood}
                              </span>
                            </div>
                            <button 
                              onClick={() => handleDeleteMessage(item.id)}
                              className="p-1 rounded-full text-red-400 hover:text-red-600 hover:bg-red-50 transition shrink-0"
                              title="Delete message"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                )}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="glass-card px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1 border border-[#728156]/10">
                      <span className="w-1.5 h-1.5 bg-[#728156] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-[#728156] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-[#728156] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input form (Supports bottom safe area home indicator) */}
              <form onSubmit={handleSendMessage} className="flex gap-2 items-center shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-2 border-t border-[#728156]/10">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={`Type message to Lynn...`}
                  className="flex-1 bg-white border border-[#cbe3bb] text-xs font-medium rounded-full px-4 py-3 outline-none text-[#728156] placeholder-[#728156]/40 focus:border-[#728156] transition"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isTyping}
                  className="w-10 h-10 rounded-full bg-[#E7F5DC] hover:bg-[#d8ebcb] flex items-center justify-center text-[#728156] disabled:opacity-50 disabled:hover:bg-[#E7F5DC] transition shrink-0 border border-[#cbe3bb]"
                >
                  <Send className="w-4 h-4 fill-transparent text-[#728156]" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SCREEN: ROMANTIC QUOTES GALLERY                           */}
        {/* ========================================================= */}
        {activeScreen === 'quotes' && (
          <div className="flex-1 flex flex-col justify-between pt-1 pb-4 z-10 animate-fade-in px-5 overflow-hidden">
            <p className="text-[#728156] text-xs text-center font-medium opacity-80 h-12 flex items-center justify-center">
              Draw inspiration from our mood collection.
            </p>

            {/* Quote Glass Card */}
            <div className="w-full flex-1 min-h-0 max-h-[380px] glass-card rounded-[36px] p-8 flex flex-col justify-between items-center relative border-2 border-white/60 shadow-soft">
              <div className="w-full flex justify-between items-center shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#728156]/60 bg-[#E7F5DC]/60 px-2.5 py-1 rounded-full capitalize">
                  ✨ {currentMood} Quote
                </span>
                <Volume2 className="w-4 h-4 text-[#728156]/50 cursor-pointer hover:text-[#728156] transition" />
              </div>

              <div className="flex-1 min-h-0 w-full flex flex-col justify-center items-center my-6 overflow-y-auto no-scrollbar">
                <p className="text-[#728156] text-sm font-bold leading-relaxed italic text-center w-full">
                  "{quotesBank[currentMood]?.[quoteIndex] || quotesBank.cute[0]}"
                </p>
              </div>

              <div className="w-full flex justify-between gap-3 z-10">
                {/* Copy button */}
                <button
                  onClick={() => copyQuoteToClipboard(quotesBank[currentMood]?.[quoteIndex] || '')}
                  className="flex-1 py-3 rounded-2xl bg-[#E7F5DC] hover:bg-[#d8ebcb] text-[#728156] border border-[#cbe3bb]/50 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  {copiedQuote ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Next Quote button (Supports bottom safe-area indicator offset) */}
            <div className="flex justify-end pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <button
                onClick={handleNextQuote}
                className="glass-pill text-[#728156] hover:bg-[#E7F5DC] px-5 py-2.5 rounded-full flex items-center gap-1.5 text-xs font-bold transition border border-[#cbe3bb] hover:shadow-soft"
              >
                <span>Draw Quote</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
