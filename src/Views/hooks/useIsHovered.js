// This file is automatically generated by Views and will be overwritten
// when the morpher runs. If you want to contribute to how it's generated, eg,
// improving the algorithms inside, etc, see this:
// https://github.com/viewstools/morph/blob/master/ensure-is-hovered.js
import { useEffect, useMemo, useState } from 'react'

// TODO replace with something more performant like:
// https://github.com/therealparmesh/use-hovering/blob/master/src/index.js
// or useTooltip from Reach UI
// https://github.com/reach/reach-ui/blob/master/packages/tooltip/src/index.tsx
export default function useIsHovered({
  isDisabled,
  isSelected,
  onMouseEnter,
  onMouseLeave,
}) {
  let [isHovered, setIsHovered] = useState(false)

  let isHoveredBind = useMemo(
    () => ({
      onMouseEnter: (event) => {
        setIsHovered(true)

        if (typeof onMouseEnter === 'function') {
          onMouseEnter(event)
        }
      },
      onMouseLeave: (event) => {
        setIsHovered(false)

        if (typeof onMouseLeave === 'function') {
          onMouseLeave(event)
        }
      },
    }),
    [onMouseEnter, onMouseLeave]
  )

  useEffect(() => {
    if (!isDisabled) return

    setIsHovered(false)
  }, [isDisabled])

  return [isHovered, isHovered && isSelected, isHoveredBind]
}