import { useLayoutEffect, useRef, useState } from 'react'
import type { Box, Design, DesignSpec, PNode } from '../types'
import { CAT_COLOR, svc } from '../data/services'
import { allEdges, allNodes } from '../engine'

export function SvcIcon({ id, size = 26 }: { id: string; size?: number }) {
  const s = svc(id)
  const emoji = /\p{Extended_Pictographic}/u.test(s.short)
  return (
    <span
      className="svc-icon"
      style={{
        width: size,
        height: size,
        background: emoji ? '#eef2f7' : CAT_COLOR[s.cat],
        fontSize: emoji ? size * 0.6 : s.short.length > 4 ? size * 0.26 : s.short.length > 3 ? size * 0.3 : size * 0.36,
      }}
    >
      {s.short}
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
        next[n.dataset.node!] = { x: r.left - base.left + r.width / 2, y: r.top - base.top + r.height / 2 }
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
          // 부드러운 곡선: 세로로 더 멀면 위·아래로, 가로로 더 멀면 좌·우로 빠져나가게 하고 아이콘 가장자리에서 시작·끝낸다
          const dx = B0.x - A0.x
          const dy = B0.y - A0.y
          const cut = 17
          const vertical = Math.abs(dy) >= Math.abs(dx) * 0.6 && Math.abs(dy) > cut * 2 + 6
          let d: string
          let S: Pt
          if (vertical) {
            const sy = Math.sign(dy)
            S = { x: A0.x, y: A0.y + sy * cut }
            const E = { x: B0.x, y: B0.y - sy * cut }
            const m = (E.y - S.y) / 2
            d = `M${S.x},${S.y} C${S.x},${S.y + m} ${E.x},${E.y - m} ${E.x},${E.y}`
          } else {
            const len = Math.hypot(dx, dy) || 1
            const ux = dx / len
            const uy = dy / len
            const cx = Math.min(Math.abs(dx), 60) * Math.sign(dx || 1)
            S = { x: A0.x + ux * cut * 1.6, y: A0.y + uy * cut }
            const E = { x: B0.x - ux * cut * 1.6, y: B0.y - uy * cut }
            d = `M${S.x},${S.y} C${S.x + cx * 0.5},${S.y} ${E.x - cx * 0.5},${E.y} ${E.x},${E.y}`
          }
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
