export interface MxRecord {
  exchange: string
  priority: number
}

export interface DomainRecords {
  ipv4: string[]
  ipv6: string[]
  mx: MxRecord[]
  ns: string[]
  txt: string[]
}

export interface DomainInfo {
  domain: string
  records: DomainRecords
  fetchedAt: string
  source: 'cache' | 'dns'
}
