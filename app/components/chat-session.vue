<script setup lang="ts">
import type { PresentationPrepareContext } from '@@/shared/types';

const props = defineProps<{
  sessionContext: PresentationPrepareContext;
}>();

// Helper to get field label based on language
const getFieldLabel = (field: string): string => {
  const isKorean = props.sessionContext?.language === 'ko';
  
  const labels: Record<string, { ko: string; en: string }> = {
    subject: { ko: '주제', en: 'Subject' },
    purpose: { ko: '목적', en: 'Purpose' },
    audience: { ko: '청중', en: 'Audience' },
    core_message: { ko: '핵심 메시지', en: 'Core Message' },
    structure: { ko: '구조', en: 'Structure' }
  };
  
  return labels[field]?.[isKorean ? 'ko' : 'en'] || field;
};

// Helper to get progress percentage
const getProgress = computed(() => {
  const fields = ['subject', 'purpose', 'audience', 'core_message'];
  const completed = fields.filter(field => props.sessionContext?.[field as keyof PresentationPrepareContext]).length;
  return (completed / fields.length) * 100;
});

</script>

<template>
  <div class="w-64 bg-white border-l border-gray-200 h-full overflow-y-auto">
    <!-- Header -->
    <div class="p-4 border-b border-gray-200">
      <h3 class="text-lg font-semibold text-gray-800">
        {{ sessionContext?.language === 'ko' ? '프레젠테이션 준비' : 'Presentation Prep' }}
      </h3>
      
      <!-- Progress Bar -->
      <div class="mt-3">
        <div class="flex justify-between text-sm text-gray-600 mb-1">
          <span>{{ sessionContext?.language === 'ko' ? '진행률' : 'Progress' }}</span>
          <span>{{ Math.round(getProgress) }}%</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div 
            class="bg-blue-500 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${getProgress}%` }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Context Fields -->
    <div class="p-4 space-y-4">
      <!-- Subject -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-sm font-medium text-gray-700">
            {{ getFieldLabel('subject') }}
          </label>
          <svg v-if="sessionContext?.subject" class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
          </svg>
        </div>
        <div class="text-sm text-gray-600 bg-gray-50 rounded-md p-3 min-h-[3rem]">
          {{ sessionContext?.subject || (sessionContext?.language === 'ko' ? '아직 입력되지 않음' : 'Not yet provided') }}
        </div>
      </div>

      <!-- Purpose -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-sm font-medium text-gray-700">
            {{ getFieldLabel('purpose') }}
          </label>
          <svg v-if="sessionContext?.purpose" class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
          </svg>
        </div>
        <div class="text-sm text-gray-600 bg-gray-50 rounded-md p-3 min-h-[3rem]">
          {{ sessionContext?.purpose || (sessionContext?.language === 'ko' ? '아직 입력되지 않음' : 'Not yet provided') }}
        </div>
      </div>

      <!-- Audience -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-sm font-medium text-gray-700">
            {{ getFieldLabel('audience') }}
          </label>
          <svg v-if="sessionContext?.audience" class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
          </svg>
        </div>
        <div class="text-sm text-gray-600 bg-gray-50 rounded-md p-3 min-h-[3rem]">
          {{ sessionContext?.audience || (sessionContext?.language === 'ko' ? '아직 입력되지 않음' : 'Not yet provided') }}
        </div>
      </div>

      <!-- Core Message -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-sm font-medium text-gray-700">
            {{ getFieldLabel('core_message') }}
          </label>
          <svg v-if="sessionContext?.core_message" class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
          </svg>
        </div>
        <div class="text-sm text-gray-600 bg-gray-50 rounded-md p-3 min-h-[4rem]">
          {{ sessionContext?.core_message || (sessionContext?.language === 'ko' ? '아직 입력되지 않음' : 'Not yet provided') }}
        </div>
      </div>

      <!-- Structure (if selected) -->
      <div v-if="sessionContext?.structure" class="space-y-2 pt-2 border-t border-gray-200">
        <label class="text-sm font-medium text-gray-700">
          {{ getFieldLabel('structure') }}
        </label>
        <div class="text-sm text-gray-600 bg-blue-50 rounded-md p-3">
          {{ sessionContext.structure }}
        </div>
      </div>
    </div>

    <!-- Status -->
    <div class="p-4 border-t border-gray-200">
      <div class="text-xs text-gray-500">
        <span class="font-medium">{{ sessionContext?.language === 'ko' ? '현재 단계' : 'Current Step' }}:</span>
        <span class="ml-1">{{ sessionContext?.step || 'initial' }}</span>
      </div>
    </div>
  </div>
</template>