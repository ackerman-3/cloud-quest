import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// SINGLE=1 이면 미리보기용 단일 HTML 파일로 빌드합니다.
const single = process.env.SINGLE === '1'

// 빌드마다 바뀌는 버전 값. 앱에 넣고(__BUILD__), 같은 값을 version.json으로도 내보낸다.
// 아이폰 홈 화면 앱이 다시 보일 때 version.json과 비교해 새 버전이면 새로고침한다(src/update.ts).
const BUILD = Date.now().toString(36)
const versionFile = (): Plugin => ({
  name: 'version-file',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ v: BUILD }) })
  },
})

export default defineConfig({
  base: './',
  define: { __BUILD__: JSON.stringify(BUILD) },
  plugins: [react(), ...(single ? [viteSingleFile()] : [versionFile()])],
  build: single ? { outDir: 'dist-single', assetsInlineLimit: 100_000_000 } : { outDir: 'dist' },
})
