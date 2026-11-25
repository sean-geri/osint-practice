export interface IpLocation {
  lat: number
  lon: number
}

export interface IpInfo {
  type: 'ip'
  schemaVersion: 1
  ip: string
  version: 4 | 6
  hostname?: string
  asn?: string
  owner?: string
  country?: string
  region?: string
  city?: string
  location?: IpLocation
  timezone?: string
  fetchedAt: string
  source: 'cache' | 'ipinfo'
}
