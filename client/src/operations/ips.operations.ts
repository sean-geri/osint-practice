import { appApi } from '@/api/app-api'
import type { IpInfo } from '@/types/ip'

export function getIpInfo(ip: string): Promise<IpInfo> {
  return appApi.get<IpInfo>(`/api/ips/${encodeURIComponent(ip.trim())}`)
}
