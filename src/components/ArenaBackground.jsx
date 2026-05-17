import { useEffect, useRef } from 'react'

const SERPENT_COLORS = [
  { r: 232, g: 184, b:  75 },
  { r: 255, g:  51, b: 102 },
  { r:  77, g: 255, b: 234 },
]

function makeSerpent(W, H, t) {
  const color = SERPENT_COLORS[Math.floor(Math.random() * SERPENT_COLORS.length)]
  const fromEdge = Math.floor(Math.random() * 4)
  let x, y, vx, vy
  const speed = 0.8 + Math.random() * 1.2
  switch (fromEdge) {
    case 0: x = Math.random() * W; y = -40;   vx = (Math.random()-0.5)*0.4; vy =  1; break
    case 1: x = W+40; y = Math.random()*H;    vx = -1; vy = (Math.random()-0.5)*0.4; break
    case 2: x = Math.random()*W; y = H+40;    vx = (Math.random()-0.5)*0.4; vy = -1; break
    default: x = -40; y = Math.random()*H;    vx =  1; vy = (Math.random()-0.5)*0.4; break
  }
  const mag = Math.hypot(vx, vy) || 1
  vx = (vx / mag) * speed
  vy = (vy / mag) * speed
  return {
    color, speed, baseSpeed: speed,
    sineAmp: 0.6 + Math.random() * 1.2,
    sineFreq: 0.04 + Math.random() * 0.04,
    sinePhase: Math.random() * Math.PI * 2,
    length: 44 + Math.floor(Math.random() * 18),
    head: { x, y }, vx, vy,
    history: [],
    nextBurstAt: t + 8 + Math.random() * 4,
    burstUntil: 0,
    nextAttractAt: t + 4 + Math.random() * 8,
    attractUntil: 0,
    attractTarget: null,
    alpha: 0.08 + Math.random() * 0.07,
    age: 0,
  }
}

