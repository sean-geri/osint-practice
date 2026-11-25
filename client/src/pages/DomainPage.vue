<script setup lang="ts">
import { computed, ref } from 'vue'
import DomainSearch from '@/components/DomainSearch.vue'
import { getDomainInfo } from '@/operations/domains.operations'
import type { DomainInfo } from '@/types/domain'

const result = ref<DomainInfo | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

async function onSearch(domain: string) {
  loading.value = true
  error.value = null
  result.value = null
  try {
    result.value = await getDomainInfo(domain)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Something went wrong'
  } finally {
    loading.value = false
  }
}

const fetchedAt = computed(() =>
  result.value ? new Date(result.value.fetchedAt).toLocaleString() : '',
)

const sections = computed(() => {
  const r = result.value?.records
  if (!r) return []
  return [
    { key: 'ipv4', title: 'IPv4 (A)', items: r.ipv4 },
    { key: 'ipv6', title: 'IPv6 (AAAA)', items: r.ipv6 },
    { key: 'ns', title: 'Name servers (NS)', items: r.ns },
  ]
})
</script>

<template>
  <section class="page">
    <header class="page-header">
      <h1>Domain lookup</h1>
      <p class="subtitle">IP addresses, mail servers, name servers and TXT records for a domain.</p>
    </header>

    <DomainSearch :loading="loading" @search="onSearch" />

    <p v-if="error" class="alert" role="alert">{{ error }}</p>

    <p v-if="loading" class="status">Querying DNS…</p>

    <div v-if="result" class="result">
      <div class="result-header">
        <h2 class="result-domain">{{ result.domain }}</h2>
        <span class="badge" :class="result.source">
          {{ result.source === 'cache' ? 'Cached' : 'Live DNS' }}
        </span>
        <span class="fetched">Fetched {{ fetchedAt }}</span>
      </div>

      <div class="grid">
        <article v-for="section in sections" :key="section.key" class="card">
          <h3 class="card-title">
            {{ section.title }} <span class="count">{{ section.items.length }}</span>
          </h3>
          <ul v-if="section.items.length" class="list">
            <li v-for="item in section.items" :key="item" class="mono">{{ item }}</li>
          </ul>
          <p v-else class="empty">No records</p>
        </article>

        <article class="card">
          <h3 class="card-title">
            Mail servers (MX) <span class="count">{{ result.records.mx.length }}</span>
          </h3>
          <ul v-if="result.records.mx.length" class="list">
            <li v-for="mx in result.records.mx" :key="mx.exchange" class="mx-row">
              <span class="mono">{{ mx.exchange }}</span>
              <span class="priority">priority {{ mx.priority }}</span>
            </li>
          </ul>
          <p v-else class="empty">No records</p>
        </article>

        <article class="card card-wide">
          <h3 class="card-title">
            Text records (TXT) <span class="count">{{ result.records.txt.length }}</span>
          </h3>
          <ul v-if="result.records.txt.length" class="list">
            <li v-for="(txt, i) in result.records.txt" :key="i" class="mono txt">{{ txt }}</li>
          </ul>
          <p v-else class="empty">No records</p>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header h1 {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 600;
}

.subtitle {
  margin: 4px 0 0;
  color: var(--text-muted);
}

.alert {
  margin: 0;
  padding: 10px 14px;
  border: 1px solid var(--danger);
  border-radius: var(--radius);
  background: var(--danger-dim);
  color: var(--danger);
}

.status {
  margin: 0;
  color: var(--text-muted);
}

.result {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 14px;
}

.result-domain {
  margin: 0;
  font-family: var(--mono);
  font-size: 1.25rem;
  overflow-wrap: anywhere;
}

.badge {
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
}

.badge.cache {
  background: var(--info-dim);
  color: var(--info);
}

.badge.dns {
  background: var(--accent-dim);
  color: var(--accent);
}

.fetched {
  color: var(--text-muted);
  font-size: 0.85rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}

.card {
  min-width: 0;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
}

.card-wide {
  grid-column: 1 / -1;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.count {
  padding: 0 7px;
  border-radius: 999px;
  background: var(--surface-2);
  color: var(--text);
  font-size: 0.75rem;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.list li {
  padding: 6px 10px;
  border-radius: 6px;
  background: var(--surface-2);
}

.mono {
  font-family: var(--mono);
  font-size: 0.9rem;
  overflow-wrap: anywhere;
}

.txt {
  white-space: pre-wrap;
}

.mx-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.priority {
  flex-shrink: 0;
  color: var(--text-muted);
  font-size: 0.8rem;
}

.empty {
  margin: 0;
  color: var(--text-muted);
  font-style: italic;
}
</style>
