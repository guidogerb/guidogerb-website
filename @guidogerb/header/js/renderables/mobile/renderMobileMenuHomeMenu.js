import { childrenMenuTypes } from '../../enumerations/childrenMenuTypes'
import { getHeaderSettings } from '../../settings/getHeaderSettings.js'
import { renderMenu } from '../popupMenu/renderPopupMenu'

export function renderMobileMenuHomeMenu() {
  const settings = getHeaderSettings()
  return renderMenu((settings.mainMenu && settings.mainMenu?.menuItems) || undefined, {
    childrenMenuType: childrenMenuTypes.INLINE,
    parentMenuLinkSuffix:
      typeof settings.mainMenu === 'object' ? settings.mainMenu.parentMenuLinkSuffix : undefined,
    removePopupArrow: true,
  })
}
