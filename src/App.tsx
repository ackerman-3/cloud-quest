import { useEffect, useState } from 'react'
import { Home } from './components/Home'
import { Play } from './components/Play'
import { Sprite } from './components/Sprite'
import { PROJECTS, LEVELS } from './data/projects'
import { CHARS } from './data/characters'
import { STUDY_URL } from './data/links'
import {
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

type View =
  | { v: 'home' }
  | { v: 'play'; id: string; resume?: Session | null }
  | { v: 'result'; id: string; c: Completion; levelUp: number | null }

export default function App() {
  const [progress, setP] = useState<Progress>(loadProgress)
  const [session, setSession] = useState<Session | null>(loadSession)
  const [view, setView] = useState<View>({ v: 'home' })

  const setProgress = (p: Progress) => {
    setP(p)
    saveProgress(p)
  }

  useEffect(() => {
    // 브라우저가 저장소를 임의로 비우지 않도록 요청(지원하는 브라우저만)
    navigator.storage?.persist?.().catch(() => {})
  }, [])

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

  if (view.v === 'play') {
    const project = PROJECTS.find((p) => p.id === view.id)!
    return (
      <Play
        project={project}
        resume={view.resume}
        onExit={() => {
          setSession(loadSession())
          setView({ v: 'home' })
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
          {view.levelUp && (
            <div className="levelup">
              🎉 승급! <b>{LEVELS[view.levelUp - 1].name}</b>가 되었어요. {LEVELS[view.levelUp - 1].diff} 프로젝트가 열렸어요.
            </div>
          )}
          <div className="row-center">
            <button className="ghost" onClick={() => setView({ v: 'home' })}>
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

  return (
    <Home
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
  )
}
