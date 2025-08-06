import { streamText, UIMessage, convertToModelMessages, createUIMessageStream, createUIMessageStreamResponse } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { AllivoUIMessage } from '@@/shared/types';

export default defineLazyEventHandler(async () => {
  const apiKey = useRuntimeConfig().openaiApiKey;
  if (!apiKey) throw new Error('Missing OpenAI API key');
  const openai = createOpenAI({
    apiKey: apiKey,
  });

  return defineEventHandler(async (event: any) => {
    const { messages }: { messages: UIMessage[] } = await readBody(event);

    const stream = createUIMessageStream<AllivoUIMessage>({
      execute: ({ writer }) => {
        const result = streamText({
          model: openai('gpt-4o'),
          messages: convertToModelMessages(messages),
          onFinish(event) {
            // console.log('Stream finished:', event);
            writer.write({
              type: 'data-suggestion',
              data: {
                candidates: ['Candidate 1', 'Candidate 2', 'Candidate 3'],
              }
            })
          }
        });
        writer.merge(result.toUIMessageStream());
      },
    });

    return createUIMessageStreamResponse({ stream });
  });
});