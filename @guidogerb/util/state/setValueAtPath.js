import { cloneDeep, isArray, isObject } from 'lodash'
import { notNull } from '../notNull'

/**
 * Returns a new object where the value at the provided path has been replaced while cloning only the nodes along that path.
 *
 * Deep cloning entire state objects can be costly and breaks referential equality for unaffected branches.  This helper
 * therefore performs the minimal cloning required for React's change detection:
 *
 * 1. Clone the root object.
 * 2. Clone each nested object on the way to the target.
 * 3. Deep clone the new value so mutations do not leak out of the state container.
 *
 * If any segment of the path is missing the function stops without creating new objects, but it will create a new field on
 * the final object if that field did not previously exist.
 *
 * @example
 * ```js
 * setValueAtPath({
 *   object: { a: { b: { c: 1 } } },
 *   path: 'a.b',
 *   value: { c: 2 },
 * })
 * // => { a: { b: { c: 2 } } }
 * ```
 *
 * @template SetValueAtPathT
 * @param {object} params
 * @param {Record<string, any>} params.object Source object to clone and update.
 * @param {string} params.path Dot-delimited path to the nested object that should receive the update.
 * @param {SetValueAtPathT} params.value Value to assign to the target field.
 * @returns {Record<string, any>} A copy of the original object with the updated value.
 */
export function setValueAtPath({ object, path, value }) {
  // not a deep clone; does not create a new object because immer will do that
  const result = object || {}

  // payload can be an array of targets or a single one
  const parts = (path || '').split('.')
  const pathPieces = parts.slice(0, -1)
  const field = notNull(parts.pop(), 'setValueAtPath: paths are empty')
  const valueCloned = cloneDeep(value)

  if (path) {
    // shallow clone all objects in the path
    const targetObject = pathPieces.reduce((draftNextLevel, pathPiece) => {
      // if current level isn't an object then childObj is undefined (can't get a field out of a non-object)
      let childObj
      if (isObject(draftNextLevel)) {
        childObj = draftNextLevel[pathPiece]
        if (childObj === undefined || childObj === null) {
          // childObj is missing, so add a blank object
          draftNextLevel[pathPiece] = {}
          childObj = draftNextLevel[pathPiece]
        } else if (isObject(childObj)) {
          // no need to clone a non-object
          if (isArray(childObj)) {
            childObj = childObj.concat([])
          } else {
            childObj = { ...childObj }
          }
          // put clone back in state so that the pointers change which will trigger react to render
          draftNextLevel[pathPiece] = childObj
        }
      }
      return childObj
    }, result)

    // set value of target object
    if (targetObject && isObject(targetObject)) {
      // set deep cloned value
      targetObject[field] = valueCloned
    }
  } else if (field) {
    // set field on root state object
    result[field] = valueCloned
  }

  return result
}
