import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  webExt: {
    chromiumArgs: ['--user-data-dir=./.wxt/chrome-data'],
  },
  manifest: {
    web_accessible_resources: [
      {
        resources: ['interceptor-injected.js'],
        matches: ['https://*.velog.io/*'],
      },
    ],
  },
});
