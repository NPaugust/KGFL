"use client"
import Link from 'next/link'
import { useReveal } from '@/hooks/useReveal'

export function Hero() {
  const heroRef = useReveal()

  return (
    <section ref={heroRef} className="relative overflow-hidden reveal">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(210,55,55,0.35),transparent_60%)]" />
      <div className="container-px py-14 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">Кыргызская футбольная лига</h1>
          <p className="mt-4 text-lg text-white/80">Официальная платформа соревнований Кыргызской футбольной лиги KGFL: 
          турнирные таблицы, расписание матчей и статистика.</p>
          <div className="mt-8 flex items-center justify-center">
            <Link href="/table" className="btn btn-primary">Турниры</Link>
          </div>
        </div>
      </div>
    </section>
  )
}


