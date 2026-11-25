import { appApi } from '@/api/app-api'
import type { DomainInfo } from '@/types/domain'

export function getDomainInfo(domain: string): Promise<DomainInfo> {
  return appApi.get<DomainInfo>(`/api/domains/${encodeURIComponent(domain.trim())}`)
}
