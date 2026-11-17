// 캐릭터 미리보기용: npx tsx scripts/looks-demo.ts > looks.json
import { drawLook } from '../src/pixel'
import { CHARS } from '../src/data/characters'
const out = Object.fromEntries(Object.entries(CHARS).map(([k, c]) => [k, { name: `${c.name} · ${c.role}`, grid: drawLook(c) }]))
console.log(JSON.stringify(out))
