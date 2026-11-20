// 추가 프로젝트 10개 (보통 5, 어려움 5) — SAA-C03 출제 주제 중심
import type { Box, Project, Result, Scope } from '../types'

const B = (id: string, kind: Box['kind'], label: string, children: Box[] = [], dir: 'row' | 'col' = 'col'): Box => ({ id, kind, label, children, dir })
const Z = (id: string, kind: Box['kind'], label: string, scope: Scope, max = 3): Box => ({ id, kind, label, zone: { scope, max } })
const ok = (msg: string): Result => ({ ok: true, msg })
const bad = (msg: string): Result => ({ ok: false, msg })
const USERS = { id: 'users', service: 'users', zone: 'out', label: '사용자' }
const IGW = { id: 'igw', service: 'igw', zone: 'vpcEdge', label: '인터넷 게이트웨이' }

// ── 보통 (주니어) ─────────────────────────────────────

const j1: Project = {
  id: 'estate-replica',
  level: 2,
  title: '시세 리포트가 운영 DB를 멈춘다',
  client: 'estate',
  org: '집값노트',
  summary: '조회가 대부분인 서비스의 읽기 부하를 분리\nRDS 읽기 전용 복제본 vs Multi-AZ',
  topics: ['RDS 읽기 전용 복제본', 'Multi-AZ', '읽기 부하 분산'],
  env: 'AWS',
  steps: [
    {
      t: 'talk',
      scene: 'office',
      lines: [
        { who: 'lead', text: '부동산 시세 사이트 집값노트예요. 매일 밤 통계 리포트를 돌리면 사이트가 같이 느려진대요.' },
        { who: 'senior', text: '무거운 집계 쿼리가 운영 DB와 같은 곳을 때리는 거네요. 읽기 부하를 어디로 보낼지가 핵심이에요.' },
      ],
    },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'estate', text: '사용자 요청의 95%가 시세 조회예요. 매물 등록 같은 쓰기는 얼마 안 돼요.' },
        { who: 'estate', text: '얼마 전에 DB를 Multi-AZ로 바꿨거든요. 그 대기 DB로 리포트를 돌리면 되지 않나요?' },
        { who: 'me', text: '그 부분부터 확인해 보겠습니다. 대기 DB와 복제본은 목적이 달라요.' },
      ],
    },
    {
      t: 'quiz',
      scene: 'office',
      quiz: {
        who: 'senior',
        prompt: 'RDS Multi-AZ(인스턴스 배포)의 대기 DB에 통계 리포트 쿼리를 보낼 수 있을까요?',
        options: [
          { id: 'a', text: '보낼 수 있다. 동기 복제라 데이터도 가장 최신이다', why: '데이터는 최신이지만, 대기 인스턴스는 장애 조치 전까지 연결을 받지 않아요.' },
          { id: 'b', text: '보낼 수 없다. 대기 DB는 장애 조치용이라 읽기 요청을 받지 않는다', why: '' },
          { id: 'c', text: '엔드포인트 주소만 바꾸면 보낼 수 있다', why: '대기 인스턴스용 별도 엔드포인트가 없어요. 하나의 엔드포인트가 장애 시 대기 쪽을 가리키게 바뀌는 구조예요.' },
          { id: 'd', text: '야간에만 보낼 수 있다', why: '시간대와 상관없이 대기 인스턴스는 읽기를 받지 않아요.' },
        ],
        answer: 'b',
        explain: 'Multi-AZ 인스턴스 배포의 대기 DB는 고가용성 전용이에요. 장애 조치 전에는 읽기에 쓸 수 없어요. 읽기 부하를 나누려면 읽기 전용 복제본을 만들고, 앱이 복제본 엔드포인트로 조회하게 해야 해요. (참고: 대기 2개가 읽기를 받는 "Multi-AZ DB 클러스터" 배포는 별도 방식이에요.)',
        hint: 'Multi-AZ의 목적은 "빠르게"가 아니라 "멈추지 않게"예요.',
      },
    },
    {
      t: 'quiz',
      scene: 'lounge',
      quiz: {
        who: 'peer',
        prompt: '읽기 전용 복제본에 대한 설명으로 맞는 것은?',
        options: [
          { id: 'a', text: '기본 DB와 동기 복제되어 데이터 지연이 전혀 없다', why: '읽기 전용 복제본은 비동기 복제라 약간의 지연(복제 지연)이 생길 수 있어요.' },
          { id: 'b', text: '기본 DB에 장애가 나면 자동으로 쓰기 DB가 된다', why: '자동 전환은 Multi-AZ의 역할이에요. 복제본은 필요할 때 직접 승격(promote)해야 해요.' },
          { id: 'c', text: '비동기 복제되며, 별도 엔드포인트로 읽기 요청을 분산할 수 있다', why: '' },
          { id: 'd', text: '같은 AZ에만 만들 수 있다', why: '다른 AZ는 물론 다른 리전에도 만들 수 있어요.' },
        ],
        answer: 'c',
        explain: '읽기 전용 복제본은 비동기 복제로 따라오는 읽기 전용 DB예요. 자기 엔드포인트가 있어서 리포트·조회 트래픽을 보낼 수 있어요. 복제 지연이 있으니 "방금 쓴 값을 바로 읽어야 하는" 요청은 기본 DB로 보내야 해요.',
        hint: '동기/비동기, 자동 전환 여부를 Multi-AZ와 비교해 보세요.',
      },
    },
    { t: 'design' },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'estate', text: '어젯밤 리포트 돌리는 동안에도 사이트가 멀쩡했어요!' },
        { who: 'senior', text: '고가용성은 Multi-AZ, 읽기 확장은 복제본. 둘을 같이 쓰는 게 정석이에요.' },
      ],
    },
  ],
  design: {
    brief: ['조회 위주 웹 서비스, 두 AZ에 앱 서버', 'AZ 하나가 멈춰도 DB 자동 전환', '야간 통계 리포트는 운영 DB에 부담 없이'],
    layout: B('root', 'plain', '', [
      B('out', 'outside', '인터넷'),
      B('cloud', 'cloud', 'AWS 클라우드', [
        B('region', 'region', '리전 · 서울', [
          B('vpc', 'vpc', 'VPC', [
            B('vpcEdge', 'gate', 'VPC 경계'),
            Z('albZone', 'public', '퍼블릭 서브넷 A·B', 'subnet', 2),
            B(
              'azRow',
              'plain',
              '',
              [
                B('azA', 'az', '가용 영역 A', [Z('appA', 'private', '앱 서브넷', 'subnet', 2), Z('dbA', 'private', 'DB 서브넷', 'subnet', 2)]),
                B('azB', 'az', '가용 영역 B', [Z('appB', 'private', '앱 서브넷', 'subnet', 2), Z('dbB', 'private', 'DB 서브넷', 'subnet', 2)]),
              ],
              'row',
            ),
            Z('batch', 'private', '리포트 서브넷', 'subnet', 1),
          ]),
        ]),
      ]),
    ]),
    fixed: [{ ...USERS, label: '방문자' }, IGW, { id: 'report', service: 'ec2Worker', zone: 'batch', label: '통계 리포트 서버' }],
    fixedEdges: [['users', 'igw']],
    palette: ['alb', 'ec2', 'rds', 'rdsStandby', 'rdsRead', 'elasticache', 'dx'],
    answer: {
      nodes: [
        { id: 'a1', service: 'alb', zone: 'albZone' },
        { id: 'a2', service: 'ec2', zone: 'appA' },
        { id: 'a3', service: 'ec2', zone: 'appB' },
        { id: 'a4', service: 'rds', zone: 'dbA' },
        { id: 'a5', service: 'rdsStandby', zone: 'dbB' },
        { id: 'a6', service: 'rdsRead', zone: 'dbB' },
      ],
      edges: [
        ['igw', 'a1'],
        ['a1', 'a2'],
        ['a1', 'a3'],
        ['a2', 'a4'],
        ['a3', 'a4'],
        ['a4', 'a5'],
        ['a4', 'a6'],
        ['report', 'a6'],
      ],
    },
    answerNote: [
      '기본 DB(AZ A) ↔ 대기 DB(AZ B)는 Multi-AZ 동기 복제, 장애 시 자동 전환돼요.',
      '기본 DB → 읽기 전용 복제본은 비동기 복제예요. 리포트 서버는 복제본 엔드포인트로만 조회해요.',
      '조회가 더 늘면 복제본을 여러 개(RDS MySQL 기준 최대 15개) 두거나 ElastiCache로 자주 보는 시세를 캐시할 수 있어요.',
    ],
  },
  scenarios: [
    {
      id: 'browse',
      icon: '🏠',
      title: '평소 시세 조회',
      desc: '방문자가 시세를 조회합니다.',
      check: (c) => (c.path(['users', 'igw', 'alb', 'ec2', 'rds|rdsStandby']) ? ok('ALB → 앱 서버 → DB로 정상 조회됐어요.') : bad('방문자 → 인터넷 게이트웨이 → ALB → 앱 서버 → DB 경로를 만들어 주세요.')),
    },
    {
      id: 'report',
      icon: '📊',
      title: '야간 통계 리포트',
      desc: '리포트 서버가 1시간짜리 집계 쿼리를 돌립니다.',
      load: 2,
      check: (c) => {
        if (c.linked('report', 'rds')) return bad('리포트 서버가 운영 DB에 바로 붙어 있어 사이트가 느려졌어요.')
        if (!c.linked('report', 'rdsRead')) return bad('리포트 서버가 조회할 DB가 없어요. 대기 DB는 읽기를 받지 않아요. 읽기 전용 복제본을 만드세요.')
        if (!c.linked('rds', 'rdsRead')) return bad('복제본이 기본 DB와 연결되지 않아 데이터가 비어 있어요.')
        return ok('무거운 쿼리는 복제본이 받아서 운영 DB와 사이트는 그대로 빨랐어요.')
      },
    },
    {
      id: 'az',
      icon: '⚡',
      title: '가용 영역 A 장애',
      desc: 'AZ A가 통째로 멈춥니다.',
      fail: ['azA'],
      check: (c) =>
        c.path(['users', 'igw', 'alb', 'ec2', 'rds|rdsStandby'], ['azA'])
          ? ok('대기 DB로 자동 전환되고 AZ B 앱 서버가 계속 응답했어요.')
          : bad('AZ A가 멈추자 서비스가 끊겼어요. 두 AZ에 앱 서버를 두고, Multi-AZ 대기 DB가 필요해요.'),
    },
    {
      id: 'cost',
      icon: '💰',
      title: '비용 점검',
      desc: '필요 없는 리소스가 있는지 봅니다.',
      check: (c) => (c.has('dx') ? bad('Direct Connect는 데이터센터 연결용이에요. 이 구성에는 필요 없어요.') : c.has('rdsRead') ? ok('복제본 1대로 리포트 부하를 분리했어요.') : bad('읽기 부하를 받을 복제본이 없어요.')),
    },
  ],
}

