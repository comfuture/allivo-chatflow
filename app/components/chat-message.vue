<script setup lang="ts">
import * as marked from "marked";
import { computed } from 'vue';

const props = defineProps<{
  message: any; // Using any for now to handle custom data types
}>();

const emit = defineEmits<{
  (e: "sendMessage", message: string): void;
}>();

// Determine if message has any renderable parts
const hasRenderableParts = computed(() => {
  const parts = props.message?.parts || [];
  return parts.some((part: any) => {
    if (part?.type === 'text') {
      return !!(part.text && String(part.text).trim().length > 0);
    }
    if (part?.type === 'data-suggestion') {
      const d = part.data || {};
      return (Array.isArray(d.candidates) && d.candidates.length > 0) || !!(d.notice && String(d.notice).trim().length > 0);
    }
    // Non-visual data parts (e.g., data-start-session, data-session-context) should not render a bubble
    return false;
  });
});

// Debug log to check message structure
console.log('Message parts:', props.message.parts);
</script>
<template>
  <div v-if="hasRenderableParts" class="chat-message" :class="[
    'flex',
    message.role === 'user' ? 'justify-end' : 'justify-start'
  ]">
    <div :class="[
      'max-w-[70%] rounded-lg p-4',
      message.role === 'user'
        ? 'bg-blue-500 text-white'
        : 'bg-gray-100 text-gray-800'
    ]">
      <div class="font-semibold text-sm mb-1">
        {{ message.role === "user" ? "You" : "Allivo" }}
      </div>
      <div class="space-y-2">
        <template v-for="(part, index) in message.parts" :key="index">
          <div v-if="part.type === 'text'" class="prose prose-sm max-w-none"
            :class="message.role === 'user' ? 'prose-invert' : ''" v-html="marked.parse(part.text || '')" />
          <div v-else-if="part.type === 'data-suggestion' && part.data" class="mt-4">
            <p v-if="part.data.notice" class="text-xs opacity-80 mb-2">
              {{ part.data.notice }}
            </p>
            <div v-if="part.data.candidates && part.data.candidates.length" class="flex flex-wrap gap-2">
              <button class="suggestion" @click.prevent="emit('sendMessage', candidate)"
                v-for="(candidate, idx) in (part.data as any).candidates" :key="idx">
                {{ candidate }}
              </button>
            </div>
          </div>
          <!-- Handle other part types as needed -->
        </template>
      </div>
    </div>
  </div>
</template>
<style scoped>
.suggestion {
  background-color: rgba(255, 255, 255, 0.2);
  border: 1px solid currentColor;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.assistant .suggestion {
  background-color: white;
  border-color: rgb(209 213 219);
  color: rgb(55 65 81);
}

.assistant .suggestion:hover {
  background-color: rgb(243 244 246);
  border-color: rgb(156 163 175);
}

.user .suggestion {
  color: white;
  border-color: rgba(255, 255, 255, 0.5);
}

.user .suggestion:hover {
  background-color: rgba(255, 255, 255, 0.3);
  border-color: white;
}
</style>
