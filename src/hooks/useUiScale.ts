import { useEffect, useSyncExternalStore } from 'react'
import { applyUiScale, getUiScale, setUiScale, subscribeUiScale, type UiScale } from '../utils/uiScale'

/**
 * The chrome scale dials. Mounting the hook applies the stored value to the
 * document, so any surface that uses it restores the user's density.
 */
export function useUiScale(): [UiScale, (next: Partial<UiScale>) => void] {
  const scale = useSyncExternalStore(subscribeUiScale, getUiScale, () => getUiScale())

  useEffect(() => {
    applyUiScale(scale)
  }, [scale])

  return [scale, setUiScale]
}
