export function resolveSlot(slot) {
  if (typeof slot === 'function') {
    return slot()
  }
  return slot ?? null
}

export function joinClassNames(...classes) {
  return classes.filter(Boolean).join(' ')
}
