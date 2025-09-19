import { identity } from 'lodash'

/**
 * Recursively searches a tree-like structure and returns whether any node matches the provided predicate.
 *
 * The function expects each node in the tree to expose its children through the same field name
 * (for example `children` or `items`).  A typical call therefore looks like:
 *
 * ```js
 * const hasSelectedNode = arrayMatchRecursive({
 *   object: rootNode,
 *   arrayField: 'children',
 *   isMatchFunc: (node) => node.selected,
 * })
 * ```
 *
 * @param {object} params
 * @param {Record<string, any> | null | undefined} params.object Node to evaluate.
 * @param {string} params.arrayField Name of the field that stores child nodes.
 * @param {(arrayItem: any) => boolean} params.isMatchFunc Predicate that determines a match.
 * @returns {boolean} True when the node itself or any descendant satisfies {@link params.isMatchFunc}.
 */
export function arrayMatchRecursive({ object, arrayField, isMatchFunc }) {
  if (!object) {
    return false
  }

  if (isMatchFunc(object)) {
    return true
  }

  const children = Array.isArray(object[arrayField]) ? object[arrayField].filter(identity) : []
  return children.some((arrayItem) =>
    arrayMatchRecursive({ object: arrayItem, arrayField, isMatchFunc }),
  )
}
