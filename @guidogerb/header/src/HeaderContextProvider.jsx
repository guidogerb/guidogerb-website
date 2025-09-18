import { useEffect, useMemo } from 'react'
import { useImmerRef } from './useImmerRef.js'
import { HeaderContext } from './HeaderContext.js'
import { createHeaderSettings, getHeaderSettings, setHeaderSettings } from './settings.js'

/**
 * @param {{
 *   children?: import('react').ReactNode,
 *   defaultSettings?: Partial<import('./settings.js').HeaderSettings>,
 * }} props
 */
export function HeaderContextProvider({ children, defaultSettings }) {
  const [settings, setSettings, settingsRef] = useImmerRef(() =>
    createHeaderSettings(defaultSettings ?? {}, getHeaderSettings()),
  )

  useEffect(() => {
    setHeaderSettings(settings)
  }, [settings])

  const providedSettings = useMemo(
    () => ({ settings, setSettings, settingsRef }),
    [settings, setSettings, settingsRef],
  )

  return (
    // eslint-disable-next-line react/jsx-no-constructed-context-values
    <HeaderContext.Provider value={providedSettings}>{children}</HeaderContext.Provider>
  )
}