const j2: Project = {
  id: 'scooter-stream',
  level: 2,
  title: '킥보드 3만 대 실시간 위치',
  client: 'scooter',
  org: '씽씽킥',
  summary: '초당 수만 건 위치 데이터를 순서대로 받아 여러 곳에서 소비\nKinesis Data Streams, Data Firehose',
  topics: ['Kinesis Data Streams', '샤드·파티션 키', 'Data Firehose', '스트리밍'],
  env: 'AWS',
  steps: [
    {
      t: 'talk',
      scene: 'office',
      lines: [
        { who: 'lead', text: '공유 킥보드 회사 씽씽킥이에요. 킥보드 3만 대가 1초마다 위치를 보낸대요.' },
        { who: 'peer', text: '초당 3만 건이요? DB에 바로 넣으면 버티기 힘들겠는데요.' },
      ],
    },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'scooter', text: '앱 지도에는 최신 위치가 보여야 하고, 같은 데이터를 1년치 쌓아서 수요 분석도 하고 싶어요.' },
        { who: 'scooter', text: '한 킥보드의 위치는 꼭 순서대로 처리돼야 해요. 순서가 꼬이면 킥보드가 순간 이동한 것처럼 보이거든요.' },
        { who: 'me', text: '순서 보장, 여러 소비자, 다시 읽기. 세 가지를 만족하는 스트리밍 구조로 가겠습니다.' },
      ],
    },
    {
      t: 'quiz',
      scene: 'lounge',
      quiz: {
        who: 'peer',
        prompt: '킥보드별 순서를 지키고, 같은 데이터를 지도 갱신과 보관 두 곳이 각자 읽으며, 장애 시 지난 데이터를 다시 읽어야 해요. 무엇이 맞을까요?',
        options: [
          { id: 'a', text: 'SQS 표준 큐', why: '표준 큐는 순서를 보장하지 않고, 한 소비자가 처리해 지운 메시지는 다른 소비자가 다시 읽을 수 없어요.' },
          { id: 'b', text: 'SQS FIFO 큐', why: '순서는 지키지만 처리 후 삭제되는 구조라 두 소비자가 같은 데이터를 각자 읽거나 다시 읽을 수 없어요.' },
          { id: 'c', text: 'Kinesis Data Streams', why: '' },
          { id: 'd', text: 'SNS 토픽', why: 'SNS는 메시지를 저장하지 않아서 다시 읽기가 안 돼요.' },
        ],
        answer: 'c',
        explain: 'Kinesis Data Streams는 파티션 키(킥보드 ID)가 같은 레코드를 같은 샤드에 넣어 순서를 지켜요. 레코드를 보존 기간(기본 24시간, 최대 365일) 동안 남겨 두기 때문에 여러 소비자가 각자 읽고, 필요하면 과거 위치부터 다시 읽을 수 있어요.',
        hint: '"처리하면 사라지는 큐"와 "일정 기간 남아 있는 로그" 중 어느 쪽이 필요할까요?',
      },
    },
    {
      t: 'quiz',
      scene: 'office',
      quiz: {
        who: 'senior',
        prompt: '레코드 크기는 200바이트, 초당 3만 건이에요. 프로비저닝 모드라면 쓰기 기준 최소 샤드 수는?',
        options: [
          { id: 'a', text: '6개 (초당 6MB ÷ 샤드당 1MB)', why: '용량만 보면 6개지만, 샤드당 초당 레코드 수 한도(1,000건)에 먼저 걸려요.' },
          { id: 'b', text: '30개', why: '' },
          { id: 'c', text: '3개', why: '레코드 수와 용량 모두 한도를 넘어요.' },
          { id: 'd', text: '1개면 충분하다', why: '샤드 1개는 초당 1,000건까지만 쓸 수 있어요.' },
        ],
        answer: 'b',
        explain: '샤드 1개의 쓰기 한도는 초당 1MB 또는 1,000건 중 먼저 닿는 쪽이에요. 3만 건 ÷ 1,000건 = 30개가 필요해요. 트래픽 예측이 어렵다면 샤드를 자동으로 관리하는 온디맨드 모드도 선택지예요.',
        hint: '샤드 한도는 "용량"과 "건수" 두 가지예요. 둘 다 계산해서 큰 쪽을 고르세요.',
      },
    },
    { t: 'design' },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'scooter', text: '킥보드 순간 이동이 사라졌어요. 분석팀도 S3에 쌓인 데이터로 수요 지도를 그리기 시작했어요!' },
        { who: 'lead', text: '실시간 처리와 장기 보관을 한 스트림에서 나눈 게 좋았어요.' },
      ],
    },
  ],
  design: {
    brief: ['킥보드 3만 대 × 초당 1건 위치 수신', '지도용 최신 위치 저장(실시간)', '같은 데이터를 S3에 장기 보관(분석용)', '킥보드별 순서 보장'],
    layout: B('root', 'plain', '', [
      B('out', 'outside', '도로 위 킥보드'),
      B('cloud', 'cloud', 'AWS 클라우드', [
        B('region', 'region', '리전 · 서울', [
          Z('ingest', 'plain', '수신', 'region', 2),
          Z('stream', 'plain', '스트림', 'region', 2),
          Z('consume', 'plain', '소비자', 'region', 3),
          Z('store', 'plain', '저장', 'region', 3),
        ]),
      ]),
    ]),
    fixed: [{ ...USERS, label: '킥보드 3만 대' }],
    palette: ['apigw', 'sqs', 'sns', 'kinesis', 'lambda', 'firehose', 'dynamodb', 's3', 'rds'],
    answer: {
      nodes: [
        { id: 'a1', service: 'apigw', zone: 'ingest' },
        { id: 'a2', service: 'kinesis', zone: 'stream' },
        { id: 'a3', service: 'lambda', zone: 'consume', label: '위치 갱신' },
        { id: 'a4', service: 'firehose', zone: 'consume' },
        { id: 'a5', service: 'dynamodb', zone: 'store', label: 'DynamoDB (최신 위치)' },
        { id: 'a6', service: 's3', zone: 'store', label: 'S3 (위치 이력)' },
      ],
      edges: [
        ['users', 'a1'],
        ['a1', 'a2'],
        ['a2', 'a3'],
        ['a3', 'a5'],
        ['a2', 'a4'],
        ['a4', 'a6'],
      ],
    },
    answerNote: [
      'API Gateway는 Kinesis PutRecord를 바로 호출하도록 연결할 수 있어요. 파티션 키는 킥보드 ID예요.',
      '한 스트림에 Lambda(실시간)와 Data Firehose(보관) 두 소비자를 붙였어요. 소비자가 많아지면 향상된 팬아웃(Enhanced Fan-Out)으로 소비자마다 샤드당 초당 2MB를 따로 받을 수 있어요.',
      '실제 IoT 기기라면 AWS IoT Core로 받는 방법도 많이 써요.',
    ],
  },
  scenarios: [
    {
      id: 'live',
      icon: '🛴',
      title: '지도에 최신 위치 표시',
      desc: '킥보드가 1초마다 위치를 보냅니다.',
      load: 3,
      check: (c) => {
        if (c.linked('users', 'rds') || c.linked('lambda', 'rds')) return bad('초당 3만 건 쓰기를 관계형 DB 한 대가 받기는 어려워요. 최신 위치는 DynamoDB처럼 쓰기 확장이 쉬운 곳에 두세요.')
        return c.path(['users', 'apigw', 'kinesis', 'lambda', 'dynamodb']) ? ok('스트림 → Lambda → DynamoDB로 최신 위치가 갱신됐어요.') : bad('킥보드 → API Gateway → Kinesis → Lambda → DynamoDB 경로를 만들어 주세요.')
      },
    },
    {
      id: 'order',
      icon: '🔢',
      title: '순서 점검',
      desc: '한 킥보드의 위치 1, 2, 3이 순서대로 처리되는지 봅니다.',
      check: (c) => {
        if (c.path(['users', 'apigw', 'sqs']) || c.path(['users', 'apigw', 'sns'])) return bad('수신 데이터가 큐나 토픽으로 먼저 가요. 표준 큐·SNS는 순서를 보장하지 않아 킥보드가 순간 이동했어요.')
        return c.path(['users', 'apigw', 'kinesis']) ? ok('같은 킥보드 ID는 같은 샤드로 가서 순서대로 처리됐어요.') : bad('순서를 지켜 줄 스트림이 없어요.')
      },
    },
    {
      id: 'archive',
      icon: '🗄️',
      title: '1년치 수요 분석',
      desc: '분석팀이 위치 이력을 찾습니다.',
      check: (c) => (c.path(['kinesis', 'firehose', 's3']) ? ok('Firehose가 스트림을 묶어 S3에 자동으로 쌓아 두었어요.') : bad('스트림 데이터가 S3에 쌓이지 않아요. Kinesis → Data Firehose → S3로 연결하세요.')),
    },
    {
      id: 'replay',
      icon: '⏪',
      title: '위치 갱신 버그 수정 후 재처리',
      desc: '어제 배포한 Lambda에 버그가 있었어요. 지난 3시간 데이터를 다시 처리해야 합니다.',
      check: (c) => (c.linked('kinesis', 'lambda') ? ok('스트림에 레코드가 남아 있어 3시간 전 위치부터 다시 읽어 고쳤어요.') : bad('처리하면 사라지는 구조라 다시 읽을 데이터가 없어요.')),
    },
  ],
}

