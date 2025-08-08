<script setup lang="ts">
import { Chat } from "@ai-sdk/vue";
import { DefaultChatTransport } from 'ai';
import { ref, nextTick, provide, reactive } from "vue";

const { params: { sessionId } } = useRoute();
const id = useId();
const input = ref("");
const candidates = ref<string[]>([]);
const messagesContainer = ref<HTMLDivElement>();

const { data: sessionData } = await useFetch(`/api/session/${sessionId}`);

// Create reactive session context for sharing
const currentSession = reactive({
  id: sessionId as string,
  context: (sessionData.value as any)?.session || {}
});

// Provide the current session to child components
provide('currentSession', currentSession);

// Auto-scroll to bottom function
const scrollToBottom = async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

const chat = new Chat({
  transport: new DefaultChatTransport({
    api: `/api/session/${sessionId}`,
  }),
  messages: (sessionData.value as any)?.messages || [],
  onData({ data, type }) {
    if (type === "data-suggestion") {
      console.log("Suggestion received:", data);
      candidates.value = (data as any).candidates || [];
      // Optionally, handle data.notice later if needed by UI components
    } else if (type === "data-session-context") {
      console.log("Session context updated:", data);
      if (sessionData.value) {
        (sessionData.value as any).session = data;
      }
      // Update the reactive session context
      currentSession.context = data as any;
    }

    // Scroll to bottom on any data update
    scrollToBottom();
  }
});

// Watch for new messages to auto-scroll
watch(() => chat.messages.length, () => {
  scrollToBottom();
});

// Watch for streaming content updates with debounce
let scrollTimeout: any;
watchEffect(() => {
  // Trigger on any message content change
  const lastMessage = chat.messages[chat.messages.length - 1];
  if (lastMessage && lastMessage.parts) {
    // Debounce scrolling to avoid too frequent updates
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      scrollToBottom();
    }, 50);
  }
});

const handleSubmit = (e: Event) => {
  e.preventDefault();
  if (!input.value.trim()) return;

  candidates.value = [];
  chat.sendMessage({ text: input.value });
  input.value = "";
  scrollToBottom();
};

// On mount: if there are no messages yet, send a special kickoff message part
onMounted(() => {
  scrollToBottom();
  const hasMessages = Array.isArray((sessionData.value as any)?.messages) && (sessionData.value as any)?.messages.length > 0;
  if (!hasMessages) {
    chat.sendMessage({
      // Include a custom data part to signal server to start the session
      parts: [
        { type: 'data-start-session', data: { ts: Date.now() } }
      ] as any
    });
  }
});
</script>

<template>
  <section class="h-screen flex bg-gray-50">
    <!-- Sidebar - Fixed -->
    <chat-sidebar />

    <!-- Main Chat Area -->
    <div class="flex-1 flex h-full">
      <!-- Chat Messages Container -->
      <div class="flex-1 flex flex-col bg-white">
        <!-- Messages Area - Scrollable -->
        <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 space-y-4">
          <chat-message :message="m" v-for="m in chat.messages" :key="m.id"
            @sendMessage="chat.sendMessage({ text: $event })" />
        </div>

        <!-- Input Area - Fixed at bottom -->
        <div class="border-t border-gray-200 bg-white p-4">
          <form @submit="handleSubmit" class="flex gap-2">
            <input v-model="input" placeholder="Type your message..."
              class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            <button type="submit" :disabled="!input.trim()"
              class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200">
              Send
            </button>
          </form>
        </div>
      </div>

      <!-- Session Context Panel - Fixed -->
      <chat-session v-if="currentSession.context" :session-context="currentSession.context" />
    </div>
  </section>
</template>

<style scoped>
/* Suggestion button styles */
button.suggestion {
  background-color: rgb(243 244 246);
  border: 0;
  padding: 0.5rem 1rem;
  margin: 0.25rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

button.suggestion:hover {
  background-color: rgb(229 231 235);
}
</style>