import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useEditMode } from './EditModeContext.jsx'
import { clearDraft, readDraft, writeDraft } from './localDraftStorage.js'

const UPSERT_SLOT_INSTANCE_MUTATION = `
  mutation UpsertSlotInstance($input: SlotInstanceInput!) {
    upsertSlotInstance(input: $input) {
      editableId
      slotKey
      variant
      sizes
      propsJSON
      updatedAt
    }
  }
`

function deepClone(value) {
  if (value == null) return value
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value)
    } catch (error) {
      // Fall through to JSON cloning
    }
  }
  return JSON.parse(JSON.stringify(value))
}

function sanitizeSizes(map) {
  if (!map || typeof map !== 'object') return undefined
  const result = {}
  for (const [breakpoint, entry] of Object.entries(map)) {
    if (!entry || typeof entry !== 'object') continue
    const normalized = {}
    for (const [dimension, raw] of Object.entries(entry)) {
      if (raw == null || raw === '') continue
      normalized[dimension] = raw
    }
    if (Object.keys(normalized).length > 0) {
      result[breakpoint] = normalized
    }
  }
  return Object.keys(result).length > 0 ? result : undefined
}

function sanitizePropsJSON(value) {
  if (value == null) return undefined
  if (typeof value !== 'object') return undefined
  if (Array.isArray(value)) {
    return deepClone(value)
  }
  return deepClone(value)
}

function sanitizeDraft(draft) {
  if (!draft) return { version: 1 }
  const sanitized = { version: 1 }

  if (draft.editableId) {
    sanitized.editableId = String(draft.editableId)
  }
  if (draft.slotKey) {
    sanitized.slotKey = String(draft.slotKey)
  }
  if (draft.variant != null && draft.variant !== '') {
    sanitized.variant = draft.variant
  }

  const sizes = sanitizeSizes(draft.sizes)
  if (sizes) {
    sanitized.sizes = sizes
  }

  const propsJSON = sanitizePropsJSON(draft.propsJSON ?? draft.props)
  if (propsJSON !== undefined) {
    sanitized.propsJSON = propsJSON
  }

  if (draft.updatedAt) {
    sanitized.updatedAt = draft.updatedAt
  }

  return sanitized
}

function sanitizeForCompare(draft) {
  const sanitized = sanitizeDraft(draft)
  const { updatedAt, version, ...rest } = sanitized
  return rest
}

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`
  }

  if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort()
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`
  }

  return JSON.stringify(value)
}

function normalizeDraft(base, candidate) {
  const sanitizedBase = sanitizeDraft(base)
  const sanitizedCandidate = sanitizeDraft(candidate)
  const merged = { ...sanitizedBase, ...sanitizedCandidate }
  merged.version = 1
  merged.updatedAt =
    sanitizedCandidate.updatedAt ||
    (candidate && candidate.updatedAt) ||
    sanitizedBase.updatedAt ||
    new Date().toISOString()
  return merged
}

function resolveHeaders(input) {
  if (!input) return {}
  if (typeof input === 'function') {
    try {
      const result = input()
      return result && typeof result === 'object' ? result : {}
    } catch (error) {
      return {}
    }
  }
  return typeof input === 'object' ? input : {}
}

function emptyPromise() {
  return Promise.resolve(null)
}

const NOOP = () => {}

