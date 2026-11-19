// 추가 프로젝트 10개 (쉬움 3, 보통 4, 어려움 3)
import type { Box, Project, Result, Scope } from '../types'

const B = (id: string, kind: Box['kind'], label: string, children: Box[] = [], dir: 'row' | 'col' = 'col'): Box => ({ id, kind, label, children, dir })
const Z = (id: string, kind: Box['kind'], label: string, scope: Scope, max = 3): Box => ({ id, kind, label, zone: { scope, max } })
const ok = (msg: string): Result => ({ ok: true, msg })
const bad = (msg: string): Result => ({ ok: false, msg })
const USERS = { id: 'users', service: 'users', zone: 'out', label: '사용자' }
const IGW = { id: 'igw', service: 'igw', zone: 'vpcEdge', label: '인터넷 게이트웨이' }

/** 2개 AZ, 퍼블릭(ALB) + 앱 + DB 서브넷 */
const vpc2az = (extra: Box[] = [], db = true): Box =>
  B('vpc', 'vpc', 'VPC', [
    B('vpcEdge', 'gate', 'VPC 경계'),
    Z('albZone', 'public', '퍼블릭 서브넷 A·B', 'subnet', 2),
    B(
      'azRow',
      'plain',
      '',
      [
        B('azA', 'az', '가용 영역 A', [Z('appA', 'private', '앱 서브넷', 'subnet', 2), ...(db ? [Z('dbA', 'private', 'DB 서브넷', 'subnet', 2)] : [])]),
        B('azB', 'az', '가용 영역 B', [Z('appB', 'private', '앱 서브넷', 'subnet', 2), ...(db ? [Z('dbB', 'private', 'DB 서브넷', 'subnet', 2)] : [])]),
      ],
      'row',
    ),
    ...extra,
  ])

// ── 쉬움 ─────────────────────────────────────────────

const e1: Project = {
  id: 'cafe-domain',
  level: 1,
  title: '카페 홈페이지 도메인·HTTPS',
  client: 'cafe',
  org: '카페 하린',
  summary: '내 도메인으로 접속하고 브라우저 경고 없이 HTTPS로\nRoute 53, CloudFront, ACM',
  topics: ['Route 53', 'ACM', 'CloudFront', 'HTTPS'],
  env: 'AWS',
  steps: [
    {
      t: 'talk',
      scene: 'office',
      lines: [
        { who: 'lead', text: '카페 하린 사장님이 홈페이지를 S3에 올려 두셨는데, 주소가 너무 길고 "주의 요함" 경고가 뜬대요.' },
        { who: 'peer', text: '도메인 연결이랑 HTTPS 문제네요. 제가 같이 갈게요!' },
      ],
    },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'cafe', text: 'harincafe.com 도메인을 샀어요. 손님들이 그 주소로 들어왔으면 좋겠어요.' },
        { who: 'cafe', text: '메뉴판 사진이 많아서 느리다는 말도 들었어요. 그리고 그 빨간 경고는 꼭 없애 주세요.' },
        { who: 'me', text: 'DNS, 인증서, 콘텐츠 전송을 각각 맞는 서비스로 연결하겠습니다.' },
      ],
    },
    {
      t: 'quiz',
      scene: 'lounge',
      quiz: {
        who: 'peer',
        prompt: 'CloudFront에 내 도메인용 HTTPS 인증서를 붙이려고 해요. ACM 인증서는 어느 리전에서 발급해야 할까요?',
        options: [
          { id: 'a', text: '서울 리전(ap-northeast-2)', why: '서울에서 발급한 인증서는 서울 리전의 ALB 같은 리소스에 쓰여요. CloudFront에는 선택할 수 없어요.' },
          { id: 'b', text: '버지니아 북부 리전(us-east-1)', why: '' },
          { id: 'c', text: '아무 리전이나 상관없다', why: 'CloudFront는 글로벌 서비스라 인증서 리전이 정해져 있어요.' },
          { id: 'd', text: '인증서는 S3 버킷에 업로드한다', why: 'S3는 인증서를 붙이는 곳이 아니에요.' },
        ],
        answer: 'b',
        explain: 'CloudFront에 연결하는 ACM 인증서는 반드시 us-east-1(버지니아 북부)에서 요청하거나 가져와야 해요. ACM 공인 인증서는 무료이고 자동 갱신돼요.',
        hint: 'CloudFront는 특정 리전이 아니라 전 세계 서비스예요. 그래서 AWS가 정해 둔 한 리전이 있어요.',
      },
    },
    { t: 'design' },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'cafe', text: '주소창에 자물쇠가 떴어요! 손님들이 주소 외우기도 쉽대요.' },
        { who: 'lead', text: 'DNS·인증서·CDN의 역할을 고객에게 잘 나눠 설명했어요.' },
      ],
    },
  ],
  design: {
    brief: ['harincafe.com 주소로 접속', '브라우저 경고 없는 HTTPS', '사진이 많은 페이지를 빠르게', 'S3 버킷은 직접 공개하지 않기'],
    layout: B('root', 'plain', '', [
      B('out', 'outside', '인터넷'),
      B('cloud', 'cloud', 'AWS 클라우드', [
        Z('global', 'edge', '글로벌 · DNS', 'global', 1),
        Z('edge', 'edge', '엣지 로케이션 (인증서는 us-east-1)', 'edge', 2),
        B('region', 'region', '리전 · 서울', [Z('svc', 'plain', '리전 서비스', 'region', 2)]),
      ]),
    ]),
    fixed: [{ ...USERS, label: '손님' }],
    palette: ['route53', 'cloudfront', 'acm', 's3', 'ec2', 'waf'],
    answer: {
      nodes: [
        { id: 'a1', service: 'route53', zone: 'global' },
        { id: 'a2', service: 'cloudfront', zone: 'edge' },
        { id: 'a3', service: 'acm', zone: 'edge' },
        { id: 'a4', service: 's3', zone: 'svc' },
      ],
      edges: [
        ['users', 'a1'],
        ['a1', 'a2'],
        ['a3', 'a2'],
        ['a2', 'a4'],
      ],
    },
    answerNote: [
      '손님 → Route 53(별칭 레코드) → CloudFront → S3. ACM–CloudFront 선은 인증서 연결을 뜻해요.',
      'S3는 퍼블릭 액세스를 막고 CloudFront OAC로만 읽게 합니다.',
      'WAF는 공격 차단용이라 이번 요구사항에는 필수가 아니에요.',
    ],
  },
  scenarios: [
    {
      id: 'dns',
      icon: '🔤',
      title: 'harincafe.com 입력',
      desc: '손님이 도메인 주소로 접속합니다.',
      check: (c) =>
        c.path(['users', 'route53', 'cloudfront', 's3'])
          ? ok('Route 53이 CloudFront 주소를 알려 주고 페이지가 열렸어요.')
          : c.has('route53')
            ? bad('Route 53 → CloudFront → S3로 이어지는 경로를 확인해 주세요.')
            : bad('도메인 이름을 AWS 주소로 바꿔 줄 DNS 서비스가 없어요.'),
    },
    {
      id: 'https',
      icon: '🔒',
      title: '브라우저 보안 경고 확인',
      desc: '자물쇠 표시가 뜨는지 봅니다.',
      check: (c) =>
        c.linked('acm', 'cloudfront') ? ok('ACM 인증서로 HTTPS가 적용됐어요.') : bad('인증서가 CloudFront에 연결되지 않아 경고가 떠요.'),
    },
    {
      id: 'speed',
      icon: '🖼️',
      title: '메뉴판 사진 로딩',
      desc: '사진이 많은 페이지를 엽니다.',
      check: (c) => (c.has('ec2') ? bad('EC2는 필요 없어요. 정적 파일은 S3와 CloudFront로 충분해요.') : c.has('cloudfront', 'edge') ? ok('엣지 캐시 덕분에 빨랐어요.') : bad('CDN이 없어 느려요.')),
    },
    {
      id: 'direct',
      icon: '🚪',
      title: '버킷 직접 접근',
      desc: '버킷 주소로 바로 접근을 시도합니다.',
      check: (c) => (c.linked('users', 's3') ? bad('손님이 S3에 직접 연결돼 있어요.') : ok('버킷은 CloudFront만 읽을 수 있어요.')),
    },
  ],
}