const j3: Project = {
  id: 'codelab-schedule',
  level: 2,
  title: '개발 서버 야간 자동 끄기',
  client: 'codelab',
  org: '코드랩',
  summary: '아무도 안 쓰는 밤·주말 서버 비용 줄이기\nEventBridge 예약, CloudWatch 경보, 구매 옵션',
  topics: ['EventBridge 예약 규칙', 'CloudWatch 경보', '비용 최적화', 'Savings Plans'],
  env: 'AWS',
  steps: [
    {
      t: 'talk',
      scene: 'office',
      lines: [
        { who: 'lead', text: '개발 스튜디오 코드랩이 AWS 청구서를 보고 놀랐대요. 개발 서버가 24시간 켜져 있었다네요.' },
        { who: 'peer', text: '개발자들은 평일 낮에만 쓰잖아요. 일주일 168시간 중에 실제로 쓰는 건 50시간쯤?' },
      ],
    },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'codelab', text: '매일 밤 9시에 끄고 아침 9시에 켜 주면 좋겠어요. 사람이 하니까 자꾸 까먹어요.' },
        { who: 'codelab', text: '주말에 잠깐 켜 놓고 그냥 퇴근하는 사람도 있어요. 그것도 알아서 꺼지면 좋겠고요.' },
        { who: 'me', text: '정해진 시간 작업과, 안 쓰는 서버 감지를 나눠서 자동화하겠습니다.' },
      ],
    },
    {
      t: 'quiz',
      scene: 'lounge',
      quiz: {
        who: 'peer',
        prompt: '"매일 21시"처럼 정해진 시간에 Lambda를 실행하는 가장 간단한 방법은?',
        options: [
          { id: 'a', text: 'EventBridge 예약 규칙(cron 식)으로 Lambda를 호출한다', why: '' },
          { id: 'b', text: 'SQS 지연 큐로 12시간 뒤에 메시지를 받는다', why: 'SQS 지연은 최대 15분이에요.' },
          { id: 'c', text: 'EC2 한 대를 켜 두고 crontab을 돌린다', why: '서버를 끄려고 서버를 계속 켜 두는 셈이에요.' },
          { id: 'd', text: 'CloudWatch Logs에 시간을 기록한다', why: '로그 저장소라 작업을 실행하지 않아요.' },
        ],
        answer: 'a',
        explain: 'EventBridge(규칙 또는 EventBridge Scheduler)는 cron·rate 식으로 정해진 시간에 Lambda, Systems Manager 자동화 등을 호출해요. 서버가 필요 없고 거의 무료예요. 시간대(Asia/Seoul)를 지정하려면 EventBridge Scheduler가 편해요.',
        hint: 'AWS의 "알람 시계" 역할을 하는 서비스예요.',
      },
    },
    {
      t: 'quiz',
      scene: 'office',
      quiz: {
        who: 'senior',
        prompt: '반면 코드랩의 운영 서버는 1년 내내 24시간 켜져 있어요. 가장 비용 효율적인 구매 방식은?',
        options: [
          { id: 'a', text: '온디맨드 그대로 쓴다', why: '가장 유연하지만 가장 비싸요. 꾸준히 쓰는 서버라면 약정 할인을 받는 게 좋아요.' },
          { id: 'b', text: '스팟 인스턴스로 바꾼다', why: 'AWS가 용량을 회수하면 2분 알림 뒤 중단돼요. 계속 떠 있어야 하는 운영 서버에 맞지 않아요.' },
          { id: 'c', text: 'Savings Plans 또는 예약 인스턴스(1년 약정)', why: '' },
          { id: 'd', text: '전용 호스트를 산다', why: '라이선스·규정 때문에 물리 서버를 혼자 써야 할 때 고르는 옵션이에요. 비용 절감용이 아니에요.' },
        ],
        answer: 'c',
        explain: '사용량이 꾸준하면 1년 또는 3년 약정으로 온디맨드보다 크게 할인받는 Savings Plans나 예약 인스턴스가 맞아요. 개발 서버처럼 쓰는 시간이 짧으면 온디맨드 + 자동 끄기가 더 싸요.',
        hint: '"1년 내내", "24시간"이 핵심 단어예요.',
      },
    },
    { t: 'design' },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'codelab', text: '이번 달 개발 서버 비용이 절반 넘게 줄었어요. 주말에 켜 둔 서버도 알아서 꺼졌고요!' },
        { who: 'lead', text: '비용 최적화는 큰 설계보다 이런 자동화에서 먼저 나와요.' },
      ],
    },
  ],
  design: {
    brief: ['개발 서버 2대: 평일 21시 중지, 9시 시작', '주말에 켜 둔 채 쓰지 않는 서버는 자동 중지', '불필요한 비용 리소스 없이'],
    layout: B('root', 'plain', '', [
      B('out', 'outside', '사무실'),
      B('cloud', 'cloud', 'AWS 클라우드', [
        B('region', 'region', '리전 · 서울', [
          B('vpc', 'vpc', 'VPC', [Z('devSub', 'private', '개발 서브넷', 'subnet', 3), Z('asgZone', 'group', 'Auto Scaling 그룹 영역', 'group', 1)]),
          Z('svc', 'plain', '리전 서비스', 'region', 4),
        ]),
      ]),
    ]),
    fixed: [
      { id: 'dev1', service: 'ec2', zone: 'devSub', label: '개발 서버 1' },
      { id: 'dev2', service: 'ec2', zone: 'devSub', label: '개발 서버 2' },
    ],
    palette: ['eventbridge', 'lambda', 'cloudwatch', 'sqs', 'asg', 'natgw'],
    answer: {
      nodes: [
        { id: 'a1', service: 'eventbridge', zone: 'svc' },
        { id: 'a2', service: 'lambda', zone: 'svc', label: '서버 시작·중지' },
        { id: 'a3', service: 'cloudwatch', zone: 'svc', label: 'CloudWatch 경보 (CPU 낮음)' },
      ],
      edges: [
        ['a1', 'a2'],
        ['a2', 'dev1'],
        ['a2', 'dev2'],
        ['a3', 'dev1'],
        ['a3', 'dev2'],
      ],
    },
    answerNote: [
      'EventBridge 예약 2개(평일 21시 중지, 9시 시작)가 Lambda를 호출해요. Lambda는 태그(예: Schedule=office-hours)가 붙은 서버만 시작·중지해요.',
      'CloudWatch 경보는 EC2 작업으로 서버를 바로 중지할 수 있어요. 예: CPU 평균 5% 미만이 1시간 계속되면 중지.',
      '중지된 EC2는 컴퓨팅 요금이 멈추지만 EBS 볼륨 요금은 계속 나와요.',
      'Lambda 대신 Systems Manager 자동화(Instance Scheduler 등)로도 같은 일을 할 수 있어요.',
    ],
  },
  scenarios: [
    {
      id: 'night',
      icon: '🌙',
      title: '평일 21시',
      desc: '모두 퇴근했어요.',
      check: (c) =>
        ['dev1', 'dev2'].every((d) => c.path(['eventbridge', 'lambda', d]))
          ? ok('예약 규칙이 Lambda를 불러 개발 서버 2대를 중지했어요.')
          : bad('정해진 시간에 서버를 끌 장치가 없어요. EventBridge → Lambda → 각 개발 서버로 연결하세요.'),
    },
    {
      id: 'morning',
      icon: '☀️',
      title: '평일 9시',
      desc: '개발자들이 출근했어요.',
      check: (c) => (c.has('asg') && c.linked('asg', 'ec2') ? bad('Auto Scaling 그룹은 꺼진 서버를 비정상으로 보고 새 서버로 바꿔 버려요. 개발 서버는 그룹에 넣지 마세요.') : c.path(['eventbridge', 'lambda', 'dev1']) ? ok('같은 Lambda가 아침에 서버를 다시 켰어요.') : bad('아침에 서버를 켤 예약이 없어요.')),
    },
    {
      id: 'idle',
      icon: '🛋️',
      title: '주말에 켜 두고 퇴근',
      desc: '토요일에 누군가 개발 서버 1을 켜고 그냥 갔어요.',
      check: (c) => (['dev1', 'dev2'].every((d) => c.linked('cloudwatch', d)) ? ok('CPU가 계속 낮자 CloudWatch 경보가 서버를 중지했어요.') : bad('예약 시간이 아닐 때 켜진 서버를 감지할 장치가 없어요. CloudWatch 경보를 각 서버에 걸어 두세요.')),
    },
    {
      id: 'bill',
      icon: '🧾',
      title: '청구서 확인',
      desc: '새로 늘어난 비용이 없는지 봅니다.',
      check: (c) => (c.has('natgw') ? bad('NAT 게이트웨이는 시간당 요금이 계속 나와요. 이번 요구 사항에는 필요 없어요.') : c.has('eventbridge') ? ok('예약 규칙과 Lambda, 경보 모두 비용이 거의 없어요.') : bad('자동화가 없어 비용이 그대로예요.')),
    },
  ],
}

const j4: Project = {
  id: 'clinic-presigned',
  level: 2,
  title: '검사 결과지 안전하게 내려받기',
  client: 'clinic',
  org: '온누리내과',
  summary: '비공개 S3 파일을 본인에게만 잠깐 열어 주기\n미리 서명된 URL, SSE-KMS',
  topics: ['미리 서명된 URL', 'SSE-KMS', 'S3 퍼블릭 액세스 차단', '암호화'],
  env: 'AWS',
  steps: [
    {
      t: 'talk',
      scene: 'office',
      lines: [
        { who: 'lead', text: '온누리내과가 환자 앱에서 검사 결과 PDF를 내려받게 하고 싶대요.' },
        { who: 'senior', text: '의료 정보라 버킷은 절대 공개하면 안 돼요. 그러면서도 환자 본인은 받아야 하고요.' },
      ],
    },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'clinic', text: '외주 개발사는 S3를 공개로 열고 파일 이름을 어렵게 만들자고 하더라고요. 괜찮은 건가요?' },
        { who: 'clinic', text: '그리고 감사 때 누가 언제 어떤 파일을 열었는지, 암호화 키를 누가 썼는지 보여 줘야 해요.' },
        { who: 'me', text: '버킷은 잠가 두고, 로그인한 환자에게만 몇 분짜리 열쇠를 주는 방식으로 하겠습니다.' },
      ],
    },
    {
      t: 'quiz',
      scene: 'office',
      quiz: {
        who: 'senior',
        prompt: '비공개 S3 객체를 로그인한 환자에게만 5분 동안 내려받게 하려면?',
        options: [
          { id: 'a', text: '버킷을 공개하고 파일 이름을 무작위로 만든다', why: '주소만 알면 누구나 받을 수 있어요. 주소가 유출되면 막을 방법이 없어요.' },
          { id: 'b', text: '서버가 해당 객체의 미리 서명된 URL을 짧은 만료 시간으로 발급한다', why: '' },
          { id: 'c', text: '앱 안에 IAM 액세스 키를 넣어 직접 받게 한다', why: '앱을 분해하면 키가 그대로 드러나요. 키는 앱에 넣지 않아요.' },
          { id: 'd', text: '버킷 정책에서 병원 IP만 허용한다', why: '환자는 집이나 이동 중에 접속하니 IP로 제한할 수 없어요.' },
        ],
        answer: 'b',
        explain: '미리 서명된 URL은 서명한 주체의 권한으로, 특정 객체 하나를 정해진 시간 동안만 내려받게 해 줘요. 버킷은 계속 비공개(퍼블릭 액세스 차단)로 둘 수 있어요.',
        hint: '"잠깐 쓰는 열쇠"를 발급하는 방식이에요.',
      },
    },
    {
      t: 'quiz',
      scene: 'lounge',
      quiz: {
        who: 'peer',
        prompt: '"암호화 키를 누가 언제 썼는지 기록"하고 키 사용 권한을 따로 관리하려면 어떤 S3 암호화가 맞을까요?',
        options: [
          { id: 'a', text: 'SSE-S3 (S3 관리형 키)', why: '키를 AWS가 알아서 관리해 편하지만, 키 권한을 따로 나누거나 키 사용 기록을 볼 수 없어요.' },
          { id: 'b', text: 'SSE-KMS (KMS 고객 관리형 키)', why: '' },
          { id: 'c', text: 'SSE-C (고객 제공 키)', why: '요청마다 키를 직접 보내야 하고, 키 보관 책임도 모두 고객에게 있어요.' },
          { id: 'd', text: '암호화하지 않고 버킷 정책만 강화한다', why: '저장 데이터 암호화 요구를 만족하지 못해요.' },
        ],
        answer: 'b',
        explain: 'SSE-KMS는 KMS 키로 암호화해요. 키 정책으로 누가 복호화할 수 있는지 나누고, 키 사용은 CloudTrail에 남아 감사에 쓸 수 있어요. 요청이 많으면 KMS 호출 한도에 닿을 수 있어 S3 버킷 키를 켜서 호출 수를 줄이는 게 좋아요.',
        hint: '키 권한 분리와 사용 기록, 두 가지를 다 주는 쪽이에요.',
      },
    },
    { t: 'design' },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'clinic', text: '단체 대화방에 링크가 잘못 올라갔는데 5분 지나니 열리지 않았어요. 정말 다행이에요.' },
        { who: 'senior', text: '공개하지 않고도 필요한 사람에게만 열어 주는 것, 그게 S3 보안의 기본이에요.' },
      ],
    },
  ],
  design: {
    brief: ['환자 로그인 후 본인 결과지만 요청', 'S3 버킷은 비공개 유지, 5분짜리 다운로드 링크', '저장 데이터는 감사 가능한 키로 암호화'],
    layout: B('root', 'plain', '', [
      B('out', 'outside', '인터넷 (환자 앱)'),
      B('cloud', 'cloud', 'AWS 클라우드', [
        B('region', 'region', '리전 · 서울', [Z('api', 'plain', 'API', 'region', 3), Z('data', 'plain', '데이터·보안', 'region', 3)]),
        Z('edge', 'edge', '엣지', 'edge', 1),
      ]),
    ]),
    fixed: [{ ...USERS, label: '환자' }],
    palette: ['apigw', 'cognito', 'lambda', 's3', 'kms', 'cloudfront'],
    answer: {
      nodes: [
        { id: 'a1', service: 'apigw', zone: 'api' },
        { id: 'a2', service: 'cognito', zone: 'api' },
        { id: 'a3', service: 'lambda', zone: 'api', label: 'URL 발급' },
        { id: 'a4', service: 's3', zone: 'data', label: 'S3 (결과지, 비공개)' },
        { id: 'a5', service: 'kms', zone: 'data' },
      ],
      edges: [
        ['users', 'a1'],
        ['a1', 'a2'],
        ['a1', 'a3'],
        ['a3', 'a4'],
        ['a4', 'a5'],
        ['users', 'a4'],
      ],
    },
    answerNote: [
      '① 환자 → API Gateway(Cognito 토큰 확인) → Lambda가 본인 파일인지 확인하고 5분짜리 미리 서명된 URL 발급.',
      '② 환자 앱이 그 URL로 S3에서 바로 내려받아요(환자 → S3 연결).',
      'Lambda 역할(임시 자격 증명)로 만든 URL은 그 자격 증명이 만료되면 지정 시간 전이라도 함께 만료돼요.',
      'S3 → KMS는 SSE-KMS 암호화예요. Lambda 역할에는 해당 KMS 키의 복호화 권한도 있어야 내려받기가 돼요.',
    ],
  },
  scenarios: [
    {
      id: 'download',
      icon: '📄',
      title: '환자가 결과지 내려받기',
      desc: '로그인한 환자가 결과지를 엽니다.',
      check: (c) => {
        if (!c.path(['users', 'apigw', 'lambda', 's3'])) return bad('환자 → API Gateway → Lambda → S3로 URL을 발급하는 경로가 없어요.')
        if (!c.linked('users', 's3')) return bad('발급한 URL로 환자가 S3에서 바로 받는 연결(환자 → S3)이 없어요.')
        return ok('Lambda가 발급한 링크로 환자가 S3에서 바로 내려받았어요.')
      },
    },
    {
      id: 'other',
      icon: '🕵️',
      title: '남의 결과지 요청',
      desc: '로그인하지 않은 사람이 API로 다른 환자 파일을 요청합니다.',
      check: (c) => (c.linked('apigw', 'cognito') ? ok('Cognito 토큰이 없어 API Gateway에서 바로 거절됐어요.') : bad('API에 로그인 확인이 없어 누구나 URL을 받아 갈 수 있어요. Cognito 권한 부여자를 붙이세요.')),
    },
    {
      id: 'leak',
      icon: '💬',
      title: '링크 유출',
      desc: '환자가 링크를 단체 대화방에 잘못 올렸어요.',
      check: (c) =>
        c.has('cloudfront') && c.linked('cloudfront', 's3') && !c.linked('lambda', 's3')
          ? bad('CloudFront 주소만 있으면 계속 받을 수 있어요. 만료되는 링크가 필요해요.')
          : c.linked('lambda', 's3') && c.linked('users', 's3')
            ? ok('5분 뒤 링크가 만료돼 다른 사람은 열 수 없었어요.')
            : bad('만료 시간이 있는 링크를 발급하는 구조가 아니에요.'),
    },
    {
      id: 'audit',
      icon: '🔐',
      title: '보안 감사',
      desc: '감사관이 저장 암호화와 키 사용 기록을 요구합니다.',
      check: (c) => (c.linked('s3', 'kms') ? ok('SSE-KMS로 암호화돼 있고, 키 사용 기록이 CloudTrail에 남아 있었어요.') : bad('키 권한과 사용 기록을 보여 줄 수 없어요. S3를 KMS 키로 암호화하세요.')),
    },
  ],
}

