import { useEffect, useRef, useState, useMemo } from 'react'

// ── Count-up hook ──────────────────────────────────────────────────
export function useCountUp(target, duration = 1400, decimals = 0) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    const start = performance.now()
    let raf = 0
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(target * eased)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return decimals ? value.toFixed(decimals) : Math.round(value).toLocaleString()
}

export function Counter({ value, prefix = '', suffix = '', decimals = 0, duration = 1400, className = '' }) {
  const v = useCountUp(value, duration, decimals)
  return <span className={`font-mono tabular-nums ${className}`}>{prefix}{v}{suffix}</span>
}

// ── 3D tilt hook ───────────────────────────────────────────────────
export function useTilt({ max = 10, scale = 1.02, glare = true } = {}) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const onMove = (e) => {
      const r = el.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width
      const y = (e.clientY - r.top)  / r.height
      el.style.setProperty('--tx', ((x - 0.5) * 2 * max) + 'deg')
      el.style.setProperty('--ty', ((0.5 - y) * 2 * (max * 0.7)) + 'deg')
      el.style.setProperty('--tilt-scale', String(scale))
      if (glare) {
        el.style.setProperty('--sx', (x * 100) + '%')
        el.style.setProperty('--sy', (y * 100) + '%')
        el.style.setProperty('--shine', '1')
      }
    }
    const onLeave = () => {
      el.style.setProperty('--tx', '0deg')
      el.style.setProperty('--ty', '0deg')
      el.style.setProperty('--tilt-scale', '1')
      el.style.setProperty('--shine', '0')
    }
    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave) }
  }, [max, scale, glare])
  return ref
}

// ── Button ─────────────────────────────────────────────────────────
export function Button({ children, variant = 'gold', size = 'md', outlined = false, as: As = 'button', className = '', ...rest }) {
  const sizes = {
    sm: 'px-3 py-1.5 text-[11px] tracking-[0.16em]',
    md: 'px-5 py-3 text-[12px] tracking-[0.18em]',
    lg: 'px-7 py-4 text-[13px] tracking-[0.2em]',
  }
  const palette = {
    gold:   { fill: 'bg-[#E8B84B] text-[#06050F]', ghost: 'text-[#E8B84B] border-[#E8B84B]', shadow: 'hover:shadow-[0_0_28px_-4px_rgba(232,184,75,0.7)]' },
    human:  { fill: 'bg-[#4DFFEA] text-[#06050F]', ghost: 'text-[#4DFFEA] border-[#4DFFEA]', shadow: 'hover:shadow-[0_0_28px_-4px_rgba(77,255,234,0.7)]' },
    ai:     { fill: 'bg-[#FF3366] text-white',      ghost: 'text-[#FF3366] border-[#FF3366]', shadow: 'hover:shadow-[0_0_28px_-4px_rgba(255,51,102,0.7)]' },
    success:{ fill: 'bg-[#39FF14] text-[#06050F]', ghost: 'text-[#39FF14] border-[#39FF14]', shadow: 'hover:shadow-[0_0_28px_-4px_rgba(57,255,20,0.7)]'  },
    danger: { fill: 'bg-[#FF3366] text-white',      ghost: 'text-[#FF3366] border-[#FF3366]', shadow: 'hover:shadow-[0_0_28px_-4px_rgba(255,51,102,0.7)]' },
    ghost:  { fill: 'bg-[#0D0C1E] text-[#F0EBE3]', ghost: 'text-[#F0EBE3] border-[#1F1C3A]', shadow: 'hover:shadow-[0_0_18px_-4px_rgba(255,255,255,0.18)]' },
  }
  const v = palette[variant] || palette.gold
  const cls = `relative inline-flex items-center justify-center gap-2 font-display font-semibold uppercase
    transition-all duration-200 cut-br-sm select-none btn-scan
    ${sizes[size]} ${outlined ? `bg-transparent border ${v.ghost} hover:bg-white/5` : v.fill}
    ${v.shadow} hover:-translate-y-0.5 active:translate-y-0 ${className}`
  return <As className={cls} {...rest}><span className="relative z-10 inline-flex items-center gap-2">{children}</span></As>
}