const e2: Project = {
  id: 'photo-thumbnail',
  level: 1,
  title: '사진 업로드 썸네일 자동 생성',
  client: 'photo',
  org: '스냅로그',
  summary: '업로드 이벤트로 Lambda를 실행해 썸네일 만들기\n이벤트 기반 서버리스',
  topics: ['S3 이벤트 알림', 'Lambda', '이벤트 기반'],
  env: 'AWS',
  steps: [
    {
      t: 'talk',
      scene: 'office',
      lines: [
        { who: 'lead', text: '사진 공유 앱 스냅로그가 썸네일 서버 때문에 고생 중이래요. 1분마다 새 파일을 확인하는 서버를 돌린대요.' },
        { who: 'senior', text: '폴링 방식이네요. 업로드되는 순간 반응하게 바꾸면 서버가 필요 없어요.' },
      ],
    },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'photo', text: '사용자가 원본을 S3에 올리면 작은 썸네일이 자동으로 생겼으면 해요.' },
        { who: 'photo', text: '한밤엔 업로드가 거의 없고, 축제 시즌엔 폭발해요. 서버는 더 관리하기 싫어요.' },
      ],
    },
    {
      t: 'quiz',
      scene: 'office',
      quiz: {
        who: 'senior',
        prompt: '썸네일을 원본과 같은 버킷·같은 경로에 저장하도록 Lambda를 만들면 어떤 문제가 생길까요?',
        options: [
          { id: 'a', text: '썸네일 저장이 다시 업로드 이벤트를 만들어 Lambda가 계속 호출될 수 있다', why: '' },
          { id: 'b', text: 'S3는 같은 버킷에 두 파일을 저장할 수 없다', why: '한 버킷에 객체를 얼마든지 저장할 수 있어요.' },
          { id: 'c', text: 'Lambda는 S3에 파일을 쓸 수 없다', why: 'IAM 권한만 있으면 Lambda도 S3에 쓸 수 있어요.' },
          { id: 'd', text: '아무 문제 없다', why: '저장 자체가 새 이벤트라서 반복 호출 위험이 있어요.' },
        ],
        answer: 'a',
        explain: '출력이 같은 트리거 조건에 다시 걸리면 재귀 호출이 생겨 비용이 크게 늘 수 있어요. 결과는 다른 버킷에 쓰거나, 이벤트 필터(접두사·접미사)로 원본 경로만 트리거되게 합니다.',
        hint: '썸네일을 저장하는 것도 "업로드"예요.',
      },
    },
    { t: 'design' },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'photo', text: '폴링 서버를 껐어요. 이제 올리자마자 썸네일이 생기고, 새벽엔 비용이 거의 0이에요.' },
        { who: 'lead', text: '"이벤트가 오면 실행"이라는 서버리스의 기본을 잘 보여 줬어요.' },
      ],
    },
  ],
  design: {
    brief: ['원본 업로드 즉시 썸네일 생성', '서버 관리 없음', '업로드가 없을 땐 비용 거의 없음', '재귀 호출 위험 없게'],
    layout: B('root', 'plain', '', [
      B('out', 'outside', '인터넷 (앱 사용자)'),
      B('cloud', 'cloud', 'AWS 클라우드', [
        B('region', 'region', '리전 · 서울', [Z('svc', 'plain', '리전 서비스', 'region', 4), B('vpc', 'vpc', 'VPC', [Z('sub', 'public', '퍼블릭 서브넷', 'subnet', 2)])]),
      ]),
    ]),
    fixed: [{ ...USERS, label: '앱 사용자' }],
    palette: ['s3', 'lambda', 'ec2', 'sqs', 'rds'],
    answer: {
      nodes: [
        { id: 'a1', service: 's3', zone: 'svc', label: 'S3 (원본)' },
        { id: 'a2', service: 'lambda', zone: 'svc' },
        { id: 'a3', service: 's3', zone: 'svc', label: 'S3 (썸네일)' },
      ],
      edges: [
        ['users', 'a1'],
        ['a1', 'a2'],
        ['a2', 'a3'],
      ],
    },
    answerNote: [
      '원본 버킷의 이벤트 알림이 Lambda를 호출하고, Lambda는 썸네일을 별도 버킷에 저장해요.',
      '앱은 보통 미리 서명된 URL(presigned URL)로 S3에 직접 업로드합니다.',
    ],
  },
  scenarios: [
    {
      id: 'upload',
      icon: '📸',
      title: '사진 업로드',
      desc: '사용자가 원본 사진을 올립니다.',
      check: (c) => {
        if (c.path(['users', 's3', 'lambda', 's3'])) {
          const srcs = c.nodes('s3').filter((n) => c.linked('users', n.id))
          const outs = c.nodes('s3').filter((n) => c.linked('lambda', n.id) && !srcs.some((x) => x.id === n.id))
          return outs.length ? ok('업로드 이벤트로 Lambda가 실행돼 썸네일이 생겼어요.') : bad('썸네일을 원본과 같은 버킷에 저장해 재귀 호출 위험이 있어요. 별도 S3 버킷을 두세요.')
        }
        if (c.has('ec2')) return bad('EC2로 확인하는 건 지금의 폴링 구조와 같아요.')
        return bad('사용자 → S3 → Lambda → S3(썸네일) 경로를 만들어 주세요.')
      },
    },
    {
      id: 'night',
      icon: '🌙',
      title: '새벽, 업로드 0건',
      desc: '아무도 사진을 올리지 않습니다.',
      load: 0,
      check: (c) => (c.has('ec2') || c.has('rds') ? bad('켜져 있는 동안 계속 과금되는 서버형 리소스가 있어요.') : ok('실행이 없으니 컴퓨팅 비용도 없어요.')),
    },
    {
      id: 'festival',
      icon: '🎆',
      title: '축제 시즌 폭주',
      desc: '분당 수천 장이 올라옵니다.',
      load: 10,
      check: (c) => (c.path(['s3', 'lambda']) ? ok('업로드마다 Lambda가 병렬로 실행돼 따라갔어요.') : bad('업로드에 반응하는 처리 경로가 없어요.')),
    },
  ],
}

