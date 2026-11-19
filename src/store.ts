import { PROJECTS, LEVELS } from './data/projects'
import { ATTEND_GOLD, LEVEL_GOLD, REVIEW_RATE, STAR_BONUS } from './data/rewards'
import type { Design } from './types'

// ⚠️ 저장 키 이름과 형식을 바꾸면 기존 기록이 사라질 수 있습니다.
export const PROGRESS_KEY = 'cloud-quest-progress-v1'
export const SESSION_KEY = 'cloud-quest-session-v1'

export interface Completion {
  projectId: string
  date: string // YYYY-MM-DD (기기 현지 날짜)
  ts: number
  stars: number
  peeked: boolean // 정답·해설을 본 적 있음
  counted: boolean // 오늘 완료 수에 반영됐는지 (같은 날 같은 프로젝트는 1회만)
  review: boolean // 이전 날짜에 이미 완료한 프로젝트를 다시 한 것
}

export interface Progress {
  version: 1
  completions: Completion[]
  dailyGoal: number
  lastBackup?: number
  /** 출석한 날짜(YYYY-MM-DD). 하루 첫 접속마다 골드 지급 */
  attendance?: string[]
  /** 선물 기록. 골드 사용·호감도 계산의 근거 */
  gifts?: GiftLog[]
  /** 본 특별 에피소드 id */
  seenEpisodes?: string[]
}

export interface GiftLog {
  ts: number
  to: string // 캐릭터 id
  item: string // 선물 id
  cost: number
  points: number
}

export interface Session {
  projectId: string
  step: number
  design: Design
  peeked: boolean
  simRuns: number
  savedAt: number
}

const empty = (): Progress => ({ version: 1, completions: [], dailyGoal: 2 })

export function today(d = new Date()) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function safeGet(key: string) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
function safeSet(key: string, v: string) {
  try {
    localStorage.setItem(key, v)
    return true
  } catch {
    return false
  }
}

export function loadProgress(): Progress {
  const raw = safeGet(PROGRESS_KEY)
  if (!raw) return empty()
  try {
    const p = JSON.parse(raw) as Progress
    if (p && p.version === 1 && Array.isArray(p.completions)) return { ...empty(), ...p }
  } catch {
    /* 손상된 데이터는 무시 */
  }
  return empty()
}

export function saveProgress(p: Progress) {
  return safeSet(PROGRESS_KEY, JSON.stringify(p))
}

export function loadSession(): Session | null {
  const raw = safeGet(SESSION_KEY)
  if (!raw) return null
  try {
    const s = JSON.parse(raw) as Session
    return PROJECTS.some((p) => p.id === s.projectId) ? s : null
  } catch {
    return null
  }
}
export function saveSession(s: Session | null) {
  if (s) safeSet(SESSION_KEY, JSON.stringify(s))
  else {
    try {
      localStorage.removeItem(SESSION_KEY)
    } catch {
      /* noop */
    }
  }
}

/** 프로젝트 완료 기록. 같은 날 같은 프로젝트는 완료 수에 1회만 반영 */
export function recordCompletion(p: Progress, projectId: string, stars: number, peeked: boolean) {
  const d = today()
  const counted = !p.completions.some((c) => c.projectId === projectId && c.date === d && c.counted)
  const review = p.completions.some((c) => c.projectId === projectId && c.date < d)
  const c: Completion = { projectId, date: d, ts: Date.now(), stars, peeked, counted, review }
  return { next: { ...p, completions: [...p.completions, c] }, completion: c }
}

export function todayCount(p: Progress) {
  const d = today()
  return p.completions.filter((c) => c.date === d && c.counted).length
}

export function studyDays(p: Progress) {
  return new Set(p.completions.map((c) => c.date))
}

export function streak(p: Progress) {
  const days = studyDays(p)
  const d = new Date()
  // 오늘 아직 안 했으면 어제부터 센다
  if (!days.has(today(d))) d.setDate(d.getDate() - 1)
  let n = 0
  while (days.has(today(d))) {
    n++
    d.setDate(d.getDate() - 1)
  }
  return n
}