const j5: Project = {
  id: 'studio-spot',
  level: 2,
  title: '야간 영상 인코딩 비용 70% 줄이기',
  client: 'studio',
  org: '무빙컷 스튜디오',
  summary: '중단돼도 다시 하면 되는 배치 작업을 스팟으로\nSQS + Auto Scaling + 스팟 인스턴스',
  topics: ['스팟 인스턴스', 'SQS 가시성 제한 시간', 'Auto Scaling', '비용 최적화'],
  env: 'AWS',
  steps: [
    {
      t: 'talk',
      scene: 'office',
      lines: [
        { who: 'lead', text: '영상 제작사 무빙컷이에요. 매일 밤 영상 수천 개를 인코딩하는데 온디맨드 서버 비용이 부담이래요.' },
        { who: 'peer', text: '인코딩은 중간에 끊겨도 다시 돌리면 되잖아요. 이건 그 할인 많이 되는 거…!' },
      ],
    },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'studio', text: '아침 9시까지만 끝나면 돼요. 그 대신 영상이 하나라도 빠지면 안 돼요.' },
        { who: 'studio', text: '예전에 싼 서버를 써 봤는데 갑자기 꺼지면서 작업이 날아갔어요.' },
        { who: 'me', text: '작업을 큐에 보관해 두면, 서버가 꺼져도 다른 서버가 이어서 처리할 수 있어요.' },
      ],
    },
    {
      t: 'quiz',
      scene: 'lounge',
      quiz: {
        who: 'peer',
        prompt: '중단돼도 다시 하면 되고, 시간에 여유가 있는 배치 작업에 가장 저렴한 EC2 구매 옵션은?',
        options: [
          { id: 'a', text: '온디맨드 인스턴스', why: '중단은 없지만 가장 비싸요.' },
          { id: 'b', text: '예약 인스턴스(1년)', why: '밤에만 쓰는 작업이라 1년 약정을 하면 낮 시간 비용까지 내는 셈이에요.' },
          { id: 'c', text: '스팟 인스턴스', why: '' },
          { id: 'd', text: '전용 호스트', why: '규정·라이선스용 옵션이라 오히려 비싸요.' },
        ],
        answer: 'c',
        explain: '스팟 인스턴스는 AWS의 남는 용량을 온디맨드보다 최대 90% 싸게 써요. 대신 AWS가 용량을 회수하면 2분 전 알림 후 중단돼요. 그래서 중단에 강한 배치·인코딩·분석 작업에 맞아요.',
        hint: '"중단돼도 된다"는 조건에서만 고를 수 있는 옵션이에요.',
      },
    },
    {
      t: 'quiz',
      scene: 'office',
      quiz: {
        who: 'senior',
        prompt: '스팟 중단으로 작업이 멈추는 일을 줄이려면 Auto Scaling 그룹을 어떻게 설정할까요?',
        options: [
          { id: 'a', text: '가장 싼 인스턴스 유형 하나, AZ 하나로 고정한다', why: '그 유형·AZ의 용량이 회수되면 한꺼번에 멈춰요.' },
          { id: 'b', text: '여러 인스턴스 유형과 여러 AZ를 쓰고, 용량 최적화(capacity-optimized) 할당 전략을 쓴다', why: '' },
          { id: 'c', text: '최고 가격을 온디맨드의 10배로 설정한다', why: '지금의 스팟은 가격 경쟁보다 용량 회수 때문에 중단되는 경우가 대부분이라, 최고 가격을 올려도 중단을 막지 못해요.' },
          { id: 'd', text: '스팟 인스턴스에 EBS 볼륨을 크게 붙인다', why: '디스크 크기는 중단과 관계없어요.' },
        ],
        answer: 'b',
        explain: '인스턴스 유형과 AZ를 다양하게 고르면 쓸 수 있는 스팟 용량 풀이 많아져요. 용량 최적화 전략은 남는 용량이 가장 많은 풀을 골라 중단 가능성을 낮춰요. 꼭 필요한 최소 용량만 온디맨드로 섞는 방법도 있어요.',
        hint: '달걀을 한 바구니에 담지 않는 방법이에요.',
      },
    },
    { t: 'design' },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'studio', text: '어젯밤 스팟 서버 몇 대가 꺼졌는데, 그 작업도 다른 서버가 다시 처리해서 하나도 안 빠졌어요!' },
        { who: 'lead', text: '큐로 작업을 보관한 게 스팟을 안심하고 쓰게 해 준 거예요.' },
      ],
    },
  ],
  design: {
    brief: ['편집팀이 S3에 원본 업로드 → 인코딩 → 결과 S3', '하룻밤 3,000개, 작업 하나도 유실 없이', '스팟으로 비용 절감, 두 AZ에 분산'],
    layout: B('root', 'plain', '', [
      B('out', 'outside', '편집팀'),
      B('cloud', 'cloud', 'AWS 클라우드', [
        B('region', 'region', '리전 · 서울', [
          Z('svc', 'plain', '리전 서비스', 'region', 4),
          B('vpc', 'vpc', 'VPC', [
            Z('asgZone', 'group', 'Auto Scaling 그룹 영역 (워커 서브넷 A·B를 묶음)', 'group', 1),
            B(
              'azRow',
              'plain',
              '',
              [B('azA', 'az', '가용 영역 A', [Z('wA', 'private', '워커 서브넷', 'subnet', 2)]), B('azB', 'az', '가용 영역 B', [Z('wB', 'private', '워커 서브넷', 'subnet', 2)])],
              'row',
            ),
          ]),
        ]),
      ]),
    ]),
    fixed: [{ ...USERS, label: '편집팀' }],
    palette: ['s3', 'sqs', 'sns', 'asg', 'ec2Spot', 'ec2Worker', 'dx'],
    answer: {
      nodes: [
        { id: 'a1', service: 's3', zone: 'svc', label: 'S3 (원본)' },
        { id: 'a2', service: 'sqs', zone: 'svc', label: 'SQS (인코딩 작업)' },
        { id: 'a3', service: 's3', zone: 'svc', label: 'S3 (결과)' },
        { id: 'a4', service: 'asg', zone: 'asgZone' },
        { id: 'a5', service: 'ec2Spot', zone: 'wA' },
        { id: 'a6', service: 'ec2Spot', zone: 'wB' },
      ],
      edges: [
        ['users', 'a1'],
        ['a1', 'a2'],
        ['a2', 'a5'],
        ['a2', 'a6'],
        ['a5', 'a3'],
        ['a6', 'a3'],
      ],
    },
    answerNote: [
      'S3 이벤트 알림 → SQS로 작업이 쌓이고, 스팟 워커가 꺼내 처리해요.',
      '워커가 처리 중 중단되면 메시지를 지우지 못해요. 가시성 제한 시간이 지나면 메시지가 큐에 다시 보여서 다른 워커가 처리해요.',
      'Auto Scaling 그룹은 큐 길이(대기 메시지 수)에 맞춰 워커 수를 늘리고 줄여요.',
      '프라이빗 서브넷 워커가 S3·SQS에 닿으려면 VPC 엔드포인트나 NAT 게이트웨이가 필요해요(그림에서 생략).',
    ],
  },
  scenarios: [
    {
      id: 'night',
      icon: '🎬',
      title: '오늘 밤 3,000개 인코딩',
      desc: '편집팀이 원본을 올립니다.',
      load: 3,
      check: (c) => {
        if (c.linked('s3', 'ec2Spot') && !c.has('sqs')) return bad('S3가 워커에 바로 일을 넘겨요. 워커가 꺼지면 그 일은 사라져요.')
        if (!c.path(['users', 's3', 'sqs', 'ec2Spot|ec2Worker', 's3'])) return bad('편집팀 → S3(원본) → SQS → 워커 → S3(결과) 경로를 만들어 주세요.')
        if (!c.has('asg')) return bad('워커 수가 고정이라 3,000개를 아침까지 끝내지 못했어요. Auto Scaling 그룹이 필요해요.')
        return ok('큐에 쌓인 작업을 워커들이 나눠 처리해 새벽 4시에 끝났어요.')
      },
    },
    {
      id: 'interrupt',
      icon: '⏹️',
      title: '스팟 회수 (2분 알림)',
      desc: '작업 중이던 스팟 워커 1대가 회수됩니다.',
      check: (c) =>
        c.has('sqs') && c.nodes('ec2Spot').length + c.nodes('ec2Worker').length > 0 && [...c.nodes('ec2Spot'), ...c.nodes('ec2Worker')].every((n) => c.linked('sqs', n.id))
          ? ok('지우지 못한 메시지가 가시성 제한 시간 뒤 큐에 다시 나타나 다른 워커가 처리했어요.')
          : bad('작업을 보관하는 큐가 없어 그 영상이 빠졌어요.'),
    },
    {
      id: 'az',
      icon: '⚡',
      title: 'AZ A 스팟 용량 부족',
      desc: 'AZ A에서 스팟 인스턴스를 더 받을 수 없습니다.',
      fail: ['wA'],
      check: (c) => (c.path(['sqs', 'ec2Spot|ec2Worker', 's3'], ['wA']) ? ok('AZ B 워커가 계속 처리했어요.') : bad('워커가 AZ A에만 있어 작업이 멈췄어요. 두 AZ에 나눠 두세요.')),
    },
    {
      id: 'cost',
      icon: '💰',
      title: '월말 청구서',
      desc: '인코딩 비용을 봅니다.',
      check: (c) => (c.has('dx') ? bad('Direct Connect는 필요 없어요.') : c.has('ec2Spot') ? ok('스팟으로 인코딩 서버 비용이 70% 넘게 줄었어요.') : bad('온디맨드 워커만 써서 비용이 그대로예요.')),
    },
  ],
}

// ── 어려움 (시니어) ─────────────────────────────────────

