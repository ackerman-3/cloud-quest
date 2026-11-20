import { useLayoutEffect, useRef, useState } from 'react'
import type { Box, Design, DesignSpec, PNode } from '../types'
import { CAT_COLOR, svc } from '../data/services'
import { allEdges, allNodes } from '../engine'
import { Glyph } from './glyphs'

// AWS 공식 아키텍처 아이콘(Architecture-Service-Icons_07312025, 48px). 파일 이름 = 서비스 id
const AWS_ICONS = Object.fromEntries(
  Object.entries(import.meta.glob('../assets/aws/*.svg', { eager: true, query: '?url', import: 'default' })).map(([k, v]) => [
    k.split('/').pop()!.replace('.svg', ''),
    v as string,
  ]),
)
// 같은 서비스를 다른 역할로 쓰는 id
const ICON_ALIAS: Record<string, string> = { ec2Web: 'ec2', ec2Worker: 'ec2', ec2Spot: 'ec2', rdsStandby: 'rds', rdsReplica: 'rds', rdsRead: 'rds', rdsproxy: 'rds', nlb: 'alb', epsvc: 'privatelink', vpceIf: 'privatelink' }

export function SvcIcon({ id, size = 26 }: { id: string; size?: number }) {
  const s = svc(id)
  const emoji = /\p{Extended_Pictographic}/u.test(s.short)
  const official = AWS_ICONS[ICON_ALIAS[id] ?? id]
  if (official)
    return (
      <span className="svc-icon official" style={{ width: size, height: size }}>
        <img src={official} alt="" draggable={false} />
      </span>
    )
  const glyph = !emoji && <Glyph id={id} />
  const c = CAT_COLOR[s.cat]
  return (
    <span
      className={`svc-icon ${emoji ? 'emoji' : ''}`}
      style={{
        width: size,
        height: size,
        background: emoji ? 'transparent' : c,
        fontSize: emoji ? size * 0.8 : s.short.length > 4 ? size * 0.24 : s.short.length > 3 ? size * 0.28 : size * 0.34,
      }}
    >
      {glyph || s.short}
    </span>
  )
}

interface Props {
  spec: DesignSpec
  design: Design
  mode: 'edit' | 'view' | 'sim'
  armed?: boolean // 서비스가 선택돼 배치 대기 중
  hoverZone?: string | null
  connectFrom?: string | null
  selectedNode?: string | null
  /** 이 노드에 붙은 선을 강조 */
  highlightNode?: string | null
  dead?: Set<string>
  failBoxes?: string[]
  flow?: 'ok' | 'bad' | null
  load?: number
  onZoneTap?: (zone: string) => void
  onNodePointerDown?: (e: React.PointerEvent, node: PNode) => void
}

interface Pt {
  x: number
  y: number
  /** 아이콘 반 높이·반 너비, 노드(이름 포함) 위·아래 끝 */
  ih?: number
  iw?: number
  top?: number
  bottom?: number
  left?: number
  right?: number
}

