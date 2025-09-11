import { renderDOMSingle } from '../../misc/renderDOMSingle'
import { getHeaderSettings } from '../../settings/getHeaderSettings.js'
import { ActionItems } from '../actionItems/ActionItems'
import { renderGgpIdForDesktop } from '../ggpId/GgpId'
import CitizenExperienceWrapper from './html/CitizenExperienceWrapper.html?raw'

export function CitizenExperience() {
  const citizenExperienceWrapper = renderDOMSingle(CitizenExperienceWrapper)

  const actionItems = ActionItems()
  if (actionItems) {
    citizenExperienceWrapper.appendChild(actionItems)
  }

  if (getHeaderSettings().ggpId !== false) {
    citizenExperienceWrapper.appendChild(renderGgpIdForDesktop())
  }

  return citizenExperienceWrapper
}