const s1: Project = {
  id: 'glowup-global',
  level: 3,
  title: '한국·미국 동시 액티브 쇼핑몰',
  client: 'glowup',
  org: '글로우업',
  summary: '두 리전에서 동시에 읽고 쓰는 멀티 리전 액티브-액티브\nDynamoDB 글로벌 테이블, Route 53 지연 시간 라우팅',
  topics: ['DynamoDB 글로벌 테이블', 'Route 53 지연 시간 기반 라우팅', '멀티 리전', '액티브-액티브'],
  env: 'AWS (멀티 리전)',
  steps: [
    {
      t: 'talk',
      scene: 'office',
      lines: [
        { who: 'lead', text: 'K-뷰티 쇼핑몰 글로우업이 미국 고객이 절반을 넘었대요. 미국에서는 장바구니 담기가 1초씩 걸린다고요.' },
        { who: 'senior', text: '서울 리전 한 곳에서 다 받으면 태평양을 왕복하니까요. 미국에도 쓰기가 되는 리전이 필요해요.' },
      ],
    },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'glowup', text: '한국 고객은 서울로, 미국 고객은 미국으로 접속했으면 좋겠어요.' },
        { who: 'glowup', text: '한국에서 담은 장바구니를 미국 출장 가서도 그대로 봐야 해요. 그리고 리전 하나가 멈춰도 주문은 계속 받아야 하고요.' },
        { who: 'me', text: '두 리전 모두에서 읽고 쓰는 액티브-액티브로 설계하겠습니다.' },
      ],
    },
    {
      t: 'quiz',
      scene: 'office',
      quiz: {
        who: 'senior',
        prompt: '두 리전에서 모두 짧은 지연으로 쓰기가 되고, 데이터가 서로 자동 복제되는 DB는?',
        options: [
          { id: 'a', text: 'RDS 리전 간 읽기 전용 복제본', why: '복제본은 읽기만 돼요. 미국에서의 쓰기는 여전히 서울 기본 DB까지 가야 해요.' },
          { id: 'b', text: 'DynamoDB 글로벌 테이블', why: '' },
          { id: 'c', text: 'S3 리전 간 복제', why: '객체 파일 복제라 장바구니 같은 빠른 읽기·쓰기 DB로 쓰기 어려워요.' },
          { id: 'd', text: 'ElastiCache 클러스터 하나를 두 리전이 같이 쓴다', why: '캐시 클러스터는 한 리전 VPC 안에 있어요. 다른 리전은 여전히 멀리 왕복해요.' },
        ],
        answer: 'b',
        explain: 'DynamoDB 글로벌 테이블은 여러 리전에 복제본 테이블을 두고, 어느 리전에서 쓰든 다른 리전으로 보통 1초 안팎에 복제해요. 기본(최종 일관성) 모드에서 같은 항목을 동시에 고치면 마지막 쓰기가 이겨요.',
        hint: '"모든 리전에서 쓰기"가 되는 것은 보기 중 하나뿐이에요.',
      },
    },
    {
      t: 'quiz',
      scene: 'lounge',
      quiz: {
        who: 'peer',
        prompt: '고객을 가장 빠른 리전으로 보내고, 그 리전이 비정상이면 다른 리전으로 보내는 Route 53 설정은?',
        options: [
          { id: 'a', text: '단순 라우팅', why: '레코드 하나에 값을 넣는 방식이라 리전별 상태를 보고 고르지 않아요.' },
          { id: 'b', text: '가중치 기반 라우팅', why: '비율로 나누는 방식이라 고객 위치와 속도를 고려하지 않아요.' },
          { id: 'c', text: '지연 시간 기반 라우팅 + 상태 확인', why: '' },
          { id: 'd', text: '지리 위치 라우팅만 쓴다', why: '나라별로 고정해서 보내는 방식이에요. 법규·언어 때문에 위치를 정확히 나눠야 할 때 써요. "가장 빠른 곳"과는 달라요.' },
        ],
        answer: 'c',
        explain: '지연 시간 기반 라우팅은 고객과 리전 사이 지연이 가장 짧은 레코드를 돌려줘요. 상태 확인을 붙이면 비정상 리전 레코드는 빼고 다음으로 빠른 리전을 돌려줘요.',
        hint: '"가장 빠른"과 "비정상이면 다른 곳" 두 조건이에요.',
      },
    },
    { t: 'design' },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'glowup', text: '미국 장바구니 응답이 0.1초대로 줄었어요. 리전 장애 훈련 때도 주문이 멈추지 않았고요!' },
        { who: 'senior', text: '동시 수정 충돌 규칙(마지막 쓰기 우선)은 개발팀과 꼭 공유해 두세요. 재고 같은 데이터는 따로 고민이 필요해요.' },
      ],
    },
  ],
  design: {
    brief: ['한국 고객 → 서울, 미국 고객 → 버지니아', '두 리전 모두 읽기·쓰기', '장바구니는 리전 간 자동 복제', '리전 하나가 멈춰도 주문 계속'],
    layout: B('root', 'plain', '', [
      B('out', 'outside', '전 세계 고객'),
      B('cloud', 'cloud', 'AWS 클라우드', [
        Z('global', 'edge', '글로벌 · DNS', 'global', 1),
        B(
          'regions',
          'plain',
          '',
          [
            B('seoul', 'region', '리전 · 서울', [Z('seoulSvc', 'plain', '서버리스 백엔드', 'region', 3), Z('seoulVpc', 'private', 'VPC · DB 서브넷', 'subnet', 2)]),
            B('us', 'region', '리전 · 버지니아 북부', [Z('usSvc', 'plain', '서버리스 백엔드', 'region', 3), Z('usVpc', 'private', 'VPC · DB 서브넷', 'subnet', 2)]),
          ],
          'row',
        ),
      ]),
    ]),
    fixed: [
      { id: 'kr', service: 'users', zone: 'out', label: '한국 고객' },
      { id: 'usa', service: 'users', zone: 'out', label: '미국 고객' },
    ],
    palette: ['route53', 'apigw', 'lambda', 'dynamodb', 'rds', 'rdsReplica', 'elasticache'],
    answer: {
      nodes: [
        { id: 'a1', service: 'route53', zone: 'global' },
        { id: 'a2', service: 'apigw', zone: 'seoulSvc' },
        { id: 'a3', service: 'lambda', zone: 'seoulSvc' },
        { id: 'a4', service: 'dynamodb', zone: 'seoulSvc' },
        { id: 'a5', service: 'apigw', zone: 'usSvc' },
        { id: 'a6', service: 'lambda', zone: 'usSvc' },
        { id: 'a7', service: 'dynamodb', zone: 'usSvc' },
      ],
      edges: [
        ['kr', 'a1'],
        ['usa', 'a1'],
        ['a1', 'a2'],
        ['a1', 'a5'],
        ['a2', 'a3'],
        ['a3', 'a4'],
        ['a5', 'a6'],
        ['a6', 'a7'],
        ['a4', 'a7'],
      ],
    },
    answerNote: [
      'Route 53: 같은 이름에 서울·버지니아 레코드를 지연 시간 기반으로 두고 각 리전 API에 상태 확인을 붙여요.',
      'DynamoDB–DynamoDB 연결은 글로벌 테이블 복제예요. 기본 모드는 최종 일관성(마지막 쓰기 우선)이고, 강한 일관성이 필요하면 멀티 리전 강한 일관성 모드를 검토해요.',
      '서버리스라 리전마다 대기 서버 비용이 거의 없어요.',
    ],
  },
  scenarios: [
    {
      id: 'speed',
      icon: '🌏',
      title: '양쪽 고객 장바구니 담기',
      desc: '한국과 미국 고객이 동시에 상품을 담습니다.',
      check: (c) => {
        if (!c.path(['kr', 'route53', 'apigw@seoul', 'lambda@seoul', 'dynamodb|rds@seoul'])) return bad('한국 고객 → Route 53 → 서울 API → Lambda → DB 경로를 만들어 주세요.')
        if (!c.path(['usa', 'route53', 'apigw@us', 'lambda@us'])) return bad('미국 고객이 쓸 버지니아 백엔드가 없어요. 태평양을 왕복해 1초씩 걸렸어요.')
        if (!c.path(['usa', 'route53', 'apigw@us', 'lambda@us', 'dynamodb@us'])) return bad('버지니아 Lambda가 쓰기를 할 수 있는 DB가 리전 안에 없어요. 읽기 복제본은 쓰기가 안 돼 서울까지 가야 해요.')
        return ok('양쪽 고객 모두 가까운 리전에서 0.1초대로 처리됐어요.')
      },
    },
    {
      id: 'roam',
      icon: '✈️',
      title: '미국 출장 중 장바구니 확인',
      desc: '서울에서 담은 장바구니를 미국에서 엽니다.',
      check: (c) => (c.path(['dynamodb@seoul', 'dynamodb@us']) ? ok('글로벌 테이블이 1초 안에 버지니아로 복제해 둬서 그대로 보였어요.') : bad('두 리전 DB가 복제로 연결되지 않아 장바구니가 비어 있어요.')),
    },
    {
      id: 'region',
      icon: '🌋',
      title: '서울 리전 장애',
      desc: '서울 리전 API가 응답하지 않습니다.',
      fail: ['seoul'],
      check: (c) =>
        c.path(['kr', 'route53', 'apigw', 'lambda', 'dynamodb'], ['seoul'])
          ? ok('상태 확인 실패 → 한국 고객도 버지니아로 보내져 주문을 계속 받았어요.')
          : bad('한국 고객이 갈 다른 리전 경로가 없어 주문이 멈췄어요.'),
    },
    {
      id: 'ops',
      icon: '🧰',
      title: '운영 부담 점검',
      desc: '두 리전에 관리할 서버가 얼마나 되는지 봅니다.',
      check: (c) => (c.has('rds') || c.has('rdsReplica') || c.has('elasticache') ? bad('관계형 DB·캐시 서버를 두 리전에 따로 운영해야 하고, 복제본은 쓰기도 안 돼요. 이번 요구에는 서버리스 DB가 맞아요.') : c.has('dynamodb') ? ok('서버를 관리할 필요 없는 구성이라 운영이 단순해요.') : bad('DB가 없어요.')),
    },
  ],
}

