import { useEffect, useState } from 'react'

// What kind of thing is playing the game.
//
// Two separate questions, and they are not the same one: a narrow window on a
// desktop wants the phone layout, and a big tablet wants finger-sized targets
// without the phone layout. Anything that changes because of the screen asks
// the first; anything that changes because of the pointer asks the second.

const NARROW = '(max-width: 900px)'
const COARSE = '(pointer: coarse)'

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

/** A narrow screen: the rail lies down, panels take the whole screen. */
export function useNarrow(): boolean {
  return useMedia(NARROW)
}

/** A finger rather than a mouse: no hover, no right-click, bigger targets. */
export function useTouch(): boolean {
  return useMedia(COARSE)
}

/** A narrow screen held upright: the room has to be tall rather than wide. */
export function usePortrait(): boolean {
  return useMedia('(max-width: 900px) and (orientation: portrait)')
}

/** Both at once, which is what "on a phone" actually means. */
export function usePhone(): boolean {
  const narrow = useNarrow()
  const touch = useTouch()
  return narrow && touch
}
