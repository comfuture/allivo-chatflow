export default defineNitroPlugin(async (nitroApp) => {
  // Run the database initialization task on startup
  hubHooks.hook('bindings:ready', async () => {
    await runTask('db:init');
  })
});