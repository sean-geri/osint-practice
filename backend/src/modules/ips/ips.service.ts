import { DocumentNotFoundError } from 'couchbase';
import { getCollection } from '../../db/couchbase.js';
import type { IpDocument, IpInfoResponse, IpResponse } from './ips.types.js';
import type { ParsedIp } from './ips.validation.js';

const CACHE_TTL_SECONDS = 24 * 60 * 60;
const IPINFO_TIMEOUT_MS = 10_000;

export class IpLookupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IpLookupError';
  }
}

export class ReservedIpError extends Error {
  constructor(ip: string) {
    super(`IP address is private or reserved: ${ip}`);
    this.name = 'ReservedIpError';
  }
}

const docKey = (ip: string) => `ip::${ip}`;

async function fetchFromIpInfo(ip: string): Promise<IpInfoResponse> {
  const token = process.env.IPINFO_TOKEN;
  let response: Response;
  try {
    response = await fetch(`https://ipinfo.io/${encodeURIComponent(ip)}/json`, {
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      signal: AbortSignal.timeout(IPINFO_TIMEOUT_MS),
    });
  } catch (err) {
    throw new IpLookupError(`IPinfo request failed: ${(err as Error).message}`);
  }

  if (!response.ok) {
    throw new IpLookupError(`IPinfo responded with ${response.status}`);
  }
  return (await response.json()) as IpInfoResponse;
}

function parseLocation(loc?: string): IpDocument['location'] {
  if (!loc) return undefined;
  const [lat, lon] = loc.split(',').map(Number);
  return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : undefined;
}

// "AS15169 Google LLC" -> { asn: "AS15169", owner: "Google LLC" }
function parseOrg(org?: string): Pick<IpDocument, 'asn' | 'owner'> {
  if (!org) return {};
  const match = /^(AS\d+)\s+(.+)$/.exec(org);
  return match ? { asn: match[1], owner: match[2] } : { owner: org };
}

function toIpDocument({ ip, version }: ParsedIp, info: IpInfoResponse): IpDocument {
  const doc: IpDocument = {
    type: 'ip',
    schemaVersion: 1,
    ip,
    version,
    hostname: info.hostname,
    ...parseOrg(info.org),
    country: info.country,
    region: info.region,
    city: info.city,
    location: parseLocation(info.loc),
    timezone: info.timezone,
    fetchedAt: new Date().toISOString(),
  };
  // Drop fields IPinfo didn't return so the stored document only has real values.
  return Object.fromEntries(Object.entries(doc).filter(([, v]) => v !== undefined)) as IpDocument;
}

export async function getIpInfo(parsed: ParsedIp): Promise<IpResponse> {
  const collection = getCollection();
  const key = docKey(parsed.ip);

  try {
    const result = await collection.get(key);
    return { ...(result.content as IpDocument), source: 'cache' };
  } catch (err) {
    if (!(err instanceof DocumentNotFoundError)) throw err;
  }

  const info = await fetchFromIpInfo(parsed.ip);
  if (info.bogon) throw new ReservedIpError(parsed.ip);

  const doc = toIpDocument(parsed, info);

  // Couchbase deletes the document after 24h, so the next request goes to IPinfo again.
  await collection.upsert(key, doc, { expiry: CACHE_TTL_SECONDS });

  return { ...doc, source: 'ipinfo' };
}
