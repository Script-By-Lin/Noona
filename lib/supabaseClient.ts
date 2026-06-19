import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

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

            // Broadcast to other tabs
            try {
              const bc = new BroadcastChannel('noona-chats-realtime');
              bc.postMessage({ type: 'INSERT', records: saved });
              bc.close();
            } catch (e) {
              console.error("Failed to broadcast insert event:", e);
            }
          }
          return { data: saved, error: null };
        }
        return { data: [], error: null };
      },
      update(values: any) {
        return {
          async eq(column: string, value: any) {
            if (table === 'chats' && typeof window !== 'undefined') {
              const chats = getMockChats();
              let updatedRecord: any = null;
              const updated = chats.map((c: any) => {
                if (c[column] === value) {
                  updatedRecord = { ...c, ...values };
                  return updatedRecord;
                }
                return c;
              });
              localStorage.setItem('noona_chats', JSON.stringify(updated));
              
              if (updatedRecord) {
                // Trigger local update event
                const event = new CustomEvent('mock-chat-updated', { detail: [updatedRecord] });
                window.dispatchEvent(event);

                // Broadcast to other tabs
                try {
                  const bc = new BroadcastChannel('noona-chats-realtime');
                  bc.postMessage({ type: 'UPDATE', records: [updatedRecord] });
                  bc.close();
                } catch (e) {
                  console.error("Failed to broadcast update event:", e);
                }
              }
            }
            return { data: [], error: null };
          }
        };
      },
      delete() {
        return {
          async eq(column: string, value: any) {
            if (table === 'chats' && typeof window !== 'undefined') {
              const chats = getMockChats();
              const filtered = chats.filter((c: any) => c[column] !== value);
              localStorage.setItem('noona_chats', JSON.stringify(filtered));
              
              // Trigger realtime sync event
              const event = new CustomEvent('mock-chat-deleted', { detail: { column, value } });
              window.dispatchEvent(event);

              // Broadcast to other tabs
              try {
                const bc = new BroadcastChannel('noona-chats-realtime');
                if (column === 'id') {
                  bc.postMessage({ type: 'DELETE', value });
                } else if (column === 'user_id') {
                  bc.postMessage({ type: 'DELETE_ALL', value });
                }
                bc.close();
              } catch (e) {
                console.error("Failed to broadcast delete event:", e);
              }
            }
            return { data: [], error: null };
          }
        };
      }
    };
  },
  
  // Realtime subscription helper
  channel(channelName: string) {
    if (!isMockEnabled && realSupabase) {
      return realSupabase.channel(channelName);
    }
    
    // Mock channel supporting multiple .on() and chaining
    const listeners: Array<{ event: string; callback: (payload: any) => void }> = [];
    
    const channelObj = {
      on(eventType: string, filter: any, callback: (payload: any) => void) {
        const filterEvent = filter?.event || 'INSERT';
        listeners.push({ event: filterEvent, callback });
        return channelObj; // Return self for chaining!
      },
      subscribe() {
        if (typeof window !== 'undefined') {
          const insertHandler = (event: Event) => {
            const records = (event as CustomEvent).detail;
            for (const record of records) {
              const payload = { eventType: 'INSERT', new: record };
              listeners
                .filter(l => l.event === 'INSERT' || l.event === '*')
                .forEach(l => l.callback(payload));
            }
          };

          const updateHandler = (event: Event) => {
            const records = (event as CustomEvent).detail;
            for (const record of records) {
              const payload = { eventType: 'UPDATE', new: record };
              listeners
                .filter(l => l.event === 'UPDATE' || l.event === '*')
                .forEach(l => l.callback(payload));
            }
          };

          const deleteHandler = (event: Event) => {
            const { column, value } = (event as CustomEvent).detail;
            if (column === 'id') {
              const payload = { eventType: 'DELETE', old: { id: value } };
              listeners
                .filter(l => l.event === 'DELETE' || l.event === '*')
                .forEach(l => l.callback(payload));
            } else if (column === 'user_id') {
              const payload = { eventType: 'DELETE_ALL', old: { user_id: value } };
              listeners
                .filter(l => l.event === 'DELETE_ALL' || l.event === '*')
                .forEach(l => l.callback(payload));
            }
          };

          // BroadcastChannel receiver
          let bc: BroadcastChannel | null = null;
          try {
            bc = new BroadcastChannel('noona-chats-realtime');
            bc.onmessage = (event) => {
              const { type, records, value } = event.data;
              if (type === 'INSERT') {
                for (const record of records) {
                  const payload = { eventType: 'INSERT', new: record };
                  listeners
                    .filter(l => l.event === 'INSERT' || l.event === '*')
                    .forEach(l => l.callback(payload));
                }
              } else if (type === 'UPDATE') {
                for (const record of records) {
                  const payload = { eventType: 'UPDATE', new: record };
                  listeners
                    .filter(l => l.event === 'UPDATE' || l.event === '*')
                    .forEach(l => l.callback(payload));
                }
              } else if (type === 'DELETE') {
                const payload = { eventType: 'DELETE', old: { id: value } };
                listeners
                  .filter(l => l.event === 'DELETE' || l.event === '*')
                  .forEach(l => l.callback(payload));
              } else if (type === 'DELETE_ALL') {
                const payload = { eventType: 'DELETE_ALL', old: { user_id: value } };
                listeners
                  .filter(l => l.event === 'DELETE_ALL' || l.event === '*')
                  .forEach(l => l.callback(payload));
              }
            };
          } catch (e) {
            console.error("Failed to setup BroadcastChannel in mock subscriber:", e);
          }

          const storageHandler = (e: StorageEvent) => {
            if (e.key === 'noona_chats') {
              if (e.newValue) {
                try {
                  const oldChats = e.oldValue ? JSON.parse(e.oldValue) : [];
                  const newChats = JSON.parse(e.newValue);
                  
                  // Find records in newChats that aren't in oldChats (by ID)
                  const newRecords = newChats.filter(
                    (nc: any) => !oldChats.some((oc: any) => oc.id === nc.id)
                  );
                  for (const record of newRecords) {
                    const payload = { eventType: 'INSERT', new: record };
                    listeners
                      .filter(l => l.event === 'INSERT' || l.event === '*')
                      .forEach(l => l.callback(payload));
                  }

                  // Find updated records (same ID, different content)
                  const updatedRecords = newChats.filter((nc: any) => {
                    const oc = oldChats.find((o: any) => o.id === nc.id);
                    return oc && (oc.message !== nc.message || oc.response !== nc.response || oc.mood !== nc.mood);
                  });
                  for (const record of updatedRecords) {
                    const payload = { eventType: 'UPDATE', new: record };
                    listeners
                      .filter(l => l.event === 'UPDATE' || l.event === '*')
                      .forEach(l => l.callback(payload));
                  }
                  
                  // Find deleted records (in oldChats but not in newChats)
                  const deletedRecords = oldChats.filter(
                    (oc: any) => !newChats.some((nc: any) => nc.id === oc.id)
                  );
                  for (const record of deletedRecords) {
                    const payload = { eventType: 'DELETE', old: record };
                    listeners
                      .filter(l => l.event === 'DELETE' || l.event === '*')
                      .forEach(l => l.callback(payload));
                  }
                } catch (err) {
                  console.error("Error parsing storage sync event:", err);
                }
              } else {
                // LocalStorage cleared
                const payload = { eventType: 'DELETE_ALL', old: {} };
                listeners
                  .filter(l => l.event === 'DELETE_ALL' || l.event === '*')
                  .forEach(l => l.callback(payload));
              }
            }
          };
          
          window.addEventListener('mock-chat-inserted', insertHandler);
          window.addEventListener('mock-chat-updated', updateHandler);
          window.addEventListener('mock-chat-deleted', deleteHandler);
          window.addEventListener('storage', storageHandler);
          
          return {
            unsubscribe() {
              window.removeEventListener('mock-chat-inserted', insertHandler);
              window.removeEventListener('mock-chat-updated', updateHandler);
              window.removeEventListener('mock-chat-deleted', deleteHandler);
              window.removeEventListener('storage', storageHandler);
              if (bc) {
                bc.close();
              }
            }
          };
        }
        return {
          unsubscribe() {}
        };
      }
    };
    
    return channelObj;
  }
};
