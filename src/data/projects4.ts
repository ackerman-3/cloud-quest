// 추가 신입(쉬움) 프로젝트 5개 — SAA-C03 기출 출제 포인트 중심
// 보안 그룹 vs 네트워크 ACL / S3 스토리지 클래스 / IAM 역할 / CloudTrail·Config·CloudWatch / VPC CIDR·NAT 이중화
import type { Box, Project, Result, Scope } from '../types'

const B = (id: string, kind: Box['kind'], label: string, children: Box[] = [], dir: 'row' | 'col' = 'col'): Box => ({ id, kind, label, children, dir })
const Z = (id: string, kind: Box['kind'], label: string, scope: Scope, max = 3): Box => ({ id, kind, label, zone: { scope, max } })
const ok = (msg: string): Result => ({ ok: true, msg })
const bad = (msg: string): Result => ({ ok: false, msg })
const IGW = { id: 'igw', service: 'igw', zone: 'vpcEdge', label: '인터넷 게이트웨이' }

const b1: Project = {
  id: 'bakery-nacl',
  level: 1,
  title: '주문 폭주인 줄 알았는데 공격',
  client: 'bakery',
  org: '밀가루공방',
  summary: '소수 IP의 불법 요청을 서브넷 입구에서 차단\n네트워크 ACL vs 보안 그룹',
  topics: ['네트워크 ACL', '보안 그룹', '상태 저장/비저장', '최소 권한'],
  env: 'AWS',
  steps: [
    {
      t: 'talk',
      scene: 'office',
      lines: [
        { who: 'lead', text: '빵집 밀가루공방 홈페이지가 갑자기 느려졌대요. 접속 기록을 보니 IP 몇 개가 1초에 수천 번씩 요청하고 있어요.' },
        { who: 'peer', text: '그 IP만 딱 막으면 되겠네요. 보안 그룹에서 막으면…' },
        { who: 'senior', text: '보안 그룹으로 "막는" 게 되는지부터 확인해 봐요.' },
      ],
    },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'bakery', text: '내일 아침 예약 주문을 받아야 해서 오늘 안에 꼭 해결해야 해요.' },
        { who: 'bakery', text: '그리고 주문 DB는 웹 서버 말고는 아무도 못 들어오게 해 주세요.' },
        { who: 'me', text: '서브넷 입구에서 공격 IP를 막고, DB는 웹 서버만 들어오도록 좁히겠습니다.' },
      ],
    },
    {
      t: 'quiz',
      scene: 'office',
      quiz: {
        who: 'senior',
        prompt: '퍼블릭 서브넷의 웹 서버가 소수 IP의 대량 요청으로 느려졌어요. 근본 대책을 찾는 동안 바로 해결하려면?',
        options: [
          { id: 'a', text: '웹 서버 보안 그룹에 해당 IP 거부 규칙을 추가한다', why: '보안 그룹은 허용 규칙만 있어요. 거부(deny) 규칙을 만들 수 없어요.' },
          { id: 'b', text: '웹 서버가 있는 서브넷의 네트워크 ACL에 해당 IP 인바운드 거부 규칙을 추가한다', why: '' },
          { id: 'c', text: 'DB 서브넷의 네트워크 ACL에 거부 규칙을 추가한다', why: '공격은 웹 서버로 들어와요. 안쪽 서브넷에서 막으면 웹 서버는 계속 시달려요.' },
          { id: 'd', text: '웹 서버 인스턴스 크기를 키운다', why: '버티는 시간만 늘 뿐 공격은 그대로예요.' },
        ],
        answer: 'b',
        explain: '네트워크 ACL은 서브넷 단위 방화벽으로 허용과 거부 규칙을 모두 쓸 수 있어요. 규칙 번호가 작은 것부터 평가하니, 거부 규칙을 허용 규칙보다 작은 번호로 넣어요. 공격이 들어오는 첫 서브넷(웹 계층)에서 막아야 해요.',
        hint: '"거부"를 할 수 있는 것과 없는 것을 구분해 보세요.',
      },
    },
    {
      t: 'quiz',
      scene: 'lounge',
      quiz: {
        who: 'peer',
        prompt: '주문 DB(MySQL)는 웹 서버에서만 접속해야 해요. 최소 권한에 맞는 DB 보안 그룹 인바운드 규칙은?',
        options: [
          { id: 'a', text: '0.0.0.0/0에서 3306 허용', why: '인터넷 어디서나 DB 포트로 들어올 수 있게 돼요.' },
          { id: 'b', text: 'VPC 전체 CIDR에서 3306 허용', why: 'VPC 안의 모든 리소스가 DB에 닿을 수 있어 최소 권한이 아니에요.' },
          { id: 'c', text: '웹 서버 보안 그룹 ID를 소스로 3306 허용', why: '' },
          { id: 'd', text: '웹 서버의 퍼블릭 IP에서 3306 허용', why: '같은 VPC 안 통신은 프라이빗 IP로 오고, 서버가 바뀌면 IP도 바뀌어요.' },
        ],
        answer: 'c',
        explain: '보안 그룹 규칙의 소스로 다른 보안 그룹 ID를 지정하면, 그 그룹이 붙은 인스턴스만 허용돼요. 웹 서버가 늘거나 교체돼도 규칙을 고칠 필요가 없어요. 보안 그룹은 상태 저장이라 응답 트래픽은 자동으로 허용돼요.',
        hint: 'IP 대신 "누구"로 지정하는 방법이 있어요.',
      },
    },
    { t: 'design' },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'bakery', text: '홈페이지가 다시 빨라졌어요! 아침 예약도 문제없이 받았어요.' },
        { who: 'senior', text: '네트워크 ACL은 상태 비저장이라 응답이 나가는 아웃바운드(임시 포트)도 열어 둬야 해요. 그건 잊지 마세요.' },
      ],
    },
  ],
  design: {
    brief: ['공격 IP는 웹 서버에 닿기 전에 서브넷 입구에서 차단', '손님 주문은 정상 접수', 'DB는 웹 서버만 접근'],
    layout: B('root', 'plain', '', [
      B('out', 'outside', '인터넷'),
      B('cloud', 'cloud', 'AWS 클라우드', [
        Z('edge', 'edge', '엣지', 'edge', 1),
        B('region', 'region', '리전 · 서울', [
          B('vpc', 'vpc', 'VPC', [
            B('vpcEdge', 'gate', 'VPC 경계'),
            B(
              'row',
              'plain',
              '',
              [Z('pub', 'public', '퍼블릭 서브넷 (웹)', 'subnet', 2), Z('priv', 'private', '프라이빗 서브넷 (DB)', 'subnet', 2)],
              'row',
            ),
          ]),
        ]),
      ]),
    ]),
    fixed: [
      { id: 'users', service: 'users', zone: 'out', label: '손님' },
      { id: 'attacker', service: 'users', zone: 'out', label: '공격 IP 3개' },
      IGW,
    ],
    fixedEdges: [
      ['users', 'igw'],
      ['attacker', 'igw'],
    ],
    palette: ['nacl', 'ec2', 'rds', 'waf', 'natgw'],
    answer: {
      nodes: [
        { id: 'a1', service: 'nacl', zone: 'pub', label: '네트워크 ACL (공격 IP 거부)' },
        { id: 'a2', service: 'ec2', zone: 'pub', label: '웹 서버' },
        { id: 'a3', service: 'rds', zone: 'priv' },
      ],
      edges: [
        ['igw', 'a1'],
        ['a1', 'a2'],
        ['a2', 'a3'],
      ],
    },
    answerNote: [
      '인터넷 게이트웨이 → 퍼블릭 서브넷 입구(네트워크 ACL) → 웹 서버 → RDS 순서예요. 네트워크 ACL은 서브넷 경계에서 먼저 검사해요.',
      '네트워크 ACL: 규칙 100 "공격 IP 거부", 규칙 200 "80·443 허용". 번호가 작은 규칙부터 적용돼요.',
      'DB 보안 그룹은 "웹 서버 보안 그룹에서 오는 3306"만 허용해요.',
      'WAF는 EC2에 직접 붙이지 못해요. 쓰려면 CloudFront나 ALB 앞에 두는 구조로 바꿔야 해요(이번 범위 밖).',
    ],
  },
  scenarios: [
    {
      id: 'order',
      icon: '🥐',
      title: '손님 예약 주문',
      desc: '손님이 내일 아침 빵을 예약합니다.',
      check: (c) => (c.path(['users', 'igw', 'nacl|ec2', 'ec2', 'rds']) || c.path(['users', 'igw', 'ec2', 'rds']) ? ok('웹 서버를 거쳐 주문이 DB에 저장됐어요.') : bad('손님 → 인터넷 게이트웨이 → (네트워크 ACL) → 웹 서버 → RDS 경로를 만들어 주세요.')),
    },
    {
      id: 'attack',
      icon: '🚫',
      title: '공격 IP 대량 요청',
      desc: '공격 IP 3개가 1초에 수천 번 요청합니다.',
      load: 4,
      check: (c) => {
        if (c.linked('waf', 'ec2')) return bad('WAF는 EC2 인스턴스에 직접 연결할 수 없어요.')
        if (c.linked('igw', 'ec2')) return bad('인터넷 게이트웨이가 웹 서버로 바로 연결돼 서브넷 입구 검사가 없어요. 공격 요청이 그대로 들어왔어요.')
        return c.path(['igw', 'nacl', 'ec2@pub']) ? ok('네트워크 ACL 거부 규칙이 서브넷 입구에서 공격 IP를 막아 웹 서버가 다시 빨라졌어요.') : bad('공격 IP를 거부할 장치가 없어요. 웹 서브넷 입구에 네트워크 ACL을 두세요.')
      },
    },
    {
      id: 'db',
      icon: '🔒',
      title: 'DB 접근 점검',
      desc: '외부에서 DB로 들어올 길이 있는지 봅니다.',
      check: (c) => {
        if (c.has('rds', 'pub')) return bad('DB가 퍼블릭 서브넷에 있어요. 프라이빗 서브넷으로 옮기세요.')
        if (c.linked('igw', 'rds') || c.linked('nacl', 'rds')) return bad('DB가 인터넷 쪽과 바로 연결돼 있어요.')
        return c.path(['ec2', 'rds@priv']) ? ok('DB는 프라이빗 서브넷에 있고 웹 서버만 접근해요.') : bad('웹 서버 → 프라이빗 서브넷 DB 연결이 없어요.')
      },
    },
    {
      id: 'cost',
      icon: '💰',
      title: '비용 점검',
      desc: '필요 없는 리소스가 있는지 봅니다.',
      check: (c) => (c.has('natgw') ? bad('NAT 게이트웨이는 시간당 요금이 나와요. 이번 요구에는 필요 없어요.') : c.has('nacl') ? ok('네트워크 ACL과 보안 그룹은 추가 요금이 없어요.') : bad('차단 장치가 없어요.')),
    },
  ],
}

