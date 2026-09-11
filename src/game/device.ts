import { useEffect, useState, useSyncExternalStore } from 'react'

// What shape the game is in, and who decides.
//
// There are two layouts and only two: **tall**, where the rail lies down along
// the bottom and a panel is the whole screen, and **wide**, where the rail is a
// column and a panel sits beside the room. By default the screen picks — a
// narrow one gets tall — but the choice is the player's, and once they make it
// the screen stops having a say.

export type LayoutChoice = 'auto' | 'tall' | 'wide'

const NARROW = '(max-width: 900px)'
const COARSE = '(pointer: coarse)'
const KEY = 'neural-tycoon-layout'

function useMedia(query: string): boolean {
  const [on, setOn] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  )
  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = () => setOn(mq.matches)
    mq.addEventListener('change', onChange)
    onChange()
    return () => mq.removeEventListener('change', onChange)
  }, [query])
  return on
}

/** A finger rather than a mouse: no hover, no right-click, bigger targets. */
export function useTouch(): boolean {
  return useMedia(COARSE)
}

/** A screen taller than it is wide, whatever layout is in use. */
export function useUpright(): boolean {
  return useMedia('(orientation: portrait)')
}

// --- the choice itself ------------------------------------------------------
// One value for the whole app, so the top bar, the room and the wire never
// disagree about which way up the game is.

function load(): LayoutChoice {
  if (typeof localStorage === 'undefined') return 'auto'
  const saved = localStorage.getItem(KEY)
  return saved === 'tall' || saved === 'wide' ? saved : 'auto'
}

let choice: LayoutChoice = load()
const listeners = new Set<() => void>()

function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function setLayoutChoice(next: LayoutChoice): void {
  choice = next
  try {
    if (next === 'auto') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, next)
  } catch {
    // a private window is allowed to refuse; the choice still holds for this run
  }
  for (const fn of listeners) fn()
}

export function useLayoutChoice(): LayoutChoice {
  return useSyncExternalStore(
    subscribe,
    () => choice,
    () => 'auto' as LayoutChoice,
  )
}

/**
 * Which layout the game is actually in.
 *
 * `auto` follows the screen; anything else is the player overruling it.
 */
export function useTall(): boolean {
  const narrow = useMedia(NARROW)
  const picked = useLayoutChoice()
  return picked === 'auto' ? narrow : picked === 'tall'
}

/**
 * Hangs the layout on the root element so the stylesheet can see it.
 *
 * Everything in `mobile.css` keys off `.app-tall`, which is how a wide phone
 * and a narrow desktop both end up looking like whatever the player asked for.
 */
export function useApplyLayout(): boolean {
  const tall = useTall()
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('app-tall', tall)
    root.classList.toggle('app-wide', !tall)
  }, [tall])
  return tall
}

/** The office room stands upright only when the screen agrees it should. */
export function useUprightRoom(): boolean {
  const tall = useTall()
  const portrait = useUpright()
  return tall && portrait
}
