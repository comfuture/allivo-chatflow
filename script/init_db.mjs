import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database path
const dbPath = join(__dirname, '..', 'server', 'data', 'allivo.db');
const dbDir = dirname(dbPath);

// Ensure data directory exists
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
  console.log(`Created directory: ${dbDir}`);
}

// Create or open database
const db = new Database(dbPath);
console.log(`Database initialized at: ${dbPath}`);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create chat_session table
const createChatSessionTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS chat_session (
      id TEXT PRIMARY KEY,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      step TEXT,
      language TEXT,
      subject TEXT,
      audience TEXT,
      core_message TEXT,
      outline TEXT,
      structure TEXT,
      status TEXT DEFAULT 'active'
    )
  `;
  
  db.exec(sql);
  console.log('Created chat_session table');
};

// Create chat_message table
const createChatMessageTable = () => {
  const sql = `
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
  
  db.exec(sql);
  console.log('Created chat_message table');
};

// Create indexes
const createIndexes = () => {
  // Index for session_id in chat_message table for faster queries
  db.exec('CREATE INDEX IF NOT EXISTS idx_chat_message_session_id ON chat_message(session_id)');
  
  // Index for created_at in both tables for chronological queries
  db.exec('CREATE INDEX IF NOT EXISTS idx_chat_session_created_at ON chat_session(created_at)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_chat_message_created_at ON chat_message(created_at)');
  
  // Index for status in chat_session for filtering active sessions
  db.exec('CREATE INDEX IF NOT EXISTS idx_chat_session_status ON chat_session(status)');
  
  console.log('Created indexes');
};

// Create trigger to update updated_at timestamp
const createTriggers = () => {
  const sql = `
    CREATE TRIGGER IF NOT EXISTS update_chat_session_timestamp 
    AFTER UPDATE ON chat_session
    BEGIN
      UPDATE chat_session SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END
  `;
  
  db.exec(sql);
  console.log('Created triggers');
};

// Optional: Insert sample data (commented out by default)
const insertSampleData = () => {
  // Uncomment the following lines to insert sample data
  /*
  const sessionId = randomUUID();
  
  // Insert sample session
  const insertSession = db.prepare(`
    INSERT INTO chat_session (id, step, language, subject, audience, core_message)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  insertSession.run(
    sessionId,
    'subject_definition',
    'en',
    'Introduction to SQLite',
    'developers',
    'SQLite is a powerful embedded database'
  );
  
  // Insert sample messages
  const insertMessage = db.prepare(`
    INSERT INTO chat_message (id, session_id, role, content)
    VALUES (?, ?, ?, ?)
  `);
  
  insertMessage.run(
    randomUUID(),
    sessionId,
    'user',
    JSON.stringify({
      text: 'I want to create a presentation about SQLite',
      timestamp: new Date().toISOString()
    })
  );
  
  insertMessage.run(
    randomUUID(),
    sessionId,
    'assistant',
    JSON.stringify({
      text: 'Great! Let\'s start by defining the subject of your presentation.',
      suggestions: ['Database basics', 'SQLite features', 'Use cases'],
      timestamp: new Date().toISOString()
    })
  );
  
  console.log('Inserted sample data');
  */
};

// Main execution
try {
  console.log('Initializing database schema...');
  
  // Create tables
  createChatSessionTable();
  createChatMessageTable();
  
  // Create indexes
  createIndexes();
  
  // Create triggers
  createTriggers();
  
  // Optional: Insert sample data
  insertSampleData();
  
  console.log('Database schema initialization completed successfully!');
  
  // Display table information
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('\nCreated tables:', tables.map(t => t.name).join(', '));
  
} catch (error) {
  console.error('Error initializing database:', error.message);
  process.exit(1);
} finally {
  // Close database connection
  db.close();
}