export function Canvas(p: Props) {
  const wrap = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<Record<string, Pt>>({})
  const nodes = allNodes(p.spec, p.design)
  const edges = allEdges(p.spec, p.design)

  useLayoutEffect(() => {
    const el = wrap.current
    if (!el) return
    const measure = () => {
      const base = el.getBoundingClientRect()
      const next: Record<string, Pt> = {}
      el.querySelectorAll<HTMLElement>('[data-node]').forEach((n) => {
        const r = n.querySelector('.svc-icon')?.getBoundingClientRect() ?? n.getBoundingClientRect()
        const nr = n.getBoundingClientRect()
        next[n.dataset.node!] = {
          x: r.left - base.left + r.width / 2,
          y: r.top - base.top + r.height / 2,
          ih: r.height / 2,
          iw: r.width / 2,
          top: nr.top - base.top,
          bottom: nr.bottom - base.top,
          left: nr.left - base.left,
          right: nr.right - base.left,
        }
      })
      setPos(next)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [p.design, p.spec])

  const renderNode = (n: PNode) => {
    const isDead = p.dead?.has(n.id)
    const cls = [
      'node',
      n.fixed ? 'fixed' : '',
      p.connectFrom === n.id ? 'from' : '',
      p.selectedNode === n.id ? 'sel' : '',
      isDead ? 'dead' : '',
    ].join(' ')
    return (
      <div
        key={n.id}
        className={cls}
        data-node={n.id}
        onPointerDown={p.onNodePointerDown ? (e) => p.onNodePointerDown!(e, n) : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <SvcIcon id={n.service} />
        <span className="node-label">{n.label ?? svc(n.service).name}</span>
        {isDead && <span className="node-x">✕</span>}
      </div>
    )
  }

  const renderBox = (b: Box): React.ReactNode => {
    const here = nodes.filter((n) => n.zone === b.id)
    const isZone = !!b.zone
    const down = p.failBoxes?.includes(b.id)
    const cls = [
      'box',
      `k-${b.kind}`,
      isZone ? 'zone' : '',
      isZone && p.armed ? 'armed' : '',
      p.hoverZone === b.id ? 'hover' : '',
      down ? 'down' : '',
    ].join(' ')
    return (
      <div
        key={b.id}
        className={cls}
        data-zone={isZone ? b.id : undefined}
        data-box={b.id}
        onClick={isZone && p.onZoneTap ? () => p.onZoneTap!(b.id) : undefined}
      >
        {b.label && <div className="box-label">{b.label}</div>}
        {down && <div className="down-tag">장애</div>}
        {(here.length > 0 || (isZone && p.mode === 'edit')) && (
          <div className="box-nodes">
            {here.map(renderNode)}
            {isZone && p.mode === 'edit' && here.filter((n) => !n.fixed).length < (b.zone?.max ?? 3) && (
              <div className="drop-hint">{p.armed ? '여기에 배치' : '+'}</div>
            )}
          </div>
        )}
        {b.children && b.children.length > 0 && <div className={`box-children ${b.dir ?? 'col'}`}>{b.children.map(renderBox)}</div>}
      </div>
    )
  }

  return (
    <div className={`canvas mode-${p.mode}`} ref={wrap}>
      {renderBox(p.spec.layout)}
      <svg className="edges">
        <defs>
          {(['base', 'ok', 'bad', 'dead', 'hl'] as const).map((k) => (
            <marker
              key={k}
              id={`arrow-${k}`}
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="9"
              markerHeight="9"
              markerUnits="userSpaceOnUse"
              orient="auto-start-reverse"
            >
              <path d="M0,1 L9,5 L0,9 L2.5,5 z" className={`arrow-head ${k}`} />
            </marker>
          ))}
        </defs>
        {edges.map(([a, b], i) => {
          const A0 = pos[a]
          const B0 = pos[b]
          if (!A0 || !B0) return null
          // AWS 구성도처럼 꺾은선(직각)으로 잇고, 모서리는 살짝 둥글게
          const pts = routeEdge(A0, B0, a, b, pos)
          const S = pts[0]
          const d = roundPath(pts, 7)
          const dead = p.dead?.has(a) || p.dead?.has(b)
          const hl = !p.flow && !!p.highlightNode && (a === p.highlightNode || b === p.highlightNode)
          const state = dead ? 'dead' : p.flow ? p.flow : hl ? 'hl' : 'base'
          const dots = p.flow === 'ok' && !dead ? Math.min(3, Math.max(1, Math.round((p.load ?? 1) / 3))) : 0
          return (
            <g key={`${a}-${b}-${i}`} className={`edge-g ${state}`}>
              <path d={d} className="edge-halo" />
              <path d={d} className={`edge ${state}`} markerEnd={`url(#arrow-${state})`} />
              <circle cx={S.x} cy={S.y} r={3} className={`edge-start ${state}`} />
              {Array.from({ length: dots }).map((_, k) => (
                <circle key={k} r={3} className="packet">
                  <animateMotion dur={`${1.1 + (i % 3) * 0.2}s`} begin={`${k * 0.35}s`} repeatCount="indefinite" path={d} />
                </circle>
              ))}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/** 꺾은선 꼭짓점을 반지름 r로 둥글게 */
function roundPath(pts: Pt[], r: number) {
  let d = `M${pts[0].x},${pts[0].y}`
  for (let i = 1; i < pts.length - 1; i++) {
    const p0 = pts[i - 1]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const l1 = Math.hypot(p1.x - p0.x, p1.y - p0.y)
    const l2 = Math.hypot(p2.x - p1.x, p2.y - p1.y)
    const rr = Math.min(r, l1 / 2, l2 / 2)
    const a = { x: p1.x - ((p1.x - p0.x) / (l1 || 1)) * rr, y: p1.y - ((p1.y - p0.y) / (l1 || 1)) * rr }
    const b = { x: p1.x + ((p2.x - p1.x) / (l2 || 1)) * rr, y: p1.y + ((p2.y - p1.y) / (l2 || 1)) * rr }
    d += ` L${a.x},${a.y} Q${p1.x},${p1.y} ${b.x},${b.y}`
  }
  const last = pts[pts.length - 1]
  return d + ` L${last.x},${last.y}`
}

type Rect = { l: number; r: number; t: number; b: number }

/** 선분(수평·수직)이 사각형을 지나가는지 */
function hits(p: Pt, q: Pt, R: Rect) {
  const l = Math.min(p.x, q.x)
  const r = Math.max(p.x, q.x)
  const t = Math.min(p.y, q.y)
  const b = Math.max(p.y, q.y)
  return l < R.r && r > R.l && t < R.b && b > R.t
}

/**
 * 직각 꺾은선 경로 후보를 여러 개 만들고, 다른 서비스(아이콘·이름)를 가장 적게 가로지르는 경로를 고른다.
 * 아래로 가면 이름 밑에서 출발해 아이콘 위로, 위로 가면 아이콘 위에서 출발해 이름 밑으로 들어간다.
 */
function routeEdge(A: Pt, B: Pt, aId: string, bId: string, pos: Record<string, Pt>): Pt[] {
  const gap = 4
  const ih = (P: Pt) => P.ih ?? 18
  const iw = (P: Pt) => P.iw ?? 18
  const obstacles: Rect[] = Object.entries(pos)
    .filter(([id]) => id !== aId && id !== bId)
    .map(([, P]) => ({ l: (P.left ?? P.x - 39) - 3, r: (P.right ?? P.x + 39) + 3, t: (P.top ?? P.y - 18) - 3, b: (P.bottom ?? P.y + 30) + 3 }))
  const cost = (pts: Pt[]) => {
    let n = 0
    let len = 0
    for (let i = 1; i < pts.length; i++) {
      for (const R of obstacles) if (hits(pts[i - 1], pts[i], R)) n++
      len += Math.abs(pts[i].x - pts[i - 1].x) + Math.abs(pts[i].y - pts[i - 1].y)
    }
    return n * 10000 + len + pts.length * 30
  }
  const simplify = (pts: Pt[]) =>
    pts.filter((p, i) => i === 0 || i === pts.length - 1 || !(Math.abs(p.x - pts[i - 1].x) < 1 && Math.abs(p.y - pts[i - 1].y) < 1))

  const dx = B.x - A.x
  const dy = B.y - A.y
  const cands: Pt[][] = []
  if (Math.abs(dy) > 40) {
    const down = dy > 0
    const S = { x: A.x, y: down ? (A.bottom ?? A.y) + gap : A.y - ih(A) - gap }
    const E = { x: B.x, y: down ? B.y - ih(B) - gap - 2 : (B.bottom ?? B.y) + gap + 2 }
    const sy = down ? 1 : -1
    for (const my of [(S.y + E.y) / 2, S.y + sy * 10, E.y - sy * 12]) {
      cands.push(Math.abs(S.x - E.x) < 3 ? [S, E] : [S, { x: S.x, y: my }, { x: E.x, y: my }, E])
    }
    // 옆으로 빠져 내려가는 경로(중간 서비스를 비켜 감)
    for (const side of [1, -1]) {
      const S2 = { x: A.x + side * (iw(A) + gap), y: A.y }
      for (const off of [12, 24]) {
        const cx = side > 0 ? (A.right ?? A.x + 39) + off : (A.left ?? A.x - 39) - off
        cands.push([S2, { x: cx, y: S2.y }, { x: cx, y: E.y - sy * 12 }, { x: E.x, y: E.y - sy * 12 }, E])
      }
    }
  }
  {
    const sx = Math.sign(dx || 1)
    const S = { x: A.x + sx * (iw(A) + gap), y: A.y }
    const E = { x: B.x - sx * (iw(B) + gap + 2), y: B.y }
    const mx = (S.x + E.x) / 2
    cands.push(Math.abs(S.y - E.y) < 3 ? [S, { x: E.x, y: S.y }] : [S, { x: mx, y: S.y }, { x: mx, y: E.y }, E])
  }
  let best = cands[0]
  let bc = Infinity
  for (const c of cands.map(simplify)) {
    const v = cost(c)
    if (v < bc) {
      bc = v
      best = c
    }
  }
  return best
}
