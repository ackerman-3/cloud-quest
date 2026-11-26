import { useCallback, useEffect, useRef, useState } from 'react'

// 사무실 장면 확대·축소
// - 아이폰: 두 손가락 벌리기/오므리기, 확대 상태에서 한 손가락으로 끌어 이동(배율 1이면 평소처럼 화면 스크롤)
// - PC: 마우스 끌기로 이동, 트랙패드 핀치(ctrl+휠)로 확대
// - 끌어서 움직였을 때는 그 뒤에 오는 클릭(동료·자리 누르기)을 무시한다
export const ZOOM_MIN = 1
export const ZOOM_MAX = 2.6

type View = { s: number; x: number; y: number }

export function useZoom() {
  const box = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<View>({ s: 1, x: 0, y: 0 })
  const v = useRef(view)
  v.current = view

  const clamp = useCallback((n: View): View => {
    const el = box.current
    const s = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, n.s))
    if (!el) return { s, x: 0, y: 0 }
    const w = el.clientWidth
    const h = el.clientHeight
    return { s, x: Math.min(0, Math.max(w - w * s, n.x)), y: Math.min(0, Math.max(h - h * s, n.y)) }
  }, [])

  /** 화면 안의 점(px, py)을 고정한 채 배율 변경 */
  const zoomAt = useCallback(
    (s: number, px?: number, py?: number) => {
      const el = box.current
      const cur = v.current
      const cx = px ?? (el ? el.clientWidth / 2 : 0)
      const cy = py ?? (el ? el.clientHeight / 2 : 0)
      const wx = (cx - cur.x) / cur.s
      const wy = (cy - cur.y) / cur.s
      setView(clamp({ s, x: cx - wx * s, y: cy - wy * s }))
    },
    [clamp],
  )

  useEffect(() => {
    const el = box.current
    if (!el) return
    let pinch: null | { d0: number; s0: number; wx: number; wy: number } = null
    let pan: null | { x0: number; y0: number; vx: number; vy: number; moved: boolean } = null
    let suppress = false
    const rel = (t: { clientX: number; clientY: number }) => {
      const r = el.getBoundingClientRect()
      return { x: t.clientX - r.left, y: t.clientY - r.top }
    }
    const startPinch = (a: Touch, b: Touch) => {
      const p = rel(a)
      const q = rel(b)
      const m = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }
      const cur = v.current
      pinch = { d0: Math.hypot(p.x - q.x, p.y - q.y) || 1, s0: cur.s, wx: (m.x - cur.x) / cur.s, wy: (m.y - cur.y) / cur.s }
      pan = null
    }
    const startPan = (cx: number, cy: number) => {
      pan = { x0: cx, y0: cy, vx: v.current.x, vy: v.current.y, moved: false }
    }
    const movePan = (cx: number, cy: number) => {
      if (!pan) return false
      const dx = cx - pan.x0
      const dy = cy - pan.y0
      if (!pan.moved && Math.hypot(dx, dy) < 6) return false
      pan.moved = true
      setView(clamp({ s: v.current.s, x: pan.vx + dx, y: pan.vy + dy }))
      return true
    }

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) suppress = false
      if (e.touches.length === 2) startPinch(e.touches[0], e.touches[1])
      else if (e.touches.length === 1 && v.current.s > 1.001) startPan(e.touches[0].clientX, e.touches[0].clientY)
    }
    const onTouchMove = (e: TouchEvent) => {
      if (pinch && e.touches.length === 2) {
        e.preventDefault()
        const p = rel(e.touches[0])
        const q = rel(e.touches[1])
        const m = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }
        const s = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, (pinch.s0 * Math.hypot(p.x - q.x, p.y - q.y)) / pinch.d0))
        setView(clamp({ s, x: m.x - pinch.wx * s, y: m.y - pinch.wy * s }))
        suppress = true
      } else if (pan && e.touches.length === 1) {
        e.preventDefault()
        if (movePan(e.touches[0].clientX, e.touches[0].clientY)) suppress = true
      }
    }
    const onTouchEnd = (e: TouchEvent) => {
      if (pinch && e.touches.length < 2) {
        pinch = null
        if (e.touches.length === 1 && v.current.s > 1.001) startPan(e.touches[0].clientX, e.touches[0].clientY)
      } else if (e.touches.length === 0) pan = null
    }
    // 마우스(PC)
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      suppress = false
      if (v.current.s <= 1.001) return
      startPan(e.clientX, e.clientY)
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && pan && movePan(e.clientX, e.clientY)) suppress = true
    }
    const onUp = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') pan = null
    }
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return // 트랙패드 핀치만(일반 휠은 페이지 스크롤)
      e.preventDefault()
      const p = rel(e)
      zoomAt(v.current.s * Math.exp(-e.deltaY / 120), p.x, p.y)
    }
    // 끌거나 확대한 직후의 클릭은 무시
    const onClick = (e: MouseEvent) => {
      if (suppress) {
        e.stopPropagation()
        e.preventDefault()
      }
      suppress = false
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)
    el.addEventListener('touchcancel', onTouchEnd)
    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('click', onClick, true)
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('click', onClick, true)
    }
  }, [clamp, zoomAt])

  // 화면 크기가 바뀌면 이동 범위를 다시 맞춤
  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setView((cur) => clamp(cur)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [clamp])

  return {
    box,
    view,
    zoomIn: () => zoomAt(v.current.s * 1.4),
    zoomOut: () => zoomAt(v.current.s / 1.4),
    reset: () => setView({ s: 1, x: 0, y: 0 }),
  }
}
