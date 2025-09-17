"use client"
import { clsx } from 'clsx'
import { useEffect, useRef, useState } from 'react'

export function Select({ label, value, onChange, options, className }: {
  label?: string
  value: string
  onChange: (v: string) => void
  options: { label: string; value: string }[]
  className?: string
}) {
  return (
    <div className={clsx('flex items-center gap-3', className)}>
      {label && <span className="text-white/70 text-sm">{label}</span>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-white/20 bg-brand-dark px-3 py-2 text-sm text-white shadow-inner focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

export function SelectMenu({ label, value, onChange, options, className }: {
  label?: string
  value: string
  onChange: (v: string) => void
  options: { label: string; value: string }[]
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return
      if (!ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])
  const current = options.find((o) => o.value === value)?.label ?? ''
  return (
    <div ref={ref} className={clsx('relative flex items-center gap-3', className)}>
      {label && <span className="text-white/70 text-sm">{label}</span>}
      <button type="button" onClick={() => setOpen((o) => !o)} className="min-w-[140px] rounded-lg border border-white/20 bg-brand-dark px-3 py-2 text-left text-sm text-white shadow-inner focus:outline-none focus:ring-2 focus:ring-brand-primary/60">
        {current}
      </button>
      {open && (
        <div className="absolute left-[60px] top-full z-20 mt-2 w-[200px] overflow-hidden rounded-lg border border-white/10 bg-black/70 backdrop-blur-xl">
          {options.map((o) => {
            const selected = o.value === value
            return (
              <button
                key={o.value}
                onClick={() => { onChange(o.value); setOpen(false) }}
                className={clsx('block w-full px-3 py-2 text-left text-sm transition-colors', selected ? 'bg-brand-primary text-white' : 'hover:bg-white/10 text-white/90')}
              >
                {o.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}


