import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

export default defineNitroPlugin(async () => {
  // Check if database exists
  const dbPath = join(process.cwd(), 'server', 'data', 'allivo.db');
  
  if (!existsSync(dbPath)) {
    console.log('Database not found. Initializing...');
    
    try {
      // Run the init:db script
      execSync('npm run init:db', {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw new Error('Database initialization failed');
    }
  } else {
    console.log('Database found at:', dbPath);
  }
});