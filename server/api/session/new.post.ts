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
    system: `IMPORTANT: Generate the message in ${language} language. Use natural, conversational tone in that language.`,
    prompt: dedent`Generate a greeting message for a new presentation preparation session.
      The message should be friendly and welcoming. 
      Tell them you'll help prepare their presentation by understanding:
      1. What they want to present about (topic/subject)
      2. Who their audience is
      3. Their main message
      4. How they want to structure it
      
      Then ask an open question that allows them to share whatever they already know.
      They might share just the topic, or they might share multiple pieces of information at once.
      
      <example>
        Hello! I'm here to help you prepare an effective presentation. We'll work together to define your topic, audience, key message, and structure. What can you tell me about the presentation you're preparing?
      </example>
      <example>
        안녕하세요! 효과적인 프레젠테이션을 준비하는 것을 도와드리겠습니다. 주제, 청중, 핵심 메시지, 구성을 함께 정리해보겠습니다. 준비하고 계신 발표에 대해 알려주시겠어요?
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