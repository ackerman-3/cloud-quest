import { useState } from 'react'
import type { Quiz, SceneName } from '../types'
import { CHARS } from '../data/characters'
import { Stage } from './Talk'

type Phase = 'ask' | 'wrong' | 'right' | 'peek'

export function QuizView({ scene, quiz, onPeek, onDone }: { scene: SceneName; quiz: Quiz; onPeek: () => void; onDone: () => void }) {
  const [pick, setPick] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>('ask')
  const [tries, setTries] = useState(0)
  const asker = CHARS[quiz.who]
  const correct = quiz.options.find((o) => o.id === quiz.answer)!

  const submit = () => {
    if (!pick) return
    setTries((t) => t + 1)
    setPhase(pick === quiz.answer ? 'right' : 'wrong')
  }

  const retry = () => {
    setPick(null)
    setPhase('ask')
  }

  return (
    <div className="quiz-wrap">
      <Stage scene={scene} cast={[quiz.who]} speaking={quiz.who} />
      <div className="quiz-card">
        <div className="speaker">
          <b>{asker.name}</b>
          <span>{asker.role} · 솔루션 검토</span>
        </div>
        <p className="quiz-q">{quiz.prompt}</p>

        {phase !== 'peek' && (
          <div className="options">
            {quiz.options.map((o, i) => {
              const state =
                phase === 'right' ? (o.id === quiz.answer ? 'correct' : '') : phase === 'wrong' && o.id === pick ? 'wrong' : ''
              return (
                <button
                  key={o.id}
                  className={`opt ${pick === o.id ? 'picked' : ''} ${state}`}
                  disabled={phase === 'right'}
                  onClick={() => {
                    if (phase === 'wrong') setPhase('ask')
                    setPick(o.id)
                  }}
                >
                  <span className="opt-key">{'ABCD'[i]}</span>
                  <span>{o.text}</span>
                </button>
              )
            })}
          </div>
        )}

        {phase === 'ask' && (
          <div className="row-end">
            <button
              className="ghost"
              onClick={() => {
                onPeek()
                setPhase('peek')
              }}
            >
              모르겠어요 · 정답과 해설 보기
            </button>
            <button className="primary" disabled={!pick} onClick={submit}>
              제출
            </button>
          </div>
        )}

        {phase === 'wrong' && (
          <div className="feedback bad">
            <b>다시 생각해 볼까요?</b>
            <p>{quiz.options.find((o) => o.id === pick)?.why}</p>
            <p className="hint">힌트: {quiz.hint}</p>
            <div className="row-end">
              <button
                className="ghost"
                onClick={() => {
                  onPeek()
                  setPhase('peek')
                }}
              >
                건너뛰고 정답·해설 보기
              </button>
              <button className="primary" onClick={retry}>
                다시 풀기
              </button>
            </div>
          </div>
        )}

        {phase === 'right' && (
          <div className="feedback good">
            <b>{tries === 1 ? '정확해요!' : '맞았어요!'}</b>
            <p>{quiz.explain}</p>
            <details>
              <summary>다른 선택지는 왜 아닐까?</summary>
              <ul>
                {quiz.options
                  .filter((o) => o.id !== quiz.answer)
                  .map((o) => (
                    <li key={o.id}>
                      <b>{o.text}</b> — {o.why}
                    </li>
                  ))}
              </ul>
            </details>
            <div className="row-end">
              <button className="primary" onClick={onDone}>
                다음 →
              </button>
            </div>
          </div>
        )}

        {phase === 'peek' && (
          <div className="feedback peek">
            <b>정답: {correct.text}</b>
            <p>{quiz.explain}</p>
            <ul>
              {quiz.options
                .filter((o) => o.id !== quiz.answer)
                .map((o) => (
                  <li key={o.id}>
                    <b>{o.text}</b> — {o.why}
                  </li>
                ))}
            </ul>
            <div className="row-end">
              <button className="primary" onClick={retry}>
                원래 문제로 돌아가 다시 풀기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
