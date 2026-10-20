export type EnrollmentStatus = 'pending' | 'processing' | 'enrolled' | 'failed'

export interface HouseholdMemberRecord {
  member_id: string
  name: string
  photo_reference: string
  enrollment_status: EnrollmentStatus
  status_message: string | null
  created_at: string
  updated_at: string
}

const apiBaseUrl = (import.meta.env.VITE_HAVEN_API_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/+$/, '')

export class EnrollmentApiError extends Error {
  status: number | null

  constructor(message: string, status: number | null = null) {
    super(message)
    this.name = 'EnrollmentApiError'
    this.status = status
  }
}

async function authorizedFetch(path: string, token: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers)
  headers.set('Authorization', `Bearer ${token}`)

  try {
    return await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers,
    })
  } catch {
    throw new EnrollmentApiError('The enrollment backend is unavailable. Start the local COJ-CS API and try again.')
  }
}

async function errorForResponse(response: Response): Promise<EnrollmentApiError> {
  let message = `Enrollment request failed (${response.status}).`
  try {
    const body: unknown = await response.json()
    if (typeof body === 'object' && body !== null && 'detail' in body && typeof body.detail === 'string') {
      message = body.detail
    }
  } catch {
    return new EnrollmentApiError(message, response.status)
  }
  return new EnrollmentApiError(message, response.status)
}

async function request<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const response = await authorizedFetch(path, token, init)
  if (!response.ok) {
    throw await errorForResponse(response)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export function listHouseholdMembers(token: string): Promise<HouseholdMemberRecord[]> {
  return request('/members', token)
}

export function createHouseholdMember(token: string, name: string, photo: File): Promise<HouseholdMemberRecord> {
  const body = new FormData()
  body.append('name', name)
  body.append('photo', photo)
  return request('/members', token, { method: 'POST', body })
}

export function getHouseholdMemberPhoto(token: string, memberId: string): Promise<Blob> {
  return authorizedFetch(`/members/${encodeURIComponent(memberId)}/photo`, token).then(async (response) => {
    if (!response.ok) throw await errorForResponse(response)
    return response.blob()
  })
}

export function deleteHouseholdMember(token: string, memberId: string): Promise<void> {
  return request(`/members/${encodeURIComponent(memberId)}`, token, { method: 'DELETE' })
}