export function useSlotEditing({
  editableId,
  slotKey,
  defaultVariant,
  variantProp,
  propOverrides,
  propsJSON,
}) {
  const {
    isEditing,
    activeEditableId,
    setActiveEditableId,
    graphqlEndpoint,
    graphqlHeaders,
    fetcher,
  } = useEditMode()

  const isEditable = Boolean(editableId)

  const baseState = useMemo(() => {
    if (!isEditable) return null
    return sanitizeDraft({
      editableId,
      slotKey,
      variant: variantProp ?? defaultVariant ?? null,
      sizes: propOverrides,
      propsJSON,
    })
  }, [isEditable, editableId, slotKey, variantProp, defaultVariant, propOverrides, propsJSON])

  const baseFingerprint = useMemo(
    () => (baseState ? stableStringify(sanitizeForCompare(baseState)) : 'base:none'),
    [baseState],
  )

  const initialStateRef = useRef(baseState)
  const [initialFingerprint, setInitialFingerprint] = useState(() =>
    baseState ? stableStringify(sanitizeForCompare(baseState)) : 'base:none',
  )

  const [draft, setDraft] = useState(() => {
    if (!isEditable || !baseState) return null
    const stored = readDraft(editableId)
    const normalized = normalizeDraft(baseState, stored)
    initialStateRef.current = baseState
    return normalized
  })

  useEffect(() => {
    if (!isEditable || !baseState) return
    initialStateRef.current = baseState
    setInitialFingerprint(stableStringify(sanitizeForCompare(baseState)))
    const stored = readDraft(editableId)
    setDraft(normalizeDraft(baseState, stored))
  }, [isEditable, editableId, baseFingerprint, baseState])

  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [overflowEvents, setOverflowEvents] = useState([])

  useEffect(() => {
    if (!isEditable) {
      setOverflowEvents([])
    }
  }, [isEditable])

  const updateDraft = useCallback(
    (updater) => {
      if (!isEditable) return
      setDraft((current) => {
        const nextPartial = typeof updater === 'function' ? updater(current) : updater
        const merged = normalizeDraft(initialStateRef.current, {
          ...current,
          ...nextPartial,
        })
        merged.updatedAt = new Date().toISOString()
        writeDraft(editableId, merged)
        return merged
      })
    },
    [isEditable, editableId],
  )

  const updateSize = useCallback(
    (breakpoint, dimension, value) => {
      if (!breakpoint || !dimension) return
      updateDraft((current) => {
        const sizes = deepClone(current?.sizes ?? {}) || {}
        const entry = { ...(sizes[breakpoint] || {}) }
        if (value == null || value === '') {
          delete entry[dimension]
        } else {
          entry[dimension] = value
        }
        if (Object.keys(entry).length > 0) {
          sizes[breakpoint] = entry
        } else {
          delete sizes[breakpoint]
        }
        return { sizes: Object.keys(sizes).length > 0 ? sizes : undefined }
      })
    },
    [updateDraft],
  )

  const clearBreakpoint = useCallback(
    (breakpoint) => {
      if (!breakpoint) return
      updateDraft((current) => {
        const sizes = deepClone(current?.sizes ?? {}) || {}
        if (sizes[breakpoint]) {
          delete sizes[breakpoint]
        }
        return { sizes: Object.keys(sizes).length > 0 ? sizes : undefined }
      })
    },
    [updateDraft],
  )

  const updateVariant = useCallback(
    (nextVariant) => {
      updateDraft({ variant: nextVariant || null })
    },
    [updateDraft],
  )

  const updateProps = useCallback(
    (nextProps) => {
      const normalized =
        nextProps != null && typeof nextProps === 'object' && Object.keys(nextProps).length > 0
          ? deepClone(nextProps)
          : undefined
      updateDraft({ propsJSON: normalized })
    },
    [updateDraft],
  )

  const isActive = isEditable && activeEditableId === editableId
  const shouldShowOverlay = Boolean(
    isEditable &&
      isEditing &&
      (activeEditableId == null || activeEditableId === editableId),
  )

  const setActive = useCallback(() => {
    if (!isEditable || !setActiveEditableId) return
    setActiveEditableId(editableId)
  }, [isEditable, editableId, setActiveEditableId])

  const recordOverflow = useCallback((event) => {
    if (!event) return
    setOverflowEvents((current) => {
      const next = [...current, { ...event, id: `${event.breakpoint}:${event.timestamp}` }]
      return next.slice(-8)
    })
  }, [])

  const publishDraft = useCallback(async () => {
    if (!isEditable || !draft) return null
    setStatus('saving')
    setError(null)
    const payload = sanitizeDraft(draft)
    try {
      if (graphqlEndpoint && fetcher) {
        const body = {
          query: UPSERT_SLOT_INSTANCE_MUTATION,
          variables: {
            input: {
              editableId: payload.editableId,
              slotKey: payload.slotKey,
              variant: payload.variant ?? null,
              sizes: payload.sizes ?? null,
              propsJSON: payload.propsJSON ?? null,
            },
          },
        }
        const headers = resolveHeaders(graphqlHeaders)
        const response = await fetcher(graphqlEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify(body),
        })
        const json = await response.json()
        if (json.errors && json.errors.length > 0) {
          throw new Error(json.errors[0].message || 'Failed to publish slot draft')
        }
        const result = json.data?.upsertSlotInstance
        if (result?.updatedAt) {
          payload.updatedAt = result.updatedAt
        }
      }

      clearDraft(editableId)
      const normalized = normalizeDraft(initialStateRef.current, payload)
      initialStateRef.current = sanitizeDraft(normalized)
      setInitialFingerprint(stableStringify(sanitizeForCompare(initialStateRef.current)))
      setDraft({ ...normalized, updatedAt: normalized.updatedAt })
      setStatus('idle')
      return normalized
    } catch (err) {
      setStatus('error')
      setError(err)
      throw err
    }
  }, [
    isEditable,
    draft,
    graphqlEndpoint,
    fetcher,
    graphqlHeaders,
    editableId,
  ])

  const discardDraft = useCallback(() => {
    if (!isEditable || !baseState) return
    clearDraft(editableId)
    initialStateRef.current = baseState
    setInitialFingerprint(stableStringify(sanitizeForCompare(baseState)))
    setDraft(normalizeDraft(baseState, baseState))
    setStatus('idle')
    setError(null)
    setOverflowEvents([])
  }, [isEditable, baseState, editableId])

  const currentFingerprint = useMemo(
    () => (draft ? stableStringify(sanitizeForCompare(draft)) : 'draft:none'),
    [draft],
  )

  const isDirty = currentFingerprint !== initialFingerprint

  if (!isEditable) {
    return {
      isEditable: false,
      isEditingEnabled: Boolean(isEditing),
      isActive: false,
      shouldShowOverlay: false,
      setActive: NOOP,
      recordOverflow: NOOP,
      publishDraft: emptyPromise,
      discardDraft: NOOP,
      updateSize: NOOP,
      updateVariant: NOOP,
      updateProps: NOOP,
      clearBreakpoint: NOOP,
      overrides: undefined,
      variant: variantProp ?? defaultVariant,
      props: propsJSON,
      draft: null,
      status,
      error,
      isDirty: false,
      overflowEvents: [],
      lastUpdatedAt: null,
    }
  }

  return {
    isEditable: true,
    isEditingEnabled: Boolean(isEditing),
    isActive,
    shouldShowOverlay,
    setActive,
    recordOverflow,
    publishDraft,
    discardDraft,
    updateSize,
    updateVariant,
    updateProps,
    clearBreakpoint,
    overrides: draft?.sizes,
    variant: draft?.variant ?? variantProp ?? defaultVariant,
    props: draft?.propsJSON ?? propsJSON,
    draft,
    status,
    error,
    isDirty,
    overflowEvents,
    lastUpdatedAt: draft?.updatedAt ?? null,
  }
}
