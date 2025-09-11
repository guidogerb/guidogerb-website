import { childrenMenuTypes } from '../../enumerations/childrenMenuTypes'
import { domConstants, getCssClassSelector } from '../../enumerations/domConstants'
import { ggpIdUrls } from '../../enumerations/ggpIdUrls.js'
import { popupFocusHandler } from '../../misc/popupFocusHandler'
import { renderDOMSingle } from '../../misc/renderDOMSingle'
import { uuidv4 } from '../../misc/uuidv4'
import { getHeaderSettings } from '../../settings/getHeaderSettings.js'
import { renderMenuWithTitle } from '../menu/renderMenuWithTitle'
import { renderPopup } from '../popup/renderPopup'
import { renderMenu } from '../popupMenu/renderPopupMenu'
import GgpIdButtonHtml from './html/GgpIdButton.html?raw'
import GgpIdWrapperHtml from './html/GgpIdWrapper.html?raw'

/** @typedef {import('src/@types/jsDocTypes.d').MenuItem} MenuItem */
/** @typedef {import('src/@types/jsDocTypes.d').PopupMenu} PopupMenu */
/** @typedef {import('src/@types/jsDocTypes.d').GgpIdData} GgpIdData */

/** @type {GgpIdData | null} */
let ggpIdData = null

/**
 * @param {GgpIdData} newGgpIdData
 */
export function authChangedEventHandler(newGgpIdData) {
  ggpIdData = newGgpIdData
  // it's ok if ggpIdData is not definitive
  // - when it does become definitive it will update the button
  // - maybe it was fetched and got a user and became indeterminate to fetch again but will get same result again

  // get ggpIdButtons (at least two: mobile button (center in menu bar) & non-mobile (top right))
  const ggpIdButtons = document.querySelectorAll(getCssClassSelector(domConstants.UTAH_ID__BUTTON))
  ggpIdButtons.forEach((ggpIdButton) => {
    if (ggpIdButton) {
      // kill contents so can be loaded with correct content
      // eslint-disable-next-line no-param-reassign
      ggpIdButton.innerHTML = ''

      // make button behave appropriately for logged in user status
      if (ggpIdData?.userInfo?.authenticated) {
        // text in the button for screen readers
        const ggpIDText = document.createElement('span')
        ggpIDText.appendChild(document.createTextNode('GgpID Account:'))
        ggpIDText.classList.add(domConstants.VISUALLY_HIDDEN)
        ggpIdButton.appendChild(ggpIDText)
        // visible text in the button
        ggpIdButton.appendChild(document.createTextNode(`Hello, ${ggpIdData.userInfo.first || ''}`))
      } else {
        ggpIdButton.appendChild(document.createTextNode('GgpID Sign In'))
      }

      // hook up aria
      const popupId = ggpIdButton.getAttribute('aria-controls')
      if (!popupId) {
        throw new Error(`authChangedEventHandler: popup id for button not found - ${popupId}`)
      }
      const ggpIdPopupMenu = document.getElementById(popupId)
      if (ggpIdPopupMenu) {
        // popup menu does not exist if the user is not logged in
        doAriaForGgpId(ggpIdButton, ggpIdPopupMenu)
      }
    }
  })
}

/**
 * @param {Element} ggpIdButton
 * @param {Element} ggpIdPopupMenu
 */
function doAriaForGgpId(ggpIdButton, ggpIdPopupMenu) {
  if (ggpIdButton && ggpIdPopupMenu) {
    // Is user signed in?
    const userSignedIn = !!ggpIdData?.isDefinitive && !!ggpIdData?.userInfo?.authenticated

    // Add aria-haspopup, aria-controls, and aria-expanded to the button to tie in the menu
    // Hide the menu from aria when the user is not signed in
    if (userSignedIn) {
      ggpIdButton.setAttribute('aria-haspopup', 'menu')
      ggpIdButton.setAttribute('aria-expanded', 'false')
      ggpIdPopupMenu.removeAttribute('aria-hidden')
    } else {
      ggpIdButton.removeAttribute('aria-haspopup')
      ggpIdButton.removeAttribute('aria-expanded')
      ggpIdPopupMenu.setAttribute('aria-hidden', 'true')
    }
  }
}

/**
 * @returns {HTMLElement}
 */
export function renderGgpIdButton() {
  // create GgpID wrapper w/ button DOM
  const ggpIdButton = renderDOMSingle(GgpIdButtonHtml)
  ggpIdButton.setAttribute('id', uuidv4())

  // set ggp id user name change immediately to current value so that the button does not flicker
  if (ggpIdData) {
    authChangedEventHandler(ggpIdData)
  }
  return ggpIdButton
}

/**
 * @param {boolean} shouldAddMenuTitle
 * @returns {HTMLElement}
 */
