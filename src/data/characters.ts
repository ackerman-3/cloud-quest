import type { Look } from '../pixel'

export interface CharCfg extends Look {
  name: string
  role: string
}

const S = { a: '#f7d7bd', b: '#efc19d', c: '#d6a07a', d: '#b07a55' }

export const CHARS: Record<string, CharCfg> = {
  lead: { name: '케이', role: '클라우드사업팀 팀장', skin: '#f8e0d0', hair: '#2a2326', hairStyle: 'shag', eye: '#55505a', top: '#b9d8f2', bottom: '#30343f', shoes: '#1d1d22', sharp: true, small: true, shirt: true },
  senior: { name: '변의주', role: '클라우드 아키텍트(선배)', skin: S.b, hair: '#5b3a28', hairStyle: 'side', eye: '#24232a', top: '#cfe0f2', jacket: '#7d8794', bottom: '#3c4352', shoes: '#4a3428', sharp: true, small: true },
  peer: { name: '니콜라스', role: '입사 동기', skin: '#fbe5d8', hair: '#f0a3bd', hairStyle: 'shag', eye: '#5b4e52', top: '#ececee', jacket: '#1f2026', bottom: '#26272d', shoes: '#18181c', earring: true, chain: true, print: true, sharp: true, small: true },
  flower: { name: '김봄', role: '플로라 꽃방 대표', skin: S.a, hair: '#b0552e', hairStyle: 'long', eye: '#7a5b3a', top: '#f6eedf', jacket: '#7aa56d', bottom: '#5b5e66', shoes: '#6a4a35', blush: true },
  publisher: { name: '오세훈', role: '한빛나래출판 마케팅팀장', skin: S.b, hair: '#9a9ca2', hairStyle: 'side', eye: '#4c5566', top: '#f2efe6', jacket: '#7b5a3e', tie: '#a63c3c', bottom: '#3f3a35', shoes: '#2d2522', glasses: '#6b4a2a' },
  fashion: { name: '윤다은', role: '무드웨어 CTO', skin: S.a, hair: '#1f1d26', hairStyle: 'short-f', eye: '#3e3a4a', top: '#2c2c35', jacket: '#d9d4cc', bottom: '#2c2c35', shoes: '#f0f0f0', earring: true },
  settle: { name: '정민호', role: '대성물산 전산팀 과장', skin: S.c, hair: '#222222', hairStyle: 'buzz', eye: '#3b3b3b', top: '#eef2f6', tie: '#2f4f7f', bottom: '#2f3748', shoes: '#1c1c1c', badge: '#c43b3b' },
  ticket: { name: '서유나', role: '스테이지원 개발팀장', skin: S.a, hair: '#9a6a46', hairStyle: 'bob', eye: '#3d2f2a', top: '#f7f7f9', jacket: '#2a3142', bottom: '#2a3142', skirt: true, legs: '#e9cbb7', shoes: '#141418', earring: true, lips: '#c4687a', badge: '#2a3142' },
  city: { name: '최정우', role: '해솔시청 정보화담당관실 주무관', skin: S.b, hair: '#24232b', hairStyle: 'twoblock', eye: '#3d4652', top: '#ffffff', jacket: '#3f5470', tie: '#26364f', bottom: '#2c3440', shoes: '#1d1d1d', badge: '#2a7d4f', sharp: true },
  survey: { name: '배지후', role: '폼잇 공동창업자', skin: S.a, hair: '#e3b862', hairStyle: 'swept', eye: '#4f87b8', top: '#f2f2f2', jacket: '#2f6e5f', hoodie: true, bottom: '#5b6470', shoes: '#e4e4e4', sharp: true },
  design: { name: '한소율', role: '스튜디오 오르 실장', skin: S.a, hair: '#3a2a22', hairStyle: 'perm', eye: '#5c4636', top: '#d9c4a6', bottom: '#3b3b3b', skirt: true, legs: '#2b2b2f', shoes: '#2b2b2b', earring: true },
  commerce: { name: '임태준', role: '바로마켓 플랫폼실장', skin: S.d, hair: '#1b1b1b', hairStyle: 'curly', eye: '#3a2a20', top: '#dfe9f3', jacket: '#2e3c54', bottom: '#2e3c54', shoes: '#151515', beard: true },
  bank: { name: '노은서', role: '새빛저축은행 정보보호팀장', skin: S.a, hair: '#26242e', hairStyle: 'long', eye: '#3f4656', top: '#f7f7f7', jacket: '#34343e', bottom: '#34343e', skirt: true, legs: '#3a3a44', shoes: '#191919' },
  edu: { name: '문재현', role: '런업에듀 인프라 리드', skin: S.b, hair: '#3a2620', hairStyle: 'swept', eye: '#5a3e2e', top: '#f4f1ea', jacket: '#b8643a', bottom: '#2f3540', shoes: '#3c2b20', sharp: true },
}

export const ME = { name: '나', role: '신입 컨설턴트' }
