import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  webExt: {
    chromiumArgs: ['--user-data-dir=./.wxt/chrome-data'],
  },
  manifest: {
    name: 'velove - velog 통계, 카테고리, 코드복사',
    description: '통계 편하게 보기, 카테고리로 관리, 코드블록 복사',
    action: {},
    permissions: [
      'sidePanel',
      'storage',
      'tabs',
      'scripting',
    ],
    host_permissions: [
      'https://*.velog.io/*',
      'https://api.mixpanel.com/*',
      'https://api.lemonsqueezy.com/*',
    ],
    web_accessible_resources: [
      {
        resources: ['interceptor-injected.js'],
        matches: ['https://*.velog.io/*'],
      },
    ],
  },
});