const b2: Project = {
  id: 'wedding-storage-class',
  level: 1,
  title: '웨딩 사진 보관 비용 줄이기',
  client: 'wedding',
  org: '스튜디오 화이트데이',
  summary: '데이터 성격에 맞게 S3 스토리지 클래스 고르기\nIntelligent-Tiering, One Zone-IA, Glacier Deep Archive',
  topics: ['S3 스토리지 클래스', 'Intelligent-Tiering', 'One Zone-IA', '수명 주기'],
  env: 'AWS',
  steps: [
    {
      t: 'talk',
      scene: 'office',
      lines: [
        { who: 'lead', text: '웨딩 스튜디오 화이트데이가 S3 비용이 매달 늘어서 고민이래요. 전부 S3 Standard에 넣어 뒀대요.' },
        { who: 'senior', text: '데이터마다 쓰는 방식이 다를 거예요. 종류별로 나눠 보죠.' },
      ],
    },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'wedding', text: '원본 사진은 촬영 후 한 달 동안 신랑·신부가 엄청 봐요. 그 뒤로는 언제 다시 볼지 몰라요. 몇 년 뒤 갑자기 액자 주문이 오기도 해요.' },
        { who: 'wedding', text: '미리보기용 작은 사진은 원본으로 언제든 다시 만들 수 있어요. 계약서 스캔본은 5년 보관이 의무인데 거의 안 봐요. 꺼내는 데 반나절 걸려도 괜찮아요.' },
        { who: 'me', text: '세 종류를 각각 맞는 클래스에 넣겠습니다.' },
      ],
    },
    {
      t: 'quiz',
      scene: 'office',
      quiz: {
        who: 'senior',
        prompt: '원본 사진은 30일 동안 자주 보고, 그 뒤 액세스 패턴을 예측할 수 없어요. 가용성을 유지하면서 비용을 최적화하려면?',
        options: [
          { id: 'a', text: '30일 후 S3 Standard-IA로 옮긴다', why: '저빈도 클래스라 조회할 때마다 검색 요금이 붙어요. 패턴이 일정하지 않으면 오히려 비쌀 수 있어요.' },
          { id: 'b', text: '30일 후 S3 Intelligent-Tiering으로 옮긴다', why: '' },
          { id: 'c', text: '30일 후 S3 One Zone-IA로 옮긴다', why: '한 AZ에만 저장해 AZ 손실에 약해요. 다시 만들 수 없는 원본에는 맞지 않아요.' },
          { id: 'd', text: '30일 후 S3 Glacier Deep Archive로 옮긴다', why: '꺼내는 데 수 시간이 걸려요. 갑자기 온 액자 주문에 바로 응대하기 어려워요.' },
        ],
        answer: 'b',
        explain: 'Intelligent-Tiering은 객체마다 접근을 지켜보다가 30일 연속 접근이 없으면 저빈도 계층으로 자동으로 옮겨요. 다시 접근하면 자주 쓰는 계층으로 되돌아오고, 검색 요금이 없어요. "예측할 수 없는 패턴"이 나오면 Intelligent-Tiering을 떠올리세요.',
        hint: '"예측할 수 없다"는 말이 결정적 힌트예요.',
      },
    },
    {
      t: 'quiz',
      scene: 'lounge',
      quiz: {
        who: 'peer',
        prompt: '미리보기 사진은 원본으로 언제든 다시 만들 수 있고 가끔 조회해요. 가장 비용 효율적인 클래스는?',
        options: [
          { id: 'a', text: 'S3 Standard', why: '자주 읽는 데이터용이라 가끔 보는 데이터에는 비싸요.' },
          { id: 'b', text: 'S3 One Zone-IA', why: '' },
          { id: 'c', text: 'S3 Glacier Deep Archive', why: '가끔이라도 바로 보여야 하는 미리보기에 수 시간 복원은 맞지 않아요.' },
          { id: 'd', text: 'EBS 볼륨', why: 'EC2에 붙는 디스크라 이런 보관에는 비싸고 관리가 필요해요.' },
        ],
        answer: 'b',
        explain: 'One Zone-IA는 한 AZ에만 저장해 Standard-IA보다 싸요. AZ가 손실되면 데이터도 잃을 수 있어서, 다시 만들 수 있는 데이터에 맞아요. Standard-IA와 마찬가지로 최소 보관 기간(30일)과 검색 요금이 있어요.',
        hint: '"다시 만들 수 있다"면 내구성을 조금 양보해도 돼요.',
      },
    },
    { t: 'design' },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'wedding', text: '이번 달 S3 비용이 절반 아래로 줄었어요. 5년 전 계약서도 다음 날 아침에 받았고요!' },
        { who: 'lead', text: '데이터 성격을 먼저 물어본 게 정답이었어요.' },
      ],
    },
  ],
  design: {
    brief: ['원본: 30일 자주 → 이후 예측 불가, AZ 손실에도 안전해야 함', '미리보기: 다시 만들 수 있음, 가끔 조회', '계약서: 5년 보관, 거의 안 봄, 복원 반나절 OK'],
    layout: B('root', 'plain', '', [
      B('out', 'outside', '고객·사무실'),
      B('cloud', 'cloud', 'AWS 클라우드', [
        B('region', 'region', '리전 · 서울', [
          Z('upload', 'plain', '업로드·처리', 'region', 2),
          Z('classes', 'plain', '보관 (스토리지 클래스)', 'region', 4),
        ]),
      ]),
    ]),
    fixed: [
      { id: 'users', service: 'users', zone: 'out', label: '신랑·신부' },
      { id: 'staff', service: 'users', zone: 'out', label: '사무실 직원' },
      { id: 'thumb', service: 'lambda', zone: 'upload', label: '미리보기 생성' },
    ],
    palette: ['s3', 's3it', 's3ia', 's3onezone', 'glacier', 'ebs'],
    answer: {
      nodes: [
        { id: 'a1', service: 's3', zone: 'upload', label: 'S3 Standard (원본, 첫 30일)' },
        { id: 'a2', service: 's3it', zone: 'classes', label: 'Intelligent-Tiering (원본 30일 후)' },
        { id: 'a3', service: 's3onezone', zone: 'classes', label: 'One Zone-IA (미리보기)' },
        { id: 'a4', service: 'glacier', zone: 'classes', label: 'Deep Archive (계약서)' },
      ],
      edges: [
        ['users', 'a1'],
        ['a1', 'a2'],
        ['a1', 'thumb'],
        ['thumb', 'a3'],
        ['staff', 'a4'],
      ],
    },
    answerNote: [
      'S3 Standard → Intelligent-Tiering 선은 수명 주기 규칙(30일 후 전환)이에요.',
      '원본 업로드 이벤트가 Lambda를 불러 미리보기를 One Zone-IA 클래스로 저장해요.',
      '계약서는 처음부터 Deep Archive 클래스로 올리거나, 수명 주기로 옮겨요. 표준 검색은 12시간 이내예요.',
      '실제로는 한 버킷 안에서 접두사(폴더)별 수명 주기 규칙으로 나눌 수도 있어요. 그림에서는 클래스별로 나눠 그렸어요.',
    ],
  },
  scenarios: [
    {
      id: 'view',
      icon: '💍',
      title: '촬영 직후 사진 확인',
      desc: '신랑·신부가 원본을 계속 넘겨 봅니다.',
      check: (c) => (c.linked('users', 's3onezone') ? bad('원본이 One Zone-IA에 있어요. 다시 만들 수 없는 원본은 여러 AZ에 저장해야 해요.') : c.linked('users', 's3') ? ok('첫 30일은 S3 Standard에서 빠르게 봤어요.') : bad('신랑·신부가 원본을 볼 곳이 없어요. S3 Standard에 올리도록 연결하세요.')),
    },
    {
      id: 'later',
      icon: '🖼️',
      title: '3년 뒤 갑자기 액자 주문',
      desc: '오래된 원본을 바로 꺼내야 합니다.',
      check: (c) => {
        if (c.linked('s3', 'glacier') && !c.linked('s3', 's3it')) return bad('원본이 Deep Archive로 가 있어 복원에 수 시간이 걸렸어요.')
        if (c.linked('s3', 's3ia') && !c.linked('s3', 's3it')) return bad('Standard-IA는 패턴이 들쭉날쭉하면 검색 요금이 쌓여요. 예측할 수 없는 패턴엔 Intelligent-Tiering이 맞아요.')
        return c.linked('s3', 's3it') ? ok('Intelligent-Tiering이라 바로 꺼냈고, 안 보던 기간에는 저렴한 계층에 있었어요.') : bad('30일 후 원본을 옮길 수명 주기 규칙이 없어 계속 Standard 요금이 나가요.')
      },
    },
    {
      id: 'thumb',
      icon: '🧩',
      title: '미리보기 저장',
      desc: '원본마다 작은 사진을 만듭니다.',
      check: (c) => {
        if (!c.linked('s3', 'thumb')) return bad('원본이 올라와도 미리보기 Lambda가 불리지 않아요. S3 → 미리보기 생성 연결이 필요해요.')
        if (c.linked('thumb', 's3onezone')) return ok('다시 만들 수 있는 미리보기는 One Zone-IA로 가장 싸게 보관했어요.')
        if (c.linked('thumb', 's3ia') || c.linked('thumb', 's3it')) return bad('동작은 하지만, 다시 만들 수 있는 데이터라 One Zone-IA로 더 아낄 수 있어요.')
        return bad('미리보기를 저장할 클래스를 연결해 주세요.')
      },
    },
    {
      id: 'contract',
      icon: '📜',
      title: '5년 전 계약서 요청',
      desc: '분쟁 때문에 계약서가 필요해요. 내일 아침까지면 됩니다.',
      check: (c) => (c.linked('staff', 'glacier') ? ok('Deep Archive에서 12시간 안에 복원했어요. 보관 비용은 가장 낮았어요.') : c.linked('staff', 's3') || c.linked('staff', 's3it') || c.linked('staff', 's3ia') ? bad('거의 안 보는 5년 보관 문서에 비싼 클래스를 썼어요.') : bad('계약서를 보관할 곳이 없어요.')),
    },
  ],
}

