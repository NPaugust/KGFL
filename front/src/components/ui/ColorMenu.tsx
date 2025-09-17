"use client"
import { useEffect, useMemo, useState } from 'react'

function clamp(n: number, min: number, max: number) { return Math.min(max, Math.max(min, n)) }

function hexToRgb(hex: string) {
  const h = hex.replace('#','')
  const m = h.length === 3
    ? h.split('').map((c) => c + c).join('')
    : h
  const num = parseInt(m || '000000', 16)
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 }
}

function rgbToHex(r: number, g: number, b: number) {
  return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('').toUpperCase()
}

function rgbToHsv(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r,g,b), min = Math.min(r,g,b)
  const d = max - min
  let h = 0
  if (d !== 0) {
    switch(max){
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  }
  const s = max === 0 ? 0 : d / max
  const v = max
  return { h: Math.round(h*360), s: Math.round(s*100), v: Math.round(v*100) }
}

function hsvToRgb(h: number, s: number, v: number){
  h/=60; s/=100; v/=100
  const i = Math.floor(h)
  const f = h - i
  const p = v * (1 - s)
  const q = v * (1 - s * f)
  const t = v * (1 - s * (1 - f))
  let r=0,g=0,b=0
  switch(i%6){
    case 0: r=v; g=t; b=p; break
    case 1: r=q; g=v; b=p; break
    case 2: r=p; g=v; b=t; break
    case 3: r=p; g=q; b=v; break
    case 4: r=t; g=p; b=v; break
    case 5: r=v; g=p; b=q; break
  }
  return { r: Math.round(r*255), g: Math.round(g*255), b: Math.round(b*255) }
}

export function ColorMenu({ value, onChange, onClose }: { value: string; onChange: (hex: string)=>void; onClose?: ()=>void }){
  const initial = useMemo(() => {
    const { r,g,b } = hexToRgb(value || '#FFFFFF')
    return rgbToHsv(r,g,b)
  }, [value])
  const [hue, setHue] = useState(initial.h)
  const [sat, setSat] = useState(initial.s)
  const [val, setVal] = useState(initial.v)
  const hex = useMemo(() => {
    const { r,g,b } = hsvToRgb(hue, sat, val)
    return rgbToHex(r,g,b)
  }, [hue, sat, val])

  useEffect(() => { onChange(hex) }, [hex, onChange])

  const presetRows = [
    ['#111827','#1F2937','#374151','#6B7280','#9CA3AF','#D1D5DB','#FFFFFF'],
    ['#EF4444','#F59E0B','#FBBF24','#10B981','#3B82F6','#6366F1','#8B5CF6'],
  ]

  return (
    <div className="absolute z-50 mt-2 w-80 rounded-lg border border-white/10 bg-gray-900 p-4 shadow-xl">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded border border-white/20" style={{ backgroundColor: hex }} />
        <input type="text" value={hex} onChange={(e)=>onChange(e.target.value)} className="input flex-1" />
        <button type="button" onClick={onClose} className="btn btn-outline px-3 py-1">OK</button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs text-white/60 mb-1">Hue</label>
          <input type="range" min={0} max={360} value={hue} onChange={(e)=>setHue(clamp(parseInt(e.target.value)||0,0,360))} className="w-full" />
        </div>
        <div>
          <label className="block text-xs text-white/60 mb-1">Saturation</label>
          <input type="range" min={0} max={100} value={sat} onChange={(e)=>setSat(clamp(parseInt(e.target.value)||0,0,100))} className="w-full" />
        </div>
        <div>
          <label className="block text-xs text-white/60 mb-1">Value</label>
          <input type="range" min={0} max={100} value={val} onChange={(e)=>setVal(clamp(parseInt(e.target.value)||0,0,100))} className="w-full" />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {presetRows.map((row, i) => (
          <div key={i} className="flex gap-2">
            {row.map(c => (
              <button key={c} type="button" onClick={()=>onChange(c)} className="h-6 w-6 rounded border border-white/20" style={{ backgroundColor: c }} title={c} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}


