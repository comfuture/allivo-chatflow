<script setup lang="ts">
import { useFetch as useHttp } from "@vueuse/core"
import { inject } from "vue"

const router = useRouter();
const route = useRoute();

// Inject the current session from parent
const currentSession = inject<any>('currentSession', null);

const { data, refresh } = await useFetch("/api/session")
const createSession = async () => {
  const { data } = await useHttp("/api/session/new").post({ language: navigator.language }).json()
  refresh()
  router.push({
    name: 'session-sessionId',
    params: { sessionId: data.value?.id || '' }
  });
};

// Helper to get session display name
const getSessionDisplayName = (session: any) => {
  // If this is the current session, use the reactive context
  if (currentSession && session.id === currentSession.id && currentSession.context?.subject) {
    return currentSession.context.subject;
  }
  
  if (session.subject) {
    return session.subject;
  }
  const date = new Date(session.created_at);
  return `Session ${date.toLocaleDateString()}`;
};
</script>
<template>
  <aside class="w-64 bg-gray-50 border-r border-gray-200 h-full flex flex-col">
    <!-- Header -->
    <div class="p-4 border-b border-gray-200">
      <h2 class="text-xl font-semibold text-gray-800 mb-4">Allivo</h2>
      <button 
        @click="createSession" 
        class="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
        </svg>
        New Presentation
      </button>
    </div>
    
    <!-- Sessions List -->
    <div class="flex-1 overflow-y-auto">
      <div class="p-2">
        <h3 class="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent Sessions</h3>
        <ul class="space-y-1">
          <li v-for="session in (data as any)?.sessions" :key="session.id">
            <nuxt-link 
              :to="{ name: 'session-sessionId', params: { sessionId: session.id } }"
              :class="[
                'block px-3 py-2 rounded-lg text-sm transition-colors duration-200',
                route.params.sessionId === session.id 
                  ? 'bg-blue-100 text-blue-700 font-medium' 
                  : 'text-gray-700 hover:bg-gray-100'
              ]"
            >
              <div class="truncate">{{ getSessionDisplayName(session) }}</div>
              <div class="text-xs text-gray-500 mt-1">
                {{ new Date(session.created_at).toLocaleTimeString() }}
              </div>
            </nuxt-link>
          </li>
        </ul>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="p-4 border-t border-gray-200">
      <div class="text-xs text-gray-500 text-center">
        Powered by Allivo
      </div>
    </div>
  </aside>
</template>