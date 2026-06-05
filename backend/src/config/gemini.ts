import dotenv from 'dotenv';
dotenv.config();

/**
 * Rotating Gemini API key utility.
 * Round-robins through keys to avoid per-key rate limits.
 */

const GEMINI_KEYS = (process.env.GEMINI_API_KEYS ?? '')
  .split(',')
  .map(k => k.trim())
  .filter(Boolean);

// Fallbacks for local development if keys are not configured in environment
if (GEMINI_KEYS.length === 0) {
  GEMINI_KEYS.push('YOUR_GEMINI_API_KEY');
}

let currentKeyIndex = 0;

/**
 * Returns the next Gemini API key in round-robin order.
 */
export function getGeminiKey(): string {
  const key = GEMINI_KEYS[currentKeyIndex % GEMINI_KEYS.length];
  currentKeyIndex = (currentKeyIndex + 1) % GEMINI_KEYS.length;
  return key!;
}

/**
 * Returns all available Gemini keys (for bulk initialization).
 */
export function getAllGeminiKeys(): string[] {
  return [...GEMINI_KEYS];
}
