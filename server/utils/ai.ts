import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

/**
 * Initializes and returns an OpenAI client instance using the API key from runtime configuration.
 *
 * @throws {Error} If the OpenAI API key is missing in the runtime configuration.
 * @returns {ReturnType<typeof createOpenAI>} An instance of the OpenAI client.
 */
export const useOpenAI = () => {
  const { openaiApiKey: apiKey } = useRuntimeConfig()
  if (!apiKey) throw new Error('Missing OpenAI API key');
  const openai = createOpenAI({
    apiKey: apiKey,
  });
  return openai;
}