const e3: Project = {
  id: 'gym-session',
  level: 1,
  title: '서버 접속 포트 닫기',
  client: 'gym',
  org: '핏앤런',
  summary: 'SSH 포트를 인터넷에 열지 않고 서버 관리하기\nSystems Manager Session Manager',
  topics: ['Session Manager', '보안 그룹', '프라이빗 서브넷'],
  env: 'AWS',
  steps: [
    {
      t: 'talk',
      scene: 'office',
      lines: [
        { who: 'lead', text: '피트니스 체인 핏앤런이 보안 점검에서 "SSH 22번 포트 전체 개방"을 지적받았대요.' },
        { who: 'senior', text: '관리자가 집에서도 접속하려고 0.0.0.0/0으로 열어 둔 거죠. 흔한 실수예요.' },
      ],
    },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'gym', text: '운영 담당이 가끔 서버에 들어가 로그를 봐야 해요. 접속 기록도 남겨야 하고요.' },
        { who: 'gym', text: '키 파일 관리도 귀찮아요. 퇴사자가 키를 갖고 나간 적도 있어요.' },
      ],
    },
    {
      t: 'quiz',
      scene: 'office',
      quiz: {
        who: 'senior',
        prompt: '인바운드 포트를 열지 않고, IAM 권한으로 서버에 접속하며, 세션 기록까지 남기려면?',
        options: [
          { id: 'a', text: '퍼블릭 서브넷에 배스천 호스트를 두고 22번을 연다', why: '배스천도 결국 22번 포트를 열고 키를 관리해야 해요.' },
          { id: 'b', text: 'Systems Manager Session Manager를 쓴다', why: '' },
          { id: 'c', text: '서버를 퍼블릭 서브넷으로 옮긴다', why: '노출만 늘어나요.' },
          { id: 'd', text: '22번 대신 2222번 포트를 연다', why: '포트 번호를 바꿔도 열려 있는 건 같아요.' },
        ],
        answer: 'b',
        explain: 'Session Manager는 서버의 SSM 에이전트가 바깥으로 연결하는 방식이라 인바운드 포트를 열 필요가 없어요. IAM으로 접속 권한을 관리하고, 세션 로그를 S3·CloudWatch Logs에 남길 수 있어요.',
        hint: '"포트 없음, IAM, 기록"을 모두 만족하는 관리형 서비스예요.',
      },
    },
    { t: 'design' },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'gym', text: '22번 포트를 닫았는데도 브라우저에서 바로 서버에 들어가지네요. 재점검 통과했어요!' },
        { who: 'lead', text: '보안과 편의를 같이 잡았네요.' },
      ],
    },
  ],
  design: {
    brief: ['서버는 프라이빗 서브넷, 인바운드 포트 없음', '운영자는 IAM 권한으로 접속', '접속 기록 보관'],
    layout: B('root', 'plain', '', [
      B('out', 'outside', '인터넷'),
      B('cloud', 'cloud', 'AWS 클라우드', [
        B('region', 'region', '리전 · 서울', [
          Z('svc', 'plain', '리전 서비스', 'region', 3),
          B('vpc', 'vpc', 'VPC', [
            B('vpcEdge', 'gate', 'VPC 경계'),
            B('azA', 'az', '가용 영역 A', [Z('pub', 'public', '퍼블릭 서브넷', 'subnet', 2), Z('priv', 'private', '프라이빗 서브넷', 'subnet', 2)]),
          ]),
        ]),
      ]),
    ]),
    fixed: [{ id: 'admin', service: 'users', zone: 'out', label: '운영 담당자' }, IGW],
    fixedEdges: [['admin', 'igw']],
    palette: ['ec2', 'ssm', 's3', 'alb', 'natgw'],
    answer: {
      nodes: [
        { id: 'a1', service: 'ec2', zone: 'priv', label: '회원 관리 서버' },
        { id: 'a2', service: 'ssm', zone: 'svc' },
        { id: 'a3', service: 's3', zone: 'svc', label: 'S3 (세션 로그)' },
      ],
      edges: [
        ['admin', 'a2'],
        ['a2', 'a1'],
        ['a2', 'a3'],
      ],
    },
    answerNote: [
      '운영 담당자 → Session Manager(콘솔·CLI) → 프라이빗 EC2. 서버의 보안 그룹 인바운드는 비워 둬요.',
      'EC2의 SSM 에이전트가 SSM 엔드포인트에 연결할 수 있어야 해요. NAT 게이트웨이나 인터페이스 VPC 엔드포인트(ssm, ssmmessages, ec2messages)가 필요합니다. 그림에서는 생략했어요.',
    ],
  },
  scenarios: [
    {
      id: 'login',
      icon: '🧑‍💻',
      title: '운영자 접속',
      desc: '운영 담당자가 서버 로그를 확인합니다.',
      check: (c) => (c.path(['admin', 'ssm', 'ec2']) ? ok('Session Manager로 접속했어요.') : c.path(['admin', 'igw', 'ec2']) ? bad('인터넷 게이트웨이로 서버에 직접 접속하고 있어요. 22번 포트를 연 것과 같아요.') : bad('운영자 → Session Manager → 서버 경로를 만들어 주세요.')),
    },
    {
      id: 'scan',
      icon: '🔍',
      title: '외부 포트 스캔',
      desc: '공격자가 열린 포트를 찾습니다.',
      check: (c) => (c.has('ec2', 'pub') || c.linked('igw', 'ec2') || c.has('alb') ? bad('서버가 인터넷에 노출돼 있어요.') : ok('열린 포트가 없어 아무것도 찾지 못했어요.')),
    },
    {
      id: 'audit',
      icon: '📝',
      title: '접속 기록 감사',
      desc: '지난달 누가 서버에 들어갔는지 확인합니다.',
      check: (c) => (c.path(['ssm', 's3']) ? ok('세션 기록이 S3에 남아 있어요.') : bad('세션 기록을 보관할 곳이 연결되지 않았어요.')),
    },
  ],
}

// ── 보통 ─────────────────────────────────────────────

const n1: Project = {
  id: 'order-fanout',
  level: 2,
  title: '주문 이벤트 팬아웃',
  client: 'shop2',
  org: '데일리박스',
  summary: '주문 1건을 메일·포인트·배송 서비스에 각각 전달\nSNS + SQS 팬아웃',
  topics: ['SNS', 'SQS', '팬아웃', '느슨한 결합'],
  env: 'AWS',
  steps: [
    {
      t: 'talk',
      scene: 'office',
      lines: [
        { who: 'lead', text: '구독 박스 쇼핑몰 데일리박스예요. 주문이 들어오면 세 군데에 알려야 하는데 자꾸 하나씩 빠진대요.' },
        { who: 'senior', text: '주문 서버가 메일, 포인트, 배송 API를 차례로 호출하는 구조라면 하나만 실패해도 꼬여요.' },
      ],
    },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'shop2', text: '포인트 서버 점검 중에 들어온 주문은 포인트가 아예 안 쌓였어요.' },
        { who: 'shop2', text: '앞으로 쿠폰 서비스도 붙일 건데, 그때마다 주문 서버를 고치고 싶지 않아요.' },
      ],
    },
    {
      t: 'quiz',
      scene: 'office',
      quiz: {
        who: 'senior',
        prompt: '이벤트 하나를 여러 서비스가 각자 받아 처리하고, 한 서비스가 멈춰도 메시지를 잃지 않으려면?',
        options: [
          { id: 'a', text: 'SQS 큐 하나에 넣고 세 서비스가 같이 꺼내 간다', why: '한 메시지는 보통 하나의 소비자만 처리해요. 세 서비스가 모두 받지 못해요.' },
          { id: 'b', text: 'SNS 토픽에 발행하고 서비스별 SQS 큐가 구독한다', why: '' },
          { id: 'c', text: '주문 서버가 세 API를 동시에 호출한다', why: '여전히 강하게 묶여 있고, 실패한 호출은 사라져요.' },
          { id: 'd', text: 'DynamoDB에 저장하고 세 서비스가 1분마다 조회한다', why: '폴링이라 지연과 비용이 생기고 구현도 복잡해요.' },
        ],
        answer: 'b',
        explain: 'SNS가 메시지를 구독자 전체에 복제해 보내고(팬아웃), 각 SQS 큐가 서비스별로 메시지를 보관해요. 포인트 서버가 멈춰도 포인트 큐에 쌓였다가 복구 후 처리되고, 새 서비스는 큐를 하나 더 구독시키면 돼요.',
        hint: '"모두에게 보내기"와 "보관해 두기"를 각각 맡는 서비스 두 개를 조합해요.',
      },
    },
    { t: 'design' },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'shop2', text: '포인트 서버 점검 시간에도 주문이 쌓였다가 다 반영됐어요. 쿠폰 팀은 큐만 하나 만들면 된대요!' },
        { who: 'lead', text: '확장성까지 고려한 설계였어요.' },
      ],
    },
  ],
  design: {
    brief: ['주문 1건 → 메일·포인트·배송 세 서비스에 전달', '한 서비스가 멈춰도 메시지 보존', '새 서비스 추가 시 주문 서버 수정 없음'],
    layout: B('root', 'plain', '', [
      B('out', 'outside', '인터넷'),
      B('cloud', 'cloud', 'AWS 클라우드', [B('region', 'region', '리전 · 서울', [Z('pub', 'plain', '주문 처리', 'region', 2), Z('msg', 'plain', '메시징', 'region', 4), Z('workers', 'plain', '처리 서비스', 'region', 4)])]),
    ]),
    fixed: [
      { ...USERS, label: '고객' },
      { id: 'mail', service: 'lambda', zone: 'workers', label: '메일 발송' },
      { id: 'point', service: 'lambda', zone: 'workers', label: '포인트 적립' },
      { id: 'ship', service: 'lambda', zone: 'workers', label: '배송 요청' },
    ],
    palette: ['apigw', 'lambda', 'sns', 'sqs', 'dynamodb'],
    answer: {
      nodes: [
        { id: 'a1', service: 'apigw', zone: 'pub' },
        { id: 'a2', service: 'lambda', zone: 'pub', label: '주문 접수' },
        { id: 'a3', service: 'sns', zone: 'msg' },
        { id: 'q1', service: 'sqs', zone: 'msg', label: 'SQS (메일)' },
        { id: 'q2', service: 'sqs', zone: 'msg', label: 'SQS (포인트)' },
        { id: 'q3', service: 'sqs', zone: 'msg', label: 'SQS (배송)' },
      ],
      edges: [
        ['users', 'a1'],
        ['a1', 'a2'],
        ['a2', 'a3'],
        ['a3', 'q1'],
        ['a3', 'q2'],
        ['a3', 'q3'],
        ['q1', 'mail'],
        ['q2', 'point'],
        ['q3', 'ship'],
      ],
    },
    answerNote: ['주문 접수 → SNS 토픽 → 서비스별 SQS 큐 → 각 처리 Lambda.', 'SQS 큐는 SNS 구독 시 큐 정책으로 해당 토픽의 전송을 허용해야 해요.'],
  },
  scenarios: [
    {
      id: 'order',
      icon: '🛒',
      title: '주문 1건',
      desc: '고객이 주문합니다.',
      check: (c) => {
        if (!c.path(['users', 'apigw', 'lambda'])) return bad('고객 → API Gateway → 주문 접수 Lambda 경로를 만들어 주세요.')
        const all = ['mail', 'point', 'ship'].every((t) => c.path(['users', 'apigw', 'lambda', 'sns', 'sqs', t]))
        return all ? ok('세 서비스 모두 주문 이벤트를 받았어요.') : bad('일부 서비스가 이벤트를 받지 못했어요. SNS → 서비스별 SQS → 처리 서비스로 연결하세요.')
      },
    },
    {
      id: 'pointDown',
      icon: '🔧',
      title: '포인트 서버 점검',
      desc: '포인트 적립 서비스가 30분간 멈춥니다.',
      check: (c) => {
        const q = c.nodes('sqs').filter((n) => c.linked(n.id, 'point'))
        return q.length && q.every((n) => !c.linked(n.id, 'mail') && !c.linked(n.id, 'ship'))
          ? ok('포인트 큐에 메시지가 쌓였다가 복구 후 처리됐어요. 다른 서비스는 영향 없었어요.')
          : bad('포인트 전용 큐가 없어 점검 중 이벤트가 유실되거나 다른 서비스와 얽혀요.')
      },
    },
    {
      id: 'coupon',
      icon: '🎟️',
      title: '쿠폰 서비스 추가',
      desc: '새 서비스가 주문 이벤트를 받아야 합니다.',
      check: (c) => (c.has('sns') && !c.linked('lambda', 'mail') ? ok('SNS에 큐 하나만 더 구독시키면 끝이에요. 주문 서버는 그대로예요.') : bad('주문 서버가 서비스를 직접 알고 있어 코드 수정이 필요해요.')),
    },
  ],
}