const s2: Project = {
  id: 'battle-accelerator',
  level: 3,
  title: '실시간 대전 게임 글로벌 접속',
  client: 'battle',
  org: '배틀로드',
  summary: 'UDP 게임 서버에 고정 IP와 빠른 리전 전환\nGlobal Accelerator, NLB',
  topics: ['Global Accelerator', 'NLB', 'UDP', '애니캐스트 고정 IP'],
  env: 'AWS (멀티 리전)',
  steps: [
    {
      t: 'talk',
      scene: 'office',
      lines: [
        { who: 'lead', text: '실시간 대전 게임 배틀로드가 유럽 서비스를 시작해요. 서울과 프랑크푸르트에 게임 서버를 둔대요.' },
        { who: 'peer', text: '게임이면 UDP죠? 웹이랑 쓰는 서비스가 좀 다를 텐데요.' },
      ],
    },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'battle', text: 'PC방이나 회사 방화벽에서 저희 서버 IP를 허용해 줘야 하는데, IP가 자꾸 바뀌면 안 돼요. 딱 몇 개로 고정해 주세요.' },
        { who: 'battle', text: '서버가 죽었을 때 DNS가 바뀔 때까지 몇 분씩 못 들어오는 것도 싫어요. 그리고 핑이 들쭉날쭉하다는 불만이 많아요.' },
        { who: 'me', text: '고정 IP로 받아서 AWS 네트워크로 가장 가까운 리전까지 보내는 구조를 쓰겠습니다.' },
      ],
    },
    {
      t: 'quiz',
      scene: 'office',
      quiz: {
        who: 'senior',
        prompt: 'UDP 게임 트래픽에 고정 IP 2개를 주고, 사용자를 가까운 정상 리전으로 보내며, DNS 캐시와 상관없이 빠르게 전환하려면?',
        options: [
          { id: 'a', text: 'CloudFront', why: 'CloudFront는 HTTP(S)·WebSocket 콘텐츠 전송용이에요. UDP 게임 트래픽은 받지 않아요.' },
          { id: 'b', text: 'AWS Global Accelerator', why: '' },
          { id: 'c', text: 'Route 53 지연 시간 기반 라우팅', why: 'DNS 방식이라 고정 IP를 주지 못하고, 클라이언트 DNS 캐시(TTL) 때문에 전환이 늦을 수 있어요.' },
          { id: 'd', text: '리전마다 탄력적 IP를 하나씩 준다', why: '리전별 IP라 사용자가 직접 골라야 하고, 장애 때 자동 전환이 안 돼요.' },
        ],
        answer: 'b',
        explain: 'Global Accelerator는 애니캐스트 고정 IP 2개를 줘요. 사용자는 가장 가까운 AWS 엣지로 들어와 AWS 글로벌 네트워크를 타고 정상 엔드포인트로 가요. TCP·UDP 모두 지원하고, 상태 확인으로 수십 초 안에 다른 리전으로 바꿔요. IP가 그대로라 DNS 캐시 영향이 없어요.',
        hint: 'IP가 "고정"이면서 "전 세계 어디서나 같은" 서비스예요.',
      },
    },
    {
      t: 'quiz',
      scene: 'lounge',
      quiz: {
        who: 'peer',
        prompt: '각 리전에서 UDP 게임 서버 여러 대로 트래픽을 나눌 로드 밸런서는?',
        options: [
          { id: 'a', text: 'ALB', why: 'ALB는 HTTP·HTTPS(7계층) 전용이에요.' },
          { id: 'b', text: 'NLB', why: '' },
          { id: 'c', text: 'Gateway Load Balancer', why: '방화벽·침입 탐지 같은 보안 장비로 트래픽을 보내는 용도예요.' },
          { id: 'd', text: '로드 밸런서는 UDP를 지원하지 않는다', why: 'NLB는 UDP를 지원해요.' },
        ],
        answer: 'b',
        explain: 'NLB는 4계층(TCP·UDP·TLS) 로드 밸런서로, 지연이 매우 짧고 초당 수백만 요청을 처리해요. Global Accelerator의 엔드포인트로 NLB를 등록할 수 있어요.',
        hint: '"계층"을 생각해 보세요. UDP는 4계층이에요.',
      },
    },
    { t: 'design' },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'battle', text: 'PC방에 IP 2개만 알려 주면 끝이에요. 서울 서버 점검 때도 유저들이 거의 못 느꼈대요!' },
        { who: 'senior', text: '웹 콘텐츠면 CloudFront, 그 밖의 TCP·UDP나 고정 IP가 필요하면 Global Accelerator. 시험에 정말 자주 나와요.' },
      ],
    },
  ],
  design: {
    brief: ['UDP 실시간 대전, 아시아·유럽 플레이어', '방화벽에 등록할 고정 IP', '리전 장애 시 수십 초 내 자동 전환', '두 리전: 서울, 프랑크푸르트'],
    layout: B('root', 'plain', '', [
      B('out', 'outside', '전 세계 플레이어'),
      B('cloud', 'cloud', 'AWS 클라우드', [
        B(
          'globalRow',
          'plain',
          '',
          [Z('global', 'edge', '글로벌', 'global', 1), Z('edge', 'edge', '엣지', 'edge', 1)],
          'row',
        ),
        B(
          'regions',
          'plain',
          '',
          [
            B('seoul', 'region', '리전 · 서울', [B('seoulVpc', 'vpc', 'VPC', [Z('seoulLb', 'public', '로드 밸런서 서브넷', 'subnet', 1), Z('seoulGame', 'private', '게임 서버 서브넷', 'subnet', 2)])]),
            B('fra', 'region', '리전 · 프랑크푸르트', [B('fraVpc', 'vpc', 'VPC', [Z('fraLb', 'public', '로드 밸런서 서브넷', 'subnet', 1), Z('fraGame', 'private', '게임 서버 서브넷', 'subnet', 2)])]),
          ],
          'row',
        ),
      ]),
    ]),
    fixed: [
      { id: 'asia', service: 'users', zone: 'out', label: '아시아 플레이어' },
      { id: 'eu', service: 'users', zone: 'out', label: '유럽 플레이어' },
    ],
    palette: ['ga', 'route53', 'cloudfront', 'nlb', 'alb', 'ec2', 'elasticache'],
    answer: {
      nodes: [
        { id: 'a1', service: 'ga', zone: 'global' },
        { id: 'a2', service: 'nlb', zone: 'seoulLb' },
        { id: 'a3', service: 'ec2', zone: 'seoulGame', label: '게임 서버' },
        { id: 'a4', service: 'nlb', zone: 'fraLb' },
        { id: 'a5', service: 'ec2', zone: 'fraGame', label: '게임 서버' },
      ],
      edges: [
        ['asia', 'a1'],
        ['eu', 'a1'],
        ['a1', 'a2'],
        ['a1', 'a4'],
        ['a2', 'a3'],
        ['a4', 'a5'],
      ],
    },
    answerNote: [
      'Global Accelerator 리스너(UDP 포트) → 리전별 엔드포인트 그룹(서울 NLB, 프랑크푸르트 NLB).',
      '트래픽 다이얼로 리전별 트래픽 비율을 조절할 수 있어 점검 때 한 리전을 0%로 내릴 수 있어요.',
      '실제 운영에서는 각 리전 게임 서버를 여러 AZ와 Auto Scaling으로 늘려요(그림에서 생략).',
    ],
  },
  scenarios: [
    {
      id: 'match',
      icon: '🎮',
      title: '대전 매칭 (UDP)',
      desc: '아시아·유럽 플레이어가 동시에 접속합니다.',
      check: (c) => {
        if (c.linked('cloudfront', 'asia') || c.linked('cloudfront', 'eu')) return bad('CloudFront는 UDP 게임 트래픽을 전달하지 않아요.')
        if (c.path(['asia|eu', 'ga|route53', 'alb'])) return bad('ALB는 HTTP 전용이라 UDP 패킷을 받지 못했어요.')
        const both = c.path(['asia', 'ga|route53', 'nlb', 'ec2']) && c.path(['eu', 'ga|route53', 'nlb@fra', 'ec2@fra'])
        return both ? ok('NLB가 UDP 패킷을 게임 서버로 전달했어요.') : bad('아시아·유럽 플레이어 → 진입점 → 리전 NLB → 게임 서버 경로를 만들어 주세요. 유럽 플레이어는 프랑크푸르트로 가야 해요.')
      },
    },
    {
      id: 'firewall',
      icon: '🧱',
      title: 'PC방 방화벽 등록',
      desc: 'PC방 관리자가 허용할 IP 목록을 요청합니다.',
      check: (c) => (c.path(['asia', 'ga']) && c.path(['eu', 'ga']) ? ok('Global Accelerator의 고정 IP 2개만 알려 주면 끝이었어요.') : bad('DNS 이름만 있어 IP가 리전·시점마다 달라져요. 고정 IP를 줄 진입점이 필요해요.')),
    },
    {
      id: 'region',
      icon: '🌋',
      title: '서울 리전 게임 서버 장애',
      desc: '서울 쪽 엔드포인트가 상태 확인에 실패합니다.',
      fail: ['seoul'],
      check: (c) => {
        if (!c.path(['asia', 'ga|route53', 'nlb', 'ec2'], ['seoul'])) return bad('아시아 플레이어가 갈 다른 리전이 없어 접속이 끊겼어요.')
        return c.path(['asia', 'ga'])
          ? ok('IP는 그대로, 수십 초 만에 프랑크푸르트로 전환됐어요. DNS 캐시 영향도 없었어요.')
          : bad('DNS 전환이라 TTL 동안 일부 플레이어가 죽은 서울 IP로 계속 접속했어요.')
      },
    },
    {
      id: 'ping',
      icon: '📶',
      title: '핑 흔들림',
      desc: '먼 거리 플레이어의 지연이 들쭉날쭉합니다.',
      check: (c) => (c.has('ga') ? ok('가까운 엣지에서 AWS 글로벌 네트워크로 들어와 공용 인터넷 구간이 줄었어요.') : bad('공용 인터넷을 오래 타서 지연이 들쭉날쭉해요.')),
    },
  ],
}

