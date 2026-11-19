import { useEffect, useState } from 'react'

// 선물 메뉴 관리자 잠금(4자리 고정 비밀번호).
// 코드에는 비밀번호 대신 해시만 둔다. 공개 저장소이고 4자리라 마음먹으면 알아낼 수 있으니,
// 다른 사람이 실수로 들어오는 걸 막는 가벼운 잠금으로만 쓴다.
// 비밀번호를 바꾸려면 scripts/pin-hash.ts로 새 해시를 만들어 아래 두 값을 바꾼다.
const SALT = 'cloud-quest:gift:'
const ADMIN_SHA256 = '807ae7e16b2d9e9226c7aab33ae02b51db612f3ed37a7c9d1d0f97e1da7e8140'
const ADMIN_FNV = '2494cf7a'

export async function pinMatches(pin: string) {
  const text = SALT + pin
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('') === ADMIN_SHA256
  } catch {
    // 보안 컨텍스트가 아니라 crypto.subtle을 못 쓰는 환경용
    let h = 2166136261
    for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
    return (h >>> 0).toString(16) === ADMIN_FNV
  }
}

export function PinLock({ onUnlock, title = '선물하기' }: { onUnlock: () => void; title?: string }) {
  const [pin, setPin] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [shake, setShake] = useState(false)
  useEffect(() => {
    if (pin.length !== 4) return
    const t = window.setTimeout(async () => {
      if (await pinMatches(pin)) {
        onUnlock()
        return
      }
      setErr('비밀번호가 달라요.')
      setShake(true)
      window.setTimeout(() => setShake(false), 450)
      setPin('')
    }, 120)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin])

  const press = (d: string) => {
    setErr(null)
    setPin((p) => (p.length < 4 ? p + d : p))
  }

  return (
    <div className="pin-lock">
      <div className="pin-top">
        <div className="pin-icon">🔒</div>
        <div className="pin-title">{title}</div>
        <p>관리자 비밀번호를 입력하세요</p>
        <div className={`pin-dots ${shake ? 'shake' : ''}`}>
          {[0, 1, 2, 3].map((i) => (
            <i key={i} className={i < pin.length ? 'on' : ''} />
          ))}
        </div>
        <div className="pin-err">{err ?? ''}</div>
      </div>
      <div className="pin-pad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button key={d} onClick={() => press(d)}>
            {d}
          </button>
        ))}
        <span />
        <button onClick={() => press('0')}>
          0
        </button>
        <button className="pin-sub" onClick={() => setPin((p) => p.slice(0, -1))} aria-label="지우기">
          ⌫
        </button>
      </div>
    </div>
  )
}
