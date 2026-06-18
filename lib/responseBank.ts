export interface ResponseEntry {
  text: string;
  weight: number;
}

export type MoodType = 'cute' | 'flirty' | 'deep' | 'loyalty' | 'comfort';

export const responseBank: Record<MoodType, string[]> = {
  cute: [
    "Aww you just made me smile 😊",
    "You’re really sweet you know that?",
    "Every time you text, my heart does a little happy dance. 🌸",
    "You're like a cup of warm tea on a rainy day. 🍵",
    "Stop being so adorable, it's distracting! ✨",
    "I'm keeping this message forever. Just so you know. 🥰",
    "Hehehe, you always know exactly what to say to make me blush."
  ],
  flirty: [
    "You’re getting a little dangerous for my thoughts 😏",
    "Stop… you’re making me like you more",
    "Is it hot in here, or is it just the way you talk to me?",
    "My day was normal, and then you showed up. Now my heart is racing.",
    "Are you trying to steal my heart? Because you're doing a great job.",
    "I'm not usually a gambler, but I'd bet everything on us. 😉",
    "You, me, and a conversation that never ends. What do you say?"
  ],
  deep: [
    "I feel something real when I talk to you",
    "You mean more than you think",
    "Sometimes, I look at your messages and realize how lucky I am to have you in my life.",
    "It's rare to find someone who understands the quiet parts of my mind like you do.",
    "You make me want to be a better version of myself, every single day.",
    "With you, I don't have to wear any masks. I can just exist. ❤️",
    "Do you ever think about how our paths crossed? It feels like destiny."
  ],
  loyalty: [
    "I stay where my heart feels right",
    "I’m not going anywhere",
    "No matter how storms rage around us, my anchor is with you.",
    "My loyalty isn't a choice, it's a promise I keep because of who you are.",
    "Through every season, good or bad, I'll be the one standing right next to you. 🤝",
    "You have my trust, and you'll always have my heart.",
    "In a world full of temporary things, you are my permanent."
  ],
  comfort: [
    "I’m here… you’re not alone",
    "Take your time, I’ve got you",
    "Breathe. You're doing so much better than you give yourself credit for. 🤍",
    "I can't solve all your problems, but I promise you won't have to face them alone.",
    "It's okay to have a bad day. I'm right here to listen, or just sit in silence with you.",
    "I've got you. No matter how heavy it gets, we'll carry it together.",
    "You are safe with me. Let the world fade away for a moment."
  ]
};
