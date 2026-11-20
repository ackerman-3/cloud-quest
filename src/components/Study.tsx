// 학습 탭: 개념 노트 목록과 노트 보기(기본 개념 + 구성도 읽기 + 문제 속 단서)
import { useEffect, useRef, useState } from 'react'
import { NOTES, type Note } from '../data/notes'
import { PROJECTS, LEVELS } from '../data/projects'
import { Canvas, SvcIcon } from './Canvas'

/** 설명 문단을 문장 단위로 나눈다 (첫 문장 = 요약) */
const sentences = (t: string) =>
  t
    .split(/(?<=[.!?])\s+/)
    .map((x) => x.trim())
    .filter(Boolean)

/** 문장 끝 마침표 제거 */
const noDot = (t: string) => t.replace(/\.\s*$/, '')

/** 여러 문장은 줄을 바꿔 보여 주고, 문장 끝 마침표는 뺀다 */
function Lines({ t }: { t: string }) {
  const ss = sentences(t)
  return (
    <>
      {ss.map((x, i) => (
        <span key={i}>
          {i > 0 && <br />}
          {noDot(x)}
        </span>
      ))}
    </>
  )
}

type Page = { k: 'concepts' } | { k: 'compare' } | { k: 'diagram' } | { k: 'keywords' }

const PAGE_LABEL: Record<Page['k'], string> = {
  concepts: '핵심 개념',
  compare: '비교',
  diagram: '구성도 읽기',
  keywords: '문제 속 단서',
}

