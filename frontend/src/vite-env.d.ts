// frontend/src/vite-env.d.ts (または env.d.ts, shims-vue.d.ts など)

/// <reference types="vite/client" /> // Viteプロジェクトの場合、これは通常存在します

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>
  export default component
}
