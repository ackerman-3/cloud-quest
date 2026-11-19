// AWS 아키텍처 다이어그램 느낌의 단순한 흰색 선 아이콘(직접 그린 것, 24x24 기준)
const g = {
  chip: (
    <>
      <rect x="7" y="7" width="10" height="10" rx="1" />
      <path d="M9.5 4v3M12 4v3M14.5 4v3M9.5 17v3M12 17v3M14.5 17v3M4 9.5h3M4 12h3M4 14.5h3M17 9.5h3M17 12h3M17 14.5h3" />
    </>
  ),
  container: (
    <>
      <path d="M12 4l7 4v8l-7 4-7-4V8z" />
      <path d="M5 8l7 4 7-4M12 12v8" />
    </>
  ),
  lambda: <path d="M6 19h3.2l3-7 3.3 7H19M8 5h2.5l7 14" />,
  scale: (
    <>
      <rect x="9" y="9" width="6" height="6" />
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M10.5 4.5L12 3l1.5 1.5M10.5 19.5L12 21l1.5-1.5M4.5 10.5L3 12l1.5 1.5M19.5 10.5L21 12l-1.5 1.5" />
    </>
  ),
  db: (
    <>
      <ellipse cx="12" cy="6.5" rx="6" ry="2.5" />
      <path d="M6 6.5v11c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-11M6 12c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5" />
    </>
  ),
  cache: (
    <>
      <ellipse cx="12" cy="6.5" rx="6" ry="2.5" />
      <path d="M6 6.5v11c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-11" />
      <path d="M12.8 10.5l-2.3 3.5h3l-2.3 3.5" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="5" />
      <path d="M14.2 14.2L19 19" />
    </>
  ),
  catalog: (
    <>
      <rect x="5" y="4" width="14" height="16" rx="1" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </>
  ),
  migrate: (
    <>
      <ellipse cx="7" cy="8" rx="3" ry="1.3" />
      <path d="M4 8v7c0 .7 1.3 1.3 3 1.3s3-.6 3-1.3V8" />
      <ellipse cx="17" cy="8" rx="3" ry="1.3" />
      <path d="M14 8v7c0 .7 1.3 1.3 3 1.3s3-.6 3-1.3V8M10.5 12h3M12.5 10.8l1.2 1.2-1.2 1.2" />
    </>
  ),
  lb: (
    <>
      <circle cx="9" cy="12" r="4" />
      <path d="M13 12h2.5M15.5 6.5v11M15.5 6.5H18M15.5 12H18M15.5 17.5H18" />
      <circle cx="19" cy="6.5" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="19" cy="17.5" r="1" />
    </>
  ),
  igw: (
    <>
      <path d="M7 19V10a5 5 0 0 1 10 0v9" />
      <path d="M9.5 19v-8.5a2.5 2.5 0 0 1 5 0V19" />
    </>
  ),
  nat: (
    <>
      <circle cx="12" cy="12" r="7.5" />
      <path d="M8 9.5h7.5M13.5 7.5l2 2-2 2M16 14.5H8.5M10.5 12.5l-2 2 2 2" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="7.5" />
      <path d="M4.5 12h15M12 4.5c2.2 2.2 3.2 4.7 3.2 7.5s-1 5.3-3.2 7.5c-2.2-2.2-3.2-4.7-3.2-7.5S9.8 6.7 12 4.5z" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.5l7 2.5v5.5c0 4.2-3 7.5-7 9-4-1.5-7-4.8-7-9V6z" />
      <path d="M9 11.5l2.2 2.2L15.5 9.5" />
    </>
  ),
  lock: (
    <>
      <rect x="6" y="11" width="12" height="9" rx="1" />
      <path d="M8.5 11V8.5a3.5 3.5 0 0 1 7 0V11M12 14.5v2" />
    </>
  ),
  router: (
    <>
      <circle cx="12" cy="12" r="7.5" />
      <path d="M12 6v12M6 12h12M10.5 7.5L12 6l1.5 1.5M10.5 16.5L12 18l1.5-1.5M7.5 10.5L6 12l1.5 1.5M16.5 10.5L18 12l-1.5 1.5" />
    </>
  ),
  link: (
    <>
      <path d="M4 12h4M16 12h4" />
      <rect x="8" y="8" width="8" height="8" rx="1" />
      <path d="M10.5 10.5h3v3h-3z" />
    </>
  ),
  door: (
    <>
      <rect x="6" y="4" width="12" height="16" rx="1" />
      <path d="M10 20v-6h4v6M14.5 10.5h-5M11.5 8.5l-2 2 2 2" />
    </>
  ),
  hub: (
    <>
      <circle cx="12" cy="12" r="2.5" />
      <circle cx="5.5" cy="6" r="1.5" />
      <circle cx="18.5" cy="6" r="1.5" />
      <circle cx="5.5" cy="18" r="1.5" />
      <circle cx="18.5" cy="18" r="1.5" />
      <path d="M7 7.3l3.2 3M17 7.3l-3.2 3M7 16.7l3.2-3M17 16.7l-3.2-3" />
    </>
  ),
  peer: (
    <>
      <circle cx="7.5" cy="12" r="3.5" />
      <circle cx="16.5" cy="12" r="3.5" />
      <path d="M11 12h2" />
    </>
  ),
  bucket: (
    <>
      <ellipse cx="12" cy="7" rx="7" ry="2.5" />
      <path d="M5 7l1.6 11c.2 1.2 2.6 2 5.4 2s5.2-.8 5.4-2L19 7" />
    </>
  ),
  archive: (
    <>
      <rect x="4.5" y="5" width="15" height="4" rx="1" />
      <path d="M6 9v9.5c0 .3.2.5.5.5h11c.3 0 .5-.2.5-.5V9M10 12.5h4" />
    </>
  ),
  folder: <path d="M4 7.5V18a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9.5a1 1 0 0 0-1-1h-7l-2-2.5H5a1 1 0 0 0-1 1z" />,
  disk: (
    <>
      <rect x="5" y="6" width="14" height="12" rx="1.5" />
      <path d="M5 10h14M5 14h14" />
    </>
  ),
  wall: (
    <>
      <rect x="4" y="5" width="16" height="14" />
      <path d="M4 9.7h16M4 14.3h16M9 5v4.7M15 5v4.7M12 9.7v4.6M9 14.3V19M15 14.3V19" />
    </>
  ),
  cert: (
    <>
      <rect x="4" y="5" width="16" height="11" rx="1" />
      <path d="M7 9h6M7 12h4" />
      <circle cx="16" cy="13" r="2" />
      <path d="M15 15v4l1-1 1 1v-4" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 19.5c.6-3.6 3.4-5.5 7-5.5s6.4 1.9 7 5.5" />
    </>
  ),
  key: (
    <>
      <circle cx="8.5" cy="12" r="3.5" />
      <path d="M12 12h8M17 12v3M19.5 12v2" />
    </>
  ),
  queue: (
    <>
      <rect x="3.5" y="8" width="17" height="8" rx="1" />
      <path d="M8 8v8M12 8v8M16 8v8" />
    </>
  ),
  broadcast: (
    <>
      <circle cx="12" cy="12" r="2" />
      <path d="M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7M6 6a8.5 8.5 0 0 0 0 12M18 6a8.5 8.5 0 0 1 0 12" />
    </>
  ),
  api: <path d="M8.5 5H7a1.5 1.5 0 0 0-1.5 1.5v3.5L4 12l1.5 2v3.5A1.5 1.5 0 0 0 7 19h1.5M15.5 5H17a1.5 1.5 0 0 1 1.5 1.5v3.5L20 12l-1.5 2v3.5A1.5 1.5 0 0 1 17 19h-1.5M10 15l4-6" />,
  terminal: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="1" />
      <path d="M7.5 10l2.5 2-2.5 2M12 15h4" />
    </>
  ),
  stream: <path d="M4 8c2.7 0 2.7 2 5.3 2s2.7-2 5.4-2 2.6 2 5.3 2M4 13c2.7 0 2.7 2 5.3 2s2.7-2 5.4-2 2.6 2 5.3 2M17 17.5l2.5 1.5-2.5 1.5" />,
  server: (
    <>
      <rect x="5" y="4" width="14" height="7" rx="1" />
      <rect x="5" y="13" width="14" height="7" rx="1" />
      <path d="M8 7.5h1M8 16.5h1" />
    </>
  ),
  vpc: (
    <>
      <path d="M7.5 17.5h9a3.5 3.5 0 0 0 .4-7 5 5 0 0 0-9.6-1.3A4.2 4.2 0 0 0 7.5 17.5z" />
      <rect x="10" y="11.5" width="4" height="3.5" />
      <path d="M10.8 11.5v-1a1.2 1.2 0 0 1 2.4 0v1" />
    </>
  ),
}

