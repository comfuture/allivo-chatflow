export default defineNitroPlugin(async (nitroApp) => {
  // Run the database initialization task on startup
  hubHooks.hookOnce('bindings:ready', async () => {
    await runTask('db:init');
  })
});