export function bestStars(p: Progress, projectId: string) {
  return p.completions.filter((c) => c.projectId === projectId).reduce((m, c) => Math.max(m, c.stars), 0)
}

export function doneProjects(p: Progress, level?: number) {
  const ids = new Set(p.completions.map((c) => c.projectId))
  return PROJECTS.filter((pr) => ids.has(pr.id) && (!level || pr.level === level))
}

/** 해금된 최고 등급 */
export function unlockedLevel(p: Progress): 1 | 2 | 3 {
  let lv: 1 | 2 | 3 = 1
  for (const L of LEVELS) {
    if (L.level === 1) continue
    if (doneProjects(p, L.level - 1).length >= L.need) lv = L.level
    else break
  }
  return lv
}

export function exportJson(p: Progress) {
  return JSON.stringify({ app: 'cloud-quest', exportedAt: new Date().toISOString(), progress: p }, null, 2)
}

export function importJson(text: string): Progress | null {
  try {
    const o = JSON.parse(text)
    const p = (o?.progress ?? o) as Progress
    if (p?.version === 1 && Array.isArray(p.completions)) return { ...empty(), ...p }
  } catch {
    /* noop */
  }
  return null
}

/** 완료 기록 하나를 지우고, 남은 기록의 "완료 수 반영(counted)"·"복습(review)" 표시를 다시 계산한다 */
export function deleteCompletion(p: Progress, ts: number): Progress {
  const rest = p.completions.filter((c) => c.ts !== ts).sort((a, b) => a.ts - b.ts)
  const seenDay = new Set<string>()
  const completions = rest.map((c) => {
    const key = `${c.projectId}|${c.date}`
    const counted = !seenDay.has(key)
    seenDay.add(key)
    const review = rest.some((x) => x.projectId === c.projectId && x.date < c.date)
    return { ...c, counted, review }
  })
  return { ...p, completions }
}

// ── 골드·출석·선물 ──
// 골드는 따로 저장하지 않고 기록(완료·출석·선물)에서 계산한다. 완료 기록을 지우면 그 보상도 함께 빠진다.

/** 완료 기록 하나로 받은 골드. 같은 날 반복은 0, 다른 날 복습은 기본 골드 절반 */
export function completionGold(c: Completion) {
  if (!c.counted) return 0
  const p = PROJECTS.find((x) => x.id === c.projectId)
  if (!p) return 0
  const base = LEVEL_GOLD[p.level]
  return Math.round(base * (c.review ? REVIEW_RATE : 1)) + STAR_BONUS * Math.max(0, c.stars - 1)
}

export function goldEarned(p: Progress) {
  return p.completions.reduce((s, c) => s + completionGold(c), 0) + (p.attendance?.length ?? 0) * ATTEND_GOLD
}

export function goldSpent(p: Progress) {
  return (p.gifts ?? []).reduce((s, g) => s + g.cost, 0)
}

export function goldBalance(p: Progress) {
  return Math.max(0, goldEarned(p) - goldSpent(p))
}

/** 오늘 처음 접속했으면 출석 기록을 더한 새 Progress, 이미 출석했으면 null */
export function checkIn(p: Progress): Progress | null {
  const d = today()
  if (p.attendance?.includes(d)) return null
  return { ...p, attendance: [...(p.attendance ?? []), d] }
}

export function affinity(p: Progress, charId: string) {
  return (p.gifts ?? []).filter((g) => g.to === charId).reduce((s, g) => s + g.points, 0)
}

export function giveGift(p: Progress, to: string, item: string, cost: number, points: number): Progress {
  return { ...p, gifts: [...(p.gifts ?? []), { ts: Date.now(), to, item, cost, points }] }
}

export function markEpisodeSeen(p: Progress, id: string): Progress {
  if (p.seenEpisodes?.includes(id)) return p
  return { ...p, seenEpisodes: [...(p.seenEpisodes ?? []), id] }
}
