import { domConstants, getCssClassSelector } from '../../enumerations/domConstants'
import { ggpIdUrls } from '../../enumerations/ggpIdUrls.js'
import { getHeaderSettings } from '../../settings/getHeaderSettings.js'
import { getCurrentGgpIdData } from '../../ggpId/ggpIdData'
import { addMobileMenuContentItem } from './addMobileMenuContentItem'
import { mobileMenuInteractionHandler } from './mobileMenuInteractionHandler'

export function removeGgpIdInMobileMenu() {
  const profileActionItem = document.getElementById(domConstants.MOBILE_MENU_ACTON_BAR__PROFILE_ID)
  if (!profileActionItem) {
    throw new Error('removeGgpIdInMobileMenu: profileActionItem not found')
  }
  const profileActionItemWrapper = /** @type {HTMLElement} */ (
    profileActionItem.closest(
      getCssClassSelector(domConstants.MOBILE_MENU_ACTION_BAR__ACTION_ITEM_WRAPPER),
    )
  )
  if (!profileActionItemWrapper) {
    throw new Error('removeGgpIdInMobileMenu: profileActionItemWrapper not found')
  }
  profileActionItemWrapper.remove()
}

/**
 * @param {HTMLElement} mobileMenuWrapper
 * @param {HTMLElement} ggpIdPopup
 */
export function hookupGgpIdInMobileMenu(mobileMenuWrapper, ggpIdPopup) {
  // get ggpIdButton in the Mobile Menu
  const ggpIdWrapper = document.querySelector(getCssClassSelector(domConstants.MOBILE__UTAH_ID))
  if (!ggpIdWrapper) {
    throw new Error('hookupGgpIdInMobileMenu: ggpIdWrapper not found')
  }
  const ggpIdButton = /** @type {HTMLElement} */ (
    ggpIdWrapper.querySelector(getCssClassSelector(domConstants.UTAH_ID__BUTTON))
  )
  if (!ggpIdButton) {
    throw new Error('hookupGgpIdInMobileMenu: ggpIdButton not found')
  }
  const mobileContentWrapper = mobileMenuWrapper.querySelector(
    getCssClassSelector(domConstants.MOBILE_MENU__CONTENT),
  )
  if (!mobileContentWrapper) {
    throw new Error('hookupGgpIdInMobileMenu: mobileContentWrapper not found')
  }
  const profileActionItem = document.getElementById(domConstants.MOBILE_MENU_ACTON_BAR__PROFILE_ID)
  if (!profileActionItem) {
    throw new Error('hookupGgpIdInMobileMenu: profileActionItem not found')
  }
  const profileActionItemWrapper = /** @type {HTMLElement} */ (
    profileActionItem.closest(
      getCssClassSelector(domConstants.MOBILE_MENU_ACTION_BAR__ACTION_ITEM_WRAPPER),
    )
  )
  if (!profileActionItemWrapper) {
    throw new Error('hookupHamburger: profileActionItemWrapper not found')
  }
  // clicking button goes to mobile menu content menu
  const ggpIdPopupContentWrapper = addMobileMenuContentItem(ggpIdPopup)
  mobileMenuInteractionHandler(ggpIdButton, ggpIdPopupContentWrapper, profileActionItemWrapper, {
    ariaHasPopupType: 'menu',
    onClickHandler: (e) => {
      const currentGgpIdData = getCurrentGgpIdData()
      const settings = getHeaderSettings()
      let result = false
      const onSignIn =
        settings.ggpId !== false && settings.ggpId !== true && settings.ggpId?.onSignIn

      if (
        // check if controlled by app and not logged in
        (settings.ggpId !== false &&
          settings.ggpId !== true &&
          !settings.ggpId?.currentUser?.authenticated) ||
        // check if not controlled by app and not logged in (definitive is true while ajax request in flight)
        (settings.ggpId === true &&
          (!currentGgpIdData?.isDefinitive || !currentGgpIdData?.userInfo?.authenticated))
      ) {
        result = true
        if (onSignIn) {
          // custom onSignIn passed in settings
          onSignIn(e)
        } else {
          // generic default sign method
          e.preventDefault()
          e.stopPropagation()
          window.location.href = ggpIdUrls.SIGN_IN
        }
      }
      return result
    },
    shouldOnClickCloseMenu: true,
  })
}
