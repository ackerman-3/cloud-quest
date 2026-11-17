import { useEffect, useMemo, useState } from 'react'
import type { Look } from '../pixel'

import { drawLook, W, H } from '../pixel'

function toRects(grid: (string | null)[][]) {
  const rects: { x: number; y: number; w: number; c: string }[] = []
  grid.forEach((row, y) => {
    let x = 0
    while (x < W) {
      const c = row[x]
      if (!c) {
        x++
        continue
      }
      let w = 1
      while (x + w < W && row[x + w] === c) w++
      rects.push({ x, y, w, c })
      x += w
    }
  })
  return rects
}

export function Sprite({ cfg, talking, className, flip }: { cfg: Look & { name?: string }; talking?: boolean; className?: string; flip?: boolean }) {
  const [blink, setBlink] = useState(false)
  const [mouth, setMouth] = useState(false)

  useEffect(() => {
    let t: number
    const loop = () => {
      t = window.setTimeout(() => {
        setBlink(true)
        window.setTimeout(() => setBlink(false), 140)
        loop()
      }, 2400 + Math.random() * 2600)
    }
    loop()
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!talking) {
      setMouth(false)
      return
    }
    const id = window.setInterval(() => setMouth((m) => !m), 140)
    return () => clearInterval(id)
  }, [talking])

  const rects = useMemo(() => toRects(drawLook(cfg, blink, mouth)), [cfg, blink, mouth])
  return (
    <svg
      className={className}
      viewBox={`0 0 ${W} ${H}`}
      shapeRendering="crispEdges"
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
      aria-label={cfg.name}
    >
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={r.c} />
      ))}
    </svg>
  )
}
