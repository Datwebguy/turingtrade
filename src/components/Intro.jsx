import { useState, useEffect, useMemo, useCallback } from 'react'


function IntroLogoMark({ size = 110 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" style={{ filter: 'drop-shadow(0 0 18px rgba(232,184,75,0.7))' }}>
      <defs>
        <clipPath id="iL"><rect x="0" y="0" width="60" height="120"/></clipPath>
        <clipPath id="iR"><rect x="60" y="0" width="60" height="120"/></clipPath>
      </defs>
      <g clipPath="url(#iL)" fill="none" stroke="#4DFFEA" strokeLinecap="round" strokeLinejoin="round">
        <path d="M60 14 C 46 12, 32 18, 24 30 C 16 38, 12 50, 18 60 C 12 70, 18 84, 30 92 C 40 102, 52 106, 60 106 L 60 14 Z" strokeWidth="2.6"/>
        <path d="M44 28 C 38 36, 44 44, 40 52" strokeWidth="1.6"/>
        <path d="M28 50 C 38 54, 44 62, 40 70" strokeWidth="1.6"/>
      </g>
      <g fill="#4DFFEA" clipPath="url(#iL)">
        <circle cx="36" cy="38" r="2.2"/><circle cx="50" cy="52" r="2.2"/>
        <circle cx="34" cy="66" r="2.2"/><circle cx="50" cy="84" r="2.2"/>
      </g>
      <g clipPath="url(#iR)" fill="none" stroke="#FF3366" strokeLinecap="square" strokeLinejoin="miter">
        <path d="M60 14 L 76 14 L 90 22 L 100 34 L 104 46 L 100 58 L 106 70 L 98 86 L 84 98 L 70 104 L 60 106 Z" strokeWidth="2.6"/>
        <polyline points="68,30 76,30 80,38" strokeWidth="1.4"/>
        <polyline points="84,50 84,60 76,64" strokeWidth="1.4"/>
      </g>
      <g clipPath="url(#iR)" fill="#06050F" stroke="#FF3366" strokeWidth="1.5">
        <polygon points="80,46 84,44 88,46 88,50 84,52 80,50"/>
        <polygon points="72,76 76,74 80,76 80,80 76,82 72,80"/>
      </g>
      <line x1="60" y1="12" x2="60" y2="108" stroke="#E8B84B" strokeWidth="2.4"/>
      <circle cx="60" cy="12"  r="2.8" fill="#E8B84B"/>
      <circle cx="60" cy="108" r="2.8" fill="#E8B84B"/>
    </svg>
  )
}

function IntroCircuit({ growing, converging }) {
  const branches = useMemo(() => {
    const VW = window.innerWidth, VH = window.innerHeight
    const arr = [], colors = ['#E8B84B', '#FF3366', '#4DFFEA']
    for (let i = 0; i < 18; i++) {
      const dir = i % 2 === 0 ? -1 : 1
      const startX = VW * 0.5 + (Math.random() - 0.5) * 240
      const startY = VH * 0.5
      const midX   = startX + (Math.random() - 0.5) * 280
      const midY   = startY + dir * (60 + Math.random() * 120)
      const endX   = midX   + (Math.random() - 0.5) * 320
      const endY   = midY   + dir * (60 + Math.random() * 220)
      arr.push({
        d: `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`,
        c: colors[i % 3], delay: i * 22, len: 1200 + Math.random() * 600,
        nodes: [{ x: midX, y: startY }, { x: midX, y: midY }, { x: endX, y: midY }, { x: endX, y: endY }],
      })
    }
    return arr
  }, [])

  return (
    <svg className="absolute inset-0 pointer-events-none" style={{ width: '100vw', height: '100vh' }}>
      {branches.map((b, i) => (
        <g key={i}>
          <path d={b.d} fill="none" stroke={b.c} strokeWidth="1.4" strokeLinecap="square" strokeLinejoin="miter"
            style={{
              strokeDasharray: 600, strokeDashoffset: growing ? 600 : 0,
              transition: `stroke-dashoffset ${b.len}ms cubic-bezier(.2,.85,.25,1) ${b.delay}ms, opacity .4s ease`,
              opacity: converging ? 0 : 1,
            }}
          />
          {b.nodes.map((n, j) => (
            <circle key={j} cx={n.x} cy={n.y} r="2.2" fill={b.c}
              style={{ opacity: growing ? 0 : 1, transition: `opacity .3s ease ${b.delay + 300 + j*60}ms` }}
            />
          ))}
        </g>
      ))}
    </svg>
  )
}

