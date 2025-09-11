import { domConstants, getCssClassSelector } from '../../enumerations/domConstants'
import { renderDOMSingle } from '../../misc/renderDOMSingle'
import { getHeaderSettings } from '../../settings/getHeaderSettings.js'
import SkipLinkHtml from './html/SkipLink.html?raw'

/**
 * Renders the skip link if the setting `skipLinkUrl` is set.
 * @returns {Element | null}
 */
export function SkipLink() {
  const { skipLinkUrl } = getHeaderSettings()
  let skipLink

  if (skipLinkUrl) {
    skipLink = renderDOMSingle(SkipLinkHtml)

    const skipLinkLink = skipLink.querySelector(getCssClassSelector(domConstants.SKIP_LINK_LINK))
    if (!skipLinkLink) {
      throw new Error('Skip Link Link is null')
    }
    skipLinkLink.setAttribute('href', skipLinkUrl)
  } else {
    skipLink = null
    // eslint-disable-next-line no-console
    console.warn(
      'Ggp Design System: It is best practice to provide a skip link url (skipLinkUrl). See: https://uisystem.ggp.guidogerbpublishing.com/library/components/navigationLinks/skipLink',
    )
  }

  return skipLink
}
