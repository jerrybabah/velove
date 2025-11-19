import { fetchPosts, fetchCurrentUsername } from './api'

export default defineContentScript({
  matches: ['https://*.velog.io/*'],
  runAt: 'document_start',
  async main() {
    document.addEventListener('DOMContentLoaded', async () => {
      await initStorage()
    })

    window.addEventListener('message', (event) => {
      if (event.source !== window) {
        return
      }

      if (event.data && event.data.editedPostId) {
        console.log('edit event', event.data.editedPostId)
      } else if (event.data && event.data.writePost) {
        console.log('write event')
      } else if (event.data && event.data.removePostId) {
        console.log('remove event', event.data.removePostId)
      }
    })

    await injectScript('/interceptor-injected.js')
  },
});

async function initStorage() {
  const username = await fetchCurrentUsername()

  if (!username) {
    postsStorage.removeValue()
    currentUsernameStorage.removeValue()
    return
  }

  currentUsernameStorage.setValue(username)

  const posts = await postsStorage.getValue()
  const { cachedAt } = await postsStorage.getMeta()

  const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

  if (posts && cachedAt && (Date.now() - cachedAt) < CACHE_TTL) {
    return
  }

  let allPosts: Post[] = []
  let cursor: string | undefined = undefined

  while (true) {
    const { posts, nextCursor } = await fetchPosts({ username, limit: 50, cursor })
    allPosts = allPosts.concat(posts)

    if (!nextCursor) {
      break
    }

    cursor = nextCursor
  }

  postsStorage.setValue(allPosts)
  postsStorage.setMeta({ cachedAt: Date.now() })
}
