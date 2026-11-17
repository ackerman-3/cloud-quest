import { useEffect, useState } from 'react'
import type { Design, Project } from '../types'
import { Talk } from './Talk'
import { QuizView } from './QuizView'
import { Designer } from './Designer'
import { saveSession, type Session } from '../store'

function stepLabel(p: Project, i: number) {
  const s = p.steps[i]
  if (s.t === 'quiz') return '솔루션 검토'
  if (s.t === 'design') return '설계·시뮬레이션'
  if (i === p.steps.length - 1) return '마무리'
  return s.scene === 'meeting' ? '고객 미팅' : '프로젝트 배정'
}

export function Play({
  project,
  resume,
  onExit,
  onFinish,
}: {
  project: Project
  resume?: Session | null
  onExit: () => void
  onFinish: (r: { stars: number; peeked: boolean }) => void
}) {
  const [step, setStep] = useState(resume?.step ?? 0)
  const [design, setDesign] = useState<Design>(resume?.design ?? { nodes: [], edges: [] })
  const [peeked, setPeeked] = useState(resume?.peeked ?? false)
  const [simRuns, setSimRuns] = useState(resume?.simRuns ?? 0)

  useEffect(() => {
    saveSession({ projectId: project.id, step, design, peeked, simRuns, savedAt: Date.now() })
  }, [project.id, step, design, peeked, simRuns])

  const s = project.steps[step]
  const next = () => {
    if (step + 1 < project.steps.length) {
      setStep(step + 1)
      window.scrollTo(0, 0)
    } else {
      saveSession(null)
      const stars = Math.max(1, 3 - (peeked ? 1 : 0) - (simRuns > 3 ? 1 : 0))
      onFinish({ stars, peeked })
    }
  }

  const labels = [...new Set(project.steps.map((_, i) => stepLabel(project, i)))]
  const curLabel = stepLabel(project, step)

  return (
    <div className="play">
      <header className="play-head">
        <button className="ghost small" onClick={onExit}>
          ← 현황판
        </button>
        <div className="play-title">
          <small>{project.org}</small>
          <b>{project.title}</b>
        </div>
        {peeked && <span className="pill warn">해설 참고</span>}
      </header>
      <ol className="steps">
        {labels.map((l) => (
          <li key={l} className={l === curLabel ? 'cur' : labels.indexOf(l) < labels.indexOf(curLabel) ? 'done' : ''}>
            {l}
          </li>
        ))}
      </ol>

      {s.t === 'talk' && <Talk key={step} scene={s.scene} lines={s.lines} onDone={next} />}
      {s.t === 'quiz' && <QuizView key={step} scene={s.scene} quiz={s.quiz} onPeek={() => setPeeked(true)} onDone={next} />}
      {s.t === 'design' && (
        <Designer
          project={project}
          design={design}
          setDesign={setDesign}
          peeked={peeked}
          onPeek={() => setPeeked(true)}
          simRuns={simRuns}
          onSimRun={() => setSimRuns((n) => n + 1)}
          onComplete={next}
        />
      )}
    </div>
  )
}
