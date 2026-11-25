export interface MxRecord {
  exchange: string;
  priority: number;
}

export interface DomainRecords {
  ipv4: string[];
  ipv6: string[];
  mx: MxRecord[];
  ns: string[];
  txt: string[];
}

export interface DomainDocument {
  domain: string;
  records: DomainRecords;
  fetchedAt: string;
}

export interface DomainResponse extends DomainDocument {
  source: 'cache' | 'dns';
}