const MAP: Record<string, keyof typeof g> = {
  ec2: 'chip',
  ec2Web: 'chip',
  ec2Worker: 'chip',
  fargate: 'container',
  ecr: 'container',
  lambda: 'lambda',
  asg: 'scale',
  rds: 'db',
  rdsStandby: 'db',
  rdsReplica: 'db',
  aurora: 'db',
  dynamodb: 'cache',
  elasticache: 'cache',
  athena: 'search',
  glue: 'catalog',
  dms: 'migrate',
  alb: 'lb',
  igw: 'igw',
  natgw: 'nat',
  cloudfront: 'globe',
  route53: 'shield',
  vgw: 'lock',
  cgw: 'router',
  vpn: 'lock',
  dx: 'link',
  vpce: 'door',
  tgw: 'hub',
  peering: 'peer',
  s3: 'bucket',
  glacier: 'archive',
  efs: 'folder',
  ebs: 'disk',
  storagegw: 'archive',
  waf: 'wall',
  acm: 'cert',
  cognito: 'user',
  secrets: 'key',
  sqs: 'queue',
  sns: 'broadcast',
  apigw: 'api',
  ssm: 'terminal',
  firehose: 'stream',
  onpremDb: 'db',
  nas: 'server',
  vpcB: 'vpc',
}

export function Glyph({ id }: { id: string }) {
  const k = MAP[id]
  if (!k) return null
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="70%" height="70%">
      {g[k]}
    </svg>
  )
}
