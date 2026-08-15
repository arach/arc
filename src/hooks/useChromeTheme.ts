import { useEffect, useSyncExternalStore } from 'react'
import {
  applyChromeTheme,
  getChromeTheme,
  setChromeTheme,
  subscribeChromeTheme,
} from '../utils/chromeThemes'

/**
 * The application shell's skin. Mounting the hook applies the stored value, so
 * any surface that uses it restores the user's choice.
 */
export function useChromeTheme(): [string, (id: string) => void] {
  const id = useSyncExternalStore(subscribeChromeTheme, getChromeTheme, () => getChromeTheme())

  useEffect(() => {
    applyChromeTheme(id)
  }, [id])

  return [id, setChromeTheme]
}
