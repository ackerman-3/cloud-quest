// 선물 메뉴 관리자 비밀번호를 바꿀 때: npx tsx scripts/pin-hash.ts 1234
// 출력된 두 값을 src/components/PinLock.tsx의 ADMIN_SHA256, ADMIN_FNV에 넣는다.
import { createHash } from 'node:crypto'
const pin = process.argv[2] ?? ''
if (!/^\d{4}$/.test(pin)) {
  console.log('4자리 숫자를 넣어 주세요. 예: npx tsx scripts/pin-hash.ts 1234')
  process.exit(1)
}
const text = 'cloud-quest:gift:' + pin
let h = 2166136261
for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
console.log('ADMIN_SHA256 =', createHash('sha256').update(text).digest('hex'))
console.log('ADMIN_FNV    =', (h >>> 0).toString(16))
