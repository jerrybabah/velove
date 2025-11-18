export default defineContentScript({
  matches: ['https://*.velog.io/*'],
  runAt: 'document_start',
  async main() {
    console.log('Content script loaded on velog.io')

    window.addEventListener('message', (event) => {
      if (event.data.headers) {
        console.log(event.data.headers)
      } else if (event.data.body) {
        console.log(event.data.body)
      } else {
        // Unknown message type
      }
    })

    await injectScript('/interceptor-injected.js', { keepInDom: true })
  },
});
