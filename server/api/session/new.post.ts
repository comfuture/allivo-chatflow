import dedent from 'dedent';
import { generateText } from 'ai';
import { parseLanguage, createMessageContent } from '~~/server/utils/helpers';
import { generateId } from '~~/server/utils/db';

export default defineEventHandler(async (event) => {
  const db = useDatabase();

  // Generate a new session ID
  const sessionId = generateId();

  // Get optional initial context from request body
  const body = await readBody(event) || {};

  // Create new session with default values
  await db.sql`
    INSERT INTO chat_session (
      id,
      step,
      language,
      subject,
      audience,
      core_message,
      outline,
      structure,
      status
    ) VALUES (
      ${sessionId},
      ${body.step || 'initial'},
      ${body.language || null},
      ${body.subject || null},
      ${body.audience || null},
      ${body.core_message || null},
      ${body.outline || null},
      ${body.structure || null},
      'active'
    )
  `;

  // Get language from body or Accept-Language header
  const language = body.language || parseLanguage(getHeader(event, 'accept-language'));

  const openai = useOpenAI();
  const { text } = await generateText({
    model: openai('gpt-4o'),
    system: `IMPORTANT: Generate the message in ${language} language. Use friendly, conversational tone with appropriate emojis.`,
    prompt: dedent`Generate an initial greeting for Alivo presentation preparation service.
      
      Follow this format:
      - Warm greeting with emoji
      - Ask about their presentation topic
      
      <example for English>
        Hello! 😊
        First, what topic are you preparing a presentation about?
      </example>
      
      <example for Korean>
        안녕하세요! 😊
        먼저, 이번에 준비하고 계신 발표는 어떤 주제인가요?
      </example>
    `,
  });

  // Insert greeting message into chat_message with proper JSON format
  await db.sql`
    INSERT INTO chat_message (
      id,
      session_id,
      role,
      content,
      metadata
    ) VALUES (
      ${generateId()},
      ${sessionId},
      'assistant',
      ${createMessageContent([{ type: 'text', text }])},
      ${null}
    )
  `;

  // Return the created session
  return {
    id: sessionId,
    createdAt: new Date().toISOString(),
    status: 'active',
    step: body.step || 'initial',
    language: body.language || null,
    subject: body.subject || null,
    audience: body.audience || null,
    core_message: body.core_message || null,
    outline: body.outline || null,
    structure: body.structure || null
  };
});