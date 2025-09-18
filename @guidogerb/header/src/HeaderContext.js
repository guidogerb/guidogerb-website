import { createContext } from 'react'
import { getHeaderSettings } from './settings.js'

/** @typedef {import('./settings.js').HeaderSettings} HeaderSettings */

export const HeaderContext = createContext({
  settings: getHeaderSettings(),
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setSettings: /** @type {import('use-immer').Updater<HeaderSettings>} */ (() => {}),
  settingsRef: /** @type {import('react').RefObject<HeaderSettings>} */ (
    /** @type {unknown} */ ({ current: null })
  ),
})
