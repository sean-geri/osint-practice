<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getIpInfo } from '@/operations/ips.operations'
import type { IpInfo } from '@/types/ip'

// An IP picked elsewhere on the page (e.g. clicked in the domain results).
const props = defineProps<{ ip?: string | null }>()

const query = ref('')
const result = ref<IpInfo | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

async function lookup(ip: string) {
  const value = ip.trim()
  if (!value) return
  query.value = value
  loading.value = true
  error.value = null
  result.value = null
  try {
    result.value = await getIpInfo(value)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Something went wrong'
  } finally {
    loading.value = false
  }
}

watch(
  () => props.ip,
  (ip) => {
    if (ip) lookup(ip)
  },
)

const fetchedAt = computed(() =>
  result.value ? new Date(result.value.fetchedAt).toLocaleString() : '',
)

const place = computed(() => {
  const r = result.value
  if (!r) return undefined
  const parts = [r.city, r.region, r.country].filter(Boolean)
  return parts.length ? parts.join(', ') : undefined
})

const fields = computed(() => {
  const r = result.value
  if (!r) return []
  return [
    { label: 'Hostname', value: r.hostname, mono: true },
    { label: 'ASN', value: r.asn, mono: true },
    { label: 'Owner', value: r.owner },
    { label: 'Location', value: place.value },
    {
      label: 'Coordinates',
      value: r.location ? `${r.location.lat}, ${r.location.lon}` : undefined,
      mono: true,
    },
    { label: 'Timezone', value: r.timezone },
  ]
})
</script>

<template>
  <aside class="panel">
    <header class="panel-header">
      <h2>IP lookup</h2>
      <p class="subtitle">Owner, ASN and location for an IP address.</p>
    </header>

    <form class="search" @submit.prevent="lookup(query)">
      <label for="ip-input" class="visually-hidden">IP address</label>
      <input
        id="ip-input"
        v-model="query"
        class="search-input"
        type="text"
        placeholder="8.8.8.8"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        :disabled="loading"
      />
      <button class="search-button" type="submit" :disabled="loading || !query.trim()">
        {{ loading ? 'Looking up…' : 'Look up' }}
      </button>
    </form>

    <p v-if="error" class="alert" role="alert">{{ error }}</p>

    <p v-if="loading" class="status">Querying IPinfo…</p>

    <div v-if="result" class="result">
      <div class="result-header">
        <h3 class="result-ip">{{ result.ip }}</h3>
        <span class="badge version">IPv{{ result.version }}</span>
        <span class="badge" :class="result.source">
          {{ result.source === 'cache' ? 'Cached' : 'Live IPinfo' }}
        </span>
      </div>
      <span class="fetched">Fetched {{ fetchedAt }}</span>

      <dl class="fields">
        <div v-for="field in fields" :key="field.label" class="field">
          <dt>{{ field.label }}</dt>
          <dd v-if="field.value" :class="{ mono: field.mono }">{{ field.value }}</dd>
          <dd v-else class="empty">Unknown</dd>
        </div>
      </dl>
    </div>

    <p v-else-if="!loading && !error" class="hint">
      Enter an IP, or click an address in the domain results.
    </p>
  </aside>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
}

.panel-header h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.subtitle {
  margin: 4px 0 0;
  color: var(--text-muted);
}

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
  background: var(--bg);
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

.alert {
  margin: 0;
  padding: 10px 14px;
  border: 1px solid var(--danger);
  border-radius: var(--radius);
  background: var(--danger-dim);
  color: var(--danger);
}

.status,
.hint {
  margin: 0;
  color: var(--text-muted);
}

.result {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.result-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 10px;
}

.result-ip {
  margin: 0;
  font-family: var(--mono);
  font-size: 1.15rem;
  overflow-wrap: anywhere;
}

.badge {
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
}

.badge.version {
  background: var(--surface-2);
  color: var(--text);
}

.badge.cache {
  background: var(--info-dim);
  color: var(--info);
}

.badge.ipinfo {
  background: var(--accent-dim);
  color: var(--accent);
}

.fetched {
  color: var(--text-muted);
  font-size: 0.85rem;
}

.fields {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 10px 0 0;
}

.field {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
  border-radius: 6px;
  background: var(--surface-2);
}

.field dt {
  flex-shrink: 0;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.field dd {
  margin: 0;
  text-align: right;
  overflow-wrap: anywhere;
}

.mono {
  font-family: var(--mono);
  font-size: 0.9rem;
}

.empty {
  color: var(--text-muted);
  font-style: italic;
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
