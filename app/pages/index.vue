<script setup lang="ts">
import { Chat } from "@ai-sdk/vue";
import { ref } from "vue";

const id = useId();
const input = ref("");
const candidates = ref<string[]>([]);
const chat = new Chat({

  messages: [
    { role: 'assistant', id: id, parts: [{ type: 'text', text: 'Hello! How can I assist you today?' }] },
  ],
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
    <div class="container mx-auto max-w-2xl flex flex-col h-full">
      Create new session to start chat
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