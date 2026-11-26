import { useEffect, useState } from 'react'
import { isChoice, type Line, type SceneName, type TalkItem } from '../types'
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

export function Talk({
  scene,
  lines,
  onDone,
  noSkip,
}: {
  scene: SceneName
  lines: TalkItem[]
  onDone: () => void
  /** 동료 에피소드처럼 선택지가 있는 대화는 넘기기 버튼을 숨긴다 */
  noSkip?: boolean
}) {
  // 선택지를 고르면 그 선택지의 대사를 그 자리에 끼워 넣는다
  const [items, setItems] = useState<TalkItem[]>(lines)
  const [i, setI] = useState(0)
  const [shown, setShown] = useState(0)
  const cur = items[i]
  const choosing = isChoice(cur)
  const line: Line = choosing ? { who: 'me', text: '' } : cur
  const allLines = lines.flatMap((x) => (isChoice(x) ? x.choice.flatMap((c) => c.lines) : [x]))
  const cast = [...new Set(allLines.map((l) => l.who).filter((w) => CHARS[w]))].slice(-3)
  const typing = !choosing && shown < line.text.length
  // 지난 대사 중 마지막 화자(선택지를 고르는 동안 무대 표시용)
  const lastWho = [...items.slice(0, i)].reverse().find((x): x is Line => !isChoice(x) && !!CHARS[x.who])?.who

  useEffect(() => {
    setShown(0)
  }, [i, items])
  useEffect(() => {
    if (!typing) return
    const t = window.setTimeout(() => setShown((s) => Math.min(line.text.length, s + 2)), 28)
    return () => clearTimeout(t)
  }, [shown, typing, line.text.length])

  const next = () => {
    if (choosing) return
    if (typing) return setShown(line.text.length)
    if (i + 1 < items.length) setI(i + 1)
    else onDone()
  }
  const pick = (k: number) => {
    if (!isChoice(cur)) return
    setItems([...items.slice(0, i), ...cur.choice[k].lines, ...items.slice(i + 1)])
  }

  const who = line.who === 'me' ? ME : CHARS[line.who]
  return (
    <div className="talk" onClick={next}>
      <Stage scene={scene} cast={cast} speaking={choosing ? lastWho : CHARS[line.who] ? line.who : undefined} talking={typing} />
      {choosing ? (
        <div className="dialog choice-box" onClick={(e) => e.stopPropagation()}>
          <div className="speaker">
            <b>나</b>
            <span>어떻게 말할까요?</span>
          </div>
          <div className="choice-list">
            {cur.choice.map((c, k) => (
              <button key={k} onClick={() => pick(k)}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
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
              {i + 1} / {items.length}
            </span>
            {!typing && <span className="next-arrow">{i + 1 < items.length ? '▼ 탭해서 계속' : '▶ 다음 단계'}</span>}
          </div>
          {!noSkip && (
            <button
              className="skip-talk"
              onClick={(e) => {
                e.stopPropagation()
                onDone()
              }}
            >
              대화 넘기기 ≫
            </button>
          )}
        </div>
      )}
    </div>
  )
}
