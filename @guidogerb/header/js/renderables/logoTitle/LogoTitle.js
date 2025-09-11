import { domConstants, getCssClassSelector } from '../../enumerations/domConstants'
import { renderDOMSingle } from '../../misc/renderDOMSingle'
import { valueOrFunctionValue } from '../../misc/valueOrFunctionValue'
import { getHeaderSettings } from '../../settings/getHeaderSettings.js'
import LogoTitleWrapper from './html/LogoTitleWrapper.html?raw'
import LogoTitleWrapperLink from './html/LogoTitleWrapperLink.html?raw'

/**
 * @returns {Element}
 */
export function LogoTitle() {
  const ggpHeaderSettings = getHeaderSettings()
  const logoTitleURL =
    ggpHeaderSettings.titleUrl ||
    // @ts-expect-error backwards compatibility
    /** @type {string | undefined} */ (ggpHeaderSettings.titleURL)
  const logoTitleWrapper = !logoTitleURL
    ? renderDOMSingle(LogoTitleWrapper)
    : renderDOMSingle(LogoTitleWrapperLink)
  if (!logoTitleWrapper) {
    throw new Error('LogoTitle: titleWrapper is null')
  }
  if (logoTitleURL) {
    logoTitleWrapper.setAttribute('href', logoTitleURL)
  }
  // type says it can't be null, but for backwards-compatibility, it may be null
  if (ggpHeaderSettings.titleFunction) {
    if (logoTitleWrapper.onclick) {
      throw new Error('LogoTitle: logoTitleWrapper already has an onclick')
    }
    logoTitleWrapper.onclick = ggpHeaderSettings.titleFunction
  }

  // Render Logo image
  const logoWrapper = logoTitleWrapper.querySelector(getCssClassSelector(domConstants.TITLE__LOGO))
  if (!logoWrapper) {
    throw new Error('LogoTitle: logoWrapper is null')
  }

  const settingsLogo = ggpHeaderSettings.logo
  const settingsShowTitle = ggpHeaderSettings.showTitle
  const settingsTitle = ggpHeaderSettings.title
  if (settingsLogo) {
    /** @type {HTMLCollection | Element} */
    let settingsLogoElement
    if (settingsLogo.htmlString) {
      settingsLogoElement = renderDOMSingle(valueOrFunctionValue(settingsLogo.htmlString))
    } else if (settingsLogo.element) {
      settingsLogoElement = valueOrFunctionValue(settingsLogo.element)
    } else if (settingsLogo.imageUrl) {
      settingsLogoElement = renderDOMSingle(
        `<img src=${valueOrFunctionValue(settingsLogo.imageUrl)}  id="ui-system-logo" />`,
      )
    } else {
      throw new Error('LogoTitle: logo set but has no settings')
    }
    settingsLogoElement.setAttribute('role', 'presentation')
    settingsLogoElement.setAttribute('alt', '')
    logoWrapper.appendChild(settingsLogoElement)
  } else {
    logoTitleWrapper.removeChild(logoWrapper)
  }

  // Render Title text
  const title = document.createTextNode(settingsTitle)
  const titleWrapper = logoTitleWrapper.querySelector(
    getCssClassSelector(domConstants.TITLE__TITLE),
  )
  titleWrapper?.appendChild(title)
  if (!settingsShowTitle && settingsLogo) {
    titleWrapper?.classList.add(domConstants.VISUALLY_HIDDEN)
  }

  return logoTitleWrapper
}
