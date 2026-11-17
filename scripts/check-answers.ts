// 모든 프로젝트의 정답 구성이 시뮬레이션을 통과하는지, 빈 구성은 실패하는지 점검합니다.
import { PROJECTS } from '../src/data/projects'
import { runScenarios } from '../src/engine'
import { SERVICES } from '../src/data/services'
import { findBox } from '../src/engine'

let fail = 0
for (const p of PROJECTS) {
  const r = runScenarios(p.design, p.scenarios, p.design.answer)
  const bad = r.filter((x) => !x.ok)
  const empty = runScenarios(p.design, p.scenarios, { nodes: [], edges: [] }).filter((x) => x.ok).length
  // 배치 규칙(영역 범위·정원) 점검
  const placeErr: string[] = []
  for (const n of p.design.answer.nodes) {
    const b = findBox(p.design.layout, n.zone)
    if (!b?.zone) placeErr.push(`${n.id}: zone ${n.zone} 없음`)
    else if (b.zone.scope !== SERVICES[n.service].scope) placeErr.push(`${n.service} scope ${SERVICES[n.service].scope} ≠ ${b.zone.scope}`)
    const cnt = p.design.answer.nodes.filter((m) => m.zone === n.zone).length
    if (b?.zone && cnt > (b.zone.max ?? 3)) placeErr.push(`${n.zone} 정원 초과`)
  }
  for (const s of p.design.palette) if (!SERVICES[s]) placeErr.push(`팔레트 ${s} 없음`)
  for (const n of p.design.answer.nodes) if (!p.design.palette.includes(n.service)) placeErr.push(`팔레트에 ${n.service} 없음`)
  const ok = bad.length === 0 && placeErr.length === 0
  if (!ok) fail++
  console.log(`${ok ? 'OK ' : 'NG '} ${p.id}  정답 ${r.length - bad.length}/${r.length}  빈구성 통과 ${empty}/${r.length}`)
  bad.forEach((b) => console.log('    ✗', b.id, b.msg))
  placeErr.forEach((e) => console.log('    ✗', e))
}
process.exit(fail ? 1 : 0)