const n2: Project = {
  id: 'game-logs',
  level: 2,
  title: '게임 로그 분석 플랫폼',
  client: 'game',
  org: '픽셀아레나',
  summary: '대량 로그를 S3에 쌓고 서버 없이 SQL로 분석\nData Firehose, S3, Glue, Athena',
  topics: ['데이터 레이크', 'Firehose', 'Athena', 'Glue'],
  env: 'AWS',
  steps: [
    {
      t: 'talk',
      scene: 'office',
      lines: [
        { who: 'lead', text: '게임사 픽셀아레나가 하루 수억 건 로그를 운영 DB에 넣다가 DB가 느려졌대요.' },
        { who: 'peer', text: '분석용 데이터를 운영 DB에 섞으면 안 되죠. 데이터 레이크 얘기 나오겠는데요?' },
      ],
    },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'game', text: '기획팀이 SQL로 "어제 레벨 10에서 이탈한 유저 수" 같은 걸 직접 보고 싶어 해요.' },
        { who: 'game', text: '분석은 하루 몇 번뿐이라 분석 서버를 24시간 켜 두는 건 아까워요.' },
      ],
    },
    {
      t: 'quiz',
      scene: 'lounge',
      quiz: {
        who: 'peer',
        prompt: 'S3에 쌓인 로그 파일을 서버 없이 표준 SQL로 바로 조회하려면?',
        options: [
          { id: 'a', text: 'RDS로 매일 옮긴 뒤 조회한다', why: '데이터를 계속 옮겨야 하고, 대용량 로그 저장 비용도 커요.' },
          { id: 'b', text: 'Athena로 S3를 직접 조회한다', why: '' },
          { id: 'c', text: 'EC2에 분석 프로그램을 설치한다', why: '서버를 관리하고 계속 켜 둬야 해요.' },
          { id: 'd', text: 'DynamoDB에 넣고 Scan한다', why: 'Scan은 테이블 전체를 읽어 대량 분석에 비효율적이에요.' },
        ],
        answer: 'b',
        explain: 'Athena는 S3의 데이터를 그대로 두고 SQL로 조회하는 서버리스 서비스예요. 스캔한 데이터 양만큼 과금돼요. 그래서 Parquet 같은 열 형식으로 저장하고 날짜로 파티션을 나누면 비용이 크게 줄어요.',
        hint: '"S3에 있는 그대로", "서버 없이"가 조건이에요.',
      },
    },
    { t: 'design' },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'game', text: '운영 DB가 다시 빨라졌고, 기획팀이 직접 쿼리를 돌리고 있어요.' },
        { who: 'lead', text: '운영과 분석을 분리한 게 핵심이었어요.' },
      ],
    },
  ],
  design: {
    brief: ['게임 서버 로그를 자동으로 모아 저장', '운영 DB와 분석 분리', 'SQL로 직접 분석, 상시 서버 없음'],
    layout: B('root', 'plain', '', [
      B('cloud', 'cloud', 'AWS 클라우드', [
        B('region', 'region', '리전 · 서울', [
          B('vpc', 'vpc', 'VPC', [Z('app', 'private', '게임 서버 서브넷', 'subnet', 3)]),
          Z('ingest', 'plain', '수집', 'region', 2),
          Z('lake', 'plain', '저장 · 카탈로그', 'region', 3),
          Z('query', 'plain', '분석', 'region', 2),
        ]),
      ]),
      B('office', 'outside', '본사'),
    ]),
    fixed: [
      { id: 'gs', service: 'ec2', zone: 'app', label: '게임 서버' },
      { id: 'gdb', service: 'rds', zone: 'app', label: '운영 DB' },
      { id: 'planner', service: 'users', zone: 'office', label: '기획팀' },
    ],
    fixedEdges: [['gs', 'gdb']],
    palette: ['firehose', 's3', 'glue', 'athena', 'rds', 'ec2'],
    answer: {
      nodes: [
        { id: 'a1', service: 'firehose', zone: 'ingest' },
        { id: 'a2', service: 's3', zone: 'lake', label: 'S3 (로그 레이크)' },
        { id: 'a3', service: 'glue', zone: 'lake' },
        { id: 'a4', service: 'athena', zone: 'query' },
      ],
      edges: [
        ['gs', 'a1'],
        ['a1', 'a2'],
        ['a3', 'a2'],
        ['a4', 'a3'],
        ['planner', 'a4'],
      ],
    },
    answerNote: ['게임 서버 → Data Firehose → S3. Glue 데이터 카탈로그에 테이블 정의를 두고, Athena가 이를 참조해 S3를 조회해요.', 'Firehose에서 Parquet 변환과 날짜 접두사를 설정하면 Athena 비용이 줄어요.'],
  },
  scenarios: [
    {
      id: 'collect',
      icon: '📥',
      title: '로그 수집',
      desc: '게임 서버가 초당 수천 건 로그를 보냅니다.',
      load: 8,
      check: (c) => (c.path(['gs', 'firehose', 's3']) ? ok('Firehose가 묶어서 S3에 적재했어요.') : c.linked('gs', 'rds') && c.count('rds') > 1 ? bad('로그를 또 다른 DB에 넣고 있어요.') : bad('게임 서버 → Firehose → S3 경로가 없어요.')),
    },
    {
      id: 'opsdb',
      icon: '🏎️',
      title: '운영 DB 성능',
      desc: '로그 분석이 운영 DB를 느리게 하는지 봅니다.',
      check: (c) => (c.linked('athena', 'gdb') || c.linked('firehose', 'gdb') ? bad('분석 경로가 운영 DB를 건드려요.') : ok('분석이 운영 DB와 분리됐어요.')),
    },
    {
      id: 'query',
      icon: '📊',
      title: '기획팀 SQL 조회',
      desc: '"어제 레벨 10 이탈자 수"를 조회합니다.',
      check: (c) =>
        c.path(['planner', 'athena', 'glue', 's3'])
          ? ok('Athena가 카탈로그의 테이블 정의로 S3를 조회했어요.')
          : c.path(['planner', 'athena', 's3'])
            ? bad('Athena가 데이터 구조(테이블 정의)를 알 수 없어요. Glue 데이터 카탈로그를 거치게 하세요.')
            : bad('기획팀 → Athena로 조회하는 경로가 없어요.'),
    },
    {
      id: 'cost',
      icon: '💰',
      title: '분석 없는 시간 비용',
      desc: '분석하지 않는 22시간 동안의 비용입니다.',
      check: (c) => (c.has('ec2') && c.count('ec2') > 1 ? bad('분석용 서버가 계속 켜져 있어요.') : c.count('rds') > 1 ? bad('분석용 DB가 계속 켜져 있어요.') : ok('조회할 때만 비용이 나와요.')),
    },
  ],
}

