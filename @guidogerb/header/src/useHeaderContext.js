import { useContext } from 'react'
import { HeaderContext } from './HeaderContext.js'

export function useHeaderContext() {
  return useContext(HeaderContext)
}
