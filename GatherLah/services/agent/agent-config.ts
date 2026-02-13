/**
 * Agent Configuration
 *
 * Set EXPO_PUBLIC_OPENAI_API_KEY in your .env to enable GPT-powered nudges.
 * When no key is set, the agent falls back to template-based nudges.
 */

export const AGENT_CONFIG = {
  // OpenAI
  OPENAI_API_KEY: process.env.EXPO_PUBLIC_OPENAI_API_KEY || '',
  OPENAI_MODEL: 'gpt-4o-mini',
  OPENAI_MAX_TOKENS: 200,

  // Agent thresholds
  NUDGE_SCORE_THRESHOLD: 35,          // score above this triggers a nudge
  HIGH_PRIORITY_THRESHOLD: 65,        // score above this = high priority
  MEDIUM_PRIORITY_THRESHOLD: 50,      // score above this = medium
  COMEBACK_INACTIVE_DAYS: 7,          // 7+ days inactive = comeback nudge

  // Frequency limits
  MIN_HOURS_BETWEEN_NUDGES: 20,       // at least 20 hours between nudges
  MAX_NUDGES_PER_DAY: 2,

  // Outcome measurement
  OUTCOME_CHECK_DELAY_HOURS: 24,      // check outcomes 24h after nudge
};

export function isGPTEnabled(): boolean {
  return AGENT_CONFIG.OPENAI_API_KEY.length > 0;
}
