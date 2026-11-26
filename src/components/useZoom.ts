import { useCallback, useEffect, useRef, useState } from 'react'

// 사무실 장면 확대·축소
// - 아이폰: 두 손가락 벌리기/오므리기, 확대 상태에서 한 손가락으로 끌어 이동(배율 1이면 평소처럼 화면 스크롤)
// - PC: 마우스 끌기로 이동, 트랙패드 핀치(ctrl+휠)로 확대
// - 끌어서 움직였을 때는 그 뒤에 오는 클릭(동료·자리 누르기)을 무시한다
export const ZOOM_MIN = 1
export const ZOOM_MAX = 2.6

type View = { s: number; x: number; y: number }

/**
 * aspect: 방 그림의 가로/세로 비율
 * fill: false면 틀 너비에 맞춤(기본), true면 틀 높이를 채움(사무실만 보기: 가로로 넘치는 부분은 끌어서 봄)
 */
export function useZoom(aspect: number, fill: boolean) {
  const box = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<View>({ s: 1, x: 0, y: 0 })
  const [base, setBase] = useState({ w: 0, h: 0 })
  const v = useRef(view)
  v.current = view
  const opt = useRef({ aspect, fill })
  opt.current = { aspect, fill }

  /** 배율 1일 때 방 그림 크기 */
  const baseOf = useCallback(() => {
    const el = box.current
    if (!el) return { w: 0, h: 0 }
    const cw = el.clientWidth
    const ch = el.clientHeight
    const { aspect: a, fill: f } = opt.current
    if (f) {
      const w = Math.max(cw, ch * a)
      return { w, h: w / a }
    }
    return { w: cw, h: cw / a }
  }, [])

  /** 가장 작게 줄일 수 있는 배율(사무실만 보기에서는 방 전체가 보일 때까지) */
  const minOf = useCallback(() => {
    const el = box.current
    if (!el || !opt.current.fill) return ZOOM_MIN
    const b = baseOf()
    return b.w ? Math.min(ZOOM_MIN, el.clientWidth / b.w) : ZOOM_MIN
  }, [baseOf])

  const clamp = useCallback(
    (n: View): View => {
      const el = box.current
      const s = Math.min(ZOOM_MAX, Math.max(minOf(), n.s))
      if (!el) return { s, x: 0, y: 0 }
      const b = baseOf()
      const fit = (c: number, span: number, x: number) => (span >= c ? Math.min(0, Math.max(c - span, x)) : (c - span) / 2)
      return { s, x: fit(el.clientWidth, b.w * s, n.x), y: fit(el.clientHeight, b.h * s, n.y) }
    },
    [baseOf, minOf],
  )
  /** 한 손가락으로 끌어 움직일 수 있는 상태(확대했거나 방이 틀보다 큼) */
  const canPan = useCallback(() => {
    const el = box.current
    if (!el) return false
    const b = baseOf()
    const s = v.current.s
    return b.w * s > el.clientWidth + 1 || b.h * s > el.clientHeight + 1
  }, [baseOf])

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
      else if (e.touches.length === 1 && canPan()) startPan(e.touches[0].clientX, e.touches[0].clientY)
    }
    const onTouchMove = (e: TouchEvent) => {
      if (pinch && e.touches.length === 2) {
        e.preventDefault()
        const p = rel(e.touches[0])
        const q = rel(e.touches[1])
        const m = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }
        const s = Math.min(ZOOM_MAX, Math.max(minOf(), (pinch.s0 * Math.hypot(p.x - q.x, p.y - q.y)) / pinch.d0))
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
        if (e.touches.length === 1 && canPan()) startPan(e.touches[0].clientX, e.touches[0].clientY)
      } else if (e.touches.length === 0) pan = null
    }
    // 마우스(PC)
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      suppress = false
      if (!canPan()) return
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
  }, [clamp, zoomAt, canPan, minOf])

  // 틀 크기·보기 방식이 바뀌면 방 크기를 다시 재고 가운데로
  useEffect(() => {
    const el = box.current
    if (!el) return
    const fitNow = (center: boolean) => {
      setBase(baseOf())
      setView((cur) => {
        if (!center) return clamp(cur)
        const b = baseOf()
        return clamp({ s: 1, x: (el.clientWidth - b.w) / 2, y: (el.clientHeight - b.h) / 2 })
      })
    }
    // 보기 방식을 바꾼 직후에는 틀 높이가 늦게 바뀌므로 잠깐 동안은 크기가 바뀔 때마다 가운데로 맞춘다
    const centerUntil = Date.now() + 700
    fitNow(true)
    const ro = new ResizeObserver(() => fitNow(Date.now() < centerUntil))
    ro.observe(el)
    return () => ro.disconnect()
  }, [clamp, baseOf, fill, aspect])

  const zs = view.s
  return {
    box,
    view,
    base,
    minS: minOf(),
    pannable: base.w * zs > (box.current?.clientWidth ?? 0) + 1 || base.h * zs > (box.current?.clientHeight ?? 0) + 1,
    zoomIn: () => zoomAt(v.current.s * 1.4),
    zoomOut: () => zoomAt(v.current.s / 1.4),
    reset: () => {
      const el = box.current
      const b = baseOf()
      setView(clamp({ s: 1, x: el ? (el.clientWidth - b.w) / 2 : 0, y: el ? (el.clientHeight - b.h) / 2 : 0 }))
    },
  }
}
