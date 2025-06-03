module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom', // Vueコンポーネントテストにはjsdomが必要
  moduleFileExtensions: ['js', 'ts', 'json', 'vue'],
  transform: {
    '^.+\\.vue$': '@vue/vue3-jest', // .vueファイルを処理
    '^.+\\.tsx?$': 'ts-jest',    // .ts/.tsxファイルを処理
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1', // @/ を src/ にマッピング
  },
  // collectCoverage: true, // 必要ならカバレッジ収集
  // collectCoverageFrom: ['src/**/*.{ts,vue}', '!src/main.ts', '!src/router.ts'], // カバレッジ対象
};