const b3: Project = {
  id: 'mall-iam-role',
  level: 1,
  title: '깃허브에 올라간 액세스 키',
  client: 'mall',
  org: '모아몰',
  summary: '서버가 AWS에 접근할 때는 키 대신 역할로\nIAM 역할, 그룹, 최소 권한',
  topics: ['IAM 역할', '인스턴스 프로파일', 'IAM 그룹·정책', '최소 권한'],
  env: 'AWS',
  steps: [
    {
      t: 'talk',
      scene: 'office',
      lines: [
        { who: 'lead', text: '모아몰 개발자가 S3 업로드 코드에 액세스 키를 넣은 채로 깃허브 공개 저장소에 올렸대요. 몇 시간 만에 누가 그 키로 서버를 수십 대 띄웠고요.' },
        { who: 'peer', text: '헉… 키를 지우고 새로 만들면 끝 아닌가요?' },
        { who: 'senior', text: '새 키도 어딘가에 또 넣어야 하잖아요. 키를 아예 안 쓰는 방법이 있어요.' },
      ],
    },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'mall', text: '주문 서버가 영수증 PDF를 S3에 저장해야 해요. 다음 달에 신입 개발자 5명도 들어오는데, 권한은 어떻게 주죠?' },
        { who: 'me', text: '서버에는 역할을, 사람에게는 그룹으로 필요한 권한만 주겠습니다.' },
      ],
    },
    {
      t: 'quiz',
      scene: 'office',
      quiz: {
        who: 'senior',
        prompt: 'EC2의 애플리케이션이 S3 버킷에 쓰기를 해야 해요. 가장 안전한 방법은?',
        options: [
          { id: 'a', text: 'IAM 사용자 액세스 키를 애플리케이션 설정 파일에 넣는다', why: '키가 파일에 남아 유출될 수 있고, 교체도 직접 해야 해요.' },
          { id: 'b', text: '필요한 S3 권한만 가진 IAM 역할을 만들어 EC2 인스턴스 프로파일로 연결한다', why: '' },
          { id: 'c', text: '루트 사용자 액세스 키를 환경 변수에 넣는다', why: '루트는 계정의 모든 권한이에요. 루트 액세스 키는 만들지 않는 게 원칙이에요.' },
          { id: 'd', text: 'S3 버킷을 퍼블릭 쓰기로 연다', why: '누구나 버킷에 쓸 수 있게 돼요.' },
        ],
        answer: 'b',
        explain: 'EC2에 IAM 역할을 연결하면, 인스턴스 안의 SDK가 임시 자격 증명을 자동으로 받아 쓰고 주기적으로 갱신돼요. 코드나 파일에 키가 남지 않아요. 역할에는 해당 버킷에 필요한 작업만 허용해요(최소 권한).',
        hint: 'AWS 서비스에 권한을 줄 때 쓰는 IAM 구성 요소예요.',
      },
    },
    {
      t: 'quiz',
      scene: 'lounge',
      quiz: {
        who: 'peer',
        prompt: '같은 업무를 하는 신입 개발자 5명에게 권한을 주는 가장 안전하고 관리하기 쉬운 방법은?',
        options: [
          { id: 'a', text: '각자에게 AdministratorAccess를 준다', why: '필요 이상 권한이라 최소 권한 원칙에 어긋나요.' },
          { id: 'b', text: '최소 권한 IAM 정책을 만들어 IAM 그룹에 연결하고, 5명을 그룹에 넣는다', why: '' },
          { id: 'c', text: '루트 사용자 로그인 정보를 공유한다', why: '누가 무엇을 했는지 구분할 수 없고 가장 위험해요.' },
          { id: 'd', text: '서비스 제어 정책(SCP)으로 권한을 준다', why: 'SCP는 Organizations에서 계정이 쓸 수 있는 권한의 상한을 정할 뿐, 권한을 부여하지 않아요.' },
        ],
        answer: 'b',
        explain: '권한은 정책으로 정의하고, 같은 역할의 사람들은 IAM 그룹으로 묶어 정책을 한 번에 적용해요. 사람이 바뀌면 그룹에서 넣고 빼기만 하면 돼요. 루트 사용자에는 MFA를 걸고 일상 작업에 쓰지 않아요.',
        hint: '사람이 여러 명이면 "묶어서" 관리해요.',
      },
    },
    { t: 'design' },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'mall', text: '코드에서 키를 전부 지웠는데도 영수증이 잘 저장돼요. 신입들도 그룹에 넣기만 하니 편하네요.' },
        { who: 'senior', text: '"키가 없으면 유출될 키도 없다." 기억해 두세요.' },
      ],
    },
  ],
  design: {
    brief: ['주문 서버(EC2)가 영수증 PDF를 S3에 저장', '코드·파일에 액세스 키 없이', '권한은 해당 버킷 쓰기만'],
    layout: B('root', 'plain', '', [
      B('out', 'outside', '인터넷'),
      B('cloud', 'cloud', 'AWS 클라우드', [
        Z('iam', 'edge', '글로벌 · IAM', 'global', 2),
        B('region', 'region', '리전 · 서울', [
          B('vpc', 'vpc', 'VPC', [B('vpcEdge', 'gate', 'VPC 경계'), Z('pub', 'public', '퍼블릭 서브넷', 'subnet', 2)]),
          Z('svc', 'plain', '리전 서비스', 'region', 2),
        ]),
      ]),
    ]),
    fixed: [{ id: 'users', service: 'users', zone: 'out', label: '쇼핑 고객' }, IGW],
    fixedEdges: [['users', 'igw']],
    palette: ['ec2', 's3', 'iamrole', 'accesskey', 'natgw'],
    answer: {
      nodes: [
        { id: 'a1', service: 'ec2', zone: 'pub', label: '주문 서버' },
        { id: 'a2', service: 's3', zone: 'svc', label: 'S3 (영수증)' },
        { id: 'a3', service: 'iamrole', zone: 'iam', label: 'IAM 역할 (영수증 버킷 쓰기)' },
      ],
      edges: [
        ['igw', 'a1'],
        ['a1', 'a2'],
        ['a3', 'a1'],
      ],
    },
    answerNote: [
      'IAM 역할 → 주문 서버 선은 인스턴스 프로파일 연결이에요. 역할 정책은 "영수증 버킷에 s3:PutObject"만 허용해요.',
      '역할의 임시 자격 증명은 자동으로 갱신돼요. 코드에는 SDK 기본 설정만 두면 돼요.',
      '이미 유출된 키는 즉시 비활성화·삭제하고, CloudTrail로 그 키가 한 일을 확인해요.',
    ],
  },
  scenarios: [
    {
      id: 'order',
      icon: '🧾',
      title: '주문 → 영수증 저장',
      desc: '고객이 주문하면 서버가 영수증을 S3에 씁니다.',
      check: (c) => {
        if (!c.path(['users', 'igw', 'ec2', 's3'])) return bad('고객 → 인터넷 게이트웨이 → 주문 서버 → S3 경로를 만들어 주세요.')
        if (!c.linked('ec2', 'iamrole') && !c.linked('ec2', 'accesskey')) return bad('서버에 S3 권한이 없어 AccessDenied 오류가 났어요.')
        return ok('영수증이 S3에 저장됐어요.')
      },
    },
    {
      id: 'leak',
      icon: '🐙',
      title: '코드 공개 저장소 점검',
      desc: '보안팀이 코드 저장소에서 비밀 값을 찾습니다.',
      check: (c) => (c.has('accesskey') ? bad('설정 파일에 액세스 키가 있어요. 또 유출될 수 있어요.') : c.linked('iamrole', 'ec2') ? ok('코드와 파일 어디에도 키가 없어요. 서버는 역할의 임시 자격 증명을 써요.') : bad('서버가 쓸 자격 증명이 없어요.')),
    },
    {
      id: 'rotate',
      icon: '🔄',
      title: '자격 증명 교체 주기',
      desc: '보안 규정상 자격 증명을 정기적으로 바꿔야 합니다.',
      check: (c) => (c.linked('iamrole', 'ec2') && !c.has('accesskey') ? ok('역할의 임시 자격 증명은 AWS가 알아서 자주 바꿔요. 사람이 할 일이 없어요.') : bad('장기 액세스 키는 사람이 직접 교체해야 하고, 교체할 때마다 코드도 바꿔야 해요.')),
    },
  ],
}

