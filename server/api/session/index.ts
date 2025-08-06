export default defineEventHandler(async (event) => {
  const db = useDatabase();
  
  // Fetch the latest 50 chat sessions ordered by created_at in descending order
  const result = await db.sql`
    SELECT 
      id,
      created_at,
      updated_at,
      step,
      language,
      subject,
      audience,
      core_message,
      outline,
      structure,
      status
    FROM chat_session
    ORDER BY created_at DESC
    LIMIT 50
  `;
  
  return {
    sessions: result.rows || []
  };
})