import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type InfoTooltipProps = {
  content: string
}

const InfoTooltip = ({ content }: InfoTooltipProps) => {
  const btnRef = useRef<HTMLButtonElement | null>(null)
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  const updatePosition = () => {
    const el = btnRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setCoords({ x: rect.left + rect.width / 2, y: rect.top })
  }

  useEffect(() => {
    if (!open) return
    updatePosition()
    const onScroll = () => updatePosition()
    const onResize = () => updatePosition()
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
    }
  }, [open])

  return (
    <span className="relative inline-flex">
      <button
        ref={btnRef}
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/40 text-white/90 transition hover:border-accent hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-label={content}
      >
        <span className="font-bold text-[11px] leading-none">i</span>
      </button>
      {open &&
        createPortal(
          <div
            role="tooltip"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            style={{ left: coords.x, top: coords.y }}
            className="fixed z-[9999] max-w-xs -translate-x-1/2 -translate-y-2 rounded-lg bg-slate/95 p-3 text-xs leading-relaxed text-slate-100 shadow-glass"
          >
            {content}
          </div>,
          document.body,
        )}
    </span>
  )
}

export default InfoTooltip
