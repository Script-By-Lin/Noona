import { responseBank, MoodType } from './responseBank';

// Simple check for OpenAI API Key.
const hasOpenAI = !!process.env.OPENAI_API_KEY;

export async function generateResponse(
  message: string,
  mood: MoodType
): Promise<string> {
  if (hasOpenAI) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a loving, romantic, and extremely supportive partner.
              Generate a reply to your partner's message.
              Requirements:
              - Tone must be strictly ${mood} (cute = soft & sweet; flirty = playful & romantic; deep = emotional & meaningful; loyalty = commitment-based; comfort = supportive & understanding).
              - Maximum 2 sentences.
              - Absolutely no explicit, NSFW, or inappropriate content.
              - Always romantic, respectful, and warm.`
            },
            {
              role: 'user',
              content: message
            }
          ],
          max_tokens: 80,
          temperature: 0.8
        })
      });

      const data = await response.json();
      const aiReply = data.choices?.[0]?.message?.content?.trim();
      if (aiReply) return aiReply;
    } catch (e) {
      console.error("OpenAI API call failed, falling back to Response Bank:", e);
    }
  }

  // Local matching engine if OpenAI is not enabled or fails
  return generateLocalResponse(message, mood);
}

function generateLocalResponse(message: string, mood: MoodType): string {
  const normalized = message.toLowerCase().trim();
  const bank = responseBank[mood] || responseBank['cute'];

  // Keyword-based personalized response additions to make local mode feel intelligent!
  if (mood === 'comfort') {
    if (normalized.includes('sad') || normalized.includes('cry') || normalized.includes('hurt')) {
      return "I hate knowing you're hurting. Please let me hold you, even if it's just in spirit right now. 🤍";
    }
    if (normalized.includes('tired') || normalized.includes('exhausted') || normalized.includes('long day')) {
      return "You worked so hard today. Put your head down, rest, and let me take care of you tonight. 🧸";
    }
  }

  if (mood === 'flirty') {
    if (normalized.includes('love') || normalized.includes('like')) {
      return "You say that, and my heart starts beating for you all over again. 😏 Let's make this official.";
    }
    if (normalized.includes('kiss') || normalized.includes('hug')) {
      return "Sending you a virtual kiss right now... but I expect a real one next time we meet! 😉";
    }
  }

  if (mood === 'cute') {
    if (normalized.includes('smile') || normalized.includes('happy')) {
      return "Your smile is my absolute favorite thing. Seeing you happy makes my whole world bright! 😊";
    }
    if (normalized.includes('cute') || normalized.includes('sweet')) {
      return "No, you're the cute one here! I'm just trying to keep up with your sweetness. 💕";
    }
  }

  // Default: Choose a random response from the bank for the given mood
  const randomIndex = Math.floor(Math.random() * bank.length);
  return bank[randomIndex];
}
