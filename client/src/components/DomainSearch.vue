<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ loading?: boolean }>()
const emit = defineEmits<{ search: [domain: string] }>()

const domain = ref('')

function submit() {
  const value = domain.value.trim()
  if (value) emit('search', value)
}
</script>

<template>
  <form class="search" @submit.prevent="submit">
    <label for="domain-input" class="visually-hidden">Domain name</label>
    <input
      id="domain-input"
      v-model="domain"
      class="search-input"
      type="text"
      placeholder="example.com"
      autocomplete="off"
      autocapitalize="off"
      spellcheck="false"
      :disabled="loading"
    />
    <button class="search-button" type="submit" :disabled="loading || !domain.trim()">
      {{ loading ? 'Looking up…' : 'Look up' }}
    </button>
  </form>
</template>

<style scoped>
.search {
  display: flex;
  gap: 8px;
}

.search-input {
  flex: 1;
  min-width: 0;
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  font-family: var(--mono);
  outline: none;
}

.search-input::placeholder {
  color: var(--text-muted);
}

.search-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-dim);
}

.search-button {
  padding: 10px 18px;
  border: none;
  border-radius: var(--radius);
  background: var(--accent);
  color: #06210f;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.search-button:hover:not(:disabled) {
  filter: brightness(1.1);
}

.search-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
