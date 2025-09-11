import { getHeaderSettings, setHeaderSettings } from '@guidogerb/header'
import { useEffect, useMemo } from 'react'
import { useImmerRef } from '../../hooks/useImmerRef'
import { HeaderContext } from './HeaderContext.js'

/** @typedef {import('@guidogerb/header').SettingsInput} SettingsInput */

/**
 * provider that wraps the app at the top level
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {SettingsInput} [props.defaultSettings]
 * @returns {React.JSX.Element}
 */
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
    // Vite HMR was sometimes getting an "unspreadable" value for this context!
    // The above useMemo() ALWAYS returns a spreadable object, so it seems it's got to
    // be HMR's fault it's not always behaving? Why would providedSettings ever not be an object?
    // eslint-disable-next-line react/jsx-no-constructed-context-values
    // @ts-expect-error
    <HeaderContext.Provider value={providedSettings}>{children}</HeaderContext.Provider>
  )
}
