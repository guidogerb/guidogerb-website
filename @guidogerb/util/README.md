# `@guidogerb/util`

Utility helpers shared across the Guidogerb front-end projects.  The package is intentionally framework-light but
includes a handful of helpers that assume a browser and/or React environment.

## Installation

The utilities are published as a workspace package.  Within the monorepo they can be imported directly:

```js
import { joinClassNames, stringToId } from '@guidogerb/util'
```

## API Reference

### Array and object helpers

#### `arrayMatchRecursive({ object, arrayField, isMatchFunc })`
Walks a tree structure where each node exposes an array of children via `arrayField`.  Returns `true` when the predicate
matches on the node itself or any descendant.

```js
const hasSelected = arrayMatchRecursive({
  object: tree,
  arrayField: 'children',
  isMatchFunc: (node) => node.selected,
})
```

#### `chainSorters(sorters, ...params)`
Combines multiple comparator functions so they are evaluated in sequence.  Stops when one comparator returns a non-zero
result and is therefore ideal for multi-level sorting.

```js
const sorter = chainSorters([
  (a, b) => a.last.localeCompare(b.last),
  (a, b) => a.first.localeCompare(b.first),
  (a, b) => a.age - b.age,
])
items.sort(sorter)
```

#### `notNull(value, message)`
Throws an error when the provided value is `null`/`undefined` and returns a narrowed `NonNullable<T>` type otherwise.
Useful for runtime assertions that also improve TypeScript type inference.

#### `notNullArray(array, message)`
Ensures the array itself and every element inside is defined.  Throws with the supplied message when any value is missing
and returns an array typed as `NonNullable<T>[]` when validation succeeds.

#### `notNullMap(value)`
A convenience wrapper around `notNull` that throws a generic error message.  Handy for chaining with `map`:

```js
values.filter(Boolean).map(notNullMap)
```

#### `valueAtPath({ object, path })`
Reads a nested value from an object using a dot-delimited path string and returns `undefined` when any part of the path is
missing.

#### `setValueAtPath({ object, path, value })`
Clones the object along the specified path and assigns the new value while leaving other branches untouched—perfect for
immutably updating React state.

### DOM helpers

#### `getFocusableElements(element)`
Returns the focusable descendants of a container element, filtered to remove disabled controls.  Useful when implementing
focus traps for dialogs or menus.

#### `htmlDecode(input)`
Uses the browser’s HTML parser to decode entity references like `&amp;` into their literal characters.

#### `rectContainsPoint(rect, point)`
Determines whether the provided `x`/`y` point lies within the inclusive bounds of the supplied `DOMRect`.

### Events and React

#### `handleEvent(handler)`
Wraps an event handler so that `preventDefault`, `stopPropagation`, and (for React) `stopImmediatePropagation` are called
before the handler executes.  Ideal for button click handlers inside components with other nested event listeners.

#### `handleKeyPress(code, handler)`
Creates a React keyboard handler that calls `handler` only when `event.code` matches the supplied code (such as `'Enter'`
or `'Escape'`).

#### `useOnKeyUp(targetKey, handler, stopPropagation?)`
React hook that memoises a key-up handler, invoking it when the specified key is released.  Optionally prevents default
behaviour and event bubbling when `stopPropagation` is truthy.

### String and formatting helpers

#### `joinClassNames(...values)`
Accepts any combination of class name strings, arrays and falsy values.  Flattens and trims the input and returns a single
space-delimited class name string.

#### `stringToId(input)`
Normalises arbitrary text into a lowercase, hyphenated string that is safe to use as an HTML id attribute.

#### `toSafeString(value)`
Converts values into strings while treating `null`/`undefined` as an empty string and leaving `0` intact—handy for
uncontrolled form inputs.

#### `trailingS(value)`
Returns `'s'` when `value` is greater than or equal to two; returns an empty string otherwise.  Combine with template
strings to pluralise labels.

### Environment notes

Some utilities expect certain runtime features:

- **React-specific helpers** – `handleEvent`, `handleKeyPress`, and `useOnKeyUp` rely on React’s synthetic event types. Use
  native event helpers when working outside React.
- **Browser-only helpers** – `arrayMatchRecursive` and the DOM utilities depend on browser globals (`window`,
  `document`, `DOMParser`).  Guard these calls when rendering on the server.
