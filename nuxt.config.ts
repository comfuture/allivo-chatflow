// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  runtimeConfig: {
    openaiApiKey: ''
  },

  nitro: {
    experimental: {
      database: true
    },
    database: {
      default: {
        connector: 'better-sqlite3',
        options: {
          path: 'server/data/allivo.db',
        }
      }
    }
  },

  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss']
})