"use client"
import { useMemo, useState } from 'react'
import { clsx } from 'clsx'

type Item = {
  id: string
  content: React.ReactNode
}

export function HorizontalCarousel({ items, className }: { items: Item[]; className?: string }) {
  const [index, setIndex] = useState(0)
  const [dir, setDir] = useState<1 | -1>(1)
  const [animTick, setAnimTick] = useState(0)

  const safeItems = useMemo(() => Array.isArray(items) ? items : [], [items]);
  const total = safeItems.length

  const prevIdx = useMemo(() => (total ? (index - 1 + total) % total : 0), [index, total]);
  const nextIdx = useMemo(() => (total ? (index + 1) % total : 0), [index, total]);
  const current = useMemo(() => (total ? safeItems[index % total] : null), [safeItems, index, total])
  const prev = useMemo(() => (total ? safeItems[prevIdx] : null), [safeItems, prevIdx, total]);
  const next = useMemo(() => (total ? safeItems[nextIdx] : null), [safeItems, nextIdx, total]);

  const durationMs = 500

  const go = (d: 1 | -1) => () => {
    if (!total) return
    setDir(d)
    setIndex((prev) => (prev + d + total) % total)
    setAnimTick((t) => t + 1)
  }

  return (
    <div className={clsx('relative flex items-center justify-center', className)}>
      <button onClick={go(-1)} aria-label="prev" className="absolute left-[-56px] top-1/2 -translate-y-1/2 z-20 rounded-full border border-white/10 bg-white/10 p-2 hover:bg-white/20">‹</button>

      <div className="relative w-full max-w-2xl px-16">
        {/* Side preview left */}
        {prev && (
          <div className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 -translate-x-full opacity-40 scale-95 hidden sm:block transition-all" style={{ transitionDuration: `${durationMs}ms` }}>
            <div className="w-100 overflow-hidden">{prev.content}</div>
          </div>
        )}

        <div key={`${current ? (current.id as any) : 'none'}-${animTick}`} className={clsx('transition-transform', dir === 1 ? 'animate-slide-in-left' : 'animate-slide-in-right')} style={{ animationDuration: `${durationMs}ms` }}>
          {current ? (
            <div className="[&_.card]:w-full">{current.content}</div>
          ) : (
            <div className="card p-6 text-center text-white/60">Нет данных</div>
          )}
        </div>

        {/* Side preview right */}
        {next && (
          <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 translate-x-full opacity-40 scale-95 hidden sm:block transition-all" style={{ transitionDuration: `${durationMs}ms` }}>
            <div className="w-100 overflow-hidden">{next.content}</div>
          </div>
        )}
      </div>

      <button onClick={go(1)} aria-label="next" className="absolute right-[-56px] top-1/2 -translate-y-1/2 z-20 rounded-full border border-white/10 bg-white/10 p-2 hover:bg-white/20">›</button>

      <style jsx>{`
        @keyframes slideInLeft { from { opacity: .2; transform: translateX(28px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideInRight { from { opacity: .2; transform: translateX(-28px); } to { opacity: 1; transform: translateX(0); } }
        .animate-slide-in-left { animation: slideInLeft .5s ease; }
        .animate-slide-in-right { animation: slideInRight .5s ease; }
      `}</style>
    </div>
  )
}


