import * as React from 'react'

export type BreakpointKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export interface SlotSizeMap {
  inline: number | string
  block: number | string
  maxInline?: number | string
  maxBlock?: number | string
  minInline?: number | string
  minBlock?: number | string
}

export type SlotSizeOverrides = Partial<Record<BreakpointKey, Partial<SlotSizeMap> | SlotSizeMap>>

export interface SlotVariantMeta {
  label?: string
  description?: string
}

export interface SlotDesignMeta {
  figmaComponent?: string
  figmaNodeId?: string
  figmaUrl?: string
}

export interface SlotMeta {
  label?: string
  description?: string
  design?: SlotDesignMeta
  variants?: Record<string, SlotVariantMeta>
  defaultVariant?: string
  tags?: string | string[]
}

export interface SlotDefinition {
  sizes?: SlotSizeOverrides
  meta?: SlotMeta
  extends?: string
}

export type RegistryEntry = SlotDefinition | SlotSizeOverrides
export type Registry = Record<string, RegistryEntry>

export interface ResponsiveSlotBreakpoint {
  key: BreakpointKey
  query: string
}

export interface ResponsiveSlotBreakpointInput {
  key: BreakpointKey
  query?: string
  media?: string
  minWidth?: number
  maxWidth?: number
}

export interface ResponsiveSlotProviderProps {
  registry?: Registry
  breakpoints?: ReadonlyArray<ResponsiveSlotBreakpointInput>
  defaultBreakpoint?: BreakpointKey
  tokens?: Record<string, string | number>
  resolveToken?: (tokenName: string) => string | number | undefined | null
  children?: React.ReactNode
}

export interface ResponsiveSlotSize {
  inline: string
  block: string
  maxInline: string
  maxBlock: string
  minInline: string
  minBlock: string
  breakpoint: BreakpointKey
}

export type ResponsiveSlotStatus = 'idle' | 'saving' | 'error'

export interface SlotDraft {
  version: 1
  editableId?: string
  slotKey?: string
  variant?: string | null
  sizes?: SlotSizeOverrides
  propsJSON?: Record<string, unknown>
  updatedAt?: string
}

export interface OverflowEvent {
  id: string
  inlineBudget: string
  blockBudget: string
  breakpoint: BreakpointKey
  timestamp: number
}

export interface ResponsiveSlotEditingState {
  isEditable: boolean
  isEditingEnabled: boolean
  isActive: boolean
  shouldShowOverlay: boolean
  setActive: () => void
  recordOverflow: (event: {
    inlineBudget: string
    blockBudget: string
    breakpoint: BreakpointKey
  }) => void
  publishDraft: () => Promise<SlotDraft | null>
  discardDraft: () => void
  updateSize: (
    breakpoint: BreakpointKey,
    dimension: keyof SlotSizeMap,
    value: string | number | null | undefined,
  ) => void
  updateVariant: (variant?: string | null) => void
  updateProps: (props: Record<string, unknown> | undefined) => void
  clearBreakpoint: (breakpoint: BreakpointKey) => void
  overrides?: SlotSizeOverrides
  variant?: string | null
  props?: Record<string, unknown> | null
  draft: SlotDraft | null
  status: ResponsiveSlotStatus
  error: Error | null
  isDirty: boolean
  overflowEvents: OverflowEvent[]
  lastUpdatedAt: string | null
}

export interface ResponsiveSlotInstance {
  slot: string
  variant: string
  props?: Record<string, unknown> | null
  meta?: SlotMeta
  byBreakpoint: SlotSizeOverrides
  editing?: ResponsiveSlotEditingState
}

type ElementProps<E extends React.ElementType> = Omit<
  React.ComponentPropsWithRef<E>,
  keyof GuidoGerbUI_ContainerBaseProps
>

export interface GuidoGerbUI_ContainerBaseProps {
  slot: string
  sizes?: SlotSizeOverrides | 'content'
  inherit?: boolean
  overflow?: React.CSSProperties['overflow']
  editableId?: string
  variant?: string
  propsJSON?: Record<string, unknown> | null
  children?: React.ReactNode
}

export type GuidoGerbUI_ContainerProps<E extends React.ElementType = 'div'> =
  GuidoGerbUI_ContainerBaseProps & {
    as?: E
  } & ElementProps<E>

export function ResponsiveSlotProvider(props: ResponsiveSlotProviderProps): JSX.Element

