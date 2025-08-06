export default defineNitroPlugin(async (nitroApp) => {
  console.log('Initializing database schema...');
  
  const db = useDatabase();
  
  try {
    // Enable foreign keys
    await db.sql`PRAGMA foreign_keys = ON`;
    
    // Create chat_session table
    await db.sql`
      CREATE TABLE IF NOT EXISTS chat_session (
        id TEXT PRIMARY KEY,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        step TEXT,
        language TEXT,
        subject TEXT,
        purpose TEXT,
        audience TEXT,
        core_message TEXT,
        outline TEXT,
        structure TEXT,
        status TEXT DEFAULT 'active'
      )
    `;
    
    // Create chat_message table
    await db.sql`
      CREATE TABLE IF NOT EXISTS chat_message (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL CHECK(json_valid(content)),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        metadata TEXT CHECK(metadata IS NULL OR json_valid(metadata)),
        FOREIGN KEY (session_id) REFERENCES chat_session(id) ON DELETE CASCADE
      )
    `;
    
    // Create indexes
    await db.sql`CREATE INDEX IF NOT EXISTS idx_chat_message_session_id ON chat_message(session_id)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_chat_session_created_at ON chat_session(created_at)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_chat_message_created_at ON chat_message(created_at)`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_chat_session_status ON chat_session(status)`;
    
    // Create trigger to update updated_at timestamp
    await db.sql`
      CREATE TRIGGER IF NOT EXISTS update_chat_session_timestamp 
      AFTER UPDATE ON chat_session
      BEGIN
        UPDATE chat_session SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END
    `;
    
    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database schema:', error);
    throw error;
  }
});