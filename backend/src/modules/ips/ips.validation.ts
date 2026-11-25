import { BlockList, isIP } from 'node:net';

// Private, loopback, link-local, documentation, multicast and other reserved ranges.
// Kept as two lists: a single BlockList checks IPv4 addresses against IPv6 rules too
// (as IPv4-mapped addresses), so the ::ffff:0:0/96 rule would match every IPv4 address.
const reservedV4 = new BlockList();
const reservedV6 = new BlockList();
for (const [net, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.88.99.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
] as const) {
  reservedV4.addSubnet(net, prefix, 'ipv4');
}
for (const [net, prefix] of [
  ['::', 128],
  ['::1', 128],
  ['::ffff:0:0', 96],
  ['100::', 64],
  ['2001:db8::', 32],
  ['fc00::', 7],
  ['fe80::', 10],
  ['ff00::', 8],
] as const) {
  reservedV6.addSubnet(net, prefix, 'ipv6');
}

export type ParsedIp = { ip: string; version: 4 | 6 };

/**
 * Returns the normalized IP (IPv6 in canonical compressed lowercase form, so
 * "2001:4860:4860:0:0:0:0:8888" and "2001:4860:4860::8888" share one cache key),
 * or null if the input is not a valid IP address.
 */
export function parseIp(input: string): ParsedIp | null {
  const value = input.trim();
  const version = isIP(value);
  if (version === 4) return { ip: value, version: 4 };
  if (version === 6) {
    return { ip: new URL(`http://[${value}]`).hostname.slice(1, -1), version: 6 };
  }
  return null;
}

export function isReservedIp({ ip, version }: ParsedIp): boolean {
  return version === 4 ? reservedV4.check(ip, 'ipv4') : reservedV6.check(ip, 'ipv6');
}
