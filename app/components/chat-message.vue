<script setup lang="ts">
import * as marked from "marked";

const props = defineProps<{
  message: any; // Using any for now to handle custom data types
}>();

const emit = defineEmits<{
  (e: "sendMessage", message: string): void;
}>();

// Debug log to check message structure
console.log('Message parts:', props.message.parts);
</script>
<template>
  <div class="chat-message" :class="[
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
          <div 
            v-if="part.type === 'text'" 
            class="prose prose-sm max-w-none"
            :class="message.role === 'user' ? 'prose-invert' : ''"
            v-html="marked.parse(part.text || '')"
          />
          <div 
            v-else-if="part.type === 'data-suggestion' && part.data?.candidates"
            class="flex flex-wrap gap-2 mt-3"
          >
            <button 
              class="suggestion"
              @click.prevent="emit('sendMessage', candidate)"
              v-for="(candidate, idx) in (part.data as any).candidates" 
              :key="idx"
            >
              {{ candidate }}
            </button>
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
