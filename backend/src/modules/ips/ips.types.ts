export interface IpDocument {
  type: 'ip';
  schemaVersion: 1;
  ip: string; // "34.102.212.0"
  version: 4 | 6; // IPv4 or IPv6
  hostname?: string; // reverse DNS, if any
  asn?: string; // "AS396982"
  owner?: string; // "Google LLC"
  country?: string; // "US"
  region?: string;
  city?: string;
  location?: { lat: number; lon: number };
  timezone?: string;
  fetchedAt: string; // ISO date
}

export interface IpResponse extends IpDocument {
  source: 'cache' | 'ipinfo';
}

// Raw response from https://ipinfo.io/<ip>/json
export interface IpInfoResponse {
  ip: string;
  hostname?: string;
  city?: string;
  region?: string;
  country?: string;
  loc?: string; // "37.4056,-122.0775"
  org?: string; // "AS15169 Google LLC"
  timezone?: string;
  bogon?: boolean;
}