const n3: Project = {
  id: 'webzine-efs',
  level: 2,
  title: '웹진 업로드 파일 공유',
  client: 'media',
  org: '웹진 플랫',
  summary: '여러 웹 서버가 같은 파일을 보게 하기\nEFS와 EBS의 차이',
  topics: ['EFS', 'EBS', '공유 스토리지', 'Multi-AZ'],
  env: 'AWS',
  steps: [
    {
      t: 'talk',
      scene: 'office',
      lines: [
        { who: 'lead', text: '웹진 플랫이 서버를 두 대로 늘렸더니 "올린 이미지가 가끔 안 보인다"는 문의가 온대요.' },
        { who: 'senior', text: '이미지를 각 서버 디스크에 저장하고 있겠네요. A 서버에 올리면 B 서버엔 없죠.' },
      ],
    },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'media', text: '편집기 프로그램이 파일 경로로 이미지를 읽어요. 코드를 크게 바꾸긴 어려워요.' },
        { who: 'media', text: '서버는 두 AZ에 나눠 두고 싶고요.' },
      ],
    },
    {
      t: 'quiz',
      scene: 'office',
      quiz: {
        who: 'senior',
        prompt: '두 AZ의 EC2가 같은 폴더를 동시에 읽고 쓰려면 어떤 스토리지가 맞을까요? (코드 수정 최소)',
        options: [
          { id: 'a', text: 'EBS 볼륨 하나를 두 서버에 연결한다', why: 'EBS는 한 AZ에 속하고 보통 한 인스턴스에 붙어요. Multi-Attach도 같은 AZ의 io1/io2에서만 되고 공유 파일 시스템 용도가 아니에요.' },
          { id: 'b', text: '서버마다 EBS를 두고 매분 서로 복사한다', why: '복사 사이의 시간 동안 파일이 어긋나요.' },
          { id: 'c', text: 'EFS를 두 서버에 마운트한다', why: '' },
          { id: 'd', text: '인스턴스 스토어를 쓴다', why: '인스턴스를 멈추면 데이터가 사라지는 임시 스토리지예요.' },
        ],
        answer: 'c',
        explain: 'EFS는 여러 AZ에 걸친 리전 수준의 NFS 파일 시스템이에요. AZ마다 마운트 대상을 두면 여러 EC2가 같은 경로로 동시에 읽고 쓸 수 있어요. 장기적으로는 이미지를 S3에 두는 방식도 좋아요.',
        hint: '"여러 대가 동시에", "파일 경로"가 핵심이에요.',
      },
    },
    { t: 'design' },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'media', text: '어느 서버로 접속해도 이미지가 다 보여요. 편집기 코드는 마운트 경로만 바꿨어요.' },
        { who: 'lead', text: '스토리지 특성 차이를 정확히 짚었어요.' },
      ],
    },
  ],
  design: {
    brief: ['두 AZ의 웹 서버가 같은 업로드 폴더 사용', '파일 경로 방식 유지', 'AZ 하나 장애에도 파일 접근'],
    layout: B('root', 'plain', '', [
      B('out', 'outside', '인터넷'),
      B('cloud', 'cloud', 'AWS 클라우드', [B('region', 'region', '리전 · 서울', [vpc2az([], false), Z('svc', 'plain', '리전 서비스', 'region', 2)])]),
    ]),
    fixed: [USERS, IGW],
    fixedEdges: [['users', 'igw']],
    palette: ['alb', 'ec2', 'efs', 'ebs', 's3'],
    answer: {
      nodes: [
        { id: 'a1', service: 'alb', zone: 'albZone' },
        { id: 'a2', service: 'ec2', zone: 'appA' },
        { id: 'a3', service: 'ec2', zone: 'appB' },
        { id: 'a4', service: 'efs', zone: 'svc' },
      ],
      edges: [
        ['igw', 'a1'],
        ['a1', 'a2'],
        ['a1', 'a3'],
        ['a2', 'a4'],
        ['a3', 'a4'],
      ],
    },
    answerNote: ['두 EC2가 같은 EFS를 마운트해요. 실제로는 AZ마다 EFS 마운트 대상이 생기고, 각 서버는 자기 AZ의 마운트 대상으로 접근해요.'],
  },
  scenarios: [
    {
      id: 'upload',
      icon: '🖼️',
      title: 'A 서버에 업로드, B 서버로 조회',
      desc: '편집자가 올린 이미지를 다른 서버가 보여 줍니다.',
      check: (c) => {
        const web = c.nodes('ec2').filter((n) => c.linked('alb', n.id))
        if (web.length < 2) return bad('ALB 뒤에 웹 서버가 두 대 있어야 이 문제가 재현돼요.')
        if (web.every((n) => c.linked(n.id, 'efs'))) return ok('두 서버가 같은 EFS를 써서 이미지가 보였어요.')
        if (c.has('ebs')) return bad('EBS는 서버마다 따로라 다른 서버에선 파일이 안 보여요.')
        return bad('두 서버 모두 공유 스토리지에 연결해 주세요.')
      },
    },
    {
      id: 'az',
      icon: '⚡',
      title: '가용 영역 A 장애',
      desc: 'AZ A가 멈춥니다.',
      fail: ['azA'],
      check: (c) => (c.path(['users', 'igw', 'alb', 'ec2', 'efs'], ['azA']) ? ok('AZ B 서버가 같은 파일로 계속 서비스했어요.') : bad('AZ A가 멈추자 파일 또는 서버가 사라졌어요.')),
    },
  ],
}

const n4: Project = {
  id: 'app-login',
  level: 2,
  title: '헬스케어 앱 로그인 API',
  client: 'app',
  org: '헬시핏',
  summary: '회원 관리는 Cognito에 맡기고, 로그인한 사용자만 API 호출\nCognito + API Gateway',
  topics: ['Cognito', 'API Gateway 권한 부여자', '서버리스'],
  env: 'AWS',
  steps: [
    {
      t: 'talk',
      scene: 'office',
      lines: [
        { who: 'lead', text: '운동 기록 앱 헬시핏이 회원 기능을 붙인대요. 지금은 비밀번호를 DB에 직접 저장하려고 한대요.' },
        { who: 'peer', text: '헉, 직접 구현하면 해시, 재설정, 다단계 인증까지 다 만들어야 하잖아요.' },
      ],
    },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'app', text: '로그인한 사용자만 자기 운동 기록 API를 호출할 수 있어야 해요.' },
        { who: 'app', text: '개발자가 둘뿐이라 회원 기능은 최대한 맡기고 싶어요.' },
      ],
    },
    {
      t: 'quiz',
      scene: 'lounge',
      quiz: {
        who: 'peer',
        prompt: '로그인한 사용자의 토큰을 확인해 API 호출을 허용하려면 API Gateway에 무엇을 설정할까요?',
        options: [
          { id: 'a', text: 'Cognito 사용자 풀 권한 부여자(Authorizer)', why: '' },
          { id: 'b', text: 'API 키만 발급해 앱에 넣는다', why: 'API 키는 사용량 계획용이고 사용자 인증 수단이 아니에요. 앱에 넣으면 누구나 꺼낼 수 있어요.' },
          { id: 'c', text: '보안 그룹으로 앱 IP만 허용', why: '사용자 휴대폰 IP는 계속 바뀌고, API Gateway에는 보안 그룹을 붙이지 않아요.' },
          { id: 'd', text: 'Lambda에서 비밀번호를 매번 DB와 비교', why: '매 요청마다 비밀번호를 보내는 건 위험하고 비효율적이에요.' },
        ],
        answer: 'a',
        explain: '사용자가 Cognito로 로그인하면 JWT 토큰을 받고, API Gateway의 Cognito 권한 부여자(HTTP API는 JWT 권한 부여자)가 토큰을 검증한 요청만 Lambda로 넘겨요.',
        hint: '로그인 서비스와 API 입구를 연결하는 설정이에요.',
      },
    },
    { t: 'design' },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'app', text: '비밀번호 재설정, 이메일 인증까지 바로 됐어요. 저희는 운동 기능만 만들면 되네요.' },
        { who: 'lead', text: '보안 기능은 검증된 관리형 서비스에 맡기는 게 맞아요.' },
      ],
    },
  ],
  design: {
    brief: ['회원가입·로그인은 관리형 서비스로', '로그인한 사용자만 운동 기록 API 호출', '비밀번호를 우리 DB에 저장하지 않기', '서버 관리 없음'],
    layout: B('root', 'plain', '', [
      B('out', 'outside', '인터넷 (앱 사용자)'),
      B('cloud', 'cloud', 'AWS 클라우드', [B('region', 'region', '리전 · 서울', [Z('auth', 'plain', '인증', 'region', 2), Z('api', 'plain', 'API', 'region', 3), Z('data', 'plain', '데이터', 'region', 2), B('vpc', 'vpc', 'VPC', [Z('sub', 'private', '프라이빗 서브넷', 'subnet', 2)])])]),
    ]),
    fixed: [{ ...USERS, label: '앱 사용자' }],
    palette: ['cognito', 'apigw', 'lambda', 'dynamodb', 'rds', 'ec2'],
    answer: {
      nodes: [
        { id: 'a1', service: 'cognito', zone: 'auth' },
        { id: 'a2', service: 'apigw', zone: 'api' },
        { id: 'a3', service: 'lambda', zone: 'api' },
        { id: 'a4', service: 'dynamodb', zone: 'data' },
      ],
      edges: [
        ['users', 'a1'],
        ['users', 'a2'],
        ['a2', 'a1'],
        ['a2', 'a3'],
        ['a3', 'a4'],
      ],
    },
    answerNote: ['사용자 → Cognito(로그인, 토큰 발급), 사용자 → API Gateway(토큰 포함 요청). API Gateway–Cognito 선은 권한 부여자 설정이에요.'],
  },
  scenarios: [
    {
      id: 'login',
      icon: '🔑',
      title: '로그인 후 기록 조회',
      desc: '회원이 로그인해 운동 기록을 봅니다.',
      check: (c) =>
        c.linked('users', 'cognito') && c.path(['users', 'apigw', 'lambda', 'dynamodb'])
          ? ok('토큰으로 인증된 요청이 처리됐어요.')
          : !c.has('cognito')
            ? bad('로그인을 처리할 서비스가 없어요.')
            : bad('사용자 → Cognito(로그인), 사용자 → API Gateway → Lambda → DynamoDB 경로를 확인하세요.'),
    },
    {
      id: 'anon',
      icon: '🕵️',
      title: '로그인 없이 API 호출',
      desc: '누군가 토큰 없이 API를 호출합니다.',
      check: (c) => (c.linked('apigw', 'cognito') ? ok('권한 부여자가 토큰 없는 요청을 401로 거절했어요.') : bad('API Gateway가 토큰을 검사하지 않아 누구나 호출할 수 있어요.')),
    },
    {
      id: 'password',
      icon: '🗄️',
      title: '비밀번호 저장 위치 점검',
      desc: '비밀번호가 어디 저장되는지 확인합니다.',
      check: (c) => (c.has('rds') || c.has('ec2') ? bad('직접 관리하는 DB·서버가 있어요. 회원 정보는 Cognito에 맡기세요.') : ok('비밀번호는 Cognito가 관리하고 우리 DB에는 없어요.')),
    },
  ],
}

