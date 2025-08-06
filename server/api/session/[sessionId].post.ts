import { z } from 'zod';
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  convertToModelMessages,
  UIMessage,
  generateObject,
} from 'ai';
import { AllivoUIMessage } from '~~/shared/types';
import { randomUUID } from 'crypto';
import { createPrompt, createSuggestionsPrompt, processMessages } from '~~/server/utils/prompt';
import type { PresentationPrepareContext } from '~~/server/utils/prompt';

function extractTextParts(content: any): string[] {
  if (Array.isArray(content)) {
    return content.map(part => part.text || '');
  } else if (typeof content === 'string') {
    return [content];
  } else if (content && typeof content === 'object' && 'text' in content) {
    return [content.text];
  }
  return [];
}

export default defineEventHandler(async (event) => {
  const sessionId = event.context.params?.sessionId;
  if (!sessionId) {
    throw createError({ statusCode: 400, statusMessage: 'Session ID is required' });
  }
  const db = useDatabase();
  const { rows } = await db.sql`SELECT * FROM chat_session WHERE id = ${sessionId}`;
  if (!rows || rows.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Session not found' });
  }
  const sessionContext = rows[0] as PresentationPrepareContext;
  const { messages }: { messages: UIMessage[] } = await readBody(event);
  const openai = useOpenAI();

  const newContext = await processMessages(sessionContext,
    extractTextParts(messages?.[messages.length - 2]?.parts).join(''),
    extractTextParts(messages?.[messages.length - 1]?.parts || []).join(''),
  );

  // update session context with new information
  await db.sql`
    UPDATE chat_session
    SET
      step = ${newContext.step || sessionContext.step},
      language = ${newContext.language || sessionContext.language},
      subject = ${newContext.subject || sessionContext.subject},
      audience = ${newContext.audience || sessionContext.audience},
      core_message = ${newContext.core_message || sessionContext.core_message},
      structure = ${newContext.structure || sessionContext.structure},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${sessionId}
  `;

  Object.assign(sessionContext, newContext);

  const stream = createUIMessageStream<AllivoUIMessage>({
    execute: ({ writer }) => {
      const result = streamText({
        model: openai('gpt-4o'),
        // messages: convertToModelMessages(messages),
        system: `You should speak in the language of user's context or ${sessionContext.language || 'English'}.`,
        prompt: createPrompt(sessionContext),
        async onFinish(event) {
          const db = useDatabase();

          // Save the user's last message
          if (messages.length > 0) {
            const lastUserMessage = messages[messages.length - 1];

            await db.sql`
              INSERT INTO chat_message (
                id,
                session_id,
                role,
                content,
                metadata
              ) VALUES (
                ${randomUUID()},
                ${sessionId},
                'user',
                ${JSON.stringify({
              parts: lastUserMessage.parts || []
            })},
                ${null}
              )
            `;
          }

          // Save the assistant's response in the same UIMessage format with suggestion data
          // const suggestionCandidates = ['Candidate 1', 'Candidate 2', 'Candidate 3'];
          const suggestionPrompt = createSuggestionsPrompt(sessionContext);
          const { object } = await generateObject({
            model: openai('gpt-4.1-mini'),
            system: `You should speak in the language of user's context or ${sessionContext.language || 'English'}.`,
            prompt: suggestionPrompt,
            schema: z.object({
              candidates: z.array(z.string().min(1).max(255)),
            }),
          })
          const suggestionCandidates = object.candidates;

          await db.sql`
            INSERT INTO chat_message (
              id,
              session_id,
              role,
              content,
              metadata
            ) VALUES (
              ${randomUUID()},
              ${sessionId},
              'assistant',
              ${JSON.stringify({
            parts: [
              {
                type: 'text',
                text: event.text
              },
              {
                type: 'data-suggestion',
                data: {
                  candidates: suggestionCandidates
                }
              }
            ]
          })},
              ${JSON.stringify({
            finishReason: event.finishReason,
            usage: event.usage
          })}
            )
          `;

          // Update session's updated_at timestamp
          await db.sql`
            UPDATE chat_session 
            SET updated_at = CURRENT_TIMESTAMP 
            WHERE id = ${sessionId}
          `;

          writer.write({
            type: 'data-suggestion',
            data: {
              candidates: suggestionCandidates,
            }
          })
        }
      });
      writer.merge(result.toUIMessageStream());
    },
  });

  return createUIMessageStreamResponse({ stream });
});