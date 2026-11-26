import { useEffect, useRef, useState } from 'react'
import type { Design, PNode, Project } from '../types'
import { Canvas, SvcIcon } from './Canvas'
import { SCOPE_HINT, svc } from '../data/services'
import { costIndex, deadSet, diffWithAnswer, findBox, gradeDesign, isLoose, runScenarios } from '../engine'

interface Props {
  project: Project
  design: Design
  setDesign: (d: Design) => void
  peeked: boolean
  onPeek: () => void
  simRuns: number
  onSimRun: () => void
  onComplete: () => void
}

type Drag = { kind: 'svc'; service: string } | { kind: 'node'; node: PNode }

let uid = 0
const newId = () => `n${Date.now().toString(36)}${(uid++).toString(36)}`

export function Designer({ project, design, setDesign, peeked, onPeek, simRuns, onSimRun, onComplete }: Props) {
  const spec = project.design
  const [armed, setArmed] = useState<string | null>(null)
  const [connect, setConnect] = useState(false)
  const [from, setFrom] = useState<string | null>(null)
  const [selNode, setSelNode] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [showBrief, setShowBrief] = useState(true)
  const [showAnswer, setShowAnswer] = useState(false)
  const [sim, setSim] = useState<null | { idx: number; done: boolean }>(null)
  const [ghost, setGhost] = useState<{ x: number; y: number; service: string } | null>(null)
  const [hoverZone, setHoverZone] = useState<string | null>(null)
  const [grading, setGrading] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [selEdge, setSelEdge] = useState<string | null>(null)
  const drag = useRef<{ d: Drag; x0: number; y0: number; moved: boolean; canMove: boolean } | null>(null)
  const toastTimer = useRef<number>(0)

  const say = (m: string) => {
    setToast(m)
    clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2600)
  }

  const nodeName = (id: string) => {
    if (isLoose(id)) return '(삭제된 서비스)'
    const n = [...spec.fixed, ...design.nodes].find((x) => x.id === id)
    return n ? (n.label ?? svc(n.service).name) : id
  }

  const canPlace = (service: string, zoneId: string, moving?: PNode) => {
    const box = findBox(spec.layout, zoneId)
    if (!box?.zone) return '여기에는 배치할 수 없어요.'
    const s = svc(service)
    if (box.zone.scope !== s.scope) return `${s.name}: ${SCOPE_HINT[s.scope] ?? ''}`
    const count = design.nodes.filter((n) => n.zone === zoneId && n.id !== moving?.id).length
    if (count >= (box.zone.max ?? 3)) return '이 영역은 가득 찼어요. 불필요한 서비스를 빼 보세요.'
    return null
  }

  const place = (service: string, zoneId: string) => {
    const err = canPlace(service, zoneId)
    if (err) return say(err)
    // 같은 서비스를 여러 개 두면 번호를 붙여 연결 목록에서 구분
    const same = design.nodes.filter((n) => n.service === service).length
    const label = same > 0 ? `${svc(service).name} ${same + 1}` : undefined
    setDesign({ ...design, nodes: [...design.nodes, { id: newId(), service, zone: zoneId, label }] })
  }

  const move = (node: PNode, zoneId: string) => {
    if (node.zone === zoneId) return
    const err = canPlace(node.service, zoneId, node)
    if (err) return say(err)
    setDesign({ ...design, nodes: design.nodes.map((n) => (n.id === node.id ? { ...n, zone: zoneId } : n)) })
  }

  // 서비스 삭제: 그 서비스에 붙은 선도 함께 지운다(예전 버전에서 남은 끊긴 선도 정리)
  const remove = (id: string) => {
    setDesign({
      nodes: design.nodes.filter((n) => n.id !== id),
      edges: design.edges.filter(([a, b]) => a !== id && b !== id && !isLoose(a) && !isLoose(b)),
    })
    setSelNode(null)
    setSelEdge(null)
    if (from === id) setFrom(null)
  }

  const removeEdge = (a: string, b: string) => {
    setDesign({ ...design, edges: design.edges.filter(([x, y]) => !(x === a && y === b)) })
    setSelEdge(null)
    say('연결을 지웠어요.')
  }

  const toggleEdge = (a: string, b: string) => {
    const fixedHas = (spec.fixedEdges ?? []).some(([x, y]) => (x === a && y === b) || (x === b && y === a))
    if (fixedHas) return say('기본으로 연결된 선이에요.')
    // 이미 연결된 두 요소를 다시 이으면 선을 지운다(선의 × 로도 지울 수 있음)
    const same = ([x, y]: [string, string]) => (x === a && y === b) || (x === b && y === a)
    const has = design.edges.some(same)
    setDesign({ ...design, edges: has ? design.edges.filter((e) => !same(e)) : [...design.edges, [a, b]] })
    setSelEdge(null)
    say(has ? '연결을 지웠어요.' : `${nodeName(a)} → ${nodeName(b)} 연결`)
  }

  const zoneAt = (x: number, y: number) =>
    (document.elementFromPoint(x, y)?.closest('[data-zone]') as HTMLElement | null)?.dataset.zone ?? null

  // ── 포인터(드래그·탭) 처리 ──
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = drag.current
      if (!d) return
      if (d.canMove && !d.moved && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) > 8) d.moved = true
      if (d.moved) {
        e.preventDefault()
        setGhost({ x: e.clientX, y: e.clientY, service: d.d.kind === 'svc' ? d.d.service : d.d.node.service })
        setHoverZone(zoneAt(e.clientX, e.clientY))
        // 화면 가장자리로 끌면 자동 스크롤
        const bottomBar = window.innerHeight - 200
        if (e.clientY > bottomBar && d.d.kind === 'node') window.scrollBy(0, 14)
        else if (e.clientY < 110) window.scrollBy(0, -14)
      }
    }
    const onUp = (e: PointerEvent) => {
      const d = drag.current
      drag.current = null
      setGhost(null)
      setHoverZone(null)
      if (!d) return
      if (d.moved) {
        const z = zoneAt(e.clientX, e.clientY)
        if (!z) return
        if (d.d.kind === 'svc') place(d.d.service, z)
        else move(d.d.node, z)
        setArmed(null)
        return
      }
      // 탭
      if (d.d.kind === 'svc') {
        const s = d.d.service
        setConnect(false)
        setFrom(null)
        setArmed((a) => (a === s ? null : s))
      } else {
        const n = d.d.node
        if (connect) {
          if (!from) setFrom(n.id)
          else if (from === n.id) setFrom(null)
          else {
            toggleEdge(from, n.id)
            setFrom(null)
          }
        } else {
          setSelEdge(null)
          if (!n.fixed) setSelNode((s) => (s === n.id ? null : n.id))
        }
      }
    }
    window.addEventListener('pointermove', onMove, { passive: false })
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', () => {
      drag.current = null
      setGhost(null)
      setHoverZone(null)
    })
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  })

  const onZoneTap = (z: string) => {
    if (armed) {
      place(armed, z)
      return
    }
    setSelNode(null)
    setSelEdge(null)
  }

  const onNodePointerDown = (e: React.PointerEvent, node: PNode) => {
    e.stopPropagation()
    if (sim) return
    // 고정 노드와 연결 모드에서는 이동하지 않고 탭만 처리
    drag.current = { d: { kind: 'node', node }, x0: e.clientX, y0: e.clientY, moved: false, canMove: !node.fixed && !connect }
  }

  // ── 시뮬레이션 ──
  const results = runScenarios(spec, project.scenarios, design)
  const allOk = results.every((r) => r.ok)
  useEffect(() => {
    if (!sim || sim.done) return
    const t = window.setTimeout(
      () => setSim((s) => (s && s.idx + 1 >= project.scenarios.length ? { idx: s.idx, done: true } : s && { idx: s.idx + 1, done: false })),
      1900,
    )
    return () => clearTimeout(t)
  }, [sim, project.scenarios.length])

  const startSim = () => {
    if (design.nodes.length === 0) return say('먼저 서비스를 배치해 보세요.')
    setArmed(null)
    setConnect(false)
    setFrom(null)
    setSelNode(null)
    setSelEdge(null)
    setToast(null)
    onSimRun()
    setSim({ idx: 0, done: false })
  }

  const cur = sim ? project.scenarios[sim.idx] : null
  const curRes = sim ? results[sim.idx] : null
  const showAll = sim?.done

  const grade = grading && !sim ? gradeDesign(spec, design) : null

  const cost = costIndex(design)
  const refCost = costIndex(spec.answer)

  return (
    <div className={`designer ${sim ? 'simming' : ''}`}>
      <div className="d-head">
        <div>
          <div className="d-kicker">아키텍처 설계실</div>
          <div className="d-title">{project.title}</div>
        </div>
        <button className="ghost small" onClick={() => setShowBrief((v) => !v)}>
          {showBrief ? '요구사항 접기' : '요구사항 보기'}
        </button>
      </div>
      {showBrief && (
        <ul className="brief">
          {spec.brief.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      )}

      <div className="d-help">
        {connect
          ? from
            ? `"${nodeName(from)}"과 연결할 대상을 누르세요. 이미 연결된 대상을 누르면 선이 지워지고, × 를 누르면 서비스가 삭제돼요.`
            : '연결 모드: 출발 요소를 누르세요. 선을 누르면 × 로 지울 수 있어요.'
          : armed
            ? `"${svc(armed).name}"을(를) 놓을 영역을 누르세요.`
            : selNode || selEdge
            ? '× 를 누르면 삭제돼요. 빈 곳을 누르면 선택이 풀려요.'
            : '서비스를 끌어다 놓거나, 누른 뒤 영역을 누르세요. 배치한 아이콘을 한 번 더 누르면 × 로 삭제할 수 있어요.'}
      </div>

      {grade && (
        <div className={`grade-panel ${grade.wrongCount + grade.missingCount === 0 ? 'ok' : ''}`}>
          <div className="grade-head">
            {grade.wrongCount + grade.missingCount === 0 ? (
              <b>✅ 정답 구성과 같아요!</b>
            ) : (
              <b>
                🔍 틀린 곳 {grade.wrongCount}개 · 빠진 것 {grade.missingCount}개
              </b>
            )}

            <button className="ghost small" onClick={() => setGrading(false)}>
              채점 끄기
            </button>
          </div>
          {grade.wrongCount + grade.missingCount > 0 && (
            <>
              <p className="grade-legend">
                <span className="lg wrong" /> 빨간색: 정답에 없는 배치·연결 (눌러서 × 삭제)
                <br />
                <span className="lg miss" /> 빨간 점선: 정답에 있는데 빠진 서비스·연결
              </p>
              {grade.missingEdges.some((m) => !m.ids) && (
                <ul className="grade-list">
                  {grade.missingEdges
                    .filter((m) => !m.ids)
                    .map((m, i) => (
                      <li key={i}>빠진 연결: {m.name}</li>
                    ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}

      <div className="canvas-scroll">
        <Canvas
          spec={spec}
          design={design}
          mode={sim ? 'sim' : 'edit'}
          armed={!!armed || !!ghost}
          hoverZone={hoverZone}
          connectFrom={from}
          selectedNode={selNode}
          highlightNode={selNode ?? from}
          dead={cur ? deadSet(spec, design, cur.fail) : undefined}
          failBoxes={cur?.fail}
          flow={curRes ? (curRes.ok ? 'ok' : 'bad') : null}
          load={cur?.load}
          onZoneTap={sim ? undefined : onZoneTap}
          onNodePointerDown={onNodePointerDown}
          onNodeDelete={sim ? undefined : remove}
          selectedEdge={sim ? null : selEdge}
          onEdgeTap={
            sim || armed
              ? undefined
              : (a, b) => {
                  setSelNode(null)
                  setSelEdge((k) => (k === `${a}|${b}` ? null : `${a}|${b}`))
                }
          }
          onEdgeDelete={sim ? undefined : removeEdge}
          grade={grade}
        />
      </div>

      {selNode && !sim && (
        <div className="node-actions">
          <span>{nodeName(selNode)}</span>
          <button
            className="ghost small"
            onClick={() => {
              setConnect(true)
              setFrom(selNode)
              setSelNode(null)
            }}
          >
            여기서 연결
          </button>
        </div>
      )}

      {design.edges.length > 0 && !sim && (
        <div className="edge-list">
          {design.edges.map(([a, b]) => (
            <button
              key={`${a}-${b}`}
              className={`edge-chip ${grade?.wrongEdges.has(`${a}|${b}`) ? 'wrong' : ''}`}
              onClick={() => removeEdge(a, b)} title="눌러서 삭제">
              {nodeName(a)} → {nodeName(b)} <b>×</b>
            </button>
          ))}
        </div>
      )}

      {!sim && (
        <div className="d-bottom">
          <div className="palette">
            {spec.palette.map((s) => (
              <div
                key={s}
                className={`pal-card ${armed === s ? 'on' : ''}`}
                onPointerDown={(e) => {
                  drag.current = { d: { kind: 'svc', service: s }, x0: e.clientX, y0: e.clientY, moved: false, canMove: true }
                }}
              >
                <SvcIcon id={s} size={30} />
                <div className="pal-text">
                  <b>{svc(s).name}</b>
                  <small>{svc(s).desc}</small>
                </div>
              </div>
            ))}
          </div>
          <div className="toolbar">
            <button
              className={connect ? 'on' : ''}
              onClick={() => {
                setConnect((c) => !c)
                setFrom(null)
                setArmed(null)
                setSelNode(null)
                setSelEdge(null)
              }}
            >
              🔗 {connect ? '연결 끝내기' : '연결'}
            </button>
            <button onClick={() => setShowAnswer(true)}>💡 정답 보기</button>
            <button
              onClick={() => {
                if (confirm('배치한 서비스와 연결을 모두 지울까요?')) setDesign({ nodes: [], edges: [] })
              }}
            >
              ↺ 초기화
            </button>
            <button className="primary" onClick={startSim}>
              ▶ 시뮬레이션
            </button>
          </div>
        </div>
      )}

      {sim && (
        <div className="sim-panel">
          <div className="sim-meters">
            <div>
              <small>시나리오</small>
              <b>
                {Math.min(sim.idx + 1, project.scenarios.length)} / {project.scenarios.length}
              </b>
            </div>
            <div>
              <small>통과</small>
              <b className={allOk && showAll ? 'good' : ''}>
                {results.slice(0, sim.idx + 1).filter((r) => r.ok).length}
              </b>
            </div>
            <div>
              <small>비용 지수</small>
              <b className={cost > refCost + 2 ? 'warn' : ''}>
                {cost} <small>/ 기준 {refCost}</small>
              </b>
            </div>
            <div>
              <small>시도</small>
              <b>{simRuns}회</b>
            </div>
          </div>
          {!showAll && cur && curRes && (
            <div className={`sim-now ${curRes.ok ? 'ok' : 'bad'}`}>
              <div className="sim-ico">{cur.icon}</div>
              <div>
                <b>{cur.title}</b>
                <p>{cur.desc}</p>
                <p className="res">
                  {curRes.ok ? '✅ ' : '❌ '}
                  {curRes.msg}
                </p>
              </div>
            </div>
          )}
          {showAll && (
            <>
              <ul className="sim-results">
                {project.scenarios.map((s, i) => (
                  <li key={s.id} className={results[i].ok ? 'ok' : 'bad'}>
                    <span className="sim-ico">{s.icon}</span>
                    <div>
                      <b>
                        {results[i].ok ? '통과' : '실패'} · {s.title}
                      </b>
                      <p>{results[i].msg}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="sim-actions">
                {allOk ? (
                  <>
                    <p className="sim-verdict good">모든 시나리오를 통과했어요! 고객에게 제안하러 가요.</p>
                    <button className="ghost" onClick={() => setSim(null)}>
                      설계 더 보기
                    </button>
                    <button className="primary" onClick={onComplete}>
                      제안 완료 →
                    </button>
                  </>
                ) : (
                  <>
                    <p className="sim-verdict">실패한 시나리오의 설명을 참고해 설계를 고쳐 보세요.</p>
                    <button className="ghost" onClick={() => setShowAnswer(true)}>
                      💡 정답 보기
                    </button>
                    <button className="primary" onClick={() => setSim(null)}>
                      설계 수정하기
                    </button>
                  </>
                )}
              </div>
            </>
          )}
          {!showAll && (
            <button className="ghost small skip-anim" onClick={() => setSim({ idx: project.scenarios.length - 1, done: true })}>
              결과 바로 보기
            </button>
          )}
        </div>
      )}

      {showAnswer && (
        <div className="modal" onClick={() => setShowAnswer(false)}>
          <div className="modal-body wide" onClick={(e) => e.stopPropagation()}>
            {!peeked ? (
              <>
                <h3>정답 구성을 볼까요?</h3>
                <p>정답과 해설을 본 뒤에는 내 설계로 돌아가 직접 다시 완성해야 프로젝트가 끝나요. 완료 기록에는 "해설 참고"로 표시돼요.</p>
                <div className="row-end">
                  <button className="ghost" onClick={() => setShowAnswer(false)}>
                    조금 더 해 볼게요
                  </button>
                  <button className="primary" onClick={onPeek}>
                    정답 보기
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3>정답 구성</h3>
                <div className="canvas-scroll">
                  <Canvas spec={spec} design={spec.answer} mode="view" flow="ok" />
                </div>
                <ul className="notes">
                  {spec.answerNote.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
                <AnswerDiff diff={diffWithAnswer(spec, design)} />
                <div className="row-end">
                  <button
                    className="ghost"
                    onClick={() => {
                      if (design.nodes.length > 0 && !confirm('지금 배치한 내용을 지우고 정답 구성 전체로 바꿀까요?')) return
                      setDesign(structuredClone(spec.answer))
                      setShowAnswer(false)
                      setSelNode(null)
                      setFrom(null)
                      setConnect(false)
                      setArmed(null)
                      say('정답 구성으로 배치했어요. ▶ 시뮬레이션으로 확인해 보세요.')
                    }}
                  >
                    🧩 정답 전체로 배치하기
                  </button>
                  <button
                    className="ghost"
                    onClick={() => {
                      if (design.nodes.length === 0) return setNotice('아직 배치된 서비스가 없어요.')
                      setGrading(true)
                      setShowAnswer(false)
                      setConnect(false)
                      setFrom(null)
                      setArmed(null)
                    }}
                  >
                    🔍 틀린 곳 보기
                  </button>
                  <button className="primary" onClick={() => setShowAnswer(false)}>
                    내 설계로 돌아가 다시 풀기
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {notice && (
        <div className="modal notice" onClick={() => setNotice(null)}>
          <div className="modal-body notice-body" onClick={(e) => e.stopPropagation()}>
            <div className="notice-ico">ℹ️</div>
            <p>{notice}</p>
            <button className="primary" onClick={() => setNotice(null)}>
              확인
            </button>
          </div>
        </div>
      )}

      {ghost && (
        <div className="ghost-drag" style={{ left: ghost.x, top: ghost.y }}>
          <SvcIcon id={ghost.service} size={34} />
        </div>
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

function AnswerDiff({ diff }: { diff: ReturnType<typeof diffWithAnswer> }) {
  const groups: [string, string[]][] = [
    ['정답에 있는데 내 설계에 없는 서비스', diff.missingNodes],
    ['내 설계에만 있는 서비스', diff.extraNodes],
    ['정답에 있는데 빠진 연결', diff.missingEdges],
    ['내 설계에만 있는 연결', diff.extraEdges],
  ]
  const any = groups.some(([, l]) => l.length > 0)
  return (
    <div className="diff">
      <h4>내 설계와 정답 비교</h4>
      {!any ? (
        <p className="same">배치 위치와 연결이 정답과 같아요.</p>
      ) : (
        groups
          .filter(([, l]) => l.length > 0)
          .map(([t, l]) => (
            <div key={t}>
              <b>{t}</b>
              <ul>
                {l.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>
          ))
      )}
      <small>같은 서비스라도 놓인 영역(가용 영역·서브넷)이 다르면 다른 배치로 봐요. 정답과 달라도 모든 시나리오를 통과하면 완료돼요.</small>
    </div>
  )
}