// ── Card ───────────────────────────────────────────────────────────
export function Card({ children, className = '', glow = null, cut = true, accent = null, hover = true, tilt = false }) {
  const accentColors = { gold: '#E8B84B', human: '#4DFFEA', ai: '#FF3366', success: '#39FF14' }
  const glowClasses  = { gold: 'hover:glow-gold', human: 'hover:glow-human', ai: 'hover:glow-ai', success: 'hover:glow-success' }
  const tiltRef = useTilt({ max: 8, scale: 1.015 })
  const useTiltOn = tilt && hover
  const inner = `relative glass ${cut ? 'cut-card' : ''}
    ${hover && !useTiltOn ? 'transition-all duration-200 hover:-translate-y-0.5' : ''}
    ${useTiltOn ? 'tilt' : ''}
    ${glow && hover ? (glowClasses[glow] || '') : ''}`

  if (useTiltOn) {
    return (
      <div className={`relative tilt-host ${className}`} ref={tiltRef}>
        <div className={inner} style={accent ? { borderLeft: `2px solid ${accentColors[accent] || accentColors.gold}` } : {}}>
          {children}
          <div className="tilt-shine" />
        </div>
      </div>
    )
  }
  return (
    <div className={`${inner} ${className}`} style={accent ? { borderLeft: `2px solid ${accentColors[accent] || accentColors.gold}` } : {}}>
      {children}
    </div>
  )
}

