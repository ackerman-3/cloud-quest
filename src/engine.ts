import type { Box, Ctx, Design, DesignSpec, PNode, Scenario } from './types'
import { svc } from './data/services'

/** 상자 id → 부모 상자 id */
export function parentMap(root: Box): Map<string, string | null> {
  const m = new Map<string, string | null>()
  const walk = (b: Box, p: string | null) => {
    m.set(b.id, p)
    b.children?.forEach((c) => walk(c, b.id))
  }
  walk(root, null)
  return m
}

export function findBox(root: Box, id: string): Box | null {
  if (root.id === id) return root
  for (const c of root.children ?? []) {
    const f = findBox(c, id)
    if (f) return f
  }
  return null
}

export function allNodes(spec: DesignSpec, d: Design): PNode[] {
  return [...spec.fixed.map((f) => ({ ...f, fixed: true })), ...d.nodes]
}

export function allEdges(spec: DesignSpec, d: Design) {
  return [...(spec.fixedEdges ?? []), ...d.edges]
}

export function makeCtx(spec: DesignSpec, d: Design): Ctx {
  const parents = parentMap(spec.layout)
  const nodes = allNodes(spec, d)
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const adj = new Map<string, Set<string>>()
  for (const n of nodes) adj.set(n.id, new Set())
  for (const [a, b] of allEdges(spec, d)) {
    adj.get(a)?.add(b)
    adj.get(b)?.add(a)
  }

  const inBox = (n: PNode, box: string) => {
    let z: string | null | undefined = n.zone
    while (z) {
      if (z === box) return true
      z = parents.get(z)
    }
    return false
  }

  const azOf = (n: PNode) => {
    let z: string | null | undefined = n.zone
    while (z) {
      const b = findBox(spec.layout, z)
      if (b?.kind === 'az' || b?.kind === 'region') return z
      z = parents.get(z)
    }
    return null
  }

  // 직접 연결 + Multi-AZ 대기 DB는 기본 DB의 엔드포인트를 공유하므로 기본 DB에 연결된 노드와도 연결된 것으로 본다
  const link = (a: PNode, b: PNode) => {
    if (adj.get(a.id)?.has(b.id)) return true
    const viaStandby = (x: PNode, standby: PNode) =>
      standby.service === 'rdsStandby' &&
      [...(adj.get(x.id) ?? [])].some((y) => byId.get(y)?.service === 'rds')
    // Aurora 클러스터: 같은 클러스터(연결된 Aurora 인스턴스)는 클러스터 엔드포인트를 공유
    const viaCluster = (x: PNode, y: PNode) =>
      y.service === 'aurora' &&
      [...(adj.get(x.id) ?? [])].some((z) => byId.get(z)?.service === 'aurora' && adj.get(z)?.has(y.id))
    return viaStandby(a, b) || viaStandby(b, a) || viaCluster(a, b) || viaCluster(b, a)
  }

  const matches = (n: PNode, key: string) => {
    const [what, box] = key.split('@')
    const ok = what.split('|').some((w) => n.id === w || n.service === w)
    return ok && (!box || inBox(n, box))
  }

  const dead = (n: PNode, fail: string[]) =>
    fail.some((f) => (f.startsWith('svc:') ? n.service === f.slice(4) : inBox(n, f)))

  const path = (chain: string[], fail: string[] = []) => {
    let frontier = nodes.filter((n) => matches(n, chain[0]) && !dead(n, fail))
    for (let i = 1; i < chain.length; i++) {
      const next = nodes.filter(
        (m) => matches(m, chain[i]) && !dead(m, fail) && frontier.some((f) => link(f, m)),
      )
      if (!next.length) return false
      frontier = next
    }
    return frontier.length > 0
  }

  const list = (service: string, box?: string) =>
    nodes.filter((n) => matches(n, service) && (!box || inBox(n, box)))

  return {
    path,
    has: (s, box) => list(s, box).length > 0,
    count: (s, box) => list(s, box).length,
    nodes: (s) => list(s),
    linked: (a, b) => list(a).some((x) => list(b).some((y) => link(x, y))),
    inBox,
    azOf,
  }
}