// ── 어려움 ─────────────────────────────────────────────

const h1: Project = {
  id: 'insure-migration',
  level: 3,
  title: '보험사 DB 무중단 이전',
  client: 'insure',
  org: '한결손해보험',
  summary: '온프레미스 Oracle을 Aurora로, 서비스 중단을 최소화하며 이전\nDMS와 CDC',
  topics: ['DMS', '변경 데이터 캡처(CDC)', '이기종 마이그레이션', 'Aurora'],
  env: '하이브리드',
  steps: [
    {
      t: 'talk',
      scene: 'office',
      lines: [
        { who: 'lead', text: '한결손해보험이 계약 DB(Oracle)를 Aurora PostgreSQL로 옮긴대요. 라이선스 비용 때문이에요.' },
        { who: 'senior', text: '이기종 이전이라 스키마 변환이 필요하고, 데이터가 크니 옮기는 동안 들어오는 변경도 따라가야 해요.' },
      ],
    },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'insure', text: 'DB가 3TB예요. 계약 시스템을 하루 종일 멈출 수는 없습니다. 전환 중단은 30분 이내여야 해요.' },
        { who: 'insure', text: '데이터센터와 AWS 사이에는 이미 Site-to-Site VPN이 있어요.' },
      ],
    },
    {
      t: 'quiz',
      scene: 'office',
      quiz: {
        who: 'senior',
        prompt: '3TB를 옮기는 동안에도 원본에 계속 쓰기가 일어나요. 중단을 최소화하는 DMS 작업 유형은?',
        options: [
          { id: 'a', text: '전체 로드만(Full load only)', why: '복사하는 동안 들어온 변경이 빠지므로, 전체 로드 내내 원본 쓰기를 멈춰야 해요.' },
          { id: 'b', text: '전체 로드 + 진행 중 변경 복제(CDC)', why: '' },
          { id: 'c', text: '덤프 파일을 USB로 보낸다', why: '보내는 동안의 변경을 반영할 방법이 없어요.' },
          { id: 'd', text: 'RDS 스냅샷을 복원한다', why: '온프레미스 Oracle에는 RDS 스냅샷이 없어요.' },
        ],
        answer: 'b',
        explain: '전체 로드로 기존 데이터를 옮기는 동안 생긴 변경을 CDC로 계속 따라 적용해요. 원본과 대상의 차이가 거의 없어졌을 때 애플리케이션 연결만 바꾸면 짧은 중단으로 전환할 수 있어요. Oracle → PostgreSQL처럼 엔진이 다르면 DMS Schema Conversion(또는 SCT)으로 스키마를 먼저 변환해요.',
        hint: '"옮기는 동안 생기는 변경"을 어떻게 처리할지가 핵심이에요.',
      },
    },
    { t: 'design' },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'insure', text: '일요일 새벽 전환에서 실제 중단은 18분이었습니다. 계약 데이터 검증도 모두 일치했어요.' },
        { who: 'senior', text: '전환 전 DMS 데이터 검증 기능으로 행 단위 비교를 돌려 둔 게 효과가 있었어요.' },
        { who: 'lead', text: '마이그레이션은 절차가 곧 설계예요. 잘 해냈어요.' },
      ],
    },
  ],
  design: {
    brief: ['온프레미스 Oracle 3TB → Aurora PostgreSQL', '전환 중단 30분 이내', '기존 Site-to-Site VPN 사용', 'DB는 인터넷에 노출하지 않기'],
    layout: B('root', 'plain', '', [
      B('cloud', 'cloud', 'AWS 클라우드', [
        B('region', 'region', '리전 · 서울', [B('vpc', 'vpc', 'VPC', [B('vpcEdge', 'gate', 'VPC 경계'), Z('mig', 'private', '프라이빗 서브넷 · 마이그레이션', 'subnet', 2), Z('db', 'private', '프라이빗 서브넷 · DB', 'subnet', 2), Z('pubX', 'public', '퍼블릭 서브넷', 'subnet', 2)])]),
      ]),
      Z('linkBox', 'link', '연결 회선', 'link', 2),
      B('dc', 'onprem', '보험사 데이터센터', [B('dcIn', 'plain', '내부망')]),
    ]),
    fixed: [
      { id: 'vgw', service: 'vgw', zone: 'vpcEdge', label: '가상 프라이빗 게이트웨이' },
      { id: 'vpnL', service: 'vpn', zone: 'linkBox', label: 'Site-to-Site VPN (기존)' },
      { id: 'ora', service: 'onpremDb', zone: 'dcIn', label: 'Oracle 계약 DB' },
      { id: 'app', service: 'nas', zone: 'dcIn', label: '계약 시스템 서버' },
    ],
    fixedEdges: [
      ['ora', 'vpnL'],
      ['vpnL', 'vgw'],
      ['app', 'ora'],
    ],
    palette: ['dms', 'aurora', 'rds', 's3', 'dx'],
    answer: {
      nodes: [
        { id: 'a1', service: 'dms', zone: 'mig' },
        { id: 'a2', service: 'aurora', zone: 'db' },
      ],
      edges: [
        ['vgw', 'a1'],
        ['a1', 'a2'],
      ],
    },
    answerNote: ['Oracle → VPN → VGW → DMS 복제 인스턴스 → Aurora. 전체 로드 + CDC 작업으로 실행해요.', '전환 시점에 계약 시스템의 DB 연결 문자열을 Aurora로 바꾸고, 필요하면 역방향 복제로 롤백 경로를 마련해요.'],
  },
  scenarios: [
    {
      id: 'full',
      icon: '📦',
      title: '전체 데이터 복사',
      desc: '3TB 계약 데이터를 옮깁니다.',
      load: 6,
      check: (c) => (c.path(['ora', 'vpnL', 'vgw', 'dms', 'aurora']) ? ok('DMS가 VPN을 통해 Aurora로 적재했어요.') : !c.has('aurora') ? bad('대상 DB(Aurora)가 없어요.') : bad('Oracle → VPN → VGW → DMS → Aurora 경로를 확인하세요.')),
    },
    {
      id: 'cdc',
      icon: '🔁',
      title: '복사 중 신규 계약',
      desc: '이전 중에도 계약이 계속 들어옵니다.',
      check: (c) => (c.linked('dms', 'aurora') && c.path(['ora', 'vpnL', 'vgw', 'dms']) ? ok('CDC로 변경분이 계속 반영돼 원본과 대상이 맞춰졌어요.') : bad('변경분을 따라가는 복제 경로가 없어요.')),
    },
    {
      id: 'expose',
      icon: '🛡️',
      title: 'DB 노출 점검',
      desc: '새 DB가 인터넷에 노출됐는지 봅니다.',
      check: (c) => (c.has('aurora', 'pubX') || c.has('dms', 'pubX') ? bad('DB나 복제 인스턴스가 퍼블릭 서브넷에 있어요.') : ok('모두 프라이빗 서브넷에 있어요.')),
    },
    {
      id: 'line',
      icon: '📶',
      title: '회선 일정',
      desc: '새 회선이 필요한지 봅니다.',
      check: (c) => (c.has('dx') ? bad('이미 있는 VPN으로 충분한데 전용선을 추가했어요. 개통에 시간이 걸려요.') : ok('기존 VPN을 그대로 활용했어요.')),
    },
  ],
}