const b4: Project = {
  id: 'academy-audit',
  level: 1,
  title: '누가 22번 포트를 열었나',
  client: 'academy',
  org: '한빛어학원',
  summary: '"누가 했나", "무엇이 바뀌었나", "지금 상태는"을 구분하기\nCloudTrail, Config, CloudWatch',
  topics: ['CloudTrail', 'AWS Config', 'CloudWatch 경보', '감사'],
  env: 'AWS',
  steps: [
    {
      t: 'talk',
      scene: 'office',
      lines: [
        { who: 'lead', text: '한빛어학원 서버 보안 그룹에 SSH 22번이 0.0.0.0/0으로 열려 있었대요. 누가 언제 열었는지 아무도 모른대요.' },
        { who: 'peer', text: '로그 보면 되지 않아요? CloudWatch… 아니 CloudTrail? 헷갈리네요.' },
        { who: 'senior', text: '그 셋을 구분하는 게 이번 프로젝트의 핵심이에요.' },
      ],
    },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'academy', text: '앞으로는 누가 무엇을 했는지 1년간 남겨야 해요. 교육청 감사가 있거든요.' },
        { who: 'academy', text: '규칙에 어긋나는 설정이 생기면 바로 알고 싶고, 수강 신청 날 서버 CPU가 치솟으면 알림도 받고 싶어요.' },
        { who: 'me', text: '기록, 설정 감시, 성능 감시를 각각 맞는 서비스로 나누겠습니다.' },
      ],
    },
    {
      t: 'quiz',
      scene: 'office',
      quiz: {
        who: 'senior',
        prompt: '규정 준수를 위해 AWS 리소스의 구성 변경을 추적하고, 리소스에 대한 API 호출 기록도 남겨야 해요. 올바른 조합은?',
        options: [
          { id: 'a', text: '구성 변경 추적은 CloudTrail, API 호출 기록은 AWS Config', why: '역할이 서로 뒤바뀌었어요.' },
          { id: 'b', text: '구성 변경 추적은 AWS Config, API 호출 기록은 CloudTrail', why: '' },
          { id: 'c', text: '구성 변경 추적은 AWS Config, API 호출 기록은 CloudWatch', why: 'CloudWatch는 지표·로그 모니터링이에요. "누가 어떤 API를 호출했는지"는 CloudTrail이 기록해요.' },
          { id: 'd', text: '둘 다 CloudWatch 경보로 한다', why: '경보는 지표가 기준을 넘었는지 볼 뿐, 변경 이력이나 호출자를 남기지 않아요.' },
        ],
        answer: 'b',
        explain: 'CloudTrail은 "누가, 언제, 어떤 API를 호출했나"를 기록해요. AWS Config는 리소스 설정이 "어떻게 바뀌어 왔나"를 기록하고, 규칙(예: SSH가 0.0.0.0/0에 열린 보안 그룹 금지)으로 위반을 찾아내요. CloudWatch는 CPU 같은 지표와 로그를 보고 경보를 울려요.',
        hint: 'Trail = 발자취(누가), Config = 설정(무엇이 어떻게).',
      },
    },
    {
      t: 'quiz',
      scene: 'lounge',
      quiz: {
        who: 'peer',
        prompt: '아무 설정을 안 해도 CloudTrail 콘솔의 이벤트 기록에서 볼 수 있는 관리 이벤트는 최근 며칠치일까요?',
        options: [
          { id: 'a', text: '7일', why: '그보다 길어요.' },
          { id: 'b', text: '90일', why: '' },
          { id: 'c', text: '1년', why: '1년을 남기려면 직접 설정해야 해요.' },
          { id: 'd', text: '무제한', why: '이벤트 기록은 기간이 정해져 있어요.' },
        ],
        answer: 'b',
        explain: '이벤트 기록은 최근 90일치 관리 이벤트만 보여 줘요. 그보다 오래 보관하려면 추적(trail)을 만들어 S3 버킷에 로그 파일로 쌓고, 수명 주기 규칙으로 보관 기간과 클래스를 관리해요.',
        hint: '분기(3개월) 정도예요.',
      },
    },
    { t: 'design' },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'academy', text: '22번을 연 사람을 바로 찾았어요. 외주 업체 계정이었어요! 지금은 Config가 바로 알려 줘요.' },
        { who: 'lead', text: '"누가 / 무엇이 / 지금 상태" 세 질문에 각각 답할 수 있게 됐네요.' },
      ],
    },
  ],
  design: {
    brief: ['누가 언제 어떤 작업을 했는지 1년 보관', '보안 그룹 설정 위반을 감지', '서버 CPU 과부하 시 담당자에게 알림'],
    layout: B('root', 'plain', '', [
      B('out', 'outside', '어학원 사무실'),
      B('cloud', 'cloud', 'AWS 클라우드', [
        B('region', 'region', '리전 · 서울', [
          B('vpc', 'vpc', 'VPC', [Z('pub', 'public', '퍼블릭 서브넷', 'subnet', 1)]),
          Z('mgmt', 'plain', '관리·감사 서비스', 'region', 4),
          Z('store', 'plain', '저장·알림', 'region', 3),
        ]),
      ]),
    ]),
    fixed: [
      { id: 'admin', service: 'users', zone: 'out', label: '전산 담당자' },
      { id: 'web', service: 'ec2', zone: 'pub', label: '수강 신청 서버' },
    ],
    palette: ['cloudtrail', 'config', 'cloudwatch', 's3', 'sns', 'lambda'],
    answer: {
      nodes: [
        { id: 'a1', service: 'cloudtrail', zone: 'mgmt', label: 'CloudTrail 추적' },
        { id: 'a2', service: 'config', zone: 'mgmt', label: 'AWS Config (restricted-ssh 규칙)' },
        { id: 'a3', service: 'cloudwatch', zone: 'mgmt', label: 'CloudWatch 경보 (CPU 80%)' },
        { id: 'a4', service: 's3', zone: 'store', label: 'S3 (감사 로그 1년)' },
        { id: 'a5', service: 'sns', zone: 'store' },
      ],
      edges: [
        ['a1', 'a4'],
        ['a2', 'web'],
        ['a3', 'web'],
        ['a3', 'a5'],
        ['a2', 'a5'],
        ['a5', 'admin'],
      ],
    },
    answerNote: [
      'CloudTrail 추적 → S3: 모든 리전의 관리 이벤트를 로그 파일로 쌓아요. S3 수명 주기로 1년 뒤 삭제하거나 저렴한 클래스로 옮겨요.',
      'AWS Config: 리소스 구성 이력을 기록하고, 관리형 규칙 restricted-ssh로 0.0.0.0/0에 22번이 열린 보안 그룹을 비준수로 표시해요.',
      'CloudWatch 경보 → SNS → 담당자 메일/문자. Config 규칙 위반 알림도 SNS로 받을 수 있어요.',
    ],
  },
  scenarios: [
    {
      id: 'who',
      icon: '🕵️',
      title: '22번을 연 사람 찾기',
      desc: '3주 전 보안 그룹을 바꾼 사람을 찾습니다.',
      check: (c) => (c.has('cloudtrail') ? ok('CloudTrail에 AuthorizeSecurityGroupIngress 호출자와 시간이 남아 있었어요.') : c.has('cloudwatch') || c.has('config') ? bad('지표나 설정 이력으로는 "누가" 호출했는지 알 수 없어요. API 호출 기록이 필요해요.') : bad('작업 기록을 남기는 서비스가 없어요.')),
    },
    {
      id: 'audit',
      icon: '📋',
      title: '교육청 감사 (10개월 전 기록)',
      desc: '10개월 전 작업 기록을 요구합니다.',
      check: (c) => (c.linked('cloudtrail', 's3') ? ok('추적이 S3에 쌓아 둔 로그 파일에서 10개월 전 기록을 찾았어요.') : c.has('cloudtrail') ? bad('이벤트 기록은 90일치뿐이에요. 추적을 만들어 S3에 보관하세요.') : bad('작업 기록이 없어요.')),
    },
    {
      id: 'drift',
      icon: '🧭',
      title: '또 누군가 22번을 열었다',
      desc: '보안 그룹에 0.0.0.0/0 → 22번 규칙이 새로 생겼어요.',
      check: (c) => (c.linked('config', 'web') ? (c.path(['config', 'sns', 'admin']) ? ok('Config 규칙이 바로 비준수로 표시하고 담당자에게 알렸어요.') : ok('Config 규칙이 비준수로 표시했어요. SNS로 알림까지 연결하면 더 빨라요.')) : bad('설정 위반을 감지할 장치가 없어요. AWS Config 규칙을 서버 리소스에 적용하세요.')),
    },
    {
      id: 'cpu',
      icon: '📈',
      title: '수강 신청 날 CPU 95%',
      desc: '서버 CPU가 치솟습니다.',
      load: 3,
      check: (c) => (c.linked('cloudwatch', 'web') && c.path(['cloudwatch', 'sns', 'admin']) ? ok('CloudWatch 경보가 SNS로 담당자에게 바로 알렸어요.') : c.has('cloudtrail') && !c.has('cloudwatch') ? bad('CloudTrail은 API 호출 기록이라 CPU를 보지 않아요.') : bad('CPU를 지켜보고 알려 줄 경보 → SNS → 담당자 연결이 필요해요.')),
    },
  ],
}

