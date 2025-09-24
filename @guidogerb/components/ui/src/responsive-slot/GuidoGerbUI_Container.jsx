import { ResponsiveSlot } from '../ResponsiveSlot/ResponsiveSlot.jsx'

const DEFAULT_OVERFLOW = 'hidden auto'

/**
 * Thin wrapper around the existing ResponsiveSlot implementation that exposes the
 * GuidoGerb UI Container API described in the spec. It preserves the default
 * overflow behaviour, forwards sizing props, and leaves room for future
 * enhancements without forcing consumers to migrate immediately.
 */
export function GuidoGerbUI_Container({ overflow = DEFAULT_OVERFLOW, ...props }) {
  return <ResponsiveSlot overflow={overflow} {...props} />
}

GuidoGerbUI_Container.displayName = 'GuidoGerbUI_Container'

