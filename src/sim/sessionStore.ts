export interface Session {
  id: string
  timestamp: number
  breathingRateBrpm: number
  vagalTone: number
  metricsWindow: 'live' | 'clinical'
  rmssdMs: number
  sdnnMs: number
  lfPower: number
  hfPower: number
}

const STORAGE_KEY = 'hrv-sessions'
const MAX_SESSIONS = 20

export function loadSessions(): Session[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Session[]) : []
  } catch {
    return []
  }
}

export function saveSession(session: Omit<Session, 'id' | 'timestamp'>): Session[] {
  const sessions = loadSessions()
  sessions.push({ ...session, id: crypto.randomUUID(), timestamp: Date.now() })
  const trimmed = sessions.slice(-MAX_SESSIONS)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  return trimmed
}

export function deleteSession(id: string): Session[] {
  const remaining = loadSessions().filter((s) => s.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining))
  return remaining
}
