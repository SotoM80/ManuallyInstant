import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { hexToRgb, rgbToHex } from '../data/colorPalette'
import type { Rgb } from '../data/colorPalette'
import { useDismiss } from '../utils/useDismiss'

type RgbPopoverProps = {
  label: string // "Typography color" or "Background color"
  hex: string | null // the current color, or null while the HEX field is not valid
  onSelect: (hex: string) => void
}

const CHANNELS: { key: keyof Rgb; name: string }[] = [
  { key: 'r', name: 'Red' },
  { key: 'g', name: 'Green' },
  { key: 'b', name: 'Blue' },
]

// "RGB" button that pops up three sliders (Red, Green, Blue) to fine-tune the color.
// The panel is always in the page so it can animate in and out; `inert` hides it from
// the keyboard and screen readers while it is closed.
export function RgbPopover({ label, hex, onSelect }: RgbPopoverProps) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const firstSliderRef = useRef<HTMLInputElement>(null)
  const rgb = hexToRgb(hex ?? '#000000')

  // When it opens, the first slider gets the focus
  useEffect(() => {
    if (open) firstSliderRef.current?.focus()
  }, [open])

  // Closing gives the focus back to the button, unless the user clicked somewhere else
  const close = useCallback(() => {
    if (rootRef.current?.contains(document.activeElement)) buttonRef.current?.focus()
    setOpen(false)
  }, [])
  useDismiss(rootRef, open, close)

  // Each track shows every color its slider can reach, with the other two channels as they are.
  function trackStyle(key: keyof Rgb, index: number): CSSProperties {
    const from = rgbToHex({ ...rgb, [key]: 0 })
    const to = rgbToHex({ ...rgb, [key]: 255 })
    return { '--i': index, background: `linear-gradient(to right, ${from}, ${to})` } as CSSProperties
  }

  return (
    <div className="rgb-popover" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className="rgb-popover-toggle"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`${label} RGB`}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
      >
        RGB
      </button>

      <div
        id={panelId}
        className="rgb-popover-panel"
        role="group"
        aria-label={`${label} RGB sliders`}
        data-open={open}
        inert={!open}
      >
        <div className="rgb-popover-preview" style={{ background: rgbToHex(rgb) }} />
        {CHANNELS.map((channel, index) => (
          <label key={channel.key} className="rgb-popover-channel" style={{ '--i': index } as CSSProperties}>
            <span aria-hidden="true">{channel.name[0]}</span>
            <input
              ref={index === 0 ? firstSliderRef : undefined}
              type="range"
              min={0}
              max={255}
              value={rgb[channel.key]}
              onChange={(event) => onSelect(rgbToHex({ ...rgb, [channel.key]: Number(event.target.value) }))}
              aria-label={channel.name}
              style={trackStyle(channel.key, index)}
            />
            <output>{rgb[channel.key]}</output>
          </label>
        ))}
        <code className="rgb-popover-value">
          rgb({rgb.r}, {rgb.g}, {rgb.b})
        </code>
      </div>
    </div>
  )
}
