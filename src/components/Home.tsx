import { useRef, useState } from 'react'
import { NoteSheet } from './Study'
import { noteForProject } from '../data/notes'
import { LEVELS, PROJECTS } from '../data/projects'
import { CHARS } from '../data/characters'
import { Sprite } from './Sprite'
import { STUDY_URL } from '../data/links'
import { FRIENDS, GOLD } from '../data/rewards'
import officeImg from '../assets/office.webp'
import { PixelArt } from './Office'
import { memento } from '../data/office'

const PAGE_SIZE = 5
import {
  affinity,
  bestStars,
  earnedMementos,
  completionGold,
  isCleared,
  practiceGold,
  type PracticeKind,
  goldBalance,
  doneProjects,
  exportJson,
  importJson,
  streak,
  studyDays,
  today,
  todayCount,
  unlockedLevel,
  type Progress,
  type Session,
} from '../store'

function Calendar({ p }: { p: Progress }) {
  const days = studyDays(p)
  const counts = new Map<string, number>()
  p.completions.forEach((c) => c.counted && counts.set(c.date, (counts.get(c.date) ?? 0) + 1))
  const cells: { d: string; n: number; isToday: boolean }[] = []
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 28 - end.getDay()) // 4주 전 일요일부터 시작해 이번 주 오늘까지(요일 열과 맞춤)
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const k = today(d)
    cells.push({ d: k, n: days.has(k) ? (counts.get(k) ?? 1) : 0, isToday: k === today() })
  }
  return (
    <div className="cal">
      {['일', '월', '화', '수', '목', '금', '토'].map((w) => (
        <span key={w} className="cal-w">
          {w}
        </span>
      ))}
      {cells.map((c) => (
        <span key={c.d} className={`cal-d l${Math.min(3, c.n)} ${c.isToday ? 'today' : ''}`} title={`${c.d} · ${c.n}건`}>
          {c.d.slice(8) === '01' ? `${Number(c.d.slice(5, 7))}/1` : Number(c.d.slice(8))}
        </span>
      ))}
    </div>
  )
}

function LevelBars({ progress }: { progress: Progress }) {
  return (
    <div className="level-bars">
      {LEVELS.map((L) => {
        const n = PROJECTS.filter((p) => p.level === L.level).length
        const d = doneProjects(progress, L.level).length
        return (
          <div key={L.level} className="lb">
            <small>{L.name}</small>
            <div className="bar thin">
              <i style={{ width: `${(d / n) * 100}%` }} />
            </div>
            <small>
              {d}/{n}
            </small>
          </div>
        )
      })}
    </div>
  )
}

/** 최근 7일 학습 여부 */
function MiniWeek({ p }: { p: Progress }) {
  const counts = new Map<string, number>()
  p.completions.forEach((c) => c.counted && counts.set(c.date, (counts.get(c.date) ?? 0) + 1))
  const days: { k: string; w: string; n: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const k = today(d)
    days.push({ k, w: i === 0 ? '오늘' : '일월화수목금토'[d.getDay()], n: counts.get(k) ?? 0 })
  }
  return (
    <div className="mini-week">
      {days.map((d) => (
        <div key={d.k} className={`mw ${d.n ? 'on' : ''}`}>
          <i className={`l${Math.min(3, d.n)}`}>{d.n || ''}</i>
          <small>{d.w}</small>
        </div>
      ))}
    </div>
  )
}

