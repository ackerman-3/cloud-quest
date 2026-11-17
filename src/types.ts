// 공통 타입 정의

/** 서비스가 놓일 수 있는 범위 */
export type Scope =
  | 'subnet' // VPC 서브넷 안 (EC2, RDS, ALB, NAT 게이트웨이 등)
  | 'vpcEdge' // VPC 경계 (인터넷 게이트웨이, 가상 프라이빗 게이트웨이, VPC 엔드포인트)
  | 'region' // 리전 서비스 (S3, DynamoDB, SQS, Lambda 등)
  | 'edge' // 엣지 로케이션 (CloudFront, WAF)
  | 'global' // 글로벌 서비스 (Route 53)
  | 'group' // 묶음 설정 (Auto Scaling 그룹)
  | 'onprem' // 고객 데이터센터 안
  | 'link' // 데이터센터와 AWS를 잇는 회선
  | 'fixed' // 고정 요소 (사용자, 인터넷 등)

export type Category =
  | 'compute'
  | 'database'
  | 'network'
  | 'storage'
  | 'security'
  | 'integration'
  | 'onprem'
  | 'actor'

export interface Service {
  id: string
  name: string // 전체 이름
  short: string // 아이콘에 들어갈 약칭
  cat: Category
  scope: Scope
  desc: string // 한 줄 설명
  cost: number // 비용 지수(0~3), 시간당 과금되는 리소스일수록 큼
}

export type BoxKind =
  | 'plain'
  | 'outside'
  | 'cloud'
  | 'region'
  | 'vpc'
  | 'az'
  | 'public'
  | 'private'
  | 'gate'
  | 'edge'
  | 'group'
  | 'onprem'
  | 'link'

export interface Box {
  id: string
  kind: BoxKind
  label: string
  dir?: 'row' | 'col'
  children?: Box[]
  /** 이 상자에 서비스를 놓을 수 있으면 지정 */
  zone?: { scope: Scope; max?: number }
}

export interface PNode {
  id: string
  service: string
  zone: string
  label?: string
  fixed?: boolean
}

export type Edge = [string, string]

export interface Design {
  nodes: PNode[]
  edges: Edge[]
}

export interface Ctx {
  /** chain: 'ec2', 'ec2@appA', 'rds|rdsStandby', 고정 노드 id 등. fail: 장애 상자 id 또는 'svc:서비스id' */
  path: (chain: string[], fail?: string[]) => boolean
  has: (service: string, box?: string) => boolean
  count: (service: string, box?: string) => number
  linked: (a: string, b: string) => boolean
  nodes: (service: string) => PNode[]
  inBox: (node: PNode, box: string) => boolean
  azOf: (node: PNode) => string | null
}

export interface Result {
  ok: boolean
  msg: string
}

export interface Scenario {
  id: string
  icon: string
  title: string
  desc: string
  /** 시뮬레이션 화면에서 장애로 표시할 상자 id 또는 'svc:서비스id' */
  fail?: string[]
  /** 트래픽 배수(시각 효과용) */
  load?: number
  check: (c: Ctx) => Result
}

export interface DesignSpec {
  brief: string[]
  layout: Box
  fixed: PNode[]
  fixedEdges?: Edge[]
  palette: string[]
  answer: Design
  answerNote: string[]
}

export interface QuizOption {
  id: string
  text: string
  why: string
}

export interface Quiz {
  who: string // 질문하는 캐릭터
  prompt: string
  options: QuizOption[]
  answer: string
  explain: string
  hint: string
}

export type SceneName = 'office' | 'meeting' | 'lounge'

export interface Line {
  who: string // 캐릭터 id, 'me'(나), 'narr'(지문)
  text: string
}

export type Step =
  | { t: 'talk'; scene: SceneName; lines: Line[] }
  | { t: 'quiz'; scene: SceneName; quiz: Quiz }
  | { t: 'design' }

export interface Project {
  id: string
  level: 1 | 2 | 3
  title: string
  client: string // 캐릭터 id
  org: string
  summary: string
  topics: string[]
  env: string // 온프레미스 / AWS / 하이브리드 등
  steps: Step[]
  design: DesignSpec
  scenarios: Scenario[]
}
