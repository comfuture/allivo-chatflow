<script setup lang="ts">
// This page just shows a welcome message
// All chat functionality is handled in the session pages
</script>

<template>
  <section class="h-screen flex bg-gray-50">
    <chat-sidebar />
    <div class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <h1 class="text-3xl font-bold text-gray-800 mb-4">Welcome to Allivo</h1>
        <p class="text-lg text-gray-600 mb-8">
          Your AI-powered presentation assistant
        </p>
        <div class="flex flex-col items-center gap-4">
          <svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p class="text-gray-500">
            Create a new session from the sidebar to start preparing your presentation
          </p>
        </div>
      </div>
    </div>
  </section>
</template>