const h2: Project = {
  id: 'group-tgw',
  level: 3,
  title: '그룹사 VPC 연결 허브',
  client: 'group',
  org: '그린에너지그룹',
  summary: 'VPC가 늘어날수록 복잡해지는 피어링 대신 허브 구조로\nTransit Gateway',
  topics: ['Transit Gateway', 'VPC 피어링', '하이브리드 연결'],
  env: '멀티 VPC + 온프레미스',
  steps: [
    {
      t: 'talk',
      scene: 'office',
      lines: [
        { who: 'lead', text: '그린에너지그룹 계열사 VPC들이 서로 통신해야 하는데, 피어링이 거미줄처럼 얽혔대요.' },
        { who: 'senior', text: 'VPC가 n개면 피어링은 최대 n(n-1)/2개예요. 게다가 피어링은 전이 라우팅이 안 되죠.' },
      ],
    },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'group', text: '공통 서비스 VPC, 발전 VPC, 판매 VPC가 있고 내년에 더 늘어나요.' },
        { who: 'group', text: '본사 데이터센터와도 VPN 하나로 모든 VPC가 통신했으면 해요. VPC마다 VPN을 따로 두기 싫어요.' },
      ],
    },
    {
      t: 'quiz',
      scene: 'office',
      quiz: {
        who: 'senior',
        prompt: 'VPC A–B, B–C가 피어링돼 있어요. A에서 C로 통신할 수 있을까요?',
        options: [
          { id: 'a', text: '가능하다. B를 거쳐 자동으로 라우팅된다', why: 'VPC 피어링은 전이 라우팅을 지원하지 않아요.' },
          { id: 'b', text: '불가능하다. A–C를 직접 피어링하거나 Transit Gateway 같은 허브가 필요하다', why: '' },
          { id: 'c', text: '라우팅 테이블에 B를 넣으면 가능하다', why: '피어링 연결을 다음 홉으로 거쳐 다른 피어링으로 넘어가는 건 허용되지 않아요.' },
          { id: 'd', text: '같은 리전이면 가능하다', why: '리전과 관계없이 전이 라우팅은 안 돼요.' },
        ],
        answer: 'b',
        explain: 'Transit Gateway는 VPC와 VPN을 허브에 연결(attachment)해 라우팅 테이블로 서로 통신하게 해요. 새 VPC는 허브에 연결만 하면 되고, 온프레미스 VPN도 허브에 한 번 연결하면 여러 VPC가 공유할 수 있어요.',
        hint: '피어링은 1:1 연결이에요.',
      },
    },
    { t: 'design' },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'group', text: '피어링 6개를 정리하고 허브 하나로 바꿨어요. 신규 VPC 연결이 반나절이면 끝나요.' },
        { who: 'lead', text: '확장을 내다본 네트워크 설계였어요. 시니어 레벨이네요.' },
      ],
    },
  ],
  design: {
    brief: ['공통·발전·판매 VPC가 서로 통신', '본사 데이터센터 VPN 하나로 모든 VPC 연결', 'VPC가 늘어나도 연결 작업 최소화'],
    layout: B('root', 'plain', '', [
      B('cloud', 'cloud', 'AWS 클라우드', [
        B('region', 'region', '리전 · 서울', [B('vpcs', 'plain', '', [B('v1', 'vpc', '공통 서비스 VPC'), B('v2', 'vpc', '발전 VPC'), B('v3', 'vpc', '판매 VPC')], 'row'), Z('hub', 'link', '연결 허브 / 피어링', 'link', 4)]),
      ]),
      Z('link', 'link', '데이터센터 연결', 'link', 2),
      B('dc', 'onprem', '본사 데이터센터', [Z('dcEdge', 'plain', '경계 장비', 'onprem', 1), B('dcIn', 'plain', '내부망')]),
    ]),
    fixed: [
      { id: 'vc', service: 'vpcB', zone: 'v1', label: '공통 서비스' },
      { id: 'vp', service: 'vpcB', zone: 'v2', label: '발전 시스템' },
      { id: 'vs', service: 'vpcB', zone: 'v3', label: '판매 시스템' },
      { id: 'erp', service: 'onpremDb', zone: 'dcIn', label: '본사 ERP' },
    ],
    palette: ['tgw', 'peering', 'vpn', 'cgw', 'vgw', 'dx'],
    answer: {
      nodes: [
        { id: 'a1', service: 'tgw', zone: 'hub' },
        { id: 'a2', service: 'vpn', zone: 'link' },
        { id: 'a3', service: 'cgw', zone: 'dcEdge' },
      ],
      edges: [
        ['vc', 'a1'],
        ['vp', 'a1'],
        ['vs', 'a1'],
        ['a1', 'a2'],
        ['a2', 'a3'],
        ['a3', 'erp'],
      ],
    },
    answerNote: ['세 VPC와 VPN을 모두 Transit Gateway에 연결(attachment)해요.', 'VPN을 Transit Gateway에 붙이면 가상 프라이빗 게이트웨이가 필요 없어요.', 'Transit Gateway 라우팅 테이블을 나누면 "판매 VPC는 발전 VPC와 통신 금지" 같은 분리도 할 수 있어요.'],
  },
  scenarios: [
    {
      id: 'mesh',
      icon: '🕸️',
      title: '판매 → 발전 VPC 통신',
      desc: '판매 시스템이 발전량 데이터를 조회합니다.',
      check: (c) => (c.path(['vs', 'tgw', 'vp']) ? ok('Transit Gateway를 통해 통신했어요.') : c.path(['vs', 'peering', 'vp']) ? ok('피어링으로 통신은 됐어요. 다음 점검을 보세요.') : bad('두 VPC 사이 경로가 없어요.')),
    },
    {
      id: 'transitive',
      icon: '🔀',
      title: '판매 → 공통 → 발전 경유',
      desc: '피어링만으로 세 VPC가 모두 통신하는지 봅니다.',
      check: (c) =>
        ['vc', 'vp', 'vs'].every((a) => ['vc', 'vp', 'vs'].every((b) => a === b || c.path([a, 'tgw', b]) || c.path([a, 'peering', b])))
          ? ok('모든 VPC 쌍이 통신해요.')
          : bad('통신 못 하는 VPC 쌍이 있어요. 피어링은 전이 라우팅이 안 돼요.'),
    },
    {
      id: 'onprem',
      icon: '🏢',
      title: '본사 ERP 연결',
      desc: '세 VPC 모두 본사 ERP에 접근합니다.',
      check: (c) =>
        ['vc', 'vp', 'vs'].every((v) => c.path([v, 'tgw', 'vpn', 'cgw', 'erp']))
          ? ok('VPN 하나를 허브에서 공유했어요.')
          : c.count('vpn') > 1
            ? bad('VPC마다 VPN을 따로 두는 구조예요. 고객이 원하지 않았어요.')
            : bad('모든 VPC가 본사로 가는 경로를 갖지 못했어요.'),
    },
    {
      id: 'grow',
      icon: '➕',
      title: '내년 신규 VPC 추가',
      desc: '네 번째 VPC를 붙입니다.',
      check: (c) => (c.has('tgw') && !c.has('peering') ? ok('허브에 연결 하나만 추가하면 돼요.') : bad('피어링 구조라 기존 VPC마다 연결을 새로 만들어야 해요.')),
    },
  ],
}

