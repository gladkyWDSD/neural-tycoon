import { useCallback, useEffect, useState } from 'react'

// Taking the whole screen.
//
// On a phone the browser's own bars are a third of the screen, and the game is
// the sort of thing you want the whole of. Going fullscreen has to be asked for
// by a press — no browser will do it on its own — so this is a hook and a key,
// not something that happens at startup.

interface Vendor {
  webkitRequestFullscreen?: () => Promise<void>
  webkitExitFullscreen?: () => Promise<void>
  webkitFullscreenElement?: Element | null
  webkitFullscreenEnabled?: boolean
}

function on(): boolean {
  const doc = document as Document & Vendor
  return Boolean(document.fullscreenElement ?? doc.webkitFullscreenElement)
}

/** Whether this browser will do it at all. iPhone Safari, famously, will not. */
function allowed(): boolean {
  const doc = document as Document & Vendor
  return Boolean(document.fullscreenEnabled ?? doc.webkitFullscreenEnabled)
}

export function useFullscreen(): { supported: boolean; full: boolean; toggle: () => void } {
  const [full, setFull] = useState(() => (typeof document === 'undefined' ? false : on()))
  const [supported] = useState(() => (typeof document === 'undefined' ? false : allowed()))

  useEffect(() => {
    const sync = () => setFull(on())
    document.addEventListener('fullscreenchange', sync)
    document.addEventListener('webkitfullscreenchange', sync)
    return () => {
      document.removeEventListener('fullscreenchange', sync)
      document.removeEventListener('webkitfullscreenchange', sync)
    }
  }, [])

  const toggle = useCallback(() => {
    const root = document.documentElement as HTMLElement & Vendor
    const doc = document as Document & Vendor
    try {
      if (on()) {
        const exit = document.exitFullscreen?.bind(document) ?? doc.webkitExitFullscreen?.bind(document)
        void exit?.()
      } else {
        const enter = root.requestFullscreen?.bind(root) ?? root.webkitRequestFullscreen?.bind(root)
        void enter?.()
      }
    } catch {
      // a browser is allowed to refuse; the game carries on in a window
    }
  }, [])

  return { supported, full, toggle }
}
