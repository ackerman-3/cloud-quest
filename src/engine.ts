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
    return viaStandby(a, b) || viaStandby(b, a)
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
