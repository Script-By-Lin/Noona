You are a senior full-stack engineer.

Build a Romantic Quotes + Crush Game + Chat Response system using:

- Next.js 16+ (App Router)
- TypeScript
- Tailwind CSS
- Supabase (PostgreSQL + Auth + Realtime)

-----------------------------------
🎯 FEATURE: HER RESPONSE CHAT SYSTEM
-----------------------------------

Create a real chat system where users send messages and receive “her response”.

-----------------------------------
📦 SUPABASE TABLES
-----------------------------------

1. chats
- id (uuid, primary key)
- user_id (uuid)
- message (text)
- response (text)
- mood (text)
- created_at (timestamp)

2. profiles (optional)
- id (uuid)
- name (text)

-----------------------------------
🔌 API ROUTE
-----------------------------------

POST /api/her-response

-----------------------------------
📥 REQUEST BODY
-----------------------------------
{
  "userId": string,
  "message": string,
  "mood": "cute" | "flirty" | "deep" | "loyalty" | "comfort"
}

-----------------------------------
📤 RESPONSE BODY
-----------------------------------
{
  "message": string,
  "response": string,
  "mood": string,
  "saved": boolean
}

-----------------------------------
🧠 CORE LOGIC
-----------------------------------

1. Generate response based on mood:
   - cute → soft, sweet replies
   - flirty → playful romantic replies
   - deep → emotional meaningful replies
   - loyalty → commitment-based replies
   - comfort → supportive replies

2. Insert conversation into Supabase:

INSERT INTO chats (user_id, message, response, mood)

3. Return saved result to frontend

-----------------------------------
🧠 OPTIONAL AI MODE (if enabled)
-----------------------------------

If OPENAI_KEY exists:
- Generate response dynamically
- Keep response max 2 sentences
- Tone must match mood
- No explicit content
- Always romantic + respectful

-----------------------------------
⚡ SUPABASE CLIENT SETUP
-----------------------------------

Create:
/lib/supabaseClient.ts

Use:
- @supabase/supabase-js

-----------------------------------
📁 BACKEND STRUCTURE
-----------------------------------

/app/api/her-response/route.ts
/lib/supabaseClient.ts
/lib/responseBank.ts
/lib/moodEngine.ts

-----------------------------------
💬 RESPONSE BANK EXAMPLES
-----------------------------------

Cute:
- "Aww you just made me smile 😊"
- "You’re really sweet you know that?"

Flirty:
- "You’re getting a little dangerous for my thoughts 😏"
- "Stop… you’re making me like you more"

Deep:
- "I feel something real when I talk to you"
- "You mean more than you think"

Loyalty:
- "I stay where my heart feels right"
- "I’m not going anywhere"

Comfort:
- "I’m here… you’re not alone"
- "Take your time, I’ve got you"

-----------------------------------
🧠 FRONTEND CHAT UI
-----------------------------------

- Chat bubble UI (WhatsApp style)
- User message + her response
- Loading animation (typing indicator)
- Auto-scroll chat
- Save chat history from Supabase

-----------------------------------
⚡ REALTIME FEATURE (OPTIONAL)
-----------------------------------

Use Supabase Realtime:
- Listen for new chat inserts
- Live update chat UI without refresh

-----------------------------------
🎯 GOAL
-----------------------------------

Build a scalable romantic chat system where:
- messages are stored in Supabase
- responses are generated dynamically
- UI feels like real emotional conversation