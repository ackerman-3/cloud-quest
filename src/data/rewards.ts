// 보상(골드)·선물·호감도·특별 에피소드 데이터
import type { Line, SceneName } from '../types'

/** 화폐 단위 */
export const GOLD = 'G'

/** 프로젝트 완료 보상: 직급(난이도)별 기본 골드 */
export const LEVEL_GOLD: Record<1 | 2 | 3, number> = { 1: 100, 2: 200, 3: 300 }
/** 별 1개당 추가 골드(별 2개 → +20, 별 3개 → +40) */
export const STAR_BONUS = 20
/** 다른 날 다시 푼 "복습"은 기본 골드의 절반 */
export const REVIEW_RATE = 0.5
/** 하루 첫 접속 출석 보상 */
export const ATTEND_GOLD = 10

export interface GiftItem {
  id: string
  emoji: string
  name: string
  price: number
  /** 기본 호감도 */
  points: number
}

export const GIFTS: GiftItem[] = [
  { id: 'americano', emoji: '☕', name: '아이스 아메리카노', price: 50, points: 5 },
  { id: 'sports', emoji: '🥤', name: '스포츠음료', price: 70, points: 7 },
  { id: 'snack', emoji: '🍪', name: '편의점 간식 꾸러미', price: 80, points: 8 },
  { id: 'energy', emoji: '⚡', name: '에너지 드링크 한 박스', price: 120, points: 12 },
  { id: 'tangerine', emoji: '🍊', name: '제주 감귤 한 박스', price: 150, points: 15 },
  { id: 'dessert', emoji: '🍰', name: '카페 디저트 세트', price: 180, points: 18 },
  { id: 'plant', emoji: '🪴', name: '미니 다육이 화분', price: 200, points: 20 },
  { id: 'chicken', emoji: '🍗', name: '치킨 기프티콘', price: 250, points: 25 },
  { id: 'book', emoji: '📘', name: '클라우드 기술 서적', price: 300, points: 30 },
  { id: 'beans', emoji: '🫘', name: '스페셜티 원두', price: 450, points: 45 },
  { id: 'pen', emoji: '🖋️', name: '만년필', price: 700, points: 70 },
  { id: 'ticket', emoji: '🎫', name: '공연 티켓 두 장', price: 900, points: 90 },
]

/** 좋아하는 선물은 호감도 2배, 싫어하는 선물은 절반 */
export const LIKE_RATE = 2
export const DISLIKE_RATE = 0.5

/** 호감도 단계 */
export const BONDS = [
  { min: 0, name: '어색한 사이' },
  { min: 50, name: '편한 동료' },
  { min: 150, name: '믿는 동료' },
  { min: 300, name: '든든한 단짝' },
]

export interface Episode {
  id: string
  need: number // 열리는 호감도
  title: string
  scene: SceneName
  lines: Line[]
}

export interface Friend {
  id: string // characters.ts의 캐릭터 id
  hint: string // 취향 힌트
  likes: string[]
  dislikes: string[]
  greet: string[] // 호감도 단계별 인사(BONDS 순서)
  react: { like: string[]; normal: string[]; dislike: string[] }
  /** 선물별 전용 반응(있으면 우선) */
  special?: Record<string, string>
  episodes: Episode[]
}

