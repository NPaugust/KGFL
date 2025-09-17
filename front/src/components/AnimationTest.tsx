"use client"
import { Reveal } from './Reveal'

export function AnimationTest() {
  return (
    <div className="container-px py-16 space-y-8">
      <Reveal as="h2" className="text-3xl font-bold text-center" delay={100}>
        Тест анимаций появления
      </Reveal>
      
      <Reveal className="text-center text-white/80" delay={200}>
        <p>Прокрутите вниз, чтобы увидеть анимации появления компонентов</p>
      </Reveal>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Reveal key={i} className="card p-6 text-center" delay={300 + i * 100}>
            <div className="w-12 h-12 bg-brand-primary/20 rounded-lg mb-3 flex items-center justify-center mx-auto">
              <span className="text-brand-primary font-bold text-lg">{i + 1}</span>
            </div>
            <h3 className="font-semibold mb-2">Элемент {i + 1}</h3>
            <p className="text-sm text-white/70">
              Этот элемент появляется с задержкой {300 + i * 100}ms
            </p>
          </Reveal>
        ))}
      </div>

      <Reveal className="text-center" delay={1000}>
        <div className="card p-8">
          <h3 className="text-xl font-semibold mb-4">Как это работает</h3>
          <ul className="text-left space-y-2 text-white/80">
            <li>• Intersection Observer отслеживает видимость элементов</li>
            <li>• Mutation Observer следит за добавлением новых элементов</li>
            <li>• Плавные CSS анимации с cubic-bezier</li>
            <li>• Поддержка кастомных задержек</li>
            <li>• Работает с динамически добавляемыми компонентами</li>
          </ul>
        </div>
      </Reveal>
    </div>
  )
} 