/** 승급 보상: 승급·올 클리어 때 받는 기념품과 남은 조건 */
function RankRewards({ progress, onOpen }: { progress: Progress; onOpen: () => void }) {
  const earned = earnedMementos(progress)
  const totalDone = doneProjects(progress).length
  const rows = [
    { m: 'm_junior', title: LEVELS[1].name + ' 승급', cur: doneProjects(progress, 1).length, need: LEVELS[1].need, unit: `${LEVELS[0].diff} 프로젝트` },
    { m: 'm_senior', title: LEVELS[2].name + ' 승급', cur: doneProjects(progress, 2).length, need: LEVELS[2].need, unit: `${LEVELS[1].diff} 프로젝트` },
    { m: 'm_all', title: '모든 프로젝트 완료', cur: totalDone, need: PROJECTS.length, unit: '전체 프로젝트' },
  ]
  const nextIdx = rows.findIndex((r) => !earned.has(r.m))
  return (
    <section className="card rank-rewards">
      <div className="card-head">
        <h2>승급 보상</h2>
        <button className="ghost small" onClick={onOpen}>
          사무실에 전시
        </button>
      </div>
      <ul>
        {rows.map((r, i) => {
          const m = memento(r.m)!
          const got = earned.has(r.m)
          const left = Math.max(0, r.need - r.cur)
          return (
            <li key={r.m} className={`${got ? 'got' : ''} ${i === nextIdx ? 'next' : ''}`}>
              <span className="rr-art">
                <PixelArt name={m.art} />
              </span>
              <span className="rr-text">
                <small>{r.title}</small>
                <b>{m.name}</b>
                {got ? (
                  <small className="rr-ok">✓ 받았어요</small>
                ) : (
                  <>
                    <div className="bar thin">
                      <i style={{ width: `${Math.min(100, (r.cur / r.need) * 100)}%` }} />
                    </div>
                    <small>
                      {r.unit} {Math.min(r.cur, r.need)}/{r.need}건 · {left}건 남음
                    </small>
                  </>
                )}
              </span>
              {i === nextIdx && <span className="rr-next">다음 보상</span>}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export function Home({
  progress,
  setProgress,
  session,
  onStart,
  onPractice,
  onResume,
  onReset,
  onGift,
  section,
  onTab,
}: {
  progress: Progress
  setProgress: (p: Progress) => void
  session: Session | null
  onStart: (id: string) => void
  onPractice: (id: string, kind: PracticeKind) => void
  onResume: () => void
  onReset: () => void
  onGift: () => void
  section: 'home' | 'projects' | 'records'
  onTab: (t: 'projects' | 'records') => void
}) {
  const [tab, setTab] = useState<1 | 2 | 3>(unlockedLevel(progress))
  // 난이도별 프로젝트 목록 페이지(한 페이지 5개). 난이도 탭마다 보던 페이지를 기억한다.
  const [pages, setPages] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0 })
  const listTop = useRef<HTMLUListElement>(null)
  const [noteOf, setNoteOf] = useState<string | null>(null)
  const sheetNote = noteOf ? noteForProject(noteOf) : undefined
  const [showBackup, setShowBackup] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [askReset, setAskReset] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const unlocked = unlockedLevel(progress)
  const tCount = todayCount(progress)
  const goal = progress.dailyGoal
  const lvl = LEVELS[unlocked - 1]
  const nextL = LEVELS[unlocked]
  const nextNeed = nextL ? nextL.need - doneProjects(progress, unlocked).length : 0
  const sessionProject = session ? PROJECTS.find((p) => p.id === session.projectId) : null
  const recent = [
    ...progress.completions.map((c) => ({ ts: c.ts, c, x: null })),
    ...(progress.practices ?? []).map((x) => ({ ts: x.ts, c: null, x })),
  ]
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 8)
  const doneIds = new Set(progress.completions.map((c) => c.projectId))
  const nextRec = [...PROJECTS].sort((a, b) => a.level - b.level).find((p) => p.level <= unlocked && !doneIds.has(p.id))
  const newEp = FRIENDS.some((f) => f.episodes.some((e) => affinity(progress, f.id) >= e.need && !(progress.seenEpisodes ?? []).includes(e.id)))

  const download = () => {
    const blob = new Blob([exportJson(progress)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `cloud-quest-backup-${today()}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 2000)
    setProgress({ ...progress, lastBackup: Date.now() })
    setMsg('백업 파일을 내려받았어요. 아이폰은 "파일" 앱의 다운로드 폴더에 저장돼요.')
  }
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(exportJson(progress))
      setProgress({ ...progress, lastBackup: Date.now() })
      setMsg('백업 내용을 복사했어요. 메모 앱 등에 붙여 넣어 보관하세요.')
    } catch {
      setMsg('복사하지 못했어요. 파일 내려받기를 이용해 주세요.')
    }
  }
  const restore = (text: string) => {
    const p = importJson(text)
    if (!p) return setMsg('백업 형식이 올바르지 않아요.')
    if (!confirm(`완료 기록 ${p.completions.length}건으로 덮어쓸까요? 지금 기록은 사라져요.`)) return
    setProgress(p)
    setMsg('복원했어요.')
  }

  const daysSinceBackup = progress.lastBackup ? Math.floor((Date.now() - progress.lastBackup) / 86400000) : null

  return (
    <div className="home">
      {sheetNote && <NoteSheet note={sheetNote} onClose={() => setNoteOf(null)} />}
      {section === 'home' && (
        <>
      <section className="hero">
        <img src={officeImg} alt="" className="hero-bg" />
        <div className="hero-shade" />
        <div className="hero-inner">
          <div className="brand">CLOUD ARCHITECT QUEST</div>
          <h1>오늘도 고객 문제를 해결해 볼까요?</h1>
          <div className="rank">
            <span className="pill">{lvl.name}</span>
            {nextL ? (
              <small>
                {nextL.name} 승급까지 {lvl.diff} 프로젝트 {Math.max(0, nextNeed)}건
              </small>
            ) : (
              <small>최고 등급 달성</small>
            )}
          </div>
          <div className="hero-actions">
            <button className="gold-pill big" onClick={onGift} aria-label="보유 골드, 사무실로 이동">
              💰 {goldBalance(progress).toLocaleString('ko-KR')}
              {GOLD}
            </button>
            {STUDY_URL && (
              <a className="study-link" href={STUDY_URL} target="_blank" rel="noopener noreferrer">
                📚 공부하러 가기
              </a>
            )}
          </div>
        </div>
        <div className="hero-lead">
          <Sprite cfg={CHARS.lead} className="hero-sprite" />
        </div>
      </section>

      <section className="stats">
        <div className="stat main">
          <small>오늘 완료한 프로젝트</small>
          <div className="big">
            {tCount}
            <span>/ {goal}</span>
          </div>
          <div className="bar">
            <i style={{ width: `${Math.min(100, (tCount / goal) * 100)}%` }} />
          </div>
          <small className="muted">{tCount >= goal ? '오늘 목표 달성! 🎉' : `목표까지 ${goal - tCount}건`}</small>
        </div>
        <div className="stat">
          <small>연속 학습</small>
          <div className="big">
            {streak(progress)}
            <span>일</span>
          </div>
        </div>
        <div className="stat">
          <small>완료한 프로젝트</small>
          <div className="big">
            {doneProjects(progress).length}
            <span>/ {PROJECTS.length}</span>
          </div>
        </div>
      </section>

      {sessionProject && (
        <button className="resume" onClick={onResume}>
          <span>이어하기</span>
          <b>{sessionProject.title}</b>
          <span>→</span>
        </button>
      )}

      {nextRec && (
        <button className="next-rec" onClick={() => onStart(nextRec.id)}>
          <span className="nr-kicker">다음 추천 · {LEVELS[nextRec.level - 1].name.split(' ')[0]}</span>
          <b>{nextRec.title}</b>
          <small>
            {nextRec.org} · {nextRec.topics.slice(0, 3).join(' · ')}
          </small>
          <span className="nr-go">시작 →</span>
        </button>
      )}

      <section className="card">
        <div className="card-head">
          <h2>승급 현황</h2>
          <button className="ghost small" onClick={() => onTab('projects')}>
            프로젝트 보기
          </button>
        </div>
        <LevelBars progress={progress} />
      </section>

      <RankRewards progress={progress} onOpen={onGift} />

      {newEp && (
        <button className="gift-entry" onClick={onGift}>
          <span className="ge-icon">💌</span>
          <span className="ge-text">
            <b>새 동료 에피소드가 열려 있어요</b>
            <small>사무실 탭에서 동료를 눌러 확인해 보세요</small>
          </span>
          <span className="ge-new">NEW</span>
        </button>
      )}

      <section className="card">
        <div className="card-head">
          <h2>최근 학습</h2>
          <button className="ghost small" onClick={() => onTab('records')}>
            기록 보기
          </button>
        </div>
        <MiniWeek p={progress} />
      </section>
        </>
      )}

      {section === 'projects' && (
      <section className="card">
        <div className="card-head">
          <h2>프로젝트</h2>
          <div className="tabs">
            {LEVELS.map((L) => (
              <button key={L.level} className={tab === L.level ? 'on' : ''} onClick={() => setTab(L.level)}>
                {L.level > unlocked ? '🔒 ' : ''}
                {L.diff}
              </button>
            ))}
          </div>
        </div>
        <LevelBars progress={progress} />
        {tab > unlocked && (
          <p className="locked-note">
            🔒 {LEVELS[tab - 2].diff} 프로젝트를 {LEVELS[tab - 1].need}건 완료하면 "{LEVELS[tab - 1].name}"로 승급해 열려요.
          </p>
        )}
        {(() => {
          const all = PROJECTS.filter((p) => p.level === tab)
          const pageCount = Math.max(1, Math.ceil(all.length / PAGE_SIZE))
          const page = Math.min(pages[tab] ?? 0, pageCount - 1)
          const go = (n: number) => {
            setPages((x) => ({ ...x, [tab]: n }))
            listTop.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
          }
          return (
            <>
        <ul className="plist" ref={listTop}>
          {all.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE).map((p) => {
            const stars = bestStars(progress, p.id)
            const locked = p.level > unlocked
            const doneToday = progress.completions.some((c) => c.projectId === p.id && c.date === today())
            const cleared = !locked && isCleared(progress, p.id)
            return (
              <li key={p.id} className={cleared ? 'cleared' : ''}>
                <button className="pitem" disabled={locked} onClick={() => onStart(p.id)}>
                  <div className="p-top">
                    <span className="p-ava">
                      <Sprite cfg={CHARS[p.client]} className="p-ava-spr" />
                    </span>
                    <b>{p.title}</b>
                    <span className="stars">{stars ? '★'.repeat(stars) + '☆'.repeat(3 - stars) : ''}</span>
                  </div>
                  <small className="muted">
                    {p.org} · {p.env}
                  </small>
                  <p>{p.summary}</p>
                  <div className="tags">
                    {p.topics.map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                    {doneToday && <span className="tag-today">오늘 완료</span>}
                  </div>
                </button>
                {noteForProject(p.id) && (
                  <button className="note-chip" onClick={() => setNoteOf(p.id)} aria-label={`개념보기: ${noteForProject(p.id)!.title}`}>
                    <span>📘</span>
                    <small>개념보기</small>
                  </button>
                )}
                {cleared && (
                  <div className="practice-row">
                    <span>다시 하기</span>
                    <button onClick={() => onPractice(p.id, 'quiz')}>🧠 퀴즈</button>
                    <button onClick={() => onPractice(p.id, 'design')}>🧩 구성도</button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
        {pageCount > 1 && (
          <div className="pager">
            <button className="pg-arrow" disabled={page === 0} onClick={() => go(page - 1)} aria-label="이전 페이지">
              ‹
            </button>
            {Array.from({ length: pageCount }, (_, i) => (
              <button key={i} className={`pg-num ${i === page ? 'on' : ''}`} onClick={() => go(i)}>
                {i + 1}
              </button>
            ))}
            <button className="pg-arrow" disabled={page === pageCount - 1} onClick={() => go(page + 1)} aria-label="다음 페이지">
              ›
            </button>
          </div>
        )}
            </>
          )
        })()}
      </section>

      )}

      {section === 'records' && (
        <>
      <section className="card">
        <h2>학습 달력</h2>
        <Calendar p={progress} />
      </section>

      <section className="card">
        <h2>최근 완료 내역</h2>
        {recent.length === 0 && <p className="muted">아직 완료한 프로젝트가 없어요. 신입 프로젝트부터 시작해 보세요.</p>}
        <ul className="history">
          {recent.map(({ ts, c, x }) => {
            const p = PROJECTS.find((y) => y.id === (c ?? x)!.projectId)
            if (x)
              return (
                <li key={ts}>
                  <span className="h-date">{x.date.slice(5).replace('-', '.')}</span>
                  <span className="h-title">{p?.title}</span>
                  <span className="pill tiny">{x.kind === 'quiz' ? '퀴즈만' : '구성도만'}</span>
                  {x.peeked && <span className="pill warn tiny">해설 참고</span>}
                  {practiceGold(x) > 0 && <span className="h-gold">+{practiceGold(x)}{GOLD}</span>}
                </li>
              )
            const cc = c!
            return (
              <li key={ts}>
                <span className="h-date">{cc.date.slice(5).replace('-', '.')}</span>
                <span className="h-title">{p?.title}</span>
                <span className="stars">{'★'.repeat(cc.stars)}</span>
                {cc.peeked && <span className="pill warn tiny">해설 참고</span>}
                {!cc.counted && <span className="pill tiny">같은 날 반복</span>}
                {cc.counted && cc.review && <span className="pill tiny">복습</span>}
                {completionGold(cc) > 0 && <span className="h-gold">+{completionGold(cc)}{GOLD}</span>}
              </li>
            )
          })}
        </ul>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>설정 · 백업</h2>
          <button className="ghost small" onClick={() => setShowBackup((v) => !v)}>
            {showBackup ? '닫기' : '열기'}
          </button>
        </div>
        {daysSinceBackup === null || daysSinceBackup >= 7 ? (
          <p className="warn-note">
            {daysSinceBackup === null ? '아직 백업한 적이 없어요.' : `마지막 백업이 ${daysSinceBackup}일 전이에요.`} 기록은 이 기기의 브라우저에만 저장돼요.
          </p>
        ) : null}
        {showBackup && (
          <div className="backup">
            <label className="goal">
              하루 목표
              <select value={goal} onChange={(e) => setProgress({ ...progress, dailyGoal: Number(e.target.value) })}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}건
                  </option>
                ))}
              </select>
            </label>
            <div className="row-wrap">
              <button onClick={download}>⬇ 백업 파일 내려받기</button>
              <button onClick={copy}>📋 백업 내용 복사</button>
              <button onClick={() => fileRef.current?.click()}>⬆ 파일에서 복원</button>
              <button
                onClick={() => {
                  const t = prompt('복사해 둔 백업 내용을 붙여 넣으세요.')
                  if (t) restore(t)
                }}
              >
                📥 붙여 넣어 복원
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0]
                if (f) restore(await f.text())
                e.target.value = ''
              }}
            />
            <div className="reset-box">
              {!askReset ? (
                <button className="danger" onClick={() => setAskReset(true)}>
                  🗑 학습 기록 초기화
                </button>
              ) : (
                <div className="reset-confirm">
                  <b>모든 학습 기록을 지울까요?</b>
                  <p>
                    완료 내역 {progress.completions.length}건, 별점, 학습 달력, 승급 상태, 진행 중인 프로젝트가 모두 지워지고 되돌릴 수 없어요. 하루 목표 설정은 유지돼요. 필요하면 먼저 백업하세요.
                  </p>
                  <div className="row-wrap">
                    <button onClick={() => setAskReset(false)}>취소</button>
                    <button
                      className="danger"
                      onClick={() => {
                        onReset()
                        setAskReset(false)
                        setTab(1)
                        setMsg('학습 기록을 초기화했어요.')
                      }}
                    >
                      초기화
                    </button>
                  </div>
                </div>
              )}
            </div>
            <ul className="notes">
              <li>기록은 이 기기·이 브라우저의 저장소(localStorage)에 저장돼요. 서버에는 저장되지 않아요.</li>
              <li>홈 화면 아이콘을 삭제하면 기록도 함께 지워져요. 삭제 전에 꼭 백업하세요.</li>
              <li>Safari에서 바로 쓰는 것과 홈 화면 앱은 저장소가 따로예요. 홈 화면 앱으로 쓰는 것을 권장해요.</li>
            </ul>
          </div>
        )}
        {msg && <p className="ok-note">{msg}</p>}
      </section>
      <footer className="foot">학습용 시나리오이며 실제 서비스 가격·할당량은 AWS 문서를 확인하세요.</footer>
        </>
      )}
    </div>
  )
}