export const FRIENDS: Friend[] = [
  {
    id: 'lead',
    hint: '회의 때마다 직접 내린 커피를 들고 와요. 커피엔 꼭 달달한 디저트를 곁들인대요.',
    likes: ['americano', 'beans', 'dessert'],
    dislikes: ['energy'],
    greet: [
      '무슨 일이에요? 프로젝트 질문이면 언제든 와요.',
      '왔어요? 오늘 진행은 어때요?',
      '마침 커피 내리던 참이에요. 한 잔 할래요?',
      '오늘도 같이 잘해 봅시다. 요즘 제일 든든한 사람이 누군지 알죠?',
    ],
    react: {
      like: ['…이거 어떻게 알았어요? 진짜 좋아하는 거예요. 고마워요.', '취향을 정확히 짚었네요. 고객 요구사항만 잘 파악하는 게 아니었군요.'],
      normal: ['고마워요. 잘 쓸게요.', '신경 써 줘서 고마워요. 덕분에 오후도 힘내겠네요.'],
      dislike: ['고마워요. 그런데 카페인은 커피로 충분해서요… 팀원들이랑 나눌게요.', '마음은 고마워요. 그런데 이건 니콜라스가 더 좋아하겠는데요.'],
    },
    special: {
      americano: '딱 한 잔 생각나던 참이었어요. 제 커피 취향까지 챙기다니, 고마워요.',
      beans: '향 좋다… 내일 아침에 이걸로 팀 전체 커피 내릴게요. 첫 잔은 당신 거예요.',
      dessert: '디저트까지요? 커피랑 먹으면 딱이겠네요. 오후 회의 전에 같이 먹어요. 커피는 제가 내릴게요.',
    },
    episodes: [
      {
        id: 'lead-1',
        need: 50,
        title: '밤 9시의 핸드드립',
        scene: 'lounge',
        lines: [
          { who: 'narr', text: '제안서 마감 전날 밤. 사무실에는 둘만 남았다.' },
          { who: 'lead', text: '아직 있었어요? 잠깐 쉬어요. 커피 내려 줄게요.' },
          { who: 'me', text: '팀장님은 매번 직접 내리시네요. 캡슐 커피가 더 편하지 않으세요?' },
          { who: 'lead', text: '편하죠. 그런데 물 온도, 뜸 들이는 시간, 붓는 속도를 하나씩 바꾸면 맛이 달라져요.' },
          { who: 'lead', text: '아키텍처도 비슷해요. 서비스 하나, 설정 하나 바꿨을 때 결과가 어떻게 달라지는지 직접 겪어 봐야 감이 생겨요.' },
          { who: 'me', text: '그래서 시뮬레이션을 몇 번씩 돌려 보라고 하셨던 거군요.' },
          { who: 'lead', text: '맞아요. 정답을 외우는 사람보다 왜 그게 정답인지 설명하는 사람이 고객을 설득해요.' },
          { who: 'lead', text: '자, 마셔 봐요. 오늘은 조금 진하게 내렸어요. 마감 전날이니까.' },
          { who: 'me', text: '…맛있어요. 쓴데 끝이 달아요.' },
          { who: 'lead', text: '좋은 원두는 그래요. 좋은 설계도 처음엔 비싸 보여도 나중에 덜 아프고요.' },
          { who: 'lead', text: '내일 발표, 당신이 앞부분 맡아 볼래요? 충분히 할 수 있어요.' },
          { who: 'narr', text: '케이 팀장이 처음으로 발표를 맡겼다. 커피가 유난히 따뜻했다.' },
        ],
      },
      {
        id: 'lead-2',
        need: 150,
        title: '새벽 3시의 장애',
        scene: 'office',
        lines: [
          { who: 'me', text: '팀장님, 처음 겪은 큰 장애 기억나세요?' },
          { who: 'lead', text: '잊을 수가 없죠. 신입 2년 차 때, 새벽 3시에 쇼핑몰 결제가 전부 멈췄어요.' },
          { who: 'lead', text: 'DB 서버 하나가 디스크가 꽉 차서 죽었는데, 그게 단일 장애점이었어요. 백업은 있었지만 복구 절차를 아무도 연습해 본 적이 없었고요.' },
          { who: 'me', text: '그래서 어떻게 하셨어요?' },
          { who: 'lead', text: '네 시간 걸려서 살렸어요. 아침에 고객사 대표 앞에서 고개를 못 들었죠.' },
          { who: 'lead', text: '그런데 그때 우리 팀장님이 이렇게 말했어요. "누가 실수했는지 말고, 구조가 왜 그걸 막지 못했는지 찾자."' },
          { who: 'me', text: '사람이 아니라 구조를 본다…' },
          { who: 'lead', text: '그날 이후로 저는 설계할 때마다 물어요. 이게 멈추면 무엇이 같이 멈추지? 그걸 몇 분 안에 되살릴 수 있지?' },
          { who: 'lead', text: 'Multi-AZ, 자동 백업, 복구 연습. 다 그 새벽에 배운 거예요.' },
          { who: 'me', text: '저도 시뮬레이션에서 장애 시나리오가 나오면 그 질문부터 해 볼게요.' },
          { who: 'lead', text: '좋아요. 그리고 진짜 장애가 나면, 혼자 끙끙대지 말고 바로 연락해요. 새벽이어도요.' },
          { who: 'lead', text: '팀장은 그러라고 있는 거예요.' },
        ],
      },
      {
        id: 'lead-3',
        need: 300,
        title: '팀장의 설계 노트',
        scene: 'meeting',
        lines: [
          { who: 'narr', text: '분기 회고가 끝난 회의실. 케이 팀장이 낡은 노트 한 권을 꺼냈다.' },
          { who: 'lead', text: '이거, 제가 신입 때부터 쓴 설계 노트예요. 프로젝트마다 구성도랑 실패한 이유를 적어 뒀어요.' },
          { who: 'me', text: '와… 페이지마다 화살표랑 메모가 빼곡하네요. 여기 "NAT 게이트웨이 AZ마다!!!"는요?' },
          { who: 'lead', text: '하나만 뒀다가 그 AZ가 멈추니까 다른 AZ 서버들도 업데이트를 못 받았던 날이에요. 느낌표 세 개는 그날의 분노예요.' },
          { who: 'me', text: '하하, 저도 그 문제 퀴즈에서 틀렸었어요.' },
          { who: 'lead', text: '그래서 주는 거예요. 이 노트, 이제 당신이 이어서 써 줬으면 해요.' },
          { who: 'me', text: '네? 이렇게 소중한 걸요?' },
          { who: 'lead', text: '다음 분기에 새 공공 프로젝트가 들어와요. PM은 당신으로 올렸어요.' },
          { who: 'lead', text: '처음 왔을 때 퍼블릭이랑 프라이빗 서브넷도 헷갈려 하던 사람이, 이제 장애 시나리오부터 묻잖아요.' },
          { who: 'lead', text: '그게 아키텍트예요. 전 옆에서 커피 내리고 있을게요.' },
          { who: 'me', text: '…노트 첫 장에 오늘 날짜부터 적을게요. 감사합니다, 팀장님.' },
          { who: 'narr', text: '노트 맨 뒷장에는 새 글씨가 한 줄 적혀 있었다. "다음 아키텍트에게. 구조를 믿고, 사람을 아껴요."' },
        ],
      },
    ],
  },
  {
    id: 'senior',
    hint: '말수는 적지만 늘 옆에서 챙겨 줘요. 책과 다육이, 귤을 좋아하고 같이 공부하는 시간을 아껴요.',
    likes: ['plant', 'book', 'tangerine'],
    dislikes: ['energy'],
    greet: [
      '아, 왔어요? 천천히 말해 줘요. 같이 보면 금방 풀릴 거예요.',
      '어제 그 구성도 다시 봤어요. 많이 늘었더라고요.',
      '오늘 하나 같이 공부해 볼래요? 저도 아직 헷갈리는 부분이 있어서요.',
      '…요즘은 당신이랑 같이 일하는 시간이 제일 좋아요. 우리 둘 다 많이 컸죠.',
    ],
    react: {
      like: ['…고마워요. 이런 거 받으면 저도 더 잘하고 싶어져요.', '기억해 줬네요. 조용히, 오래 아끼면서 쓸게요.'],
      normal: ['고마워요. 마음 써 줘서요.', '이런 거 안 줘도 괜찮은데… 그래도 기분 좋네요. 고마워요.'],
      dislike: ['고마워요. 그런데 카페인이 많으면 밤에 잠을 잘 못 자서요… 마음만 감사히 받을게요.', '고마워요. 이건 니콜라스가 보면 엄청 좋아하겠다. 같이 나눠 줘도 될까요?'],
    },
    special: {
      plant: '다육이네요. 천천히 자라는 게 꼭 우리 같아요. 창가에 두고, 같이 크는 거 지켜볼게요.',
      book: '이 책, 읽고 싶었어요. 다 읽으면 빌려줄게요. 그다음에 같이 이야기해요.',
      tangerine: '귤… 고마워요. 겨울엔 이게 제일 좋아요. 하나 까 줄게요, 같이 먹어요.',
    },
    episodes: [
      {
        id: 'senior-1',
        need: 50,
        title: '점심 산책과 알림 소음',
        scene: 'lounge',
        lines: [
          { who: 'narr', text: '점심 시간. 변의주 선배가 산책을 가자고 했다.' },
          { who: 'senior', text: '전 점심엔 꼭 걸어요. 오전 내내 모니터링 알림을 보다 보면 머리가 시끄러워서요.' },
          { who: 'me', text: '알림이 그렇게 많이 와요?' },
          { who: 'senior', text: '예전엔 하루 수백 개였어요. CPU 70% 넘으면 알림, 디스크 80%면 알림… 결국 다들 안 보게 됐죠.' },
          { who: 'senior', text: '그러다 진짜 중요한 알림을 놓쳤어요. 그 뒤로 알림을 정리했어요. 사용자가 실제로 불편한 순간만 울리게요.' },
          { who: 'me', text: '알림이 많다고 안전한 게 아니네요.' },
          { who: 'senior', text: '맞아요. 화분도 그래요. 물을 자주 준다고 잘 자라는 게 아니더라고요. 다육이는 오히려 내버려 둬야 잘 커요.' },
          { who: 'me', text: '선배는 뭐든 아키텍처로 연결하시네요.' },
          { who: 'senior', text: '직업병이죠. …아, 이건 비밀인데 다육이 이름도 다 서비스 이름이에요. "람다", "S3", 제일 큰 애는 "오로라".' },
          { who: 'me', text: '하하, 다음에 사무실 가면 인사할게요.' },
          { who: 'senior', text: '오로라는 낯을 가려요. 천천히 친해져요.' },
        ],
      },
      {
        id: 'senior-2',
        need: 150,
        title: '선배의 오답 노트',
        scene: 'office',
        lines: [
          { who: 'me', text: '선배, AWS 자격증 시험 준비하는데 자꾸 비슷한 문제를 틀려요.' },
          { who: 'senior', text: '어떤 거요? 혹시 "가장 비용 효율적인" 이런 문제?' },
          { who: 'me', text: '네! 다 맞는 말 같은데 답이 하나래요.' },
          { who: 'senior', text: '…잠깐만요. 이거 보여 줄게요. 제 오답 노트예요.' },
          { who: 'narr', text: '빛바랜 노트에 틀린 문제와 이유가 빼곡히 적혀 있었다.' },
          { who: 'senior', text: '사실 전 솔루션스 아키텍트 시험에 한 번 떨어졌어요. 다들 제가 한 번에 붙은 줄 알지만요.' },
          { who: 'me', text: '선배가요? 의외예요.' },
          { who: 'senior', text: '그때 깨달았어요. 문제는 기술보다 "조건"을 묻는 거예요. 비용, 운영 부담, 가용성 중 무엇을 제일 중요하게 보는지요.' },
          { who: 'senior', text: '그래서 문제를 읽을 때 조건에 밑줄부터 그어요. "최소한의 운영 노력", "가장 저렴하게" 같은 말이요.' },
          { who: 'me', text: '고객 요구사항을 읽는 거랑 똑같네요.' },
          { who: 'senior', text: '바로 그거예요. 이 노트 빌려줄게요. 대신 붙으면 합격 축하 커피는 당신이 사요.' },
          { who: 'me', text: '약속할게요. 제일 비싼 걸로요.' },
        ],
      },
      {
        id: 'senior-3',
        need: 300,
        title: '화이트보드 앞에서',
        scene: 'meeting',
        lines: [
          { who: 'narr', text: '고객 발표 전날 밤. 둘은 회의실 화이트보드에 구성도를 다시 그리고 있었다.' },
          { who: 'senior', text: '여기 SQS를 넣을지 말지, 아까부터 계속 고민이에요.' },
          { who: 'me', text: '주문이 몰릴 때 워커가 못 따라가면 요청이 사라지잖아요. 큐로 받아 두면 고객 입장에선 아무 일도 없었던 것처럼 보일 거예요.' },
          { who: 'senior', text: '…맞아요. 그 한 문장이면 고객이 바로 이해하겠네요.' },
          { who: 'senior', text: '있잖아요. 처음 왔을 때 당신은 서비스 이름을 외우느라 바빴어요.' },
          { who: 'senior', text: '지금은 왜 필요한지부터 말해요. 그게 제일 어려운 건데.' },
          { who: 'me', text: '선배가 매번 "왜요?"라고 물어봐 주셔서 그래요.' },
          { who: 'senior', text: '그 질문, 이제 당신이 신입한테 해 줄 차례예요.' },
          { who: 'senior', text: '그리고 내일 발표는 같이 해요. 제가 배경 설명하고, 설계는 당신이 설명하는 걸로.' },
          { who: 'me', text: '제가요? 떨리는데…' },
          { who: 'senior', text: '떨리면 화이트보드를 봐요. 우리가 같이 그린 거니까.' },
          { who: 'narr', text: '다음 날, 고객은 첫 질문으로 "이 구성은 누가 설계했나요?"라고 물었다. 선배가 웃으며 당신을 가리켰다.' },
        ],
      },
    ],
  },
  {
    id: 'peer',
    hint: '먹는 거라면 뭐든 좋아하고 점심시간엔 헬스장으로 뛰어가요. 쓴 커피는 질색이래요.',
    likes: ['snack', 'sports', 'chicken'],
    dislikes: ['americano'],
    greet: [
      '어, 동기! 뭐 필요한 거 있어?',
      '왔어? 나 방금 퀴즈 하나 맞혔다. 칭찬해 줘.',
      '야, 오늘 점심 뭐 먹을래? 네가 골라.',
      '내 최애 동기 왔다! 오늘도 같이 달리자.',
    ],
    react: {
      like: ['헐, 대박! 이거 완전 내 취향이잖아. 너 나 너무 잘 알아.', '진짜? 이걸 나한테? 오늘 운동 두 배로 한다!'],
      normal: ['오, 고마워! 잘 먹을게. 아니, 잘 쓸게!', '와, 나 이런 거 받아도 돼? 고맙다 동기야.'],
      dislike: ['아… 고마워. 근데 나 쓴 커피 못 마시는 거 알지? 시럽 세 번 넣어서 마실게!', '하하, 마음은 너무 고마운데 아메리카노는 팀장님 취향 아니야?'],
    },
    special: {
      snack: '간식 꾸러미다! 오후 3시 당 충전 완료. 너 먼저 하나 골라.',
      sports: '운동 끝나고 이거 하나면 완벽하지. 내일 아침 러닝 같이 갈래? 내가 페이스 맞춰 줄게!',
      chicken: '치킨?! 오늘 저녁은 이거다. 혼자는 못 먹어, 같이 가자. 운동은… 내일 두 배로!',
    },
    episodes: [
      {
        id: 'peer-1',
        need: 50,
        title: '핑크 머리의 비밀',
        scene: 'lounge',
        lines: [
          { who: 'me', text: '니콜라스, 처음부터 궁금했는데 머리는 왜 핑크야?' },
          { who: 'peer', text: '아 이거? 내기 졌어.' },
          { who: 'me', text: '내기?' },
          { who: 'peer', text: '입사 전에 친구랑, 첫 클라우드 자격증 한 번에 붙으면 걔가 염색하고, 떨어지면 내가 하기로 했거든.' },
          { who: 'me', text: '…그럼 떨어진 거야?' },
          { who: 'peer', text: '아니, 붙었어! 근데 걔도 붙었어. 둘 다 붙으면 어떻게 할지 안 정해 놨더라고.' },
          { who: 'peer', text: '그래서 둘 다 했어. 걔는 파란색. 우리끼리 "멀티 AZ 머리"라고 불러.' },
          { who: 'me', text: '하하, 이중화된 우정이네.' },
          { who: 'peer', text: '오, 그 말 좋다. 다음 시험은 너랑 내기할까? 지는 사람이 초록 머리.' },
          { who: 'me', text: '초록은 S3 아이콘 색인데.' },
          { who: 'peer', text: '완벽하네. 그럼 이긴 사람이 진 사람 머리에 버킷 이름 붙여 주기!' },
        ],
      },
      {
        id: 'peer-2',
        need: 150,
        title: '동기의 고민',
        scene: 'lounge',
        lines: [
          { who: 'narr', text: '퇴근 시간이 한참 지난 라운지. 니콜라스가 혼자 앉아 있었다.' },
          { who: 'me', text: '아직 안 갔어? 무슨 일 있어?' },
          { who: 'peer', text: '…아니, 그냥. 오늘 팀장님이 네 설계 칭찬하는 거 들었거든.' },
          { who: 'peer', text: '축하하는 마음은 진짜야. 근데 나는 아직 시뮬레이션에서 장애 시나리오 하나씩 꼭 틀려. 나만 제자리인 것 같아서.' },
          { who: 'me', text: '나도 처음엔 매일 틀렸어. NAT 게이트웨이 문제는 세 번 연속 틀렸고.' },
          { who: 'peer', text: '진짜? 너는 원래 잘하는 줄 알았는데.' },
          { who: 'me', text: '그리고 너는 고객이랑 얘기할 때 분위기를 진짜 잘 풀잖아. 지난번 출판사 미팅도 네 덕분에 바로 친해졌고.' },
          { who: 'peer', text: '…그건 그렇지. 나 말빨은 좀 되지.' },
          { who: 'me', text: '그럼 이렇게 하자. 매주 수요일에 같이 장애 시나리오 하나씩 풀고, 너는 나한테 고객 응대 비법 알려 줘.' },
          { who: 'peer', text: '스터디? 좋아. 이름은 "수요일의 장애 조치".' },
          { who: 'peer', text: '고마워, 동기야. 너 없었으면 오늘 혼자 에너지 드링크 세 캔 마셨을 거야.' },
          { who: 'me', text: '두 캔만 마셔. 나머지 하나는 내가 마실게.' },
        ],
      },
      {
        id: 'peer-3',
        need: 300,
        title: '둘만의 해커톤',
        scene: 'office',
        lines: [
          { who: 'narr', text: '주말 오전, 텅 빈 사무실. 니콜라스가 노트북 두 대를 펼쳐 놓았다.' },
          { who: 'peer', text: '왔다! 오늘 우리끼리 해커톤 하자. 주제는… 신입들이 클라우드를 게임처럼 배울 수 있는 앱!' },
          { who: 'me', text: '게임? 어떤 식으로?' },
          { who: 'peer', text: '고객 프로젝트를 받아서 구성도를 그리고, 장애 시뮬레이션을 돌리는 거야. 통과하면 골드도 주고!' },
          { who: 'me', text: '…어디서 많이 본 것 같은데.' },
          { who: 'peer', text: '그리고 모은 골드로 동료한테 선물도 하는 거지. 커피라든가, 에너지 드링크라든가.' },
          { who: 'me', text: '에너지 드링크는 너만 좋아하잖아.' },
          { who: 'peer', text: '그러니까 넣어야지! 개발자 특권이야.' },
          { who: 'narr', text: '둘은 하루 종일 화면 설계를 하고, 정적 파일을 S3에 올리고, CloudFront를 붙였다.' },
          { who: 'peer', text: '배포 완료! 봐, 휴대폰에서도 열린다. 우리가 만든 거야.' },
          { who: 'me', text: '처음 만났을 때 "VPC가 뭐야?" 하던 동기 맞아?' },
          { who: 'peer', text: '너도 그때 "IGW가 무슨 약자야?" 했거든. 우리 진짜 많이 컸다.' },
          { who: 'peer', text: '앞으로도 계속 같이 하자. 팀장 돼도, 선배 돼도. 동기는 영원한 이중화니까.' },
        ],
      },
    ],
  },
]

export const friend = (id: string) => FRIENDS.find((f) => f.id === id)!

export function bondOf(points: number) {
  let idx = 0
  BONDS.forEach((b, i) => {
    if (points >= b.min) idx = i
  })
  return { idx, ...BONDS[idx], next: BONDS[idx + 1]?.min ?? null }
}

export function giftPoints(f: Friend, item: GiftItem) {
  if (f.likes.includes(item.id)) return Math.round(item.points * LIKE_RATE)
  if (f.dislikes.includes(item.id)) return Math.max(1, Math.round(item.points * DISLIKE_RATE))
  return item.points
}
