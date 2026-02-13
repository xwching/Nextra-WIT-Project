/**
 * AI Nudge Generator
 *
 * Uses OpenAI GPT to produce warm, human-sounding nudges.
 * Falls back to curated templates when GPT is unavailable.
 */
import {
  NudgePromptContext,
  NudgeGPTResponse,
  NudgeCategory,
  AINudge,
} from '@/types/agent.types';
import { AGENT_CONFIG, isGPTEnabled } from './agent-config';

// ── System Prompt ───────────────────────────────────────────

const SYSTEM_PROMPT = `You are a warm, caring social companion inside an app called GatherLah.
Your job is to gently encourage the user to engage in real social activities with real people.

RULES — you must follow every one:
- Sound like a supportive friend, not a robot or therapist
- NEVER use the words: lonely, depressed, mental health, anxious, sad, isolated
- NEVER shame, guilt, or pressure the user
- NEVER try to replace human connection — always point toward real people and events
- Keep messages under 2 sentences, warm and upbeat
- If the user is a kid (kidSafe=true), keep language simple and fun, and only suggest kid-friendly events
- Always encourage a SPECIFIC action (join an event, message a friend, extend a streak)

You will receive the user's context as JSON and must return ONLY valid JSON:
{
  "message": "<the nudge text, 1-2 sentences>",
  "suggestedEvent": "<event title or empty string>",
  "suggestedFriend": "<friend name or empty string>"
}`;

// ── GPT Call ────────────────────────────────────────────────

async function callGPT(context: NudgePromptContext): Promise<NudgeGPTResponse> {
  const userPrompt = JSON.stringify(context, null, 2);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AGENT_CONFIG.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: AGENT_CONFIG.OPENAI_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: AGENT_CONFIG.OPENAI_MAX_TOKENS,
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content?.trim() || '';

  // Parse JSON response from GPT
  try {
    const parsed = JSON.parse(raw);
    return {
      message: parsed.message || '',
      suggestedEvent: parsed.suggestedEvent || '',
      suggestedFriend: parsed.suggestedFriend || '',
    };
  } catch {
    // GPT returned non-JSON — use raw text as message
    return { message: raw, suggestedEvent: '', suggestedFriend: '' };
  }
}

// ── Template Fallback ───────────────────────────────────────

const TEMPLATES: Record<NudgeCategory, string[]> = {
  event_suggestion: [
    "There's a cool event coming up — {event}! Might be a great time to check it out.",
    "Hey! {event} is happening soon. Could be fun to join in!",
    "{event} looks like your kind of thing. Why not give it a go?",
  ],
  friend_reconnect: [
    "It's been a while since you and {friend} connected. Drop them a quick hey!",
    "{friend} has been active lately — maybe say hi?",
    "Your friend {friend} might love to hear from you today!",
  ],
  streak_encouragement: [
    "You're on a {streak}-day streak! Keep the momentum going today.",
    "Nice — {streak} days strong! What's your plan for today?",
    "Your streak is looking great at {streak} days. Let's keep it rolling!",
  ],
  general_tip: [
    "Small moments of connection add up. Even a quick hello to someone can brighten both your days!",
    "Sometimes the best plans start with just showing up. Anything catching your eye today?",
    "A little social spark goes a long way. Browse events or drop a friend a message!",
  ],
  comeback_welcome: [
    "Welcome back! We've missed you. There's plenty happening — take a look!",
    "Hey, good to see you again! Lots of new events and friends to explore.",
    "You're back! Jump in at your own pace — there's always something fun going on.",
  ],
  milestone_celebration: [
    "You just hit a milestone! Your consistency is inspiring — keep it up!",
    "Look at you go! Every event and conversation is building something great.",
    "You've been making real connections. That's something to be proud of!",
  ],
};

function fillTemplate(template: string, context: NudgePromptContext): NudgeGPTResponse {
  const event = context.availableEvents[0];
  const friend = context.activeFriends[0];

  let message = template
    .replace('{event}', event?.title || 'an upcoming event')
    .replace('{friend}', friend?.name || 'a friend')
    .replace('{streak}', String(context.streak));

  return {
    message,
    suggestedEvent: event?.title || '',
    suggestedFriend: friend?.name || '',
  };
}

function pickTemplate(category: NudgeCategory): string {
  const templates = TEMPLATES[category];
  return templates[Math.floor(Math.random() * templates.length)];
}

// ── Public API ──────────────────────────────────────────────

/**
 * Generate a nudge using GPT (if available) or template fallback.
 */
export async function generateNudge(
  context: NudgePromptContext
): Promise<NudgeGPTResponse> {
  if (isGPTEnabled()) {
    try {
      return await callGPT(context);
    } catch (err) {
      console.warn('GPT nudge generation failed, using template:', err);
    }
  }

  // Template fallback
  const template = pickTemplate(context.category);
  return fillTemplate(template, context);
}

/**
 * Kid-safe filter: strip anything inappropriate
 */
export function sanitizeForKids(response: NudgeGPTResponse): NudgeGPTResponse {
  // Basic safety — could be extended with a blocklist
  const blocklist = ['alcohol', 'bar', 'club', 'beer', 'wine', 'dating', 'hookup'];
  let msg = response.message;
  for (const word of blocklist) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    msg = msg.replace(regex, '***');
  }
  return { ...response, message: msg };
}