export function NoteView({
  note,
  onStart,
  unlocked,
  onLastNext,
  lastNextLabel,
}: {
  note: Note
  onStart?: (id: string) => void
  unlocked?: number
  /** 마지막 페이지에서 "다음" 버튼을 누르면 (다음 노트로) */
  onLastNext?: () => void
  lastNextLabel?: string
}) {
  const pr = note.diagram.project ? PROJECTS.find((p) => p.id === note.diagram.project) : undefined
  const spec = pr?.design ?? note.diagram.spec!
  const design = pr?.design.answer ?? note.diagram.design!
  const [step, setStep] = useState<number | null>(null)
  const hl = step != null ? (note.diagram.steps[step]?.node ?? null) : null

  const pages: Page[] = [{ k: 'concepts' }, ...(note.compare ? [{ k: 'compare' as const }] : []), { k: 'diagram' }, { k: 'keywords' }]
  const [openC, setOpenC] = useState<number | null>(null)
  const [pg, setPg] = useState(0)
  const [dir, setDir] = useState<1 | -1>(1)
  const top = useRef<HTMLDivElement>(null)
  const touch = useRef<{ x: number; y: number; skip: boolean } | null>(null)

  useEffect(() => {
    setPg(0)
    setStep(null)
    setOpenC(null)
  }, [note.id])

  const go = (n: number) => {
    if (n < 0 || n >= pages.length) return
    setDir(n > pg ? 1 : -1)
    setPg(n)
    setStep(null)
    const el = top.current
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: 'start' })
  }

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    // 구성도처럼 가로로 스크롤되는 영역에서 시작한 밀기는 페이지 넘김으로 보지 않는다
    const skip = !!(e.target as HTMLElement).closest('.note-canvas, .cmp-wrap')
    touch.current = { x: t.clientX, y: t.clientY, skip }
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    const s0 = touch.current
    touch.current = null
    if (!s0 || s0.skip) return
    const t = e.changedTouches[0]
    const dx = t.clientX - s0.x
    const dy = t.clientY - s0.y
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(pg + (dx < 0 ? 1 : -1))
  }

  const page = pages[Math.min(pg, pages.length - 1)]

  const body = (() => {
    switch (page.k) {
      case 'concepts':
        if (note.prose)
          return (
            <article className="pg-prose">
              {note.prose.map((sec) => (
                <section key={sec.h}>
                  <h3>{sec.h}</h3>
                  {sec.p.map((t) => (
                    <p key={t}>{noDot(t)}</p>
                  ))}
                </section>
              ))}
            </article>
          )
        return (
          <div className="pg-concepts">
            <p className="pcs-sub">{noDot(note.sub)}</p>
            <ul className="clist">
              {note.concepts.map((c, i) => {
                const [head, ...rest] = sentences(c.desc)
                const on = openC === i
                return (
                  <li key={c.term} className={on ? 'on' : ''}>
                    <button onClick={() => setOpenC(on ? null : i)} aria-expanded={on}>
                      {c.svc ? <SvcIcon id={c.svc} size={30} /> : <span className="cl-emoji">💡</span>}
                      <span className="cl-text">
                        <b>{c.term}</b>
                        <span>{noDot(head)}</span>
                      </span>
                      {rest.length > 0 && <span className="cl-more">{on ? '−' : '+'}</span>}
                    </button>
                    {on && rest.length > 0 && (
                      <ul className="cl-rest">
                        {rest.map((r) => (
                          <li key={r}>{noDot(r)}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ul>
            <p className="muted tiny-note">항목을 누르면 자세한 설명이 펼쳐져요</p>
          </div>
        )
      case 'compare':
        return (
          <div className="pg-compare">
            <h3>{note.compare!.title}</h3>
            <div className="cmp-wrap">
              <table className="cmp">
                <thead>
                  <tr>
                    {note.compare!.head.map((h, i) => (
                      <th key={i}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {note.compare!.rows.map((r, i) => (
                    <tr key={i}>
                      {r.map((c, j) => (j === 0 ? <th key={j}>{noDot(c)}</th> : <td key={j}>{noDot(c)}</td>))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      case 'diagram':
        return (
          <div className="pg-diagram">
            <p className="muted small"><Lines t={note.diagram.caption} /></p>
            {pr && <p className="note-from">「{pr.title}」 프로젝트의 정답 구성이에요</p>}
            <div className="note-canvas">
              <Canvas spec={spec} design={design} mode="view" highlightNode={hl} selectedNode={hl} />
            </div>
            <ol className="read-steps">
              {note.diagram.steps.map((s, i) => (
                <li key={i} className={step === i ? 'on' : ''}>
                  <button onClick={() => setStep(step === i ? null : i)}>
                    <span className="rs-no">{i + 1}</span>
                    <span><Lines t={s.text} /></span>
                  </button>
                </li>
              ))}
            </ol>
            <p className="muted tiny-note">단계를 누르면 구성도에서 그 서비스와 연결선이 파랗게 표시돼요</p>
          </div>
        )
      case 'keywords':
        return (
          <div className="pg-kw">
            <h3>문제에서 이 말이 나오면</h3>
            <ul className="kw">
              {note.keywords.map((k) => (
                <li key={k.when}>
                  <span className="kw-when">{noDot(k.when)}</span>
                  <b className="kw-then"><Lines t={k.then} /></b>
                </li>
              ))}
            </ul>
            {note.projects.length > 0 && (
              <>
                <h3 className="kw-proj-h">이 개념을 쓰는 프로젝트</h3>
                <div className="note-projects">
                  {note.projects.map((id) => {
                    const p = PROJECTS.find((x) => x.id === id)
                    if (!p) return null
                    const locked = unlocked != null && p.level > unlocked
                    return (
                      <button key={id} className="np" disabled={!onStart || locked} onClick={() => onStart?.(id)}>
                        <small>
                          {locked ? '🔒 ' : ''}
                          {LEVELS[p.level - 1].diff}
                        </small>
                        <b>{p.title}</b>
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )
    }
  })()

  const last = pg === pages.length - 1
  return (
    <div className="note book" ref={top} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="bk-bar">
        <span className="bk-label">{page.k === 'concepts' && note.prose ? '읽기' : PAGE_LABEL[page.k]}</span>
        <span className="bk-count">
          {pg + 1} / {pages.length}
        </span>
      </div>
      <div className="bk-progress">
        <i style={{ width: `${((pg + 1) / pages.length) * 100}%` }} />
      </div>
      <div key={`${note.id}-${pg}`} className={`bk-page ${dir > 0 ? 'from-right' : 'from-left'}`}>
        {body}
      </div>
      <div className="bk-nav">
        <button className="ghost" disabled={pg === 0} onClick={() => go(pg - 1)}>
          ‹ 이전
        </button>
        {last && onLastNext ? (
          <button className="primary" onClick={onLastNext}>
            {lastNextLabel ?? '다음 노트'} ›
          </button>
        ) : (
          <button className="primary" disabled={last} onClick={() => go(pg + 1)}>
            다음 ›
          </button>
        )}
      </div>
    </div>
  )
}

/** 프로젝트 화면 등 위에 띄우는 노트 시트 */
export function NoteSheet({ note, onClose }: { note: Note; onClose: () => void }) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])
  return (
    <div className="sheet-back" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <header className="sheet-head">
          <b>
            {note.emoji} {note.title}
          </b>
          <button className="ghost small" onClick={onClose}>
            닫기
          </button>
        </header>
        <div className="sheet-body">
          <NoteView note={note} />
        </div>
      </div>
    </div>
  )
}

export function Study({ onStart, unlocked }: { onStart: (id: string) => void; unlocked: number }) {
  const [open, setOpen] = useState<string | null>(null)
  const note = NOTES.find((n) => n.id === open)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [open])

  if (note)
    return (
      <div className="dash study">
        <header className="study-head">
          <button className="ghost small" onClick={() => setOpen(null)}>
            ← 목록
          </button>
          <h2>
            {note.emoji} {note.title}
          </h2>
        </header>
        <section className="card">
          {(() => {
            const i = NOTES.findIndex((n) => n.id === note.id)
            const next = NOTES[i + 1]
            return (
              <NoteView
                note={note}
                onStart={onStart}
                unlocked={unlocked}
                onLastNext={next ? () => setOpen(next.id) : () => setOpen(null)}
                lastNextLabel={next ? `다음 노트: ${next.title}` : '목록으로'}
              />
            )
          })()}
        </section>
      </div>
    )

  return (
    <div className="dash study">
      <section className="card">
        <div className="card-head">
          <h2>개념 노트</h2>
        </div>
        <p className="muted small">프로젝트를 풀기 전에 읽어 두면 구성도와 문제가 훨씬 쉽게 보여요<br />처음이라면 「구성도 읽는 법」부터 보세요</p>
        <ul className="note-list">
          {NOTES.map((n, i) => (
            <li key={n.id}>
              <button onClick={() => setOpen(n.id)}>
                <span className="nl-emoji">{n.emoji}</span>
                <span className="nl-text">
                  <b>
                    {i === 0 ? '' : `${i}. `}
                    {n.title}
                  </b>
                  <small>{noDot(n.sub)}</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
