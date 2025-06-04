// frontend/jest.setup.ts (例: 最初は空でもOK)
// import { config } from '@vue/test-utils'

// 必要に応じてグローバル設定を追加
// config.global.plugins = [...]
// config.global.mocks = { $t: (msg) => msg } // 例: vue-i18n のモック

import * as Vue from 'vue';
(global as any).Vue = Vue; // 強引ですが、テスト環境でのみ実行されます