export function runScenarios(spec: DesignSpec, scenarios: Scenario[], d: Design) {
  const ctx = makeCtx(spec, d)
  return scenarios.map((s) => {
    try {
      return { id: s.id, ...s.check(ctx) }
    } catch {
      return { id: s.id, ok: false, msg: '구성을 해석하지 못했어요. 연결을 다시 확인해 주세요.' }
    }
  })
}

export function costIndex(d: Design) {
  return d.nodes.reduce((sum, n) => sum + svc(n.service).cost, 0)
}

/** 장애 시나리오에서 죽는 노드 판정 (시각화용) */
export function deadSet(spec: DesignSpec, d: Design, fail: string[] = []) {
  const parents = parentMap(spec.layout)
  const inBox = (n: PNode, box: string) => {
    let z: string | null | undefined = n.zone
    while (z) {
      if (z === box) return true
      z = parents.get(z)
    }
    return false
  }
  return new Set(
    allNodes(spec, d)
      .filter((n) => fail.some((f) => (f.startsWith('svc:') ? n.service === f.slice(4) : inBox(n, f))))
      .map((n) => n.id),
  )
}

/** 내 설계와 정답 구성을 비교해 빠진 것·더 있는 것을 사람이 읽을 수 있는 문장으로 돌려준다 */
export function diffWithAnswer(spec: DesignSpec, d: Design) {
  const parents = parentMap(spec.layout)
  const fixedIds = new Set(spec.fixed.map((f) => f.id))
  const place = (zone: string) => {
    const b = findBox(spec.layout, zone)
    let z = parents.get(zone)
    let az: string | null = null
    while (z) {
      const pb = findBox(spec.layout, z)
      if (pb?.kind === 'az') {
        az = pb.label
        break
      }
      z = parents.get(z)
    }
    return [az, b?.label].filter(Boolean).join(' › ')
  }
  const keyOf = (design: Design) => {
    const m = new Map<string, string>()
    for (const f of spec.fixed) m.set(f.id, f.id)
    for (const n of design.nodes) m.set(n.id, `${n.service}@${n.zone}`)
    return m
  }
  const nameOfKey = (k: string) => {
    if (fixedIds.has(k)) {
      const f = spec.fixed.find((x) => x.id === k)!
      return f.label ?? svc(f.service).name
    }
    const [s, z] = k.split('@')
    return `${svc(s).name} (${place(z)})`
  }
  const bag = (keys: string[]) => {
    const m = new Map<string, number>()
    keys.forEach((k) => m.set(k, (m.get(k) ?? 0) + 1))
    return m
  }
  const minus = (a: Map<string, number>, b: Map<string, number>) => {
    const out: string[] = []
    a.forEach((n, k) => {
      for (let i = 0; i < n - (b.get(k) ?? 0); i++) out.push(k)
    })
    return out
  }
  const ansKey = keyOf(spec.answer)
  const myKey = keyOf(d)
  const nodeBag = (design: Design, km: Map<string, string>) => bag(design.nodes.map((n) => km.get(n.id)!))
  const edgeBag = (design: Design, km: Map<string, string>) =>
    bag(
      design.edges
        .map(([a, b]) => [km.get(a), km.get(b)])
        .filter((e): e is [string, string] => !!e[0] && !!e[1])
        .map((e) => e.sort().join('\u0001')),
    )
  const an = nodeBag(spec.answer, ansKey)
  const mn = nodeBag(d, myKey)
  const ae = edgeBag(spec.answer, ansKey)
  const me = edgeBag(d, myKey)
  const edgeName = (k: string) => k.split('\u0001').map(nameOfKey).join(' ↔ ')
  return {
    missingNodes: minus(an, mn).map(nameOfKey),
    extraNodes: minus(mn, an).map(nameOfKey),
    missingEdges: minus(ae, me).map(edgeName),
    extraEdges: minus(me, ae).map(edgeName),
  }
}
