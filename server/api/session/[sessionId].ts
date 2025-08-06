export default defineEventHandler(async (event) => {
  const db = useDatabase();
  const sessionId = getRouterParam(event, 'sessionId');
  
  if (!sessionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Session ID is required'
    });
  }
  
  // Fetch session with messages using LEFT JOIN
  const result = await db.sql`
    SELECT 
      s.id as session_id,
      s.created_at as session_created_at,
      s.updated_at as session_updated_at,
      s.step,
      s.language,
      s.subject,
      s.purpose,
      s.audience,
      s.core_message,
      s.outline,
      s.structure,
      s.status,
      m.id as message_id,
      m.role,
      m.content,
      m.created_at as message_created_at,
      m.metadata
    FROM chat_session s
    LEFT JOIN chat_message m ON s.id = m.session_id
    WHERE s.id = ${sessionId}
    ORDER BY m.created_at ASC
  `;
  
  if (!result.rows || result.rows.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Session not found'
    });
  }
  
  // Extract session information from the first row
  const firstRow = result.rows[0];
  const session = {
    id: firstRow.session_id,
    created_at: firstRow.session_created_at,
    updated_at: firstRow.session_updated_at,
    step: firstRow.step,
    language: firstRow.language,
    subject: firstRow.subject,
    purpose: firstRow.purpose,
    audience: firstRow.audience,
    core_message: firstRow.core_message,
    outline: firstRow.outline,
    structure: firstRow.structure,
    status: firstRow.status
  };
  
  // Extract and parse messages - content already contains the UIMessage structure with parts
  const messages = result.rows
    .filter(row => row.message_id) // Filter out rows with no messages
    .map(row => {
      const content = JSON.parse(row.content as string);
      return {
        id: row.message_id,
        role: row.role,
        parts: content.parts || [], // Extract parts from the stored content
        created_at: row.message_created_at,
        metadata: row.metadata ? JSON.parse(row.metadata as string) : null
      };
    });
  
  return {
    session,
    messages
  };
})