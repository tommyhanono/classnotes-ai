const SESSIONS_KEY = 'classnotes_sessions'
const API_KEY_KEY = 'classnotes_api_key'
const LAST_SUBJECT_KEY = 'classnotes_last_subject'
const MAX_SESSIONS = 30

export function getApiKey() {
  return localStorage.getItem(API_KEY_KEY) || ''
}

export function saveApiKey(key) {
  localStorage.setItem(API_KEY_KEY, key)
}

export function getLastSubject() {
  return localStorage.getItem(LAST_SUBJECT_KEY) || ''
}

export function saveLastSubject(subject) {
  localStorage.setItem(LAST_SUBJECT_KEY, subject)
}

export function getSessions() {
  try {
    return JSON.parse(localStorage.getItem(SESSIONS_KEY)) || []
  } catch {
    return []
  }
}

export function saveSession(session) {
  let sessions = getSessions()
  const existing = sessions.findIndex(s => s.id === session.id)
  if (existing >= 0) {
    sessions[existing] = session
  } else {
    sessions.unshift(session)
    if (sessions.length > MAX_SESSIONS) {
      sessions = sessions.slice(0, MAX_SESSIONS)
    }
  }
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
}

export function deleteSession(id) {
  const sessions = getSessions().filter(s => s.id !== id)
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
}

export function createSession(subject, language) {
  const now = new Date()
  return {
    id: crypto.randomUUID(),
    subject,
    date: now.toISOString().split('T')[0],
    startTime: now.toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit' }),
    language,
    notes: [],
    noteCount: 0,
  }
}
