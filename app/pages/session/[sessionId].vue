<script setup lang="ts">
import { Chat } from "@ai-sdk/vue";
import { DefaultChatTransport } from 'ai';
import { ref } from "vue";

const { params: { sessionId } } = useRoute();
const id = useId();
const input = ref("");
const candidates = ref<string[]>([]);

const { data: sessionData } = await useFetch(`/api/session/${sessionId}`);

const chat = new Chat({
  transport: new DefaultChatTransport({
    api: `/api/session/${sessionId}`,
  }),
  messages: sessionData.value?.messages || [],
  onData({ data, type }) {
    if (type === "data-suggestion") {
      console.log("Suggestion received:", data);
      candidates.value = (data as any).candidates || [];
    }
  }
});

const handleSubmit = (e: Event) => {
  e.preventDefault();
  candidates.value = [];
  chat.sendMessage({ text: input.value });
  input.value = "";
};
</script>

<template>
  <section class="flex">
    <chat-sidebar />
    <div class="container flex flex-col h-full">
      {{ sessionData.messages }}
      <div class="flex gap-2">
        <div class="flex flex-col items-start gap-2 flex-1">
          <chat-message :message="m" v-for="m in chat.messages" :key="m.id"
            @sendMessage="chat.sendMessage({ text: $event })" />
        </div>
        <div class="w-64">
          {{ sessionData.session }}
        </div>
      </div>
      <form @submit="handleSubmit" class="chat-input">
        <input v-model="input" placeholder="Say something..." />
      </form>
    </div>
  </section>
</template>
<style>
.chat-input {
  position: sticky;
  bottom: 0;
  display: flex;
  flex-flow: row;
  align-items: stretch;
}

.chat-input input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

button.suggestion {
  background-color: #f0f0f0;
  border: none;
  padding: 8px;
  margin: 4px;
  border-radius: 4px;
  cursor: pointer;
}
</style>