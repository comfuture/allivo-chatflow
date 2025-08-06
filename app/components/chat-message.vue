<script setup lang="ts">
import * as marked from "marked";
import type { UIMessage, UIDataTypes, UITools } from "ai";

const props = defineProps<{
  message: UIMessage<unknown, UIDataTypes, UITools>;
}>();

const emit = defineEmits<{
  (e: "sendMessage", message: string): void;
}>();
</script>
<template>
  <div class="chat-message" :class="message.role">
    <strong>{{ message.role === "user" ? "User" : "Allivo" }}</strong>
    <template v-for="part in message.parts">
      <span class="prose" v-if="part.type === 'text'" v-html="marked.parse(part.text)" />
      <span v-else-if="part.type === 'data-suggestion'">
        <button class="suggestion" @click.prevent="emit('sendMessage', candidate)"
          v-for="candidate in part.data.candidates" :key="candidate">
          {{ candidate }}
        </button>
      </span>
      <!-- Handle other part types as needed -->
    </template>
  </div>
</template>
<style lang="postcss">
.chat-message {
  padding: 8px 12px;
  border-radius: 4px;
  margin-bottom: 8px;

  &.user {
    background-color: #e1ffc7;
    align-self: flex-end;
    @apply flex flex-col items-end;
  }

  &.assistant {
    /* background-color: #f1f1f1; */
    align-self: flex-start;
    @apply flex flex-col items-start;
  }
}
</style>
