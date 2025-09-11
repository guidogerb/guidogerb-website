import { renderDOMSingle } from '../../misc/renderDOMSingle'
import { getHeaderSettings } from '../../settings/getHeaderSettings.js'
import ActionItemsWrapper from './html/ActionItemsWrapper.html?raw'
import { renderActionItem } from './renderActionItem'

/**
 * @returns {Element | null}
 */
export function ActionItems() {
  const { actionItems } = getHeaderSettings()
  /** @type {HTMLElement | null} */
  let actionItemsWrapper = null

  if (actionItems?.length) {
    actionItemsWrapper = renderDOMSingle(ActionItemsWrapper)

    getHeaderSettings()
      .actionItems?.map((actionItemToRender) => renderActionItem(actionItemToRender))
      ?.forEach((renderedActionItem) => actionItemsWrapper?.appendChild(renderedActionItem))
  }

  return actionItemsWrapper
}
