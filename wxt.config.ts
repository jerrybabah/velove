import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  webExt: {
    chromiumArgs: ['--user-data-dir=./.wxt/chrome-data'],
  },
  manifest: {
    action: {},
    permissions: [
      'sidePanel',
      'storage',
    ],
    host_permissions: [
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
