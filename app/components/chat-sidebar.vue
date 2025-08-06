<script setup lang="ts">
import { useFetch as useHttp } from "@vueuse/core"

const router = useRouter();

const { data, refresh } = await useFetch("/api/session")
const createSession = async () => {
  const { data, error } = await useHttp("/api/session/new").post({ language: navigator.language }).json()
  refresh()
  router.push({
    name: 'session-sessionId',
    params: { sessionId: data.value?.id || '' }
  });
};
</script>
<template>
  <aside>
    <button @click="createSession" class="px-4 py-2 bg-blue-500 text-white rounded">New Session</button>
    <ul>
      <li v-for="session in data?.sessions" :key="session.id">
        <nuxt-link :to="{ name: 'session-sessionId', params: { sessionId: session.id } }">
          {{ session.name || session.id }}
        </nuxt-link>
      </li>
    </ul>
  </aside>
</template>