const s3: Project = {
  id: 'paybridge-privatelink',
  level: 3,
  title: '은행에 결제 API 사설 제공',
  client: 'paybridge',
  org: '페이브릿지',
  summary: 'IP 대역이 겹치는 고객사 VPC에 우리 API만 비공개로\nPrivateLink, NLB, 인터페이스 엔드포인트',
  topics: ['PrivateLink', 'VPC 엔드포인트 서비스', '인터페이스 엔드포인트', 'CIDR 중복'],
  env: 'AWS (다른 계정 VPC 간)',
  steps: [
    {
      t: 'talk',
      scene: 'office',
      lines: [
        { who: 'lead', text: '결제 SaaS 페이브릿지가 은행 고객사에 API를 제공해야 하는데, 은행은 인터넷을 거치지 말래요.' },
        { who: 'senior', text: '그룹사 허브 때처럼 TGW나 피어링을 생각하기 쉬운데… 고객사 IP 대역부터 확인해 봐요.' },
      ],
    },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'paybridge', text: '확인해 보니 은행 VPC도 10.0.0.0/16이고, 저희 VPC도 10.0.0.0/16이에요.' },
        { who: 'paybridge', text: '은행 보안팀은 저희 VPC 전체가 보이는 건 안 되고, 결제 API 하나만 열어 달래요. 저희도 은행 쪽으로 접속할 일은 없어요.' },
        { who: 'me', text: '네트워크를 합치지 않고 서비스 하나만 내보내는 방식으로 하겠습니다.' },
      ],
    },
    {
      t: 'quiz',
      scene: 'office',
      quiz: {
        who: 'senior',
        prompt: 'CIDR이 겹치는 다른 계정 VPC에, 우리 서비스 하나만 한 방향으로 사설 제공하려면?',
        options: [
          { id: 'a', text: 'VPC 피어링', why: 'CIDR이 겹치면 피어링을 만들 수 없고, 연결되면 서로의 VPC 전체로 라우팅이 열려요.' },
          { id: 'b', text: 'Transit Gateway', why: '겹치는 CIDR을 라우팅할 수 없고, 역시 네트워크 단위로 연결돼요.' },
          { id: 'c', text: 'PrivateLink (VPC 엔드포인트 서비스 + 인터페이스 엔드포인트)', why: '' },
          { id: 'd', text: '퍼블릭 API를 열고 은행 IP만 허용한다', why: '인터넷을 거치지 말라는 요구를 어겨요.' },
        ],
        answer: 'c',
        explain: 'PrivateLink는 서비스 제공자가 NLB 앞에 엔드포인트 서비스를 만들고, 고객은 자기 서브넷에 인터페이스 엔드포인트(ENI)를 만들어 그 서비스만 사설 IP로 호출해요. 네트워크를 합치지 않아서 CIDR이 겹쳐도 되고, 고객 → 서비스 한 방향으로만 열려요.',
        hint: '"네트워크 연결"이 아니라 "서비스 하나 연결"이 필요해요.',
      },
    },
    {
      t: 'quiz',
      scene: 'lounge',
      quiz: {
        who: 'peer',
        prompt: '엔드포인트 서비스를 만든 뒤 아무 계정이나 연결하지 못하게 하려면?',
        options: [
          { id: 'a', text: '보안 그룹에서 0.0.0.0/0을 허용한다', why: '오히려 넓게 열려요.' },
          { id: 'b', text: '허용 주체에 은행 AWS 계정을 등록하고, 연결 요청 수락을 필수로 설정한다', why: '' },
          { id: 'c', text: '은행에 우리 계정 IAM 사용자를 만들어 준다', why: '다른 계정에 자격 증명을 나눠 줄 필요가 없어요.' },
          { id: 'd', text: '인터넷 게이트웨이를 붙인다', why: '사설 연결과 관계없어요.' },
        ],
        answer: 'b',
        explain: '엔드포인트 서비스의 허용 주체(allowed principals)에 등록된 계정만 엔드포인트를 만들 수 있어요. 수락 필요(acceptance required)를 켜면 제공자가 요청을 직접 승인해야 연결돼요.',
        hint: '"누가" 연결할 수 있는지와 "승인"을 정하는 설정이에요.',
      },
    },
    { t: 'design' },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'paybridge', text: '은행 보안 심사를 한 번에 통과했어요. 다음 달에 카드사 두 곳도 같은 방식으로 붙인대요.' },
        { who: 'lead', text: '고객사가 늘어도 엔드포인트만 하나씩 만들면 되는 구조라 확장도 쉬워요.' },
      ],
    },
  ],
  design: {
    brief: ['은행 VPC와 우리 VPC 모두 10.0.0.0/16', '인터넷 경유 금지, 결제 API 하나만 제공', '은행 → 우리 한 방향', '우리 API는 두 AZ'],
    layout: B('root', 'plain', '', [
      B('cloud', 'cloud', 'AWS 클라우드 · 리전 서울', [
        B(
          'row',
          'plain',
          '',
          [
            B('bankVpc', 'vpc', '은행 VPC · 은행 계정 · 10.0.0.0/16', [Z('bankSub', 'private', '은행 앱 서브넷', 'subnet', 3)]),
            Z('linkZone', 'link', 'VPC 사이 연결', 'link', 1),
            B('provVpc', 'vpc', '우리 VPC · 페이브릿지 계정 · 10.0.0.0/16', [
              Z('provEdge', 'gate', 'VPC 경계', 'vpcEdge', 2),
              Z('lbZone', 'private', '로드 밸런서 서브넷 A·B', 'subnet', 1),
              B(
                'azRow',
                'plain',
                '',
                [B('provA', 'az', '가용 영역 A', [Z('apiA', 'private', 'API 서브넷', 'subnet', 2)]), B('provB', 'az', '가용 영역 B', [Z('apiB', 'private', 'API 서브넷', 'subnet', 2)])],
                'row',
              ),
            ]),
          ],
          'col',
        ),
      ]),
    ]),
    fixed: [{ id: 'bankApp', service: 'ec2Web', zone: 'bankSub', label: '은행 앱 서버' }],
    palette: ['vpceIf', 'epsvc', 'nlb', 'alb', 'ec2', 'peering', 'tgw', 'igw'],
    answer: {
      nodes: [
        { id: 'a1', service: 'vpceIf', zone: 'bankSub' },
        { id: 'a2', service: 'epsvc', zone: 'provEdge' },
        { id: 'a3', service: 'nlb', zone: 'lbZone' },
        { id: 'a4', service: 'ec2', zone: 'apiA', label: '결제 API' },
        { id: 'a5', service: 'ec2', zone: 'apiB', label: '결제 API' },
      ],
      edges: [
        ['bankApp', 'a1'],
        ['a1', 'a2'],
        ['a2', 'a3'],
        ['a3', 'a4'],
        ['a3', 'a5'],
      ],
    },
    answerNote: [
      '은행 서브넷의 인터페이스 엔드포인트(ENI)는 은행 VPC 대역의 사설 IP를 받아요. 은행 앱은 그 IP(또는 프라이빗 DNS 이름)로 호출해요.',
      '엔드포인트 서비스는 NLB(또는 Gateway Load Balancer) 앞에 만들어요. ALB는 바로 연결할 수 없어요.',
      '실제 서비스에서는 은행 쪽 엔드포인트도 두 AZ 서브넷에 만들어 가용성을 높여요.',
    ],
  },
  scenarios: [
    {
      id: 'call',
      icon: '💳',
      title: '결제 승인 요청',
      desc: '은행 앱이 결제 API를 호출합니다.',
      check: (c) => {
        if (c.linked('epsvc', 'alb') || c.linked('vpceIf', 'alb')) return bad('엔드포인트 서비스는 NLB(또는 GWLB) 앞에만 만들 수 있어요.')
        return c.path(['bankApp', 'vpceIf', 'epsvc', 'nlb', 'ec2']) ? ok('은행 서브넷 엔드포인트 → PrivateLink → NLB → 결제 API로 사설 호출됐어요.') : bad('은행 앱 → 인터페이스 엔드포인트 → 엔드포인트 서비스 → NLB → 결제 API 경로를 만들어 주세요.')
      },
    },
    {
      id: 'overlap',
      icon: '🧮',
      title: 'IP 대역 중복 점검',
      desc: '두 VPC 모두 10.0.0.0/16입니다.',
      check: (c) => (c.has('peering') || c.has('tgw') ? bad('CIDR이 겹쳐서 피어링·TGW로는 라우팅할 수 없어요.') : c.has('vpceIf') ? ok('네트워크를 합치지 않아 대역이 겹쳐도 문제없었어요.') : bad('두 VPC를 이을 방법이 없어요.')),
    },
    {
      id: 'scope',
      icon: '🛡️',
      title: '은행 보안 심사',
      desc: '노출 범위와 인터넷 경유 여부를 봅니다.',
      check: (c) => (c.has('igw') ? bad('인터넷 게이트웨이가 있어 인터넷 노출 여부를 소명해야 해요. 이번 연결에는 필요 없어요.') : c.path(['bankApp', 'vpceIf', 'epsvc']) ? ok('은행에서 보이는 건 결제 API 하나뿐이고, 우리 쪽에서 은행으로 가는 길은 없어요.') : bad('사설 연결이 없어요.')),
    },
    {
      id: 'az',
      icon: '⚡',
      title: '우리 쪽 AZ A 장애',
      desc: '페이브릿지 VPC의 AZ A가 멈춥니다.',
      fail: ['provA'],
      check: (c) => (c.path(['bankApp', 'vpceIf', 'epsvc', 'nlb', 'ec2'], ['provA']) ? ok('NLB가 AZ B의 API로만 보내 승인이 계속됐어요.') : bad('결제 API가 AZ A에만 있어 승인이 멈췄어요.')),
    },
  ],
}

const s4: Project = {
  id: 'precision-backup',
  level: 3,
  title: '랜섬웨어에도 지워지지 않는 백업',
  client: 'precision',
  org: '대한정밀',
  summary: '관리자 계정이 털려도 남는 백업, 다른 리전·계정에 사본\nAWS Backup, Vault Lock, 교차 계정·리전 복사',
  topics: ['AWS Backup', 'Vault Lock 규정 준수 모드', '교차 계정·리전 백업', 'RDS 백업 보관 기간'],
  env: 'AWS (다중 계정)',
  steps: [
    {
      t: 'talk',
      scene: 'office',
      lines: [
        { who: 'lead', text: '제조사 대한정밀이에요. 같은 업계 회사가 랜섬웨어에 당했는데, 공격자가 백업까지 지웠대요.' },
        { who: 'senior', text: '백업이 운영 계정 안에만 있으면 관리자 권한을 뺏긴 순간 같이 사라져요.' },
      ],
    },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'precision', text: 'ERP 서버와 DB를 매일 백업하고 1년 동안 보관해야 해요. 감사 규정이에요.' },
        { who: 'precision', text: '관리자 계정이 털려도 백업은 절대 지워지면 안 되고, 서울 리전에 큰 장애가 나도 복구할 수 있어야 해요.' },
        { who: 'me', text: '백업을 다른 계정, 다른 리전으로 복사하고, 그곳을 아무도 못 지우게 잠그겠습니다.' },
      ],
    },
    {
      t: 'quiz',
      scene: 'office',
      quiz: {
        who: 'senior',
        prompt: '백업 볼트의 복구 지점을 루트 사용자를 포함해 누구도 보관 기간 전에 지우지 못하게 하려면?',
        options: [
          { id: 'a', text: '볼트 접근 정책으로 삭제를 거부한다', why: '정책은 권한 있는 관리자가 다시 바꿀 수 있어요.' },
          { id: 'b', text: 'AWS Backup Vault Lock 거버넌스 모드', why: '특정 IAM 권한이 있는 사용자는 잠금을 풀거나 지울 수 있어요. 테스트용에 가까워요.' },
          { id: 'c', text: 'AWS Backup Vault Lock 규정 준수(Compliance) 모드', why: '' },
          { id: 'd', text: '백업에 태그를 붙인다', why: '태그는 분류용이지 삭제를 막지 않아요.' },
        ],
        answer: 'c',
        explain: '규정 준수 모드는 유예 기간(최소 72시간)이 지나면 잠금이 고정돼요. 그 뒤로는 루트 사용자나 AWS도 잠금을 풀거나 보관 기간 전에 복구 지점을 지울 수 없어요. 그래서 설정 전에 보관 기간을 신중히 정해야 해요.',
        hint: '"누구도"라는 단어가 핵심이에요.',
      },
    },
    {
      t: 'quiz',
      scene: 'lounge',
      quiz: {
        who: 'peer',
        prompt: 'RDS 자동 백업으로 "1년 보관" 요구를 맞출 수 있을까요? 자동 백업 보관 기간 최대치는?',
        options: [
          { id: 'a', text: '7일이라 안 된다', why: '7일은 기본값에 가까운 값이고, 최대는 더 길어요.' },
          { id: 'b', text: '35일이라 안 된다. AWS Backup 계획이나 수동 스냅샷으로 길게 보관해야 한다', why: '' },
          { id: 'c', text: '365일까지 되니 그대로 쓴다', why: '자동 백업은 그렇게 길게 보관할 수 없어요.' },
          { id: 'd', text: '무제한이다', why: '자동 백업에는 최대 보관 기간이 있어요.' },
        ],
        answer: 'b',
        explain: 'RDS 자동 백업 보관 기간은 최대 35일이에요. 더 오래 보관하려면 AWS Backup 백업 계획(수명 주기로 기간 지정)이나 수동 스냅샷을 써요. 읽기 복제본은 백업이 아니에요. 잘못 지우거나 암호화한 데이터도 그대로 복제되거든요.',
        hint: '한 달이 조금 넘는 숫자예요.',
      },
    },
    { t: 'design' },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'precision', text: '모의 해킹 팀이 운영 계정 관리자 권한으로 백업 삭제를 시도했는데 실패했대요. 감사도 통과했어요!' },
        { who: 'senior', text: '복구 훈련도 꼭 해 보세요. 복원해 본 적 없는 백업은 백업이 아니에요.' },
      ],
    },
  ],
  design: {
    brief: ['ERP 서버(EC2)·DB(RDS) 매일 백업, 1년 보관', '운영 계정 관리자 권한이 털려도 백업 유지', '서울 리전 장애에도 복구 가능'],
    layout: B('root', 'plain', '', [
      B(
        'cloud',
        'cloud',
        'AWS 클라우드',
        [
          B('prodAcct', 'plain', '운영 계정', [
            B('seoulR', 'region', '리전 · 서울', [B('vpc', 'vpc', 'VPC', [Z('erpSub', 'private', 'ERP 서브넷', 'subnet', 3)]), Z('prodSvc', 'plain', '리전 서비스', 'region', 2)]),
          ]),
          B('bkAcct', 'plain', '백업 전용 계정 (별도 관리자)', [
            B('bkSeoul', 'region', '리전 · 서울', [Z('bkSeoulSvc', 'plain', '리전 서비스', 'region', 1)]),
            B('bkTokyo', 'region', '리전 · 도쿄', [Z('bkTokyoSvc', 'plain', '리전 서비스', 'region', 1)]),
          ]),
        ],
        'row',
      ),
    ]),
    fixed: [
      { id: 'erp', service: 'ec2', zone: 'erpSub', label: 'ERP 서버' },
      { id: 'erpDb', service: 'rds', zone: 'erpSub', label: 'ERP DB' },
    ],
    fixedEdges: [['erp', 'erpDb']],
    palette: ['backup', 'rdsReplica', 's3', 'glacier', 'lambda', 'kms'],
    answer: {
      nodes: [
        { id: 'a1', service: 'backup', zone: 'prodSvc', label: 'AWS Backup (백업 계획·볼트)' },
        { id: 'a2', service: 'backup', zone: 'bkTokyoSvc', label: '백업 볼트 (Vault Lock 규정 준수)' },
      ],
      edges: [
        ['erp', 'a1'],
        ['erpDb', 'a1'],
        ['a1', 'a2'],
      ],
    },
    answerNote: [
      '운영 계정의 백업 계획이 매일 EC2(EBS 포함)와 RDS를 백업하고, 복사 규칙으로 백업 전용 계정 도쿄 볼트에 사본을 보내요(교차 계정·교차 리전 복사).',
      '도쿄 볼트에는 Vault Lock 규정 준수 모드를 걸고 최소 보관 기간 365일을 둬요.',
      '교차 계정 복사는 AWS Organizations 안의 계정끼리 설정해요. 같은 목적의 선택지로 AWS Backup 논리적 에어갭 볼트도 있어요.',
    ],
  },
  scenarios: [
    {
      id: 'daily',
      icon: '🗓️',
      title: '매일 밤 백업',
      desc: 'ERP 서버와 DB를 백업합니다.',
      check: (c) => (c.linked('erp', 'backup') && c.linked('erpDb', 'backup') ? ok('백업 계획이 서버와 DB를 한 번에 백업했어요.') : bad('ERP 서버와 DB를 모두 AWS Backup에 연결해 주세요.')),
    },
    {
      id: 'hack',
      icon: '🦠',
      title: '운영 계정 관리자 탈취',
      desc: '공격자가 운영 계정 관리자 권한으로 모든 백업 삭제를 시도합니다.',
      fail: ['prodAcct'],
      check: (c) => {
        if (c.has('rdsReplica') && !c.has('backup', 'bkAcct')) return bad('읽기 복제본은 백업이 아니에요. 암호화된 데이터가 그대로 복제됐어요.')
        return c.path(['backup@prodAcct', 'backup@bkAcct'])
          ? ok('운영 계정 백업은 지워졌지만, 백업 전용 계정의 잠긴 사본은 남아 있었어요.')
          : bad('백업이 운영 계정 안에만 있어서 함께 지워졌어요. 다른 계정으로 사본을 복사하세요.')
      },
    },
    {
      id: 'region',
      icon: '🌋',
      title: '서울 리전 대규모 장애',
      desc: '서울 리전 전체를 쓸 수 없습니다.',
      fail: ['seoulR', 'bkSeoul'],
      check: (c) => (c.has('backup', 'bkTokyo') && c.path(['backup@prodAcct', 'backup@bkTokyo']) ? ok('도쿄 볼트의 사본으로 다른 리전에서 ERP를 복원했어요.') : bad('사본이 모두 서울에 있어 복원할 곳이 없어요. 다른 리전으로 복사하세요.')),
    },
    {
      id: 'audit',
      icon: '📋',
      title: '1년 보관 감사',
      desc: '감사관이 11개월 전 백업을 요구합니다.',
      check: (c) => (c.has('backup') ? ok('백업 계획 보관 기간이 1년이라 11개월 전 복구 지점이 남아 있었어요.') : bad('RDS 자동 백업만으로는 35일까지만 남아요.')),
    },
  ],
}

