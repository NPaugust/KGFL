import Image from 'next/image'
import Link from 'next/link'

export function Footer() {
  return (
    <footer className="mt-16 border-t border-white/10 bg-black/40">
      <div className="container-px py-8">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-3">
              <Image src="/logotip.png" alt="KGFL" width={28} height={28} />
              <span className="text-lg font-bold tracking-wide">KGFL</span>
            </div>
            <p className="mt-3 text-white/70 text-sm">Кыргызская футбольная лига. Все права защищены.</p>
          </div>
          <div>
            <div className="font-semibold mb-3">Разделы</div>
            <ul className="space-y-2 text-white/80">
              <li><Link href="#table">Турнирная таблица</Link></li>
              <li><Link href="#scorers">Бомбардиры</Link></li>
              <li><Link href="#matches">Матчи</Link></li>
              <li><Link href="#partners">Партнёры</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-3">Мы в соцсетях</div>
            <div className="flex gap-4 items-center">
              <a href="https://www.instagram.com/kgfleague" aria-label="Instagram" className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/20 hover:border-white/30 transition" target="_blank" rel="noopener noreferrer">
                <img src="/icons/instagram.png" alt="Instagram" width={20} height={20} />
                <span className="sr-only">Instagram</span>
              </a>
              <a href="https://www.youtube.com/channel/UC_QDnB4DGob6_Ribha06S_Q" aria-label="YouTube" className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/20 hover:border-white/30 transition" target="_blank" rel="noopener noreferrer">
                <img src="/icons/youtube.png" alt="YouTube" width={20} height={20} />
                <span className="sr-only">YouTube</span>
              </a>
            </div>
          </div>
        </div>
        <div className="mt-6 border-t border-white/10 pt-4 text-center text-xs text-white/60">© {new Date().getFullYear()} KGFL. Все права защищены.</div>
      </div>
    </footer>
  )
}


