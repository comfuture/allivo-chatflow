import { z } from 'zod';
import dedent from 'dedent';
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  UIMessage,
  generateObject,
} from 'ai';
import { createPrompt, createSuggestionsPrompt, processMessages } from '~~/server/utils/prompt';
import type { PresentationPrepareContext } from '@@/shared/types';
import { extractTextFromMessage, createMessageContent, parseLanguage } from '~~/server/utils/helpers';
import { generateId } from '~~/server/utils/db';

export default defineEventHandler(async (event) => {
  const sessionId = event.context.params?.sessionId;
  if (!sessionId) {
    throw createError({ statusCode: 400, statusMessage: 'Session ID is required' });
  }

  const db = useDatabase();

  // Get session
  const { rows } = await db.sql`SELECT * FROM chat_session WHERE id = ${sessionId}`;
  if (!rows || rows.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Session not found' });
  }
  const sessionContext = rows[0] as PresentationPrepareContext;

  // Get messages from request
  const { messages }: { messages: UIMessage[] } = await readBody(event);

  const lastUser = messages[messages.length - 1];
  const userMessage = extractTextFromMessage(lastUser);
  const lastAssistantMessage = messages.length >= 2 ? extractTextFromMessage(messages[messages.length - 2]) : '';

  // Detect special kickoff signal from client
  const startPart = Array.isArray((lastUser as any)?.parts)
    ? (lastUser as any).parts.find((p: any) => p?.type === 'data-start-session')
    : undefined;
  const hasStartSessionPart = !!startPart;

  let newContext: Partial<PresentationPrepareContext & { isOffTopic?: boolean }> = {};
  let isOffTopic = false;

  if (hasStartSessionPart) {
    // Extract language hint from kickoff payload (e.g., 'ko-KR' -> 'ko')
    const kickoffLangRaw = startPart?.data?.lang as string | undefined;
    const kickoffLang = kickoffLangRaw ? parseLanguage(kickoffLangRaw) : sessionContext.language;

    // Kick off the flow: ask for subject and set language from client hint (if any)
    newContext = {
      step: 'collecting_subject',
      language: kickoffLang || sessionContext.language
    };
    isOffTopic = false;
  } else {
    // Normal processing
    newContext = await processMessages(sessionContext, lastAssistantMessage, userMessage);
    isOffTopic = !!newContext.isOffTopic;
  }

  // Debug log
  console.log('Extracted context:', newContext);
  console.log('Current context after merge:', { ...sessionContext, ...newContext });

  // Update session context
  const updates = {
    step: newContext.step || sessionContext.step,
    language: newContext.language || sessionContext.language,
    subject: isOffTopic ? sessionContext.subject : (newContext.subject || sessionContext.subject || null),
    purpose: isOffTopic ? sessionContext.purpose : (newContext.purpose || sessionContext.purpose || null),
    audience: isOffTopic ? sessionContext.audience : (newContext.audience || sessionContext.audience || null),
    core_message: isOffTopic ? sessionContext.core_message : (newContext.core_message || sessionContext.core_message || null),
    structure: isOffTopic ? sessionContext.structure : (newContext.structure || sessionContext.structure || null),
  };

  await db.sql`
    UPDATE chat_session
    SET
      step = ${updates.step},
      language = ${updates.language},
      subject = ${updates.subject},
      purpose = ${updates.purpose || null},
      audience = ${updates.audience},
      core_message = ${updates.core_message},
      structure = ${updates.structure},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${sessionId}
  `;

  Object.assign(sessionContext, updates);

  // Start generating suggestions early (in parallel with streaming)
  const suggestionPromise = (async () => {
    if (isOffTopic) return { candidates: [], notice: '' } as const;

    const suggestionPrompt = createSuggestionsPrompt(sessionContext);
    if (!suggestionPrompt) return { candidates: [], notice: '' } as const;

    try {
      const { object } = await generateObject({
        model: 'openai/gpt-4.1-mini',
        system: dedent`IMPORTANT: Generate suggestions in the user's language.
          User's language: ${sessionContext.language || 'auto-detect'}
          All suggestions must be in the same language as the user's messages.`,
        prompt: suggestionPrompt,
        schema: z.object({
          candidates: z.array(z.string().min(1).max(255)).describe('3-5 suggestions in user language'),
          notice: z.string().min(5).max(300).describe('Short friendly notice telling user they can freely input instead of choosing a suggestion')
        }),
      });
      return { candidates: object.candidates, notice: object.notice } as const;
    } catch (error) {
      console.error('Error generating suggestions:', error);
      return { candidates: [], notice: '' } as const;
    }
  })();

  // Create response stream
  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      // Stream session context update immediately if there are changes
      if (Object.keys(newContext).length > 0) {
        writer.write({
          type: 'data-session-context',
          data: sessionContext
        });
      }

      // Push suggestions as soon as they are ready
      suggestionPromise.then(({ candidates, notice }) => {
        if ((candidates && candidates.length) || notice) {
          writer.write({
            type: 'data-suggestion',
            data: { candidates, notice }
          });
        }
      });

      const result = streamText({
        model: 'openai/gpt-4.1',
        system: dedent`IMPORTANT: You must respond in the user's language.
          User's detected language: ${sessionContext.language || 'auto-detect'}
          If language is not detected, analyze the user's message and respond in the same language they used.`,
        prompt: createPrompt(sessionContext, userMessage, isOffTopic),
        async onFinish(event) {
          const db = useDatabase();

          // Save user message with session context update
          if (messages.length > 0) {
            const lastUserMessage = messages[messages.length - 1];
            const userMessageParts = lastUserMessage.parts || [];

            if (Object.keys(newContext).length > 0) {
              userMessageParts.push({
                type: 'data-session-context',
                data: sessionContext
              });
            }

            await db.sql`
              INSERT INTO chat_message (
                id, session_id, role, content, metadata
              ) VALUES (
                ${generateId()},
                ${sessionId},
                'user',
                ${createMessageContent(userMessageParts)},
                ${null}
              )
            `;
          }

          // Wait for suggestions
          const { candidates, notice } = await suggestionPromise;

          // Save assistant response with suggestions
          await db.sql`
            INSERT INTO chat_message (
              id, session_id, role, content, metadata
            ) VALUES (
              ${generateId()},
              ${sessionId},
              'assistant',
              ${createMessageContent([
            { type: 'text', text: event.text },
            { type: 'data-suggestion', data: { candidates, notice } }
          ])},
              ${JSON.stringify({
            finishReason: event.finishReason,
            usage: event.usage
          })}
            )
          `;

          await db.sql`
            UPDATE chat_session 
            SET updated_at = CURRENT_TIMESTAMP 
            WHERE id = ${sessionId}
          `;
        }
      });

      writer.merge(result.toUIMessageStream());
    },
  });

  return createUIMessageStreamResponse({ stream });
});