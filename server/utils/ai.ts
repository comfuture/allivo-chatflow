import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createGithubModels } from '@github/models'

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
    baseURL: 'https://gateway.ai.cloudflare.com/v1/1b3a9f1ee67ab460cd8b1eb53c95106c/openai/openai',
  });
  return openai;
}

/**
 * Initializes and returns a GitHub Models client instance using the GitHub PAT from runtime configuration.
 *
 * @throws {Error} If the GitHub PAT is missing in the runtime configuration.
 * @returns {ReturnType<typeof createGithubModels>} An instance of the GitHub Models client.
 */
export const useGithubModels = () => {
  const { githubToken: apiKey } = useRuntimeConfig()
  if (!apiKey) throw new Error('Missing GitHub PAT');
  const githubModels = createGithubModels({
    apiKey: apiKey,
  })
  return githubModels;
}
