import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isMockEnabled = 
  !supabaseUrl || 
  !supabaseAnonKey || 
  supabaseUrl.includes('your-project.supabase.co') || 
  supabaseAnonKey.includes('your-anon-key');

export const isMock = isMockEnabled;

let realSupabase: any = null;
if (!isMockEnabled) {
  try {
    realSupabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (e) {
    console.warn("Failed to create real Supabase client, falling back to mock:", e);
  }
}

interface ChatRecord {
  id: string;
  user_id: string;
  message: string;
  response: string;
  mood: string;
  created_at: string;
}

const getMockChats = (): ChatRecord[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('noona_chats');
  return stored ? JSON.parse(stored) : [];
};

const saveMockChat = (chat: Omit<ChatRecord, 'id' | 'created_at'>) => {
  if (typeof window === 'undefined') return null;
  const newChat: ChatRecord = {
    ...chat,
    id: typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' 
      ? crypto.randomUUID() 
      : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
    created_at: new Date().toISOString()
  };
  const current = getMockChats();
  const updated = [...current, newChat];
  localStorage.setItem('noona_chats', JSON.stringify(updated));
  return newChat;
};

class MockBuilder {
  private table: string;
  private orderColumn: string = 'created_at';
  private orderAscending: boolean = true;

  constructor(table: string) {
    this.table = table;
  }

  select(columns: string = '*') {
    return this;
  }

  order(column: string, { ascending = true } = {}) {
    this.orderColumn = column;
    this.orderAscending = ascending;
    return this;
  }

  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    return this.execute().then(onfulfilled, onrejected);
  }

  private async execute() {
    if (this.table === 'chats') {
      const chats = getMockChats();
      const sorted = chats.sort((a, b) => {
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        return this.orderAscending ? timeA - timeB : timeB - timeA;
      });
      return { data: sorted, error: null };
    }
    return { data: [], error: null };
  }
}

export const supabase: any = {
  from(table: string) {
    if (!isMockEnabled && realSupabase) {
      return realSupabase.from(table);
    }
    
    return {
      select(columns: string = '*') {
        return new MockBuilder(table);
      },
      async insert(records: any | any[]) {
        if (table === 'chats') {
          const recordList = Array.isArray(records) ? records : [records];
          const saved: any[] = [];
          for (const rec of recordList) {
            const result = saveMockChat({
              user_id: rec.user_id || 'guest-user',
              message: rec.message || '',
              response: rec.response || '',
              mood: rec.mood || 'cute'
            });
            if (result) saved.push(result);
          }
          // Trigger mock event subscription if anyone is listening (for Realtime Simulation)
          if (typeof window !== 'undefined') {
            const event = new CustomEvent('mock-chat-inserted', { detail: saved });
            window.dispatchEvent(event);
          }
          return { data: saved, error: null };
        }
        return { data: [], error: null };
      }
    };
  },
  
  // Realtime subscription helper
  channel(channelName: string) {
    if (!isMockEnabled && realSupabase) {
      return realSupabase.channel(channelName);
    }
    
    // Mock channel
    return {
      on(eventType: string, filter: any, callback: (payload: any) => void) {
        if (typeof window !== 'undefined') {
          const handler = (event: Event) => {
            const records = (event as CustomEvent).detail;
            for (const record of records) {
              callback({
                eventType: 'INSERT',
                new: record
              });
            }
          };

          const storageHandler = (e: StorageEvent) => {
            if (e.key === 'noona_chats' && e.newValue) {
              try {
                const oldChats = e.oldValue ? JSON.parse(e.oldValue) : [];
                const newChats = JSON.parse(e.newValue);
                // Find records in newChats that aren't in oldChats (by ID)
                const newRecords = newChats.filter(
                  (nc: any) => !oldChats.some((oc: any) => oc.id === nc.id)
                );
                for (const record of newRecords) {
                  callback({
                    eventType: 'INSERT',
                    new: record
                  });
                }
              } catch (err) {
                console.error("Error parsing storage sync event:", err);
              }
            }
          };
          
          window.addEventListener('mock-chat-inserted', handler);
          window.addEventListener('storage', storageHandler);
          
          return {
            subscribe() {
              return {
                unsubscribe() {
                  window.removeEventListener('mock-chat-inserted', handler);
                  window.removeEventListener('storage', storageHandler);
                }
              };
            }
          };
        }
        return {
          subscribe() {
            return { unsubscribe() {} };
          }
        };
      }
    };
  }
};
