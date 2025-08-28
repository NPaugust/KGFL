"use client"
import { useState } from 'react'

export default function ApplyPage() {
  const [submitted, setSubmitted] = useState(false)
  return (
    <main id="apply" className="container-px mx-auto py-10">
      <h1 className="text-3xl font-bold">Подать заявку на участие</h1>
      <p className="mt-2 text-white/80">Заполните форму. Данные сохранятся в будущем в базу и будут доступны в админ-панели.</p>
      {!submitted ? (
        <form className="card mt-6 grid gap-4 p-6" onSubmit={(e) => { e.preventDefault(); setSubmitted(true) }}>
          <div className="grid gap-2">
            <label className="text-sm text-white/70">Название клуба</label>
            <input required placeholder="Алга Бишкек" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2" />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm text-white/70">Город</label>
              <input required placeholder="Бишкек" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm text-white/70">Контактное лицо</label>
              <input required placeholder="Имя Фамилия" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2" />
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm text-white/70">Телефон</label>
              <input required placeholder="+996 ..." className="rounded-lg border border-white/10 bg-white/5 px-3 py-2" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm text-white/70">Email</label>
              <input type="email" required placeholder="club@mail.kg" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2" />
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-sm text-white/70">Описание клуба</label>
            <textarea rows={5} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2" placeholder="Краткая история, достижения, инфраструктура..." />
          </div>
          <button className="btn btn-primary w-fit">Отправить заявку</button>
        </form>
      ) : (
        <div className="card mt-6 p-6">Спасибо! Заявка отправлена. Мы свяжемся с вами после проверки.</div>
      )}
    </main>
  )
}


