const BASE_URL = 'http://localhost:3003'

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    })
  } catch {
    throw new ApiError(`Cannot reach the server at ${BASE_URL}`, 0)
  }

  const body = await response.json().catch(() => null)

  if (!response.ok) {
    const message = (body as { error?: string } | null)?.error ?? `Request failed (${response.status})`
    throw new ApiError(message, response.status)
  }

  return body as T
}

export const appApi = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
}
