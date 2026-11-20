import { useEffect, useState } from 'react'
import { Home } from './components/Home'
import { Play } from './components/Play'
import { Sprite } from './components/Sprite'
import { Gifts, EpisodeHeader } from './components/Gifts'
import { Talk } from './components/Talk'
import { Study } from './components/Study'
import { PinLock } from './components/PinLock'
import { ATTEND_GOLD, FRIENDS, GOLD, type Episode } from './data/rewards'
import { PROJECTS, LEVELS } from './data/projects'
import { CHARS } from './data/characters'
import { STUDY_URL } from './data/links'
import {
  affinity,
  checkIn,
  completionGold,
  goldBalance,
  markEpisodeSeen,
  loadProgress,
  loadSession,
  recordCompletion,
  saveProgress,
  saveSession,
  todayCount,
  unlockedLevel,
  type Completion,
  type Progress,
  type Session,
} from './store'

type Tab = 'home' | 'projects' | 'study' | 'gift' | 'records'

type View =
  | { v: 'home' }
  | { v: 'play'; id: string; resume?: Session | null }
  | { v: 'result'; id: string; c: Completion; levelUp: number | null }
  | { v: 'episode'; friend: string; ep: Episode }

export default function App() {
  const [progress, setP] = useState<Progress>(loadProgress)
  const [session, setSession] = useState<Session | null>(loadSession)
  const [view, setView] = useState<View>({ v: 'home' })
  const [notice, setNotice] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('home')
  const [giftFriend, setGiftFriend] = useState<string | undefined>()
  const [giftOpen, setGiftOpen] = useState(false)
  const goTab = (t: Tab) => {
    if (t !== 'gift') setGiftOpen(false) // 선물 탭을 벗어나면 다시 잠금
    setTab(t)
    setView({ v: 'home' })
    window.scrollTo(0, 0)
  }

  const setProgress = (p: Progress) => {
    setP(p)
    saveProgress(p)
  }

  useEffect(() => {
    // 브라우저가 저장소를 임의로 비우지 않도록 요청(지원하는 브라우저만)
    navigator.storage?.persist?.().catch(() => {})
  }, [])

  // 출석 보상: 앱을 열거나 다시 화면에 돌아왔을 때 오늘 첫 접속이면 골드 지급
  useEffect(() => {
    const attend = () => {
      const cur = loadProgress()
      const next = checkIn(cur)
      if (!next) return
      setProgress(next)
      setNotice(`📅 오늘 출석 보상 +${ATTEND_GOLD}${GOLD}`)
    }
    attend()
    const onVis = () => {
      if (document.visibilityState === 'visible') attend()
      else setGiftOpen(false) // 앱을 내리면 선물 메뉴 다시 잠금
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  useEffect(() => {
    if (!notice) return
    const t = window.setTimeout(() => setNotice(null), 3200)
    return () => clearTimeout(t)
  }, [notice])

  const toast = notice && <div className="toast top-toast">{notice}</div>

  const start = (id: string) => {
    const s = loadSession()
    if (s && s.projectId !== id) {
      const p = PROJECTS.find((x) => x.id === s.projectId)
      if (!confirm(`진행 중인 "${p?.title}"이(가) 있어요. 새로 시작하면 진행 상황이 사라져요. 계속할까요?`)) return
      saveSession(null)
    }
    setView({ v: 'play', id, resume: s && s.projectId === id ? s : null })
    window.scrollTo(0, 0)
  }

  if (view.v === 'episode') {
    const back = () => {
      setProgress(markEpisodeSeen(progress, view.ep.id))
      setGiftFriend(view.friend)
      goTab('gift')
    }
    return (
      <div className="play episode">
        <EpisodeHeader title={view.ep.title} name={CHARS[view.friend].name} onBack={back} />
        <Talk scene={view.ep.scene} lines={view.ep.lines} onDone={back} />
      </div>
    )
  }

  if (view.v === 'play') {
    const project = PROJECTS.find((p) => p.id === view.id)!
    return (
      <Play
        project={project}
        resume={view.resume}
        onExit={() => {
          setSession(loadSession())
          goTab('home')
        }}
        onFinish={({ stars, peeked }) => {
          const before = unlockedLevel(progress)
          const { next, completion } = recordCompletion(progress, project.id, stars, peeked)
          setProgress(next)
          setSession(null)
          const after = unlockedLevel(next)
          setView({ v: 'result', id: project.id, c: completion, levelUp: after > before ? after : null })
          window.scrollTo(0, 0)
        }}
      />
    )
  }

  if (view.v === 'result') {
    const project = PROJECTS.find((p) => p.id === view.id)!
    const n = todayCount(progress)
    // 다음 문제: 방금 푼 직급(난이도)의 안 푼 프로젝트를 먼저 이어서 낸다. 승급해도 같은 직급을 다 풀 때까지는 넘어가지 않는다.
    const notDone = (p: (typeof PROJECTS)[number]) => !progress.completions.some((c) => c.projectId === p.id)
    const idx = PROJECTS.findIndex((p) => p.id === project.id)
    const ordered = [...PROJECTS.slice(idx + 1), ...PROJECTS.slice(0, idx)]
    const nextP =
      ordered.find((p) => p.level === project.level && notDone(p)) ??
      PROJECTS.find((p) => p.level > project.level && p.level <= unlockedLevel(progress) && notDone(p)) ??
      PROJECTS.find((p) => p.level <= unlockedLevel(progress) && notDone(p))
    return (
      <div className="result">
        <div className="result-card">
          <Sprite cfg={CHARS[project.client]} className="result-sprite" talking={false} />
          <div className="kicker">프로젝트 완료</div>
          <h1>{project.title}</h1>
          <div className="stars big-stars">{'★'.repeat(view.c.stars) + '☆'.repeat(3 - view.c.stars)}</div>
          {view.c.peeked && <p className="muted">해설을 참고해 완료했어요. 다음에는 스스로 풀어 별 3개에 도전해 보세요.</p>}
          <div className="result-count">
            {view.c.counted ? (
              <>
                오늘 완료 <b>{n}건</b> {view.c.review && <span className="pill tiny">복습</span>}
              </>
            ) : (
              <>오늘 이미 완료한 프로젝트라 완료 수에는 더하지 않았어요. (오늘 {n}건)</>
            )}
          </div>
          {(() => {
            const g = completionGold(view.c)
            return (
              <div className="result-gold">
                {g > 0 ? (
                  <div>
                    💰 <b>+{g.toLocaleString('ko-KR')}{GOLD}</b> 획득{view.c.review && ' (복습 보상)'}
                  </div>
                ) : (
                  <div>오늘 이미 받은 프로젝트라 골드는 지급되지 않았어요.</div>
                )}
                <small>보유 {goldBalance(progress).toLocaleString('ko-KR')}{GOLD}</small>
              </div>
            )
          })()}
          {view.levelUp && (
            <div className="levelup">
              🎉 승급! <b>{LEVELS[view.levelUp - 1].name}</b>가 되었어요. {LEVELS[view.levelUp - 1].diff} 프로젝트가 열렸어요.
            </div>
          )}
          <div className="row-center">
            <button className="ghost" onClick={() => goTab('home')}>
              메인으로
            </button>
            {nextP && (
              <button className="primary" onClick={() => start(nextP.id)}>
                다음 {LEVELS[nextP.level - 1].name.split(" ")[0]} 프로젝트: {nextP.title}
              </button>
            )}
          </div>
          {STUDY_URL && (
            <a className="study-link" href={STUDY_URL} target="_blank" rel="noopener noreferrer">
              📚 공부하러 가기
            </a>
          )}
        </div>
      </div>
    )
  }

  const newEp = FRIENDS.some((f) => f.episodes.some((e) => affinity(progress, f.id) >= e.need && !(progress.seenEpisodes ?? []).includes(e.id)))
  return (
    <div className="with-nav">
      {toast}
      {tab === 'gift' && !giftOpen ? (
        <PinLock onUnlock={() => setGiftOpen(true)} />
      ) : tab === 'gift' ? (
        <Gifts
          key={giftFriend}
          progress={progress}
          setProgress={setProgress}
          initial={giftFriend}
          onEpisode={(friend, ep) => {
            setView({ v: 'episode', friend, ep })
            window.scrollTo(0, 0)
          }}
        />
      ) : tab === 'study' ? (
        <Study onStart={start} unlocked={unlockedLevel(progress)} />
      ) : (
        <Home
          section={tab}
          onTab={goTab}
          onGift={() => goTab('gift')}
          progress={progress}
          setProgress={setProgress}
          session={session}
          onStart={start}
          onResume={() => session && setView({ v: 'play', id: session.projectId, resume: session })}
          onReset={() => {
            saveSession(null)
            setSession(null)
            setProgress({ version: 1, completions: [], dailyGoal: progress.dailyGoal })
          }}
        />
      )}
      <nav className="bottom-nav">
        {(
          [
            ['home', '🏠', '홈'],
            ['projects', '📋', '프로젝트'],
            ['study', '📘', '학습'],
            ['gift', '🎁', '선물'],
            ['records', '📅', '기록'],
          ] as const
        ).map(([id, icon, label]) => (
          <button key={id} className={tab === id ? 'on' : ''} onClick={() => goTab(id)} aria-current={tab === id ? 'page' : undefined}>
            <span className="bn-icon">{icon}</span>
            <span>{label}</span>
            {id === 'gift' && newEp && <i className="bn-dot" />}
          </button>
        ))}
      </nav>
    </div>
  )
}
