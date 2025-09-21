const STORAGE_PREFIX = 'gg:slot:'
const STORAGE_VERSION = 'v1'

function getStorage() {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage || null
  } catch (error) {
    return null
  }
}

function buildKey(editableId) {
  return `${STORAGE_PREFIX}${editableId}:${STORAGE_VERSION}`
}

export function readDraft(editableId) {
  const storage = getStorage()
  if (!storage || !editableId) return null

  try {
    const raw = storage.getItem(buildKey(editableId))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') {
      return null
    }
    return parsed
  } catch (error) {
    return null
  }
}

export function writeDraft(editableId, draft) {
  const storage = getStorage()
  if (!storage || !editableId) return
  try {
    storage.setItem(buildKey(editableId), JSON.stringify(draft))
  } catch (error) {
    // Swallow quota errors silently to avoid crashing the editor.
  }
}

export function clearDraft(editableId) {
  const storage = getStorage()
  if (!storage || !editableId) return
  try {
    storage.removeItem(buildKey(editableId))
  } catch (error) {
    // Ignore failures (e.g., quota or private mode restrictions)
  }
}

export function hasDraft(editableId) {
  const storage = getStorage()
  if (!storage || !editableId) return false
  try {
    return storage.getItem(buildKey(editableId)) != null
  } catch (error) {
    return false
  }
}
