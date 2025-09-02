"use client"
import { useRef } from 'react'
import { clsx } from 'clsx'

type Item = {
  id: string
  content: React.ReactNode
}

export function HorizontalCarousel({ items, className }: { items: Item[]; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const scrollBy = (dir: number) => () => {
    const el = ref.current
    if (!el) return
    el.scrollBy({ left: dir * 320, behavior: 'smooth' })
  }
  return (
    <div className={clsx('relative', className)}>
      <button onClick={scrollBy(-1)} className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/10 bg-white/10 p-2 hover:bg-white/20">
        ‹
      </button>
      <div ref={ref} className="no-scrollbar flex gap-4 overflow-x-auto scroll-smooth px-8">
        {items.map((it) => (
          <div key={it.id} className="min-w-[300px] flex-1">{it.content}</div>
        ))}
      </div>
      <button onClick={scrollBy(1)} className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/10 bg-white/10 p-2 hover:bg-white/20">
        ›
      </button>
    </div>
  )
}