// ── Badge ──────────────────────────────────────────────────────────
export function Badge({ children, variant = 'gold', pulse = false, className = '' }) {
  const styles = {
    gold:    'text-[#E8B84B] border-[#E8B84B]/40 bg-[#E8B84B]/10',
    human:   'text-[#4DFFEA] border-[#4DFFEA]/40 bg-[#4DFFEA]/10',
    ai:      'text-[#FF3366] border-[#FF3366]/40 bg-[#FF3366]/10',
    success: 'text-[#39FF14] border-[#39FF14]/40 bg-[#39FF14]/10',
    danger:  'text-[#FF3366] border-[#FF3366]/40 bg-[#FF3366]/10',
    warn:    'text-yellow-300 border-yellow-300/40 bg-yellow-300/10',
    muted:   'text-[#6B6589] border-[#1F1C3A] bg-[#0D0C1E]',
  }
  const dotColors = { ai: 'bg-[#FF3366]', success: 'bg-[#39FF14]', warn: 'bg-yellow-300', human: 'bg-[#4DFFEA]' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono tracking-[0.18em] uppercase border ${styles[variant] || styles.gold} ${className}`}>
      {pulse && (
        <span className="relative inline-block w-1.5 h-1.5">
          <span className={`absolute inset-0 ${dotColors[variant] || 'bg-[#E8B84B]'} pulse-dot`} />
        </span>
      )}
      {children}
    </span>
  )
}

// ── PnL ────────────────────────────────────────────────────────────
export function PnL({ value, size = 'md', sign = true, suffix = '%', className = '' }) {
  const pos = value >= 0
  const sizes = { sm: 'text-sm', md: 'text-base', lg: 'text-2xl', xl: 'text-5xl', xxl: 'text-7xl' }
  return (
    <span className={`font-mono tabular-nums ${pos ? 'text-[#39FF14]' : 'text-[#FF3366]'} ${sizes[size] || sizes.md} ${className}`}>
      {sign ? (pos ? '+' : '') : ''}<Counter value={value} decimals={1} duration={1100} />{suffix}
    </span>
  )
}

// ── Sparkline ──────────────────────────────────────────────────────
export function Sparkline({ data, width = 70, height = 22, color = 'auto' }) {
  const min = Math.min(...data), max = Math.max(...data), rng = max - min || 1
  const pts = data.map((v, i) => `${((i / (data.length-1)) * width).toFixed(1)},${(height - ((v-min)/rng)*height).toFixed(1)}`).join(' ')
  const up = data[data.length-1] >= data[0]
  const stroke = color === 'auto' ? (up ? '#39FF14' : '#FF3366') : color
  const lx = width, ly = height - ((data[data.length-1]-min)/rng)*height
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth="1.4" strokeLinecap="square" />
      <circle cx={lx} cy={ly} r="2" fill={stroke} />
    </svg>
  )
}

// ── StatBox ────────────────────────────────────────────────────────
export function StatBox({ label, value, valueClass = '', icon = null }) {
  return (
    <div className="glass cut-br-sm p-4 flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1.5">
        <div className="text-[10px] tracking-[0.2em] uppercase text-[#6B6589]">{label}</div>
        {icon && <span className="text-[#E8B84B]/60">{icon}</span>}
      </div>
      <div className={`font-mono text-xl tabular-nums ${valueClass}`}>{value}</div>
    </div>
  )
}

// ── Countdown ──────────────────────────────────────────────────────
export function useCountdown(endsAt) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id) }, [])
  const ms = Math.max(0, endsAt - now), totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600), m = Math.floor((totalSec % 3600) / 60), s = totalSec % 60
  const pad = (n) => String(n).padStart(2, '0')
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

export function FlipCountdown({ endsAt, className = '' }) {
  const text = useCountdown(endsAt)
  const prevRef = useRef(text)
  const animRef = useRef({})
  const keys = useMemo(() => {
    const next = { ...animRef.current }
    for (let i = 0; i < text.length; i++) {
      if (prevRef.current[i] !== text[i]) next[i] = (next[i] || 0) + 1
    }
    prevRef.current = text
    animRef.current = next
    return next
  }, [text])
  return (
    <span className={`inline-flex items-baseline font-mono tabular-nums ${className}`}>
      {text.split('').map((ch, i) => {
        if (ch === ':') return <span key={`s${i}`} className="opacity-60 mx-[1px]">:</span>
        return <span key={`${i}-${keys[i] || 0}`} className="digit-flip inline-block" style={{ minWidth: '0.62em', textAlign: 'center' }}>{ch}</span>
      })}
    </span>
  )
}

// ── ScanLoader ─────────────────────────────────────────────────────
export function ScanLoader({ className = '' }) {
  return (
    <div className={`relative w-full h-1 overflow-hidden border border-[#1F1C3A] ${className}`}>
      <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-[#E8B84B] to-transparent scan-line" />
    </div>
  )
}

// ── SectionTitle ───────────────────────────────────────────────────
export function SectionTitle({ children, live = false, className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <h3 className="font-display font-semibold text-lg tracking-tight">{children}</h3>
      {live && <span className="relative inline-block w-2 h-2"><span className="absolute inset-0 bg-[#E8B84B] pulse-dot" /></span>}
    </div>
  )
}

// ── MiniPriceChart ─────────────────────────────────────────────────
export function MiniPriceChart({ height = 110 }) {
  const [data, setData] = useState(() => {
    const arr = []; let v = 100
    for (let i = 0; i < 60; i++) { v += (Math.random() - 0.48) * 2; arr.push(v) }
    return arr
  })
  useEffect(() => {
    const id = setInterval(() => setData(d => { const next = d[d.length-1] + (Math.random()-0.48)*2.4; return [...d.slice(1), next] }), 800)
    return () => clearInterval(id)
  }, [])
  const W = 600, H = height, min = Math.min(...data), max = Math.max(...data), rng = max - min || 1
  const pts = data.map((v, i) => `${((i/(data.length-1))*W).toFixed(1)},${(H - ((v-min)/rng)*(H-10) - 5).toFixed(1)}`).join(' ')
  const up = data[data.length-1] >= data[0]
  const stroke = up ? '#39FF14' : '#FF3366'
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((p, i) => (
        <line key={i} x1="0" x2={W} y1={H*p} y2={H*p} stroke="#1C2040" strokeWidth="1" strokeDasharray="3 5" />
      ))}
      <polyline points={`0,${H} ${pts} ${W},${H}`} fill="url(#chartFill)" stroke="none" />
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth="1.5" />
    </svg>
  )
}

// ── Divider ────────────────────────────────────────────────────────
export function Divider({ className = '' }) {
  return <div className={`h-px bg-gradient-to-r from-transparent via-[#1F1C3A] to-transparent ${className}`} />
}