export default function IntroSequence({ onDone }) {
  const [mode] = useState('first')
  const [phase, setPhase] = useState(0)
  const [done, setDone] = useState(false)

  const finish = useCallback(() => {
    setDone(true)
    setTimeout(() => onDone?.(), 280)
  }, [onDone])

  useEffect(() => {
    const timers = []
    timers.push(setTimeout(() => setPhase(1), 600))
    timers.push(setTimeout(() => setPhase(2), 1400))
    timers.push(setTimeout(() => setPhase(3), 2200))
    timers.push(setTimeout(() => setPhase(4), 2800))
    timers.push(setTimeout(() => finish(), 3500))
    return () => timers.forEach(clearTimeout)
  }, [finish])

  if (done) return null

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden" style={{ background: '#06050F', transition: 'opacity .28s ease', opacity: done ? 0 : 1 }}>
      {mode === 'first' && (
        <button onClick={finish}
          className="absolute top-5 right-5 z-10 px-3 py-1.5 border border-[#E8B84B]/40 text-[#E8B84B] font-mono text-[10px] tracking-[0.24em] uppercase hover:bg-[#E8B84B]/10 transition-colors cut-br-sm">
          Skip <span className="opacity-50 ml-1">⏵</span>
        </button>
      )}

      <div className="absolute inset-0 flex items-center justify-center">
        {mode === 'first' && (
          <>
            {phase === 0 && (
              <span className="block bg-[#E8B84B] intro-pixel" style={{ width: 4, height: 4, boxShadow: '0 0 18px 4px rgba(232,184,75,0.6)' }} />
            )}
            {phase >= 1 && phase < 3 && (
              <div className="relative w-full">
                <div className="absolute left-1/2 top-1/2 -translate-y-1/2 h-px" style={{ width: '50%', transformOrigin: 'left center', background: 'linear-gradient(90deg, rgba(232,184,75,0.05) 0%, #E8B84B 70%, #FFF7D8 100%)', animation: 'drawLineR 0.7s cubic-bezier(.2,.8,.2,1) forwards', boxShadow: '0 0 18px rgba(232,184,75,0.6)' }} />
                <div className="absolute right-1/2 top-1/2 -translate-y-1/2 h-px" style={{ width: '50%', transformOrigin: 'right center', background: 'linear-gradient(270deg, rgba(232,184,75,0.05) 0%, #E8B84B 70%, #FFF7D8 100%)', animation: 'drawLineL 0.7s cubic-bezier(.2,.8,.2,1) forwards', boxShadow: '0 0 18px rgba(232,184,75,0.6)' }} />
              </div>
            )}
            {phase >= 2 && phase < 4 && <IntroCircuit growing={phase === 2} converging={phase === 3} />}
            {phase === 3 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="logo-materialize"><IntroLogoMark /></div>
                <span className="absolute w-40 h-40 rounded-full" style={{ background: 'radial-gradient(circle, rgba(232,184,75,0.45), transparent 65%)', animation: 'lineFlash 0.6s ease-out forwards' }} />
              </div>
            )}
            {phase === 4 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full border border-[#E8B84B]/60" style={{ animation: 'worldShockwave 0.7s ease-out forwards' }} />
                <div className="w-32 h-32 rounded-full border border-[#E8B84B]/30 absolute" style={{ animation: 'worldShockwave 0.9s ease-out forwards', animationDelay: '0.05s' }} />
              </div>
            )}
          </>
        )}
      </div>

      {mode === 'first' && (
        <div className="absolute bottom-5 left-5 font-mono text-[10px] tracking-[0.24em] uppercase text-[#6B6589]/70 pointer-events-none">
          <span className="text-[#E8B84B]">▌</span> initializing arena · phase {phase + 1}/5
        </div>
      )}
    </div>
  )
}
