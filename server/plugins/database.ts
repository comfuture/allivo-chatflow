export default defineNitroPlugin(async (nitroApp) => {
  // Run the database initialization task on startup
  try {
    console.log('Running database initialization task...');
    await runTask('db:init');
    console.log('Database initialization task completed');
  } catch (error) {
    console.error('Failed to run database initialization task:', error);
    // Don't throw the error to allow the server to start
    // The task might have already been run before
  }
});