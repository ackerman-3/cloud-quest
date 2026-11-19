import { useEffect, useState } from 'react'
import { CHARS } from '../data/characters'
import { BONDS, FRIENDS, GIFTS, GOLD, bondOf, giftPoints, type Episode, type GiftItem } from '../data/rewards'
import { affinity, giveGift, goldBalance, type Progress } from '../store'
import { Stage } from './Talk'

const fmt = (n: number) => n.toLocaleString('ko-KR')
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]

export function Gifts({
  progress,
  setProgress,
  initial,
  onEpisode,
}: {
  progress: Progress
  setProgress: (p: Progress) => void
  initial?: string
  onEpisode: (friendId: string, ep: Episode) => void
}) {
  const [fid, setFid] = useState(initial ?? FRIENDS[0].id)
  const [ask, setAsk] = useState<GiftItem | null>(null)
  const [say, setSay] = useState<{ text: string; pts?: number; kind?: 'like' | 'normal' | 'dislike' } | null>(null)
  const [shown, setShown] = useState(0)
  const [unlocked, setUnlocked] = useState<Episode | null>(null)

  const f = FRIENDS.find((x) => x.id === fid)!
  const c = CHARS[fid]
  const pts = affinity(progress, fid)
  const bond = bondOf(pts)
  const balance = goldBalance(progress)
  const text = say?.text ?? f.greet[bond.idx]
  const typing = shown < text.length

  useEffect(() => setShown(0), [text])
  useEffect(() => {
    if (!typing) return
    const t = window.setTimeout(() => setShown((s) => Math.min(text.length, s + 2)), 28)
    return () => clearTimeout(t)
  }, [shown, typing, text.length])

  const choose = (id: string) => {
    setFid(id)
    setSay(null)
    setAsk(null)
    setUnlocked(null)
  }

  const give = (item: GiftItem) => {
    const add = giftPoints(f, item)
    const kind = f.likes.includes(item.id) ? 'like' : f.dislikes.includes(item.id) ? 'dislike' : 'normal'
    const line = (kind === 'like' && f.special?.[item.id]) || pick(f.react[kind])
    const before = pts
    setProgress(giveGift(progress, fid, item.id, item.price, add))
    setSay({ text: line, pts: add, kind })
    setAsk(null)
    const ep = f.episodes.find((e) => before < e.need && before + add >= e.need)
    setUnlocked(ep ?? null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const barMin = BONDS[bond.idx].min
  const barPct = bond.next ? ((pts - barMin) / (bond.next - barMin)) * 100 : 100
  const seen = new Set(progress.seenEpisodes ?? [])

  return (
    <div className="gifts">
      <header className="play-head">
        <div className="play-title">
          <small>동료에게 마음 전하기</small>
          <b>🎁 선물하기</b>
        </div>
        <span className="gold-pill">
          💰 {fmt(balance)}
          {GOLD}
        </span>
      </header>

      <div className="friend-tabs">
        {FRIENDS.map((x) => {
          const p = affinity(progress, x.id)
          const b = bondOf(p)
          const newEp = x.episodes.some((e) => p >= e.need && !seen.has(e.id))
          return (
            <button key={x.id} className={`friend-tab ${x.id === fid ? 'on' : ''}`} onClick={() => choose(x.id)}>
              <b>{CHARS[x.id].name}</b>
              <small>{b.name}</small>
              <span className="hearts">{'♥'.repeat(b.idx + 1) + '♡'.repeat(BONDS.length - 1 - b.idx)}</span>
              {newEp && <i className="dot-new" />}
            </button>
          )
        })}
      </div>

      <div className="gift-stage">
        <Stage scene="lounge" cast={[fid]} speaking={fid} talking={typing}>
          {say?.pts !== undefined && (
            <div key={progress.gifts?.length} className={`aff-pop ${say.kind}`}>
              ♥ +{say.pts}
            </div>
          )}
        </Stage>
        <div className="dialog gift-dialog" onClick={() => setShown(text.length)}>
          <div className="speaker">
            <b>{c.name}</b>
            <span>{c.role}</span>
          </div>
          <p>{text.slice(0, shown)}</p>
        </div>
      </div>

      {unlocked && (
        <button className="ep-unlock" onClick={() => onEpisode(fid, unlocked)}>
          <span>💌 특별 에피소드가 열렸어요</span>
          <b>「{unlocked.title}」 지금 보기 →</b>
        </button>
      )}

      <section className="card">
        <div className="bond-row">
          <div>
            <small className="muted">호감도</small>
            <div className="bond-num">
              {pts} <span>{bond.name}</span>
            </div>
          </div>
          <small className="muted">{bond.next ? `다음 단계까지 ${bond.next - pts}` : '최고 단계'}</small>
        </div>
        <div className="bar">
          <i style={{ width: `${Math.min(100, barPct)}%` }} />
        </div>
        <p className="hint">💡 {f.hint}</p>
      </section>

      <section className="card">
        <h2>선물 고르기</h2>
        <ul className="gift-grid">
          {GIFTS.map((g) => {
            const poor = balance < g.price
            return (
              <li key={g.id}>
                <button className="gift-item" disabled={poor} onClick={() => setAsk(g)}>
                  <span className="g-emoji">{g.emoji}</span>
                  <b>{g.name}</b>
                  <span className={`g-price ${poor ? 'poor' : ''}`}>
                    {fmt(g.price)}
                    {GOLD}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
        <p className="muted small-note">좋아하는 선물은 호감도가 2배, 싫어하는 선물은 절반만 올라요.</p>
      </section>

      <section className="card">
        <h2>특별 에피소드</h2>
        <ul className="ep-list">
          {f.episodes.map((e, i) => {
            const open = pts >= e.need
            return (
              <li key={e.id}>
                <button className="ep-item" disabled={!open} onClick={() => onEpisode(fid, e)}>
                  <span className="ep-no">EP {i + 1}</span>
                  <b>{open ? e.title : '???'}</b>
                  <small>{open ? (seen.has(e.id) ? '다시 보기' : 'NEW · 보기') : `🔒 호감도 ${e.need}에 열려요`}</small>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      {ask && (
        <div className="modal" onClick={() => setAsk(null)}>
          <div className="modal-body" onClick={(e) => e.stopPropagation()}>
            <h3>
              {ask.emoji} {ask.name}
            </h3>
            <p>
              {c.name}에게 <b>{fmt(ask.price)}{GOLD}</b>로 선물할까요?
              <br />
              <small className="muted">
                남는 골드 {fmt(balance - ask.price)}
                {GOLD}
              </small>
            </p>
            <div className="row-end">
              <button className="ghost" onClick={() => setAsk(null)}>
                취소
              </button>
              <button className="primary" onClick={() => give(ask)}>
                선물하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function EpisodeHeader({ title, name, onBack }: { title: string; name: string; onBack: () => void }) {
  return (
    <header className="play-head">
      <button className="ghost small" onClick={onBack}>
        ← 돌아가기
      </button>
      <div className="play-title">
        <small>{name} 특별 에피소드</small>
        <b>{title}</b>
      </div>
    </header>
  )
}
