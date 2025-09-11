import { events } from '../enumerations/events'
import { loadHeader, removeHeader } from '../lifecycle/lifecycle'
import { defaultSettings } from './defaultSettings'
import { settingsKeeper } from './settingsKeeper'

/** @typedef {import('src/@types/jsDocTypes.d').FooterSettings} FooterSettings */
/** @typedef {import('src/@types/jsDocTypes.d').Settings} Settings */
/** @typedef {import('src/@types/jsDocTypes.d').SettingsInput} SettingsInput */

function doLoadHeader() {
  removeHeader(false)

  loadHeader()
}

// Trigger a custom event ('HeaderLoaded') that developers can listen for
// in their applications.
// The event needs to wait for the UMD library to load the global window.Header
// module. Use setInterval to wait for this script to finish running before firing
// the `HeaderLoaded` event.
const MAX_EVENT_FIRES = 15000
let numberEventFires = 0

const intervalId = setInterval(() => {
  numberEventFires += 1
  if (
    numberEventFires >= MAX_EVENT_FIRES ||
    // @ts-expect-error header puts this member on window
    window['@guidogerb/header']?.isSetHeaderSettingsCalled
  ) {
    clearInterval(intervalId)
  } else {
    // please, developer, call setHeaderSettings() as soon as you receive this event... the header
    // can't load if you don't give it any settings.
    document.dispatchEvent(new Event(events.HEADER_LOADED))
  }
}, 2)

/**
 * @param {SettingsInput} newSettings
 * @returns {Settings}
 */
export function setHeaderSettings(newSettings) {
  // note that if newSettings has a key/value where the value is undefined it WILL override the value to undefined
  // but if newSettings is missing a key then the `undefined` value of the missing key will not override the default.
  // this is only a shallow copy, so merging nested settings does not happen.
  settingsKeeper.setSettings(newSettings)

  // @ts-expect-error window has no index signature
  if (window['@guidogerb/header']) {
    // @ts-expect-error window has no index signature
    window['@guidogerb/header'].isSetHeaderSettingsCalled = true
  }

  if (document?.body) {
    doLoadHeader()
  } else {
    window.addEventListener('load', () => doLoadHeader())
  }

  return settingsKeeper.getSettings()
}

/**
 * @param {FooterSettings} [footerSettings]
 * @returns {FooterSettings | undefined}
 */
export function setFooterSettings(footerSettings) {
  return setHeaderSettings({
    ...defaultSettings,
    ...settingsKeeper.getSettings(),
    footer: footerSettings,
  })
}
