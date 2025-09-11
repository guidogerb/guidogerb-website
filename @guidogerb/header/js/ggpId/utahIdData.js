import { ggpIdUrls } from '../enumerations/ggpIdUrls'
import { authChangedEventHandler } from '../renderables/ggpId/GgpId'
import { getHeaderSettings } from '../settings/getHeaderSettings.js'

/** @typedef {import('src/@types/jsDocTypes.d').GgpIdData} GgpIdData */
/** @typedef {import('src/@types/jsDocTypes.d').GgpIdFetchStyle} GgpIdFetchStyle */
/** @typedef {import('src/@types/jsDocTypes.d').GgpIDSettings} GgpIDSettings */
/** @typedef {import('src/@types/jsDocTypes.d').UserInfo} UserInfo */

/** @enum {GgpIdFetchStyle} */
const GgpIdFetchStyle = {
  AUTOMATIC: /** @type {GgpIdFetchStyle} */ ('Automatic'),
  NONE: /** @type {GgpIdFetchStyle} */ ('None'),
  PROVIDED: /** @type {GgpIdFetchStyle} */ ('Provided'),
}
let lastFetchStyle = GgpIdFetchStyle.NONE
/**
 * @param {GgpIDSettings | boolean | undefined} ggpIdData
 * @returns {GgpIdFetchStyle}
 */
function determineFetchStyle(ggpIdData) {
  /** @type {GgpIdFetchStyle} */
  let fetchStyle
  if (ggpIdData === true) {
    fetchStyle = GgpIdFetchStyle.AUTOMATIC
  } else if (ggpIdData === false) {
    fetchStyle = GgpIdFetchStyle.NONE
  } else if (ggpIdData === undefined || ggpIdData.currentUser === undefined) {
    fetchStyle = GgpIdFetchStyle.AUTOMATIC
  } else if (ggpIdData.currentUser === null || ggpIdData.currentUser) {
    fetchStyle = GgpIdFetchStyle.PROVIDED
  } else {
    throw new Error('determineFetchStyle: Unknown ggp id fetch style')
  }
  return fetchStyle
}

/**
 * @type {GgpIdData}
 */
const ggpIdData = {
  // null = not yet loaded, false = ajaxing, true = have a result (may be error or user data)
  isDefinitive: null,
  lastError: null,
  userInfo: null,
}

/**
 * when auth status changes, call this to notify the world including the Sign In button
 * @param {GgpIdData} newGgpIdData the current information to store
 */
function maybeTriggerAuthEvent(newGgpIdData) {
  // something asked for new information, so fire off that new information has arrived
  if (newGgpIdData.isDefinitive) {
    // call auth changed so name updates in button
    authChangedEventHandler(newGgpIdData)

    // give settings callback a crack at the auth change
    const ggpId = getHeaderSettings()?.ggpId
    if (typeof ggpId === 'object') {
      ggpId.onAuthChanged?.(newGgpIdData)
    }
  }
}

// give the application a bit of time to call setGgpHeaderSettings() so that they
// can tell the header if the application will be controlling the logged in user
// if the application controls the user, then the user is not fetched from GgpID
// within this "waitForLaunch" window, the application must call setGgpHeaderSettings()
// if the current user is not yet known, make sure to set `settings.ggpId.currentUser = null`
// this way the header knows the user is controlled by the app and to not go fetch the user.
let waitingForLaunch = true
const WAIT_FOR_LAUNCH_MS = 500

/** @type {number} */
let fetchUserTimeoutId = NaN

/**
 * @returns {Promise<GgpIdData>}
 */
export async function fetchGgpIdUserDataAsync() {
  /** @type {Promise<GgpIdData>} */
  let result = Promise.resolve(ggpIdData)
  const settings = getHeaderSettings()
  const fetchStyle = determineFetchStyle(settings.ggpId)

  if (ggpIdData.isDefinitive === false) {
    // working on it... come back later...
    result = Promise.resolve(ggpIdData)
  } else if (waitingForLaunch) {
    clearTimeout(fetchUserTimeoutId)
    result = new Promise((resolve) => {
      fetchUserTimeoutId = window.setTimeout(() => {
        // if the app hasn't called setGgpHeaderSettings() by now, too bad for them...
        waitingForLaunch = false
        fetchGgpIdUserDataAsync()
          .then((data) => resolve(data))
          // eslint-disable-next-line no-console
          .catch((e) => console.error(e))
      }, WAIT_FOR_LAUNCH_MS)
    })
  } else if (settings.ggpId === false) {
    // if ggpId is set and currentUser is undefined then the header has control of the user
    // otherwise, if ggpId is false then it is turned off
    // otherwise, if ggpId is an object and currentUser is not undefined, then the application will control the current user
    // ggpId is turned off (probably shouldn't even have gotten here?)
    result = Promise.resolve({
      isDefinitive: true,
      lastError: 'Ggp ID is off',
      userInfo: null,
    })
  } else if (settings.ggpId === true || settings.ggpId?.currentUser === undefined) {
    // 👆 catches true && null cases, both of which allow a refetch 👆

    // header is "on" OR ggpId settings has an `undefined` user: Header controls the user!
    if (fetchStyle !== lastFetchStyle || ggpIdData.isDefinitive === null) {
      ggpIdData.isDefinitive = false
      result = fetch(ggpIdUrls.USER_INFO, { credentials: 'include' })
        .then((resp) => resp.json())
        .then((authResult) => {
          if (authResult.status === 200) {
            ggpIdData.lastError = null
            ggpIdData.userInfo = /** @type {UserInfo} */ (authResult.data)
          } else {
            throw new Error(authResult.err)
          }
          return ggpIdData
        })
        .catch((error) => {
          ggpIdData.lastError = error
          ggpIdData.userInfo = null
          return ggpIdData
        })
        .finally(() => {
          ggpIdData.isDefinitive = true
          maybeTriggerAuthEvent(ggpIdData)
          return ggpIdData
        })
    }
  } else {
    // ggpId settings have currentUser as null or a user, either way the application will be controlling the user, not the header
    const resultData = {
      isDefinitive: true,
      lastError: null,
      userInfo: settings.ggpId?.currentUser,
    }
    result = Promise.resolve(resultData)
    maybeTriggerAuthEvent(resultData)
  }
  lastFetchStyle = fetchStyle
  return result
}

/**
 * @returns {GgpIdData}
 */
export function getCurrentGgpIdData() {
  return ggpIdData
}
