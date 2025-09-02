"use client"
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { usePathname } from 'next/navigation'

export default function RoutesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <>
      <Header />
      <div key={pathname} className="animate-fade-in">
        {children}
      </div>
      <Footer />
    </>
  )
}