const b5: Project = {
  id: 'firstvpc-cidr',
  level: 1,
  title: '첫 VPC 주소 설계',
  client: 'logistics',
  org: '한결물류',
  summary: '본사망과 겹치지 않는 CIDR, AZ마다 NAT 게이트웨이\nVPC CIDR, 서브넷 IP 개수, NAT 이중화',
  topics: ['VPC CIDR', '서브넷 예약 IP', 'NAT 게이트웨이 이중화', '가용 영역'],
  env: 'AWS',
  steps: [
    {
      t: 'talk',
      scene: 'office',
      lines: [
        { who: 'lead', text: '한결물류가 처음으로 AWS에 VPC를 만든대요. 나중에 본사와 VPN으로 연결할 계획이에요.' },
        { who: 'senior', text: '그렇다면 주소 대역부터 잘 정해야 해요. 나중에 바꾸기 정말 어렵거든요.' },
      ],
    },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'logistics', text: '본사 네트워크는 10.0.0.0/16을 써요. 배송 조회 서버는 두 AZ에 두고, 서버들이 업데이트를 받으려면 인터넷으로 나가야 해요.' },
        { who: 'logistics', text: '예전에 AZ 하나가 멈췄을 때 반대쪽 서버까지 업데이트가 안 됐다는 얘기를 들었어요. 그것도 막아 주세요.' },
        { who: 'me', text: '겹치지 않는 대역을 고르고, NAT 게이트웨이를 AZ마다 두겠습니다.' },
      ],
    },
    {
      t: 'quiz',
      scene: 'office',
      quiz: {
        who: 'senior',
        prompt: '본사가 10.0.0.0/16을 쓰고, 나중에 VPN으로 연결해요. 새 VPC의 IPv4 CIDR로 알맞은 것은?',
        options: [
          { id: 'a', text: '10.0.0.0/16', why: '본사와 대역이 겹쳐 VPN 연결 후 라우팅이 꼬여요.' },
          { id: 'b', text: '10.1.0.0/16', why: '' },
          { id: 'c', text: '10.0.0.0/8', why: 'VPC CIDR은 /16보다 클 수 없고, 본사 대역도 포함해 버려요.' },
          { id: 'd', text: '10.1.0.0/30', why: 'VPC CIDR은 /28보다 작을 수 없어요.' },
        ],
        answer: 'b',
        explain: 'VPC CIDR 크기는 /16(65,536개)부터 /28(16개)까지예요. 연결할 네트워크(본사, 다른 VPC)와 겹치지 않아야 VPN·피어링·TGW 라우팅이 돼요. 나중에 주소가 모자라면 VPC에 보조 CIDR 블록을 추가할 수 있어요.',
        hint: '크기 제한(/16~/28)과 "겹치지 않기" 두 조건이에요.',
      },
    },
    {
      t: 'quiz',
      scene: 'lounge',
      quiz: {
        who: 'peer',
        prompt: '서브넷을 10.1.1.0/24로 만들면 EC2 같은 리소스에 줄 수 있는 IP는 몇 개일까요?',
        options: [
          { id: 'a', text: '256개', why: '전체 주소 수예요. AWS가 예약하는 주소가 있어요.' },
          { id: 'b', text: '254개', why: '일반 네트워크처럼 2개만 빼면 틀려요. AWS는 더 많이 예약해요.' },
          { id: 'c', text: '251개', why: '' },
          { id: 'd', text: '128개', why: '/25의 주소 수예요.' },
        ],
        answer: 'c',
        explain: 'AWS는 서브넷마다 5개를 예약해요. 네트워크 주소(.0), VPC 라우터(.1), DNS(.2), 향후 예약(.3), 브로드캐스트(.255)예요. 그래서 /24는 256 − 5 = 251개예요.',
        hint: '앞쪽 4개 + 마지막 1개.',
      },
    },
    { t: 'design' },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'logistics', text: 'AZ 장애 훈련 때도 남은 AZ 서버가 업데이트를 잘 받았어요. 본사 VPN 연결도 주소 걱정 없이 진행 중이에요.' },
        { who: 'senior', text: 'NAT 게이트웨이는 AZ 단위 리소스예요. 하나만 두면 그게 단일 장애 지점이 돼요.' },
      ],
    },
  ],
  design: {
    brief: ['VPC 10.1.0.0/16 (본사 10.0.0.0/16과 겹치지 않게)', '배송 조회 서버: 두 AZ의 프라이빗 서브넷', '서버 업데이트용 아웃바운드 인터넷', 'AZ 하나가 멈춰도 다른 AZ는 계속 아웃바운드 가능'],
    layout: B('root', 'plain', '', [
      B('out', 'outside', '인터넷'),
      B('cloud', 'cloud', 'AWS 클라우드', [
        B('region', 'region', '리전 · 서울', [
          B('vpc', 'vpc', 'VPC · 10.1.0.0/16', [
            B('vpcEdge', 'gate', 'VPC 경계'),
            Z('albZone', 'public', '퍼블릭 서브넷 A·B (ALB)', 'subnet', 1),
            B(
              'azRow',
              'plain',
              '',
              [
                B('azA', 'az', '가용 영역 A', [Z('pubA', 'public', '퍼블릭 10.1.1.0/24', 'subnet', 1), Z('privA', 'private', '프라이빗 10.1.11.0/24', 'subnet', 2)]),
                B('azB', 'az', '가용 영역 B', [Z('pubB', 'public', '퍼블릭 10.1.2.0/24', 'subnet', 1), Z('privB', 'private', '프라이빗 10.1.12.0/24', 'subnet', 2)]),
              ],
              'row',
            ),
          ]),
        ]),
      ]),
    ]),
    fixed: [{ id: 'users', service: 'users', zone: 'out', label: '배송 조회 고객' }, IGW],
    fixedEdges: [['users', 'igw']],
    palette: ['alb', 'ec2', 'natgw', 'vpce', 'dx'],
    answer: {
      nodes: [
        { id: 'a1', service: 'alb', zone: 'albZone' },
        { id: 'a2', service: 'ec2', zone: 'privA', label: '배송 조회 서버' },
        { id: 'a3', service: 'ec2', zone: 'privB', label: '배송 조회 서버' },
        { id: 'a4', service: 'natgw', zone: 'pubA' },
        { id: 'a5', service: 'natgw', zone: 'pubB' },
      ],
      edges: [
        ['igw', 'a1'],
        ['a1', 'a2'],
        ['a1', 'a3'],
        ['a2', 'a4'],
        ['a3', 'a5'],
        ['a4', 'igw'],
        ['a5', 'igw'],
      ],
    },
    answerNote: [
      '각 AZ의 프라이빗 서브넷 라우팅 테이블은 0.0.0.0/0을 같은 AZ의 NAT 게이트웨이로 보내요. NAT 게이트웨이는 퍼블릭 서브넷에 있고 인터넷 게이트웨이로 나가요.',
      'NAT 게이트웨이를 하나만 두면 그 AZ가 멈출 때 다른 AZ 서버도 밖으로 못 나가요. AZ를 넘나드는 데이터 요금도 생겨요.',
      '/24 서브넷마다 AWS 예약 5개를 빼면 251개 IP를 쓸 수 있어요.',
    ],
  },
  scenarios: [
    {
      id: 'track',
      icon: '📦',
      title: '배송 조회',
      desc: '고객이 송장 번호로 조회합니다.',
      check: (c) => (c.path(['users', 'igw', 'alb', 'ec2']) ? (c.has('ec2', 'pubA') || c.has('ec2', 'pubB') ? bad('조회 서버가 퍼블릭 서브넷에 있어요. ALB 뒤 프라이빗 서브넷에 두세요.') : ok('ALB가 두 AZ의 서버로 요청을 나눴어요.')) : bad('고객 → 인터넷 게이트웨이 → ALB → 조회 서버 경로를 만들어 주세요.')),
    },
    {
      id: 'update',
      icon: '⬇️',
      title: '보안 업데이트 다운로드',
      desc: '프라이빗 서버가 인터넷에서 패치를 받습니다.',
      check: (c) => {
        if (c.linked('ec2', 'vpce') && !c.linked('ec2', 'natgw')) return bad('S3 게이트웨이 엔드포인트는 S3 전용이에요. 인터넷의 업데이트 서버에는 못 가요.')
        const all = c.nodes('ec2').length > 0 && c.nodes('ec2').every((n) => c.path([n.id, 'natgw', 'igw']))
        return all ? ok('모든 서버가 NAT 게이트웨이를 거쳐 패치를 받았어요.') : bad('일부 서버가 밖으로 나갈 길이 없어요. 서버 → NAT 게이트웨이 → 인터넷 게이트웨이로 연결하세요.')
      },
    },
    {
      id: 'az',
      icon: '⚡',
      title: '가용 영역 A 장애',
      desc: 'AZ A가 멈춘 상태에서 AZ B 서버가 패치를 받습니다.',
      fail: ['azA'],
      check: (c) => {
        if (!c.has('ec2', 'azB')) return bad('AZ B에 서버가 없어 서비스가 멈췄어요.')
        if (c.path(['ec2@azB', 'natgw@azB', 'igw'], ['azA'])) return ok('AZ B 서버는 자기 AZ의 NAT 게이트웨이로 계속 나갔어요.')
        return bad('AZ B 서버가 AZ A의 NAT 게이트웨이에 의존해 함께 막혔어요. AZ마다 NAT 게이트웨이를 두세요.')
      },
    },
    {
      id: 'cost',
      icon: '💰',
      title: '비용 점검',
      desc: '필요 없는 리소스가 있는지 봅니다.',
      check: (c) => (c.has('dx') ? bad('Direct Connect는 이번 범위가 아니에요. 본사 연결은 나중에 VPN부터 시작해도 돼요.') : c.count('natgw') > 2 ? bad('NAT 게이트웨이는 AZ마다 하나면 충분해요.') : c.has('natgw') ? ok('AZ마다 NAT 게이트웨이 하나씩, 꼭 필요한 만큼만 뒀어요.') : bad('아웃바운드용 NAT 게이트웨이가 없어요.')),
    },
  ],
}

export const PROJECTS4: Project[] = [b1, b2, b3, b4, b5]
