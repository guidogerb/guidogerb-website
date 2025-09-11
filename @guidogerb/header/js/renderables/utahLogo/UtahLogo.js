// eslint-disable-next-line import/extensions
import packageJsonJSON from '../../../../package.json?raw'
const packageJson = /** @type {{version: string}} */ (/** @type {unknown} */ (packageJsonJSON))

import { domConstants, getCssClassSelector } from '../../enumerations/domConstants'
import { sizes } from '../../enumerations/sizes'
import { renderDOMSingle } from '../../misc/renderDOMSingle'
import { uuidv4 } from '../../misc/uuidv4'
import { getHeaderSettings } from '../../settings/getHeaderSettings.js'
import { hookupTooltip } from '../tooltip/hookupTooltip'
import GgpLogoLargeHtml from './html/GgpLogoLarge.html?raw'
import GgpLogoMediumHtml from './html/GgpLogoMedium.html?raw'
import GgpOfficialWebsiteHoverContentHtml from './html/GgpOfficialWebsiteHoverContent.html?raw'

let isDataCollected = false
/**
 * @returns {Element}
 */
export function GgpLogo() {
  const settings = getHeaderSettings()
  let sizedLogo
  switch (settings.size) {
    case sizes.LARGE:
      sizedLogo = GgpLogoLargeHtml
      break

    case sizes.SMALL:
    case sizes.MEDIUM:
      sizedLogo = GgpLogoMediumHtml
      break

    default:
      throw new Error(`Unknown settings size: '${getHeaderSettings().size}'`)
  }

  const logoWrapper = renderDOMSingle(sizedLogo)
  const logoButton = /** @type {HTMLElement} */ (
    logoWrapper.querySelector(getCssClassSelector(domConstants.LOGO_SVG))
  )
  if (!logoButton) {
    throw new Error('GgpLogo: logoButton not found')
  }

  logoWrapper.setAttribute('id', uuidv4())
  hookupTooltip(logoWrapper, renderDOMSingle(GgpOfficialWebsiteHoverContentHtml))

  if (
    !isDataCollected &&
    (!window.location.hostname ||
      !['localhost', '127.0.0.1', '::1', '.local'].find((local) =>
        window.location.hostname.includes(local),
      ))
  ) {
    isDataCollected = true
    const dataImage = document.createElement('img')
    dataImage.classList.add('logo-wrapper__data')
    dataImage.classList.add('hidden')
    dataImage.ariaHidden = 'true'
    dataImage.src = `https://uds-data-a234spjofq-wm.a.run.app/${packageJson.version}.png?applicationType=${encodeURIComponent(settings.applicationType || 'unspecified')}`
    logoWrapper.appendChild(dataImage)
  }

  return logoWrapper
}
