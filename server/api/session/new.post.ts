import dedent from 'dedent';
import { randomUUID } from 'crypto';
import { generateText } from 'ai';

export default defineEventHandler(async (event) => {
  const db = useDatabase();

  // Generate a new session ID
  const sessionId = randomUUID();

  // Get optional initial context from request body
  const body = await readBody(event) || {};

  // Create new session with default values
  const result = await db.sql`
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
      ${body.step || 'subject'},
      ${body.language || null},
      ${body.subject || null},
      ${body.audience || null},
      ${body.coreMessage || null},
      ${body.outline || null},
      ${body.structure || null},
      'active'
    )
  `;

  // Get language from body or Accept-Language header
  const language = body.language || getHeader(event, 'accept-language')?.split(',')[0]?.split('-')[0] || 'en';

  const openai = useOpenAI();
  const { text } = await generateText({
    model: openai('gpt-4o'),
    prompt: dedent`Generate a greeting message in ${language} for a new session.
      The message should be friendly and welcoming. Ask for the topic of the presentation in a conversational tone.
      <example>
        Hi there! What topic are you preparing your presentation on? Let's get started!
      </example>
      <example>
        안녕하세요! 준비하고 계신 발표 주제는 무엇인가요? 시작해 볼까요?
      </example>
    `,
  });

  // const greetingMessage = greetings[language] || greetings['en'];

  // Insert greeting message into chat_message with proper JSON format
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
      ${JSON.stringify({ parts: [{ type: 'text', text }] })},
      ${null}
    )
  `;

  // Return the created session
  return {
    id: sessionId,
    createdAt: new Date().toISOString(),
    status: 'active',
    step: body.step || null,
    language: body.language || null,
    subject: body.subject || null,
    audience: body.audience || null,
    coreMessage: body.coreMessage || null,
    outline: body.outline || null,
    structure: body.structure || null
  };
});