const s5: Project = {
  id: 'coupon-proxy',
  level: 3,
  title: '선착순 쿠폰 DB 연결 폭주',
  client: 'coupon',
  org: '쿠폰다모아',
  summary: 'Lambda 동시 실행이 DB 연결을 고갈시키는 문제\nRDS Proxy, Secrets Manager, 예약된 동시성',
  topics: ['RDS Proxy', '연결 풀링', 'Lambda 동시성', 'Secrets Manager'],
  env: 'AWS',
  steps: [
    {
      t: 'talk',
      scene: 'office',
      lines: [
        { who: 'lead', text: '쿠폰다모아가 선착순 쿠폰 오픈마다 "too many connections" 오류로 서비스가 멈춘대요.' },
        { who: 'senior', text: 'API Gateway + Lambda + RDS 구조죠? Lambda가 1,000개 동시에 뜨면 DB 연결도 1,000개 생겨요.' },
      ],
    },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'coupon', text: 'DB 사양을 두 단계 올렸는데 다음 이벤트에서 또 터졌어요.' },
        { who: 'coupon', text: 'DB 비밀번호는 지금 Lambda 환경 변수에 그대로 들어 있어요. 그리고 지난번 DB 장애 조치 때 1분 넘게 오류가 났고요.' },
        { who: 'me', text: 'Lambda와 DB 사이에서 연결을 모아 주는 계층을 두겠습니다.' },
      ],
    },
    {
      t: 'quiz',
      scene: 'office',
      quiz: {
        who: 'senior',
        prompt: 'Lambda 동시 실행이 몰릴 때 DB 연결 고갈을 막는 가장 알맞은 방법은?',
        options: [
          { id: 'a', text: 'DB 인스턴스 크기를 계속 키운다', why: '최대 연결 수가 조금 늘 뿐, 동시 실행이 더 늘면 또 터져요. 비용만 커져요.' },
          { id: 'b', text: 'RDS Proxy로 연결을 풀링·재사용한다', why: '' },
          { id: 'c', text: '읽기 전용 복제본을 추가한다', why: '쿠폰 발급은 쓰기라 복제본이 받을 수 없어요.' },
          { id: 'd', text: 'Lambda 메모리를 늘린다', why: '실행 속도는 빨라질 수 있어도 연결 수 문제는 그대로예요.' },
        ],
        answer: 'b',
        explain: 'RDS Proxy는 DB 연결 풀을 유지하고 수많은 Lambda 연결을 적은 수의 DB 연결로 모아(다중화) 보내요. 장애 조치 때도 클라이언트 연결을 유지해 전환 시간을 줄여 주고(AWS 기준 최대 66%), DB 자격 증명은 Secrets Manager에서 가져와요.',
        hint: '연결을 "모아서 다시 쓰는" 계층이에요.',
      },
    },
    {
      t: 'quiz',
      scene: 'lounge',
      quiz: {
        who: 'peer',
        prompt: '프록시와 별개로, 이 Lambda 함수가 동시에 최대 200개까지만 실행되게 상한을 걸려면?',
        options: [
          { id: 'a', text: '프로비저닝된 동시성 200', why: '미리 데워 둔 실행 환경 수예요. 콜드 스타트를 줄이는 기능이지 상한을 거는 기능이 아니에요.' },
          { id: 'b', text: '예약된 동시성 200', why: '' },
          { id: 'c', text: '제한 시간 200초', why: '한 번 실행의 최대 시간이에요.' },
          { id: 'd', text: '메모리 200MB', why: '동시 실행 수와 관계없어요.' },
        ],
        answer: 'b',
        explain: '예약된 동시성은 그 함수용 동시성을 확보하는 동시에 최대 동시 실행 수의 상한이 돼요. 넘치는 요청은 스로틀링되니, API 쪽에서 재시도하거나 SQS로 버퍼링하는 설계를 함께 고려해요.',
        hint: '"예약"하면 그만큼만 쓸 수 있어요.',
      },
    },
    { t: 'design' },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'coupon', text: '이번 오픈 때 Lambda는 수백 개 떴는데 DB 연결은 수십 개로 안정적이었어요. DB 사양도 다시 내렸어요!' },
        { who: 'senior', text: '서버리스와 관계형 DB를 같이 쓸 땐 RDS Proxy가 거의 필수예요.' },
      ],
    },
  ],
  design: {
    brief: ['API Gateway + Lambda로 쿠폰 발급, 오픈 순간 동시 1,000건', 'DB 연결 고갈 없이', 'DB 장애 조치 영향 최소화', '비밀번호를 코드·환경 변수에 두지 않기'],
    layout: B('root', 'plain', '', [
      B('out', 'outside', '인터넷'),
      B('cloud', 'cloud', 'AWS 클라우드', [
        B('region', 'region', '리전 · 서울', [
          Z('svc', 'plain', '서버리스·리전 서비스', 'region', 4),
          B('vpc', 'vpc', 'VPC', [
            Z('proxyZone', 'private', '프록시 서브넷 A·B', 'subnet', 1),
            B(
              'azRow',
              'plain',
              '',
              [B('azA', 'az', '가용 영역 A', [Z('dbA', 'private', 'DB 서브넷', 'subnet', 2)]), B('azB', 'az', '가용 영역 B', [Z('dbB', 'private', 'DB 서브넷', 'subnet', 2)])],
              'row',
            ),
          ]),
        ]),
      ]),
    ]),
    fixed: [{ ...USERS, label: '쿠폰 사냥꾼들' }],
    palette: ['apigw', 'lambda', 'rdsproxy', 'rds', 'rdsStandby', 'rdsRead', 'secrets', 'elasticache'],
    answer: {
      nodes: [
        { id: 'a1', service: 'apigw', zone: 'svc' },
        { id: 'a2', service: 'lambda', zone: 'svc', label: '쿠폰 발급' },
        { id: 'a3', service: 'secrets', zone: 'svc' },
        { id: 'a4', service: 'rdsproxy', zone: 'proxyZone' },
        { id: 'a5', service: 'rds', zone: 'dbA' },
        { id: 'a6', service: 'rdsStandby', zone: 'dbB' },
      ],
      edges: [
        ['users', 'a1'],
        ['a1', 'a2'],
        ['a2', 'a4'],
        ['a4', 'a5'],
        ['a5', 'a6'],
        ['a4', 'a3'],
      ],
    },
    answerNote: [
      'Lambda는 VPC에 연결해 RDS Proxy 엔드포인트로 접속해요. 프록시가 Secrets Manager에서 DB 자격 증명을 가져오고, Lambda는 IAM 인증으로 프록시에 접속할 수 있어요.',
      '기본 DB(AZ A) ↔ 대기 DB(AZ B)는 Multi-AZ예요. 장애 조치 때 프록시가 연결을 잡아 둬서 앱 쪽 오류 시간이 짧아요.',
      'Lambda 함수에는 예약된 동시성으로 상한을 걸어 DB를 이중으로 보호해요.',
    ],
  },
  scenarios: [
    {
      id: 'open',
      icon: '🎟️',
      title: '쿠폰 오픈 (동시 1,000건)',
      desc: '정각에 요청이 몰립니다.',
      load: 4,
      check: (c) => {
        if (c.linked('lambda', 'rds')) return bad('Lambda가 DB에 바로 붙어 있어 연결 1,000개가 생기고 "too many connections"로 멈췄어요.')
        if (c.linked('lambda', 'rdsRead') && !c.linked('lambda', 'rdsproxy')) return bad('쿠폰 발급은 쓰기라 읽기 복제본이 받을 수 없어요.')
        return c.path(['users', 'apigw', 'lambda', 'rdsproxy', 'rds|rdsStandby']) ? ok('프록시가 연결을 수십 개로 모아 DB가 안정적으로 처리했어요.') : bad('사용자 → API Gateway → Lambda → RDS Proxy → DB 경로를 만들어 주세요.')
      },
    },
    {
      id: 'failover',
      icon: '⚡',
      title: 'DB 장애 조치',
      desc: 'AZ A의 기본 DB가 멈춥니다.',
      fail: ['azA'],
      check: (c) => {
        if (!c.has('rdsStandby', 'azB')) return bad('다른 AZ에 대기 DB가 없어 장애 조치할 곳이 없어요.')
        return c.path(['lambda', 'rdsproxy', 'rds|rdsStandby'], ['azA']) ? ok('프록시가 연결을 유지한 채 대기 DB로 넘겨 오류가 몇 초 만에 끝났어요.') : bad('대기 DB로 전환됐지만 Lambda가 새 연결을 맺느라 오류가 길어졌어요.')
      },
    },
    {
      id: 'secret',
      icon: '🗝️',
      title: '보안 점검',
      desc: 'DB 비밀번호가 어디 있는지 봅니다.',
      check: (c) => (c.linked('rdsproxy', 'secrets') ? ok('비밀번호는 Secrets Manager에만 있고, 프록시가 가져다 써요. 자동 교체도 켤 수 있어요.') : bad('비밀번호가 여전히 Lambda 환경 변수에 있어요. Secrets Manager에 넣고 프록시와 연결하세요.')),
    },
  ],
}

export const PROJECTS3: Project[] = [j1, j2, j3, j4, j5, s1, s2, s3, s4, s5]