export function renderGgpIdMenu(shouldAddMenuTitle) {
  const settings = getHeaderSettings()

  const onProfile = settings.ggpId !== false && settings.ggpId !== true && settings.ggpId?.onProfile
  const onSignOut = settings.ggpId !== false && settings.ggpId !== true && settings.ggpId?.onSignOut

  const customGgpIdMenuItems = [
    ...((settings.ggpId !== true && settings.ggpId !== false && settings.ggpId?.menuItems) || []),
  ]
  if (customGgpIdMenuItems.length) {
    customUtahIdMenuItems.push({
      isDivider: true,
      title: '--divider--',
    })
  }
  /** @type {MenuItem[]} */
  const popupMenuItems = [
    ...customUtahIdMenuItems,
    {
      actionUrl: onProfile ? undefined : { url: ggpIdUrls.PROFILE, openInNewTab: true },
      actionFunction: onProfile || undefined,
      title: 'UtahID Profile',
    },
    {
      actionUrl: onSignOut ? undefined : { url: ggpIdUrls.SIGN_OUT },
      actionFunction: onSignOut || undefined,
      title: 'Sign Out',
    },
  ]

  const ggpIdPopupMenu = renderMenu(popupMenuItems, { childrenMenuType: childrenMenuTypes.INLINE })
  const returnMenu = shouldAddMenuTitle
    ? renderMenuWithTitle(ggpIdPopupMenu, 'Utah ID Menu')
    : ggpIdPopupMenu

  returnMenu.setAttribute('aria-label', 'Utah Id Menu')
  returnMenu.setAttribute('id', uuidv4())
  return returnMenu
}

/**
 * @returns {HTMLElement}
 */
export function renderUtahIdForDesktop() {
  const ggpIdWrapper = renderDOMSingle(UtahIdWrapperHtml)

  const ggpIdButton = renderUtahIdButton()
  ggpIdButton.setAttribute('id', uuidv4())
  ggpIdWrapper.appendChild(ggpIdButton)

  const ggpIdMenu = renderUtahIdMenu(false)
  const ggpIdPopupMenu = renderPopup(ggpIdButton)
  const popupContentWrapper = /** @type {HTMLElement} */ (
    ggpIdPopupMenu.querySelector(getCssClassSelector(domConstants.POPUP_CONTENT_WRAPPER))
  )
  if (!popupContentWrapper) {
    throw new Error('renderUtahIdForDesktop: contentWrapper not found')
  }
  popupContentWrapper.appendChild(ggpIdMenu)

  ggpIdWrapper.appendChild(ggpIdPopupMenu)

  doAriaForUtahId(ggpIdButton, ggpIdPopupMenu)

  // hook up menu to be a popup
  const settings = getHeaderSettings()
  const onSignIn = settings.ggpId !== false && settings.ggpId !== true && settings.ggpId?.onSignIn

  popupFocusHandler(ggpIdWrapper, ggpIdButton, ggpIdPopupMenu, 'menu', {
    isPerformPopup: () => !!ggpIdData?.isDefinitive && !!ggpIdData?.userInfo?.authenticated,
    onClick: (e) => {
      if (!ggpIdData?.isDefinitive || !ggpIdData?.userInfo?.authenticated) {
        if (onSignIn) {
          onSignIn(e)
        } else {
          e.preventDefault()
          e.stopPropagation()
          window.location.href = ggpIdUrls.SIGN_IN
        }
      }
    },
  })

  return ggpIdWrapper
}

/**
 * @returns {{ button: HTMLElement, menu: HTMLElement}} the button and the menu
 */
export function renderUtahIdForMobile() {
  const ggpIdWrapper = renderDOMSingle(UtahIdWrapperHtml)

  const ggpIdButton = renderUtahIdButton()
  const ggpIdButtonId = ggpIdButton.getAttribute('id')
  if (!ggpIdButtonId) {
    throw new Error('renderUtahIdForMobile: ggpIdButton has no id')
  }
  ggpIdWrapper.appendChild(ggpIdButton)

  const ggpIdPopupMenu = renderUtahIdMenu(true)
  const ggpIdPopupMenuId = ggpIdPopupMenu.getAttribute('id')
  if (!ggpIdPopupMenuId) {
    throw new Error('renderUtahIdForMobile: ggpIdPopupMenu has no id')
  }
  ggpIdWrapper.appendChild(ggpIdPopupMenu)

  ggpIdButton.setAttribute('aria-controls', ggpIdPopupMenuId)
  ggpIdPopupMenu.setAttribute('aria-labelledby', ggpIdButtonId)
  doAriaForUtahId(ggpIdButton, ggpIdPopupMenu)

  return { button: ggpIdButton, menu: ggpIdPopupMenu }
}
