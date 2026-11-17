import type { Category, Service } from '../types'

export const SERVICES: Record<string, Service> = Object.fromEntries(
  (
    [
      // 고정 요소
      { id: 'users', name: '사용자', short: '👥', cat: 'actor', scope: 'fixed', desc: '인터넷에서 접속하는 고객', cost: 0 },
      { id: 'internet', name: '인터넷', short: '🌐', cat: 'actor', scope: 'fixed', desc: '외부 인터넷', cost: 0 },
      { id: 'onpremDb', name: '온프레미스 DB', short: 'DB', cat: 'onprem', scope: 'fixed', desc: '고객 데이터센터의 데이터베이스', cost: 0 },
      { id: 'nas', name: '파일 서버', short: 'NAS', cat: 'onprem', scope: 'fixed', desc: '사무실 파일 서버', cost: 0 },
      { id: 'line', name: '인터넷 회선', short: '〰', cat: 'onprem', scope: 'fixed', desc: '이미 사용 중인 인터넷 회선', cost: 0 },

      // 네트워크
      { id: 'igw', name: '인터넷 게이트웨이', short: 'IGW', cat: 'network', scope: 'vpcEdge', desc: 'VPC와 인터넷을 연결하는 관문', cost: 0 },
      { id: 'natgw', name: 'NAT 게이트웨이', short: 'NAT', cat: 'network', scope: 'subnet', desc: '프라이빗 서브넷의 나가는 인터넷 통신만 허용', cost: 2 },
      { id: 'alb', name: 'ALB (Application Load Balancer)', short: 'ALB', cat: 'network', scope: 'subnet', desc: 'HTTP 요청을 여러 서버로 분산', cost: 2 },
      { id: 'cloudfront', name: 'CloudFront', short: 'CF', cat: 'network', scope: 'edge', desc: '전 세계 엣지에서 콘텐츠를 캐시해 전송(CDN)', cost: 1 },
      { id: 'route53', name: 'Route 53', short: 'R53', cat: 'network', scope: 'global', desc: 'DNS. 상태 확인 기반 장애 조치 라우팅', cost: 1 },
      { id: 'vgw', name: '가상 프라이빗 게이트웨이', short: 'VGW', cat: 'network', scope: 'vpcEdge', desc: 'VPC 쪽 VPN·Direct Connect 연결 지점', cost: 0 },
      { id: 'cgw', name: '고객 게이트웨이', short: 'CGW', cat: 'network', scope: 'onprem', desc: '데이터센터 쪽 VPN 장비(라우터·방화벽)', cost: 0 },
      { id: 'vpn', name: 'Site-to-Site VPN', short: 'VPN', cat: 'network', scope: 'link', desc: '인터넷 위에 암호화(IPsec) 터널 구성', cost: 1 },
      { id: 'dx', name: 'Direct Connect', short: 'DX', cat: 'network', scope: 'link', desc: 'AWS와 전용 회선으로 연결', cost: 3 },
      { id: 'vpce', name: 'S3 게이트웨이 엔드포인트 (VPC 엔드포인트)', short: 'VPCE', cat: 'network', scope: 'vpcEdge', desc: '인터넷을 거치지 않고 S3에 접근', cost: 0 },

      // 컴퓨팅
      { id: 'ec2', name: 'EC2 (웹·앱 서버)', short: 'EC2', cat: 'compute', scope: 'subnet', desc: '가상 서버', cost: 2 },
      { id: 'ec2Web', name: 'EC2 (주문 접수 서버)', short: 'WEB', cat: 'compute', scope: 'subnet', desc: '주문을 받는 웹 서버', cost: 2 },
      { id: 'ec2Worker', name: 'EC2 (주문 처리 워커)', short: 'WRK', cat: 'compute', scope: 'subnet', desc: '결제·재고 처리를 하는 서버', cost: 2 },
      { id: 'asg', name: 'Auto Scaling 그룹', short: 'ASG', cat: 'compute', scope: 'group', desc: '부하에 따라 EC2 수를 자동 조절', cost: 0 },
      { id: 'lambda', name: 'Lambda', short: 'λ', cat: 'compute', scope: 'region', desc: '요청이 올 때만 코드 실행(서버리스)', cost: 0 },

      // 데이터베이스
      { id: 'rds', name: 'RDS (기본 DB)', short: 'RDS', cat: 'database', scope: 'subnet', desc: '관리형 관계형 DB', cost: 2 },
      { id: 'rdsStandby', name: 'RDS 대기 DB (Multi-AZ)', short: 'RDS·S', cat: 'database', scope: 'subnet', desc: '다른 AZ에 동기 복제, 장애 시 자동 전환', cost: 2 },
      { id: 'rdsReplica', name: 'RDS 리전 간 읽기 복제본', short: 'RDS·R', cat: 'database', scope: 'subnet', desc: '다른 리전에 비동기 복제, 필요 시 승격', cost: 2 },
      { id: 'dynamodb', name: 'DynamoDB', short: 'DDB', cat: 'database', scope: 'region', desc: '서버리스 NoSQL DB', cost: 1 },
      { id: 'elasticache', name: 'ElastiCache', short: 'CACHE', cat: 'database', scope: 'subnet', desc: '인메모리 캐시(Redis 등)', cost: 2 },

      // 스토리지
      { id: 's3', name: 'S3', short: 'S3', cat: 'storage', scope: 'region', desc: '객체 스토리지', cost: 1 },
      { id: 'glacier', name: 'S3 Glacier Deep Archive', short: 'GLC', cat: 'storage', scope: 'region', desc: '장기 보관용 최저가 스토리지 클래스', cost: 0 },
      { id: 'storagegw', name: 'Storage Gateway (S3 파일 게이트웨이)', short: 'SGW', cat: 'storage', scope: 'onprem', desc: '사내에서 S3를 파일 공유처럼 사용', cost: 1 },

      // 보안
      { id: 'waf', name: 'AWS WAF', short: 'WAF', cat: 'security', scope: 'edge', desc: 'SQL 인젝션 등 웹 공격 요청 차단', cost: 1 },

      // 애플리케이션 통합
      { id: 'apigw', name: 'API Gateway', short: 'API', cat: 'integration', scope: 'region', desc: 'API 요청을 받아 백엔드로 전달', cost: 0 },
      { id: 'sqs', name: 'SQS', short: 'SQS', cat: 'integration', scope: 'region', desc: '메시지를 저장해 두는 대기열(큐)', cost: 0 },
      { id: 'sns', name: 'SNS', short: 'SNS', cat: 'integration', scope: 'region', desc: '메시지를 구독자에게 즉시 발행(푸시)', cost: 0 },
    ] as Service[]
  ).map((s) => [s.id, s]),
)

export const CAT_COLOR: Record<Category, string> = {
  compute: '#ED7100',
  database: '#C925D1',
  network: '#8C4FFF',
  storage: '#3F8624',
  security: '#DD344C',
  integration: '#E7157B',
  onprem: '#5A6B7B',
  actor: '#232F3E',
}

export const SCOPE_HINT: Record<string, string> = {
  subnet: 'VPC 서브넷 안에 두는 리소스예요.',
  vpcEdge: 'VPC 경계(게이트웨이 영역)에 붙는 리소스예요.',
  region: '서브넷이 아니라 리전 수준에서 동작하는 서비스예요.',
  edge: '리전이 아니라 전 세계 엣지 로케이션에서 동작해요.',
  global: '특정 리전에 속하지 않는 글로벌 서비스예요.',
  group: '서버 묶음에 대한 설정이라 Auto Scaling 그룹 영역에 둬요.',
  onprem: '고객 데이터센터 쪽에 설치하는 장비예요.',
  link: '데이터센터와 AWS 사이의 연결 회선 영역에 둬요.',
}

export const svc = (id: string): Service =>
  SERVICES[id] ?? { id, name: id, short: id, cat: 'actor', scope: 'fixed', desc: '', cost: 0 }
