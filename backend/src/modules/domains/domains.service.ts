import { promises as dns } from 'node:dns';
import { DocumentNotFoundError } from 'couchbase';
import { getCollection } from '../../db/couchbase.js';
import type { DomainDocument, DomainRecords, DomainResponse } from './domains.types.js';

const CACHE_TTL_SECONDS = 24 * 60 * 60;

export class DomainNotFoundError extends Error {
  constructor(domain: string) {
    super(`Domain not found: ${domain}`);
    this.name = 'DomainNotFoundError';
  }
}

const NO_RECORDS_CODES = new Set(['ENODATA', 'ENOTFOUND']);

// Returns [] when the domain simply has no records of this type; rethrows real failures (timeouts etc.).
async function lookup<T>(resolver: () => Promise<T[]>): Promise<{ records: T[]; notFound: boolean }> {
  try {
    return { records: await resolver(), notFound: false };
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code && NO_RECORDS_CODES.has(code)) {
      return { records: [], notFound: code === 'ENOTFOUND' };
    }
    throw err;
  }
}

async function resolveDomain(domain: string): Promise<DomainRecords> {
  const [ipv4, ipv6, mx, ns, txt] = await Promise.all([
    lookup(() => dns.resolve4(domain)),
    lookup(() => dns.resolve6(domain)),
    lookup(() => dns.resolveMx(domain)),
    lookup(() => dns.resolveNs(domain)),
    lookup(() => dns.resolveTxt(domain)),
  ]);

  if ([ipv4, ipv6, mx, ns, txt].every((r) => r.notFound)) {
    throw new DomainNotFoundError(domain);
  }

  return {
    ipv4: ipv4.records,
    ipv6: ipv6.records,
    mx: mx.records.sort((a, b) => a.priority - b.priority),
    ns: ns.records,
    // A TXT record can be split into several chunks; join them back into one string.
    txt: txt.records.map((chunks) => chunks.join('')),
  };
}

export async function getDomainInfo(domain: string): Promise<DomainResponse> {
  const collection = getCollection();

  try {
    const result = await collection.get(domain);
    return { ...(result.content as DomainDocument), source: 'cache' };
  } catch (err) {
    if (!(err instanceof DocumentNotFoundError)) throw err;
  }

  const doc: DomainDocument = {
    domain,
    records: await resolveDomain(domain),
    fetchedAt: new Date().toISOString(),
  };

  // Couchbase deletes the document after 24h, so the next request triggers a fresh DNS lookup.
  await collection.upsert(domain, doc, { expiry: CACHE_TTL_SECONDS });

  return { ...doc, source: 'dns' };
}