const h3: Project = {
  id: 'delivery-container',
  level: 3,
  title: '배달 앱 컨테이너 전환',
  client: 'delivery',
  org: '빠른식탁',
  summary: '서버 관리 없이 컨테이너를 운영하고, 비밀번호는 코드 밖으로\nECS Fargate, ECR, Secrets Manager',
  topics: ['ECS Fargate', 'ECR', 'Secrets Manager', '무중단 배포'],
  env: 'AWS',
  steps: [
    {
      t: 'talk',
      scene: 'office',
      lines: [
        { who: 'lead', text: '배달 앱 빠른식탁이 EC2에 직접 배포하다가 배포 실패로 점심 피크를 날렸대요.' },
        { who: 'senior', text: '이미지는 Docker로 이미 만들고 있다니까, 컨테이너 오케스트레이션으로 가면 돼요.' },
      ],
    },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'delivery', text: 'EC2 OS 패치, 디스크 정리 같은 일에 지쳤어요. 컨테이너만 신경 쓰고 싶어요.' },
        { who: 'delivery', text: '그리고 깃허브에 DB 비밀번호가 올라간 적이 있어요... 이번엔 제대로 하고 싶어요.' },
      ],
    },
    {
      t: 'quiz',
      scene: 'office',
      quiz: {
        who: 'senior',
        prompt: '컨테이너를 실행할 서버(EC2)의 패치·용량 관리까지 AWS에 맡기려면 ECS의 어떤 시작 유형을 쓸까요?',
        options: [
          { id: 'a', text: 'EC2 시작 유형', why: '컨테이너가 돌아갈 EC2 인스턴스를 직접 관리해야 해요.' },
          { id: 'b', text: 'Fargate', why: '' },
          { id: 'c', text: 'Lambda', why: 'Lambda도 서버리스지만 ECS의 시작 유형이 아니고, 장시간 실행되는 웹 서버 컨테이너와 맞지 않을 수 있어요(최대 15분).' },
          { id: 'd', text: 'Elastic Beanstalk', why: 'Beanstalk도 내부적으로 EC2를 쓰고, ECS 시작 유형이 아니에요.' },
        ],
        answer: 'b',
        explain: 'Fargate는 작업(Task)에 필요한 CPU·메모리만 지정하면 AWS가 실행 환경을 관리해요. ALB와 함께 쓰면 롤링 배포 중 상태 확인에 통과한 새 컨테이너로만 트래픽이 가서 무중단 배포가 가능해요.',
        hint: '"서버리스 컨테이너"를 뜻하는 이름이에요.',
      },
    },
    {
      t: 'quiz',
      scene: 'lounge',
      quiz: {
        who: 'peer',
        prompt: 'DB 비밀번호를 코드·이미지에 넣지 않고, 주기적으로 자동 교체까지 하려면?',
        options: [
          { id: 'a', text: '컨테이너 이미지의 환경 변수에 넣는다', why: '이미지를 받은 누구나 볼 수 있어요.' },
          { id: 'b', text: 'Secrets Manager에 저장하고 작업 정의에서 참조한다', why: '' },
          { id: 'c', text: 'S3 공개 버킷에 파일로 둔다', why: '보안상 정반대예요.' },
          { id: 'd', text: '깃허브 비공개 저장소에 둔다', why: '저장소 접근 권한이 곧 비밀번호 접근 권한이 되고, 이력에 남아요.' },
        ],
        answer: 'b',
        explain: 'Secrets Manager는 비밀 값을 KMS로 암호화해 보관하고, RDS·Aurora 등은 자동 교체를 지원해요. ECS 작업 정의의 secrets 항목으로 참조하면 실행 시점에 컨테이너 환경 변수로 주입되고, 작업 실행 역할(IAM)로 접근을 제한해요.',
        hint: '이름 그대로 "비밀"을 관리하는 서비스예요.',
      },
    },
    { t: 'design' },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'delivery', text: '점심 피크 중에 배포했는데 아무도 몰랐어요. 비밀번호도 코드에서 완전히 사라졌고요.' },
        { who: 'senior', text: '다음 단계로 CPU 사용률에 맞춘 ECS 서비스 Auto Scaling도 걸어 두세요.' },
        { who: 'lead', text: '운영 부담, 보안, 배포 안정성을 한 번에 풀었네요. 훌륭해요.' },
      ],
    },
  ],
  design: {
    brief: ['컨테이너 실행 서버 관리 없음', '점심 피크 중에도 무중단 배포', 'DB 비밀번호를 코드·이미지에서 제거', 'AZ 하나 장애에도 운영'],
    layout: B('root', 'plain', '', [
      B('out', 'outside', '인터넷'),
      B('cloud', 'cloud', 'AWS 클라우드', [B('region', 'region', '리전 · 서울', [vpc2az(), Z('svc', 'plain', '리전 서비스', 'region', 3)])]),
    ]),
    fixed: [USERS, IGW],
    fixedEdges: [['users', 'igw']],
    palette: ['alb', 'fargate', 'ec2', 'ecr', 'secrets', 'aurora', 'rdsStandby', 's3'],
    answer: {
      nodes: [
        { id: 'a1', service: 'alb', zone: 'albZone' },
        { id: 'a2', service: 'fargate', zone: 'appA' },
        { id: 'a3', service: 'fargate', zone: 'appB' },
        { id: 'a4', service: 'aurora', zone: 'dbA', label: 'Aurora (쓰기)' },
        { id: 'a5', service: 'aurora', zone: 'dbB', label: 'Aurora (복제본)' },
        { id: 'a6', service: 'ecr', zone: 'svc' },
        { id: 'a7', service: 'secrets', zone: 'svc' },
      ],
      edges: [
        ['igw', 'a1'],
        ['a1', 'a2'],
        ['a1', 'a3'],
        ['a2', 'a4'],
        ['a3', 'a4'],
        ['a4', 'a5'],
        ['a6', 'a2'],
        ['a6', 'a3'],
        ['a7', 'a2'],
        ['a7', 'a3'],
      ],
    },
    answerNote: [
      'ALB → 두 AZ의 Fargate 작업 → Aurora. ECR에서 이미지를 받고, Secrets Manager에서 DB 비밀번호를 주입받아요.',
      'Aurora는 다른 AZ에 복제본(리더)을 두면 쓰기 인스턴스 장애 시 복제본이 승격돼요.',
      '프라이빗 서브넷의 Fargate가 ECR·Secrets Manager에 접근하려면 NAT 게이트웨이나 VPC 엔드포인트가 필요해요(그림에서는 생략).',
    ],
  },
  scenarios: [
    {
      id: 'normal',
      icon: '🍱',
      title: '점심 주문',
      desc: '피크 시간에 주문이 들어옵니다.',
      check: (c) => (c.path(['users', 'igw', 'alb@albZone', 'fargate', 'aurora']) ? ok('주문이 처리됐어요.') : c.path(['users', 'igw', 'alb', 'ec2']) ? bad('EC2에 직접 띄우는 지금 구조예요. 서버 관리 요구를 다시 보세요.') : bad('ALB → Fargate → Aurora 경로를 만들어 주세요.')),
    },
    {
      id: 'deploy',
      icon: '🚀',
      title: '피크 중 배포',
      desc: '새 버전 이미지를 배포합니다.',
      check: (c) => {
        if (!c.has('ecr') || !c.linked('ecr', 'fargate')) return bad('작업이 가져올 이미지 저장소(ECR)가 연결되지 않았어요.')
        const behind = c.nodes('fargate').filter((n) => c.linked('alb', n.id))
        return behind.length >= 2 ? ok('ALB 상태 확인을 통과한 새 작업으로만 트래픽이 넘어가 무중단 배포됐어요.') : bad('ALB 뒤 작업이 하나뿐이라 교체 중 끊길 수 있어요.')
      },
    },
    {
      id: 'secret',
      icon: '🗝️',
      title: '비밀번호 유출 점검',
      desc: '이미지와 코드에 비밀번호가 있는지 검사합니다.',
      check: (c) => (c.nodes('fargate').length && c.nodes('fargate').every((n) => c.linked('secrets', n.id)) ? ok('비밀번호는 Secrets Manager에서 실행 시 주입돼요.') : bad('비밀번호를 받아 올 곳이 없어 코드나 이미지에 넣어야 해요.')),
    },
    {
      id: 'az',
      icon: '⚡',
      title: '가용 영역 A 장애',
      desc: 'AZ A가 멈춥니다.',
      fail: ['azA'],
      check: (c) => (c.path(['users', 'igw', 'alb', 'fargate', 'aurora'], ['azA']) ? ok('AZ B의 작업과 승격된 Aurora 복제본으로 계속 운영됐어요.') : bad('AZ A가 멈추자 앱이나 DB가 끊겼어요. 두 AZ 모두에 두세요.')),
    },
  ],
}

export const PROJECTS2: Project[] = [e1, e2, e3, n1, n2, n3, n4, h1, h2, h3]