export default function ArenaBackground() {
  const canvasRef = useRef(null)
  const stateRef = useRef({
    serpents: [], mouse: { x: -1e6, y: -1e6 },
    t: 0, lastFrame: 0,
    dpr: Math.min(2, window.devicePixelRatio || 1),
    visible: true,
  })

  useEffect(() => {
    const cv = canvasRef.current
    const ctx = cv.getContext('2d')
    const s = stateRef.current

    const resize = () => {
      s.dpr = Math.min(2, window.devicePixelRatio || 1)
      cv.width  = window.innerWidth  * s.dpr
      cv.height = window.innerHeight * s.dpr
      cv.style.width  = window.innerWidth  + 'px'
      cv.style.height = window.innerHeight + 'px'
    }
    resize()
    const onMouse = (e) => { s.mouse.x = e.clientX * s.dpr; s.mouse.y = e.clientY * s.dpr }
    const onVis   = ()  => { s.visible = document.visibilityState === 'visible' }
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', onMouse)
    document.addEventListener('visibilitychange', onVis)

    s.serpents = Array.from({ length: 6 }, () => makeSerpent(cv.width, cv.height, 0))

    let raf = 0
    const loop = (ts) => {
      if (!s.visible) { raf = requestAnimationFrame(loop); s.lastFrame = ts; return }
      const dtMs = s.lastFrame ? (ts - s.lastFrame) : 16
      const dt = Math.min(40, dtMs) / 16.67
      s.lastFrame = ts; s.t = ts / 1000
      const W = cv.width, H = cv.height, dpr = s.dpr

      ctx.fillStyle = '#06050F'
      ctx.fillRect(0, 0, W, H)

      // Heartbeat perspective grid
      const beat = 0.5 + 0.5 * Math.sin(s.t * (Math.PI / 1.5))
      const gridA = 0.04 + 0.03 * beat
      const breathe = 1 + Math.sin(s.t * 0.4) * 0.015
      ctx.save()
      ctx.translate(W / 2, H * 0.55)
      ctx.strokeStyle = `rgba(232,184,75,${gridA})`
      ctx.lineWidth = 1 * dpr
      const rowCount = 18
      for (let i = 0; i <= rowCount; i++) {
        const tt = i / rowCount
        const yy = Math.pow(tt, 1.6) * H * 0.55 * breathe
        const halfW = W * (0.5 + tt * 0.6)
        ctx.globalAlpha = (1 - tt * 0.85)
        ctx.beginPath(); ctx.moveTo(-halfW, yy); ctx.lineTo(halfW, yy); ctx.stroke()
      }
      ctx.globalAlpha = 1
      const cols = 22
      for (let i = -cols; i <= cols; i++) {
        const tt = i / cols
        const bottomX = tt * W * 1.1
        const topX = tt * 20 * dpr
        ctx.beginPath(); ctx.moveTo(topX, -10*dpr); ctx.lineTo(bottomX, H*0.55*breathe); ctx.stroke()
      }
      ctx.restore()

      // Serpents
      for (let i = 0; i < s.serpents.length; i++) {
        const sp = s.serpents[i]
        sp.age += dt

        if (s.t > sp.nextBurstAt && !sp.burstUntil) { sp.burstUntil = s.t + 1.0; sp.speed = sp.baseSpeed * 2.4 }
        if (sp.burstUntil && s.t > sp.burstUntil)  { sp.burstUntil = 0; sp.speed = sp.baseSpeed; sp.nextBurstAt = s.t + 8 + Math.random() * 4 }

        if (s.t > sp.nextAttractAt && !sp.attractUntil) {
          const other = s.serpents[(i + 1 + Math.floor(Math.random() * (s.serpents.length-1))) % s.serpents.length]
          if (other) { sp.attractTarget = other; sp.attractUntil = s.t + 0.9 }
        }
        if (sp.attractUntil && s.t > sp.attractUntil) { sp.attractUntil = 0; sp.attractTarget = null; sp.nextAttractAt = s.t + 6 + Math.random() * 8 }

        let dirx = sp.vx, diry = sp.vy
        const mag0 = Math.hypot(dirx, diry) || 1
        dirx /= mag0; diry /= mag0

        const wobble = Math.sin(sp.age * sp.sineFreq * 60 + sp.sinePhase) * sp.sineAmp
        const px = -diry, py = dirx

        const dx = sp.head.x - s.mouse.x, dy = sp.head.y - s.mouse.y
        const dist = Math.hypot(dx, dy), R = 150 * dpr
        let repulseX = 0, repulseY = 0
        if (dist < R) { const f = (1 - dist/R) * 1.4; repulseX = (dx/(dist||1))*f; repulseY = (dy/(dist||1))*f }

        let attractX = 0, attractY = 0
        if (sp.attractTarget) {
          const adx = sp.attractTarget.head.x - sp.head.x, ady = sp.attractTarget.head.y - sp.head.y
          const adist = Math.hypot(adx, ady) || 1
          attractX = (adx/adist)*0.18; attractY = (ady/adist)*0.18
          if (s.t > sp.attractUntil - 0.3) { attractX *= -1.6; attractY *= -1.6 }
        }

        const stepX = dirx*sp.speed + px*wobble*0.55 + repulseX*0.9 + attractX
        const stepY = diry*sp.speed + py*wobble*0.55 + repulseY*0.9 + attractY
        sp.head.x += stepX * dpr * dt
        sp.head.y += stepY * dpr * dt

        const drift = Math.sin(sp.age * 0.012 + sp.sinePhase) * 0.004
        const nvx = sp.vx*Math.cos(drift) - sp.vy*Math.sin(drift)
        const nvy = sp.vx*Math.sin(drift) + sp.vy*Math.cos(drift)
        sp.vx = nvx; sp.vy = nvy

        sp.history.unshift({ x: sp.head.x, y: sp.head.y })
        if (sp.history.length > sp.length * 4) sp.history.length = sp.length * 4

        const PAD = 80 * dpr
        if (sp.head.x < -PAD || sp.head.x > W+PAD || sp.head.y < -PAD || sp.head.y > H+PAD) {
          s.serpents[i] = makeSerpent(W, H, s.t); continue
        }

        const col = sp.color
        const step = 3, pts = []
        for (let k = 0; k < sp.length; k++) {
          const idx = Math.min(sp.history.length - 1, k * step)
          if (idx < 0) break
          pts.push(sp.history[idx])
        }
        if (pts.length < 3) continue

        ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y)
        for (let k = 1; k < pts.length - 1; k++) {
          const a = pts[k], b = pts[k+1]
          ctx.quadraticCurveTo(a.x, a.y, (a.x+b.x)/2, (a.y+b.y)/2)
        }
        ctx.strokeStyle = `rgba(${col.r},${col.g},${col.b},${sp.alpha * 0.5})`
        ctx.lineWidth = 1.1 * dpr; ctx.lineCap = 'round'; ctx.stroke()

        for (let k = 0; k < pts.length; k++) {
          const p = pts[k], tt = k / (pts.length - 1)
          const a = (1 - tt) * sp.alpha * (k === 0 ? 2.4 : 1)
          const r = (k === 0 ? 2.6 : 1.6) * (1 - tt * 0.55) * dpr
          ctx.fillStyle = `rgba(${col.r},${col.g},${col.b},${a})`
          ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI*2); ctx.fill()
        }

        const head = pts[0]
        const hg = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 22*dpr)
        hg.addColorStop(0, `rgba(${col.r},${col.g},${col.b},${sp.alpha * 1.2})`)
        hg.addColorStop(1, `rgba(${col.r},${col.g},${col.b},0)`)
        ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(head.x, head.y, 22*dpr, 0, Math.PI*2); ctx.fill()
      }

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouse)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ background: '#06050F' }}
    />
  )
}
