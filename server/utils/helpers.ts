import type { UIMessage } from 'ai';

/**
 * Extract text from UIMessage parts
 */
export function extractTextFromMessage(message: UIMessage): string {
  if (!message.parts) return '';
  
  return message.parts
    .filter(part => part.type === 'text')
    .map(part => part.text || '')
    .join('');
}

/**
 * Create a message content object for database storage
 */
export function createMessageContent(parts: any[]) {
  return JSON.stringify({ parts });
}

/**
 * Parse language from Accept-Language header
 */
export function parseLanguage(acceptLanguage?: string | null, defaultLang = 'en'): string {
  if (!acceptLanguage) return defaultLang;
  return acceptLanguage.split(',')[0]?.split('-')[0] || defaultLang;
}