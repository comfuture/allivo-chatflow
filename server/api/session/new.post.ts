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

  // Return the created session immediately
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