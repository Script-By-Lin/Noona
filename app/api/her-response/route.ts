import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { generateResponse } from '@/lib/moodEngine';
import { MoodType } from '@/lib/responseBank';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, message, mood } = body;

    // Validate inputs
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    const validMoods: MoodType[] = ['cute', 'flirty', 'deep', 'loyalty', 'comfort'];
    const selectedMood = validMoods.includes(mood) ? (mood as MoodType) : 'cute';
    const userIdentifier = userId || 'anonymous-user';

    // 1. Generate response based on mood
    const responseText = await generateResponse(message, selectedMood);

    // 2. Insert conversation into Supabase (will use mock if not configured)
    const { data, error } = await supabase
      .from('chats')
      .insert({
        user_id: userIdentifier,
        message: message,
        response: responseText,
        mood: selectedMood
      });

    if (error) {
      console.error('Failed to save message to database:', error);
      // Return the generated response anyway, marked as not saved
      return NextResponse.json({
        message: message,
        response: responseText,
        mood: selectedMood,
        saved: false
      });
    }

    return NextResponse.json({
      message: message,
      response: responseText,
      mood: selectedMood,
      saved: true
    });
  } catch (e: any) {
    console.error('API Error:', e);
    return NextResponse.json(
      { error: 'Internal server error', details: e.message },
      { status: 500 }
    );
  }
}
