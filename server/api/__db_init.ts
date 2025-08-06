export default defineEventHandler(async (event) => {
  await runTask('db:init');
  return {
    success: true,
  }
});