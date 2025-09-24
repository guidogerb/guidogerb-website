# @guidogerb/hooks

Reusable React hooks and debugging helpers shared across Guido & Gerber web projects. The
collection covers keyboard and focus management, timers, ref utilities, and lightweight
dev-only diagnostics so feature teams can assemble consistent behaviors without re-writing
low-level effects.

## Installation

```bash
pnpm add @guidogerb/hooks
```

## Usage

```tsx
import {
  useClickOutside,
  useDebounceFunc,
  useGlobalKeyEvent,
  usePopupDelay,
  useRememberCursorPosition,
  useTimeout,
} from '@guidogerb/hooks'
import { useRef, useState } from 'react'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [term, setTerm] = useState('')
  const anchorRef = useRef(null)
  const dialogRef = useRef(null)
  const inputRef = useRef(null)
  const rememberCursor = useRememberCursorPosition(inputRef, term)
  const debouncedSearch = useDebounceFunc((value) => fetch(`/api/search?q=${value}`), 250)
  const scheduleClose = useTimeout(150, true)
  const { startPopupTimer, startNoPopupTimer } = usePopupDelay()
  const slashHeld = useGlobalKeyEvent({ whichKeyCode: 'Slash', onKeyDown: () => setOpen(true) })

  useClickOutside(
    [dialogRef, anchorRef],
    () => {
      setOpen(false)
      startNoPopupTimer()
    },
    !open,
  )

  return (
    <div ref={anchorRef}>
      <button
        data-active={open || slashHeld}
        onMouseEnter={() => startPopupTimer(() => setOpen(true))}
      >
        Search
      </button>
      {open ? (
        <dialog
          ref={dialogRef}
          onMouseLeave={() =>
            scheduleClose(() => {
              setOpen(false)
              startNoPopupTimer()
            })
          }
          onClose={() => {
            setOpen(false)
            startNoPopupTimer()
          }}
        >
          <input
            ref={inputRef}
            autoFocus
            value={term}
            onChange={(event) => {
              rememberCursor(event)
              setTerm(event.target.value)
              debouncedSearch(event.target.value)
            }}
          />
        </dialog>
      ) : null}
    </div>
  )
}
```

## Available hooks

### Interaction & accessibility

- `useClickOutside(refs, handler, isDisabled?)` &mdash; closes popovers only when pointer
  events begin outside the supplied refs, avoiding double-firing on the originating
  trigger.【F:@guidogerb/hooks/useClickOutside.js†L12-L55】
- `useGlobalKeyEvent({ whichKeyCode, onKeyDown, onKeyUp })` &mdash; tracks whether a global
  key is pressed while invoking optional React-style handlers for both phases.【F:@guidogerb/hooks/useGlobalKeyEvent.js†L12-L44】
- `useHandleEscape(onEscape?)` &mdash; memoized keyboard handler that intercepts `Escape`
  presses, prevents default bubbling, and calls an optional callback.【F:@guidogerb/hooks/useHandleEscape.js†L1-L19】
- `useHandleTab(first, last)` &mdash; traps focus inside modals by wrapping Tab/Shift+Tab at
  the supplied boundary elements.【F:@guidogerb/hooks/useHandleTab.js†L1-L23】

### Timing utilities

- `useDebounceFunc(func, delay?)` &mdash; fires the wrapped callback immediately, then queues a
  trailing execution after the cooldown window with the latest argument, returning a
  promise that resolves when the deferred call runs.【F:@guidogerb/hooks/useDebounceFunc.js†L12-L41】
- `useInterval(callback, delay, { isDisabled }?)` &mdash; persistent interval that keeps the
  latest callback in a ref so updates do not restart the timer unless the delay or disabled
  flag change.【F:@guidogerb/hooks/useInterval.js†L1-L26】
- `useTimeout(delay, isDebounced)` &mdash; schedules debounced or parallel timeouts and clears
  pending timers on unmount.【F:@guidogerb/hooks/useTimeout.js†L1-L26】
- `usePopupDelay()` &mdash; shared timer controller that throttles rapid open/close cycles so
  hover popovers feel responsive without flicker. Supports optional `delayMs` and
  `cooldownMs` overrides for finely tuned hover behavior.【F:@guidogerb/hooks/usePopupDelay.js†L1-L78】

### State & ref helpers

- `useImmerRef(defaultState)` &mdash; pairs `useImmer` state with a ref that always mirrors the
  latest value to sidestep stale closures in async callbacks.【F:@guidogerb/hooks/useImmerRef.js†L1-L23】
- `useRefAlways(value)` &mdash; synchronizes a ref with the provided value on every render for
  consumers that expect always-fresh references.【F:@guidogerb/hooks/useRefAlways.js†L1-L13】
- `useRefLazy(initial)` &mdash; lazily resolves the ref's initial value from a function, matching
  `useState`'s initializer semantics.【F:@guidogerb/hooks/useRefLazy.js†L1-L16】
- `useRememberCursorPosition(ref, value)` &mdash; caches and restores input selection ranges so
  async value updates do not jump the cursor.【F:@guidogerb/hooks/useRememberCursorPosition.js†L1-L27】

### Debug helpers

- `useMountingTracker(label)` &mdash; console-logs mount/unmount cycles and guards against label
  changes, making effect lifecycles visible during development.【F:@guidogerb/hooks/useMountingTracker.js†L1-L21】
- `debug/useDebugDidIChange(value, name)` &mdash; warns when a tracked value changes between
  renders.【F:@guidogerb/hooks/debug/useDebugDidIChange.js†L1-L16】
- `debug/useDebugDidIChanges(fields, description?)` &mdash; reports individual key changes for
  objects, useful when chasing dependency arrays.【F:@guidogerb/hooks/debug/useDebugDidIChanges.js†L1-L19】

Use these primitives individually or together to build richer behaviors across tenant
applications while keeping accessibility, timing, and debugging conventions consistent.
