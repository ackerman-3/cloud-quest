import { useEffect, useState } from 'react'
import type { Line, SceneName } from '../types'
import { CHARS, ME } from '../data/characters'
import { Sprite } from './Sprite'
import office from '../assets/office.webp'
import meeting from '../assets/meeting.webp'
import lounge from '../assets/lounge.webp'

export const SCENES: Record<SceneName, { img: string; label: string }> = {
  office: { img: office, label: '클라우드사업팀 사무실' },
  meeting: { img: meeting, label: '회의실' },
  lounge: { img: lounge, label: '라운지' },
}

export function Stage({ scene, cast, speaking, talking, children }: { scene: SceneName; cast: string[]; speaking?: string; talking?: boolean; children?: React.ReactNode }) {
  return (
    <div className="stage">
      <img className="stage-bg" src={SCENES[scene].img} alt="" />
      <div className="stage-place">{SCENES[scene].label}</div>
      <div className={`cast n${cast.length}`}>
        {cast.map((id, i) => (
          <div key={id} className={`actor ${speaking && speaking !== id ? 'dim' : ''} ${speaking === id ? 'speak' : ''}`}>
            <Sprite cfg={CHARS[id]} talking={!!talking && speaking === id} flip={cast.length > 1 && i === 0} className="actor-sprite" />
          </div>
        ))}
      </div>
      {children}
    </div>
  )
}

export function Talk({ scene, lines, onDone }: { scene: SceneName; lines: Line[]; onDone: () => void }) {
  const [i, setI] = useState(0)
  const [shown, setShown] = useState(0)
  const line = lines[i]
  const cast = [...new Set(lines.map((l) => l.who).filter((w) => CHARS[w]))].slice(-3)
  const typing = shown < line.text.length

  useEffect(() => {
    setShown(0)
  }, [i])
  useEffect(() => {
    if (!typing) return
    const t = window.setTimeout(() => setShown((s) => Math.min(line.text.length, s + 2)), 28)
    return () => clearTimeout(t)
  }, [shown, typing, line.text.length])

  const next = () => {
    if (typing) return setShown(line.text.length)
    if (i + 1 < lines.length) setI(i + 1)
    else onDone()
  }

  const who = line.who === 'me' ? ME : CHARS[line.who]
  return (
    <div className="talk" onClick={next}>
      <Stage scene={scene} cast={cast} speaking={CHARS[line.who] ? line.who : undefined} talking={typing} />
      <div className={`dialog ${line.who === 'me' ? 'mine' : ''}`}>
        {who && (
          <div className="speaker">
            <b>{who.name}</b>
            <span>{who.role}</span>
          </div>
        )}
        <p>{line.text.slice(0, shown)}</p>
        <div className="dialog-foot">
          <span>
            {i + 1} / {lines.length}
          </span>
          {!typing && <span className="next-arrow">{i + 1 < lines.length ? '▼ 탭해서 계속' : '▶ 다음 단계'}</span>}
        </div>
        <button
          className="skip-talk"
          onClick={(e) => {
            e.stopPropagation()
            onDone()
          }}
        >
          대화 넘기기 ≫
        </button>
      </div>
    </div>
  )
}