export function useBreakpointKey(): BreakpointKey

export function useResponsiveSlotSize(
  slot: string,
  overrides?: SlotSizeOverrides | 'content',
): ResponsiveSlotSize

export interface ResolveResponsiveSlotSizeOptions {
  slot: string
  breakpoint: BreakpointKey
  registry?: Registry
  overrides?: SlotSizeOverrides | 'content'
  tokenResolver?: (tokenName: string) => string | number | undefined | null
  inheritedSizes?: SlotSizeOverrides
  fallbackBreakpoint?: BreakpointKey
}

export function resolveResponsiveSlotSize(
  options: ResolveResponsiveSlotSizeOptions,
): Omit<ResponsiveSlotSize, 'breakpoint'>

export function useResponsiveSlotMeta(slot: string): SlotMeta

export function useResponsiveSlotInstance(): ResponsiveSlotInstance | null

export function GuidoGerbUI_Container<E extends React.ElementType = 'div'>(
  props: GuidoGerbUI_ContainerProps<E>,
): JSX.Element

export function ResponsiveSlot<E extends React.ElementType = 'div'>(
  props: GuidoGerbUI_ContainerProps<E>,
): JSX.Element

export const responsiveSlotBreakpoints: ReadonlyArray<ResponsiveSlotBreakpoint>

export const baseResponsiveSlots: Registry

export type EditModeKeyboardShortcut = {
  key: string
  altKey?: boolean
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
}

export interface EditModeProviderProps {
  children?: React.ReactNode
  initialMode?: boolean
  graphqlEndpoint?: string | null
  graphqlHeaders?: Record<string, string> | null | (() => Record<string, string> | undefined)
  fetcher?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
  enableKeyboardShortcut?: boolean
  keyboardShortcut?: EditModeKeyboardShortcut
  enableToolbar?: boolean
  toolbarLabel?: string
  toolbarShortcutHint?: string
  toolbarPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  persistState?: boolean
  stateStorageKey?: string
}

export interface EditModeContextValue {
  isEditing: boolean
  activeEditableId: string | null
  setActiveEditableId: (editableId: string | null) => void
  toggleEditMode: () => void
  enterEditMode: () => void
  exitEditMode: () => void
  graphqlEndpoint: string | null
  graphqlHeaders: Record<string, string> | null | (() => Record<string, string> | undefined)
  fetcher: ((input: RequestInfo | URL, init?: RequestInit) => Promise<Response>) | null
}

export function EditModeProvider(props: EditModeProviderProps): JSX.Element
export function useEditMode(): EditModeContextValue

export interface JsonEditorProps {
  label?: string
  value?: unknown
  onChange?: (value: unknown) => void
  onErrorChange?: (error: string | null) => void
  rows?: number
  id?: string
  description?: React.ReactNode
  containerStyle?: React.CSSProperties
  labelProps?: React.LabelHTMLAttributes<HTMLLabelElement>
  textareaProps?: React.TextareaHTMLAttributes<HTMLTextAreaElement>
  errorMessagePrefix?: string
}

export function JsonEditor(props: JsonEditorProps): JSX.Element

export interface SlotEditorOverlayProps {
  slotKey: string
  slotLabel: string
  editableId?: string
  variant: string
  variantOptions: Record<string, SlotVariantMeta>
  onVariantChange: (variant: string) => void
  breakpoints: ReadonlyArray<ResponsiveSlotBreakpoint>
  activeBreakpoint: BreakpointKey
  sizes: SlotSizeOverrides
  draftSizes: SlotSizeOverrides
  onSizeChange: (
    breakpoint: BreakpointKey,
    dimension: keyof SlotSizeMap,
    value: string | number | null | undefined,
  ) => void
  onClearBreakpoint: (breakpoint: BreakpointKey) => void
  propsJSON?: Record<string, unknown> | null
  onPropsChange: (props: Record<string, unknown> | undefined) => void
  publishDraft: () => Promise<SlotDraft | null>
  discardDraft: () => void
  isDirty: boolean
  status: ResponsiveSlotStatus
  error: Error | null
  lastUpdatedAt: string | null
  overflowEvents: OverflowEvent[]
  isActive: boolean
  onActivate: () => void
}

export function SlotEditorOverlay(props: SlotEditorOverlayProps): JSX.Element
