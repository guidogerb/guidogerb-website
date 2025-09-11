import { getHeaderSettings, setHeaderSettings } from '@guidogerb/header'
import { useEffect, useMemo } from 'react'
import { useImmerRef } from '../../hooks/useImmerRef'
import { HeaderContext } from './HeaderContext.js'

export function HeaderContextProvider({ children, defaultSettings }) {
  const [settings, setSettings, settingsRef] = useImmerRef(
    () =>
      /** @type {Partial<SettingsInput>} */ ({
        ...getHeaderSettings(),
        ...(defaultSettings ?? {}),
      }),
  )

  useEffect(() => {
    // these are the default settings for ANY app. Put your settings in your app (websiteHeaderSettings.js for the  Design System Website)
    // @ts-expect-error
    setHeaderSettings(settings)
  }, [settings])

  const providedSettings = useMemo(
    () => ({ settings, setSettings, settingsRef }),
    [setSettings, settings, settingsRef],
  )

  return (
    // eslint-disable-next-line react/jsx-no-constructed-context-values
    // @ts-expect-error
    <HeaderContext.Provider value={providedSettings}>{children}</HeaderContext.Provider>
  )
}
