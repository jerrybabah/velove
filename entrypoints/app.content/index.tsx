import { ContentScriptContext } from '#imports'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { StyleProvider } from '@ant-design/cssinjs'

import {
  fetchPosts,
  fetchCurrentUsername,
  fetchEditedPost,
  fetchPostStat,
} from './api'
import { App } from './App'

export default defineContentScript({
  matches: ['https://*.velog.io/*'],
  runAt: 'document_start',
  async main(ctx) {
    try {
      document.addEventListener('DOMContentLoaded', async () => {
        const initUrl = new URL(location.href)

        await Promise.all([
          initStorage(),
          handleUrlChanged(null, initUrl, ctx),
        ])

        let attempt = 0

        const intervalId = setInterval(async () => {
          const toggleEl = document.querySelector(`velove-1`)

          if (toggleEl || attempt >= 20) {
            clearInterval(intervalId)
            return
          }

          attempt += 1
          await renderToggle(ctx)
        }, 500)
      })

      ctx.addEventListener(window, 'wxt:locationchange', async ({ oldUrl, newUrl }) => {
        await handleUrlChanged(oldUrl, newUrl, ctx)
      })
  
      window.addEventListener('message', async (event) => {
        const { editedPostId, writePost, removedPostId } = event.data || {}
  
        if (editedPostId) {
          await handlePostEdited(editedPostId)
        } else if (writePost) {
          await handlePostWritten()
        } else if (removedPostId) {
          await handlePostRemoved(removedPostId)
        }
      })
  
      await injectScript('/interceptor-injected.js')

    } catch (error) {
      console.error('Failed to initialize content script', error)
    }
  },
})

async function handleUrlChanged(oldUrl: URL | null, newUrl: URL, ctx: ContentScriptContext): Promise<void> {
  await renderToggle(ctx)
}

let isRenderingToggle = false

async function renderToggle(ctx: ContentScriptContext) {
  if (isRenderingToggle) {
    return
  }

  isRenderingToggle = true
  try {
    const notificationIconEls = await getNotificationIconElements()

    await Promise.all(Array.from(notificationIconEls).map(async (notificationIconEl, index) => {
      const alreadyShadow = document.querySelector(`velove-${index}`)
  
      if (alreadyShadow) {
        return
      }

      if (notificationIconEl.innerText === '전체') {
        return
      }

      const shadow = await createShadowRootUi(ctx, {
        name: `velove-${index}`,
        position: 'inline',
        anchor: notificationIconEl,
        append: 'before',
        onMount(shadowContainer, shadowRoot) {
          const cssContainer = shadowRoot.querySelector('head')!
          const root = createRoot(shadowContainer)
    
          root.render(
            <StyleProvider container={cssContainer}>
              <App/>
            </StyleProvider>
          )
    
          return { root }
        },
        onRemove(mounted?: { root: Root }) {
          mounted?.root.unmount()
        },
      })

      shadow.mount()
    }))
  } catch (error) {
    console.error('Error in onUrlChanged:', error)
  } finally {
    isRenderingToggle = false
  }
}

async function getNotificationIconElements(): Promise<NodeListOf<HTMLAnchorElement>> {
  for (let attempt = 0; attempt < 100; attempt++) {
    const els = document.querySelectorAll<HTMLAnchorElement>('a[href$="/notifications"]')
    if (els.length > 0) {
      return els
    }
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  return document.querySelectorAll<HTMLAnchorElement>('a[href$="/notifications"]')
}

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

  let postsWithoutStats: Post[] = []
  let cursor: string | undefined = undefined

  while (true) {
    const { posts, nextCursor } = await fetchPosts({ username, limit: 50, cursor })
    postsWithoutStats = postsWithoutStats.concat(posts)

    if (!nextCursor) {
      break
    }

    cursor = nextCursor
  }

  const statResults = await chunkRun({
    inputs: postsWithoutStats,
    size: 10,
    async run(post) {
      return enrichPostWithViewStat(post)
    },
  })

  const allPosts = statResults.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value
    }

    console.error(`Failed to fetch stats for post ${postsWithoutStats[index].id}`, result.reason)
    return postsWithoutStats[index]
  })


  postsStorage.setValue(allPosts)
  postsStorage.setMeta({ cachedAt: Date.now() })
}

async function handlePostEdited(postId: string) {
  const posts = await postsStorage.getValue()

  if (!posts || posts.length === 0) {
    return
  }

  const targetIndex = posts.findIndex((post) => post.id === postId)

  if (targetIndex === -1) {
    return
  }

  const editedPost = await fetchEditedPost(postId)
  let updatedPost: Post = {
    ...posts[targetIndex],
    ...editedPost,
  }

  try {
    updatedPost = await enrichPostWithViewStat(updatedPost)
  } catch (error) {
    console.error(`Failed to refresh stats for edited post ${postId}`, error)
  }

  const nextPosts = [...posts]
  nextPosts[targetIndex] = updatedPost

  postsStorage.setValue(nextPosts)
}

async function handlePostRemoved(postId: string) {
  const posts = await postsStorage.getValue()

  if (!posts || posts.length === 0) {
    return
  }

  const filteredPosts = posts.filter((post) => post.id !== postId)

  if (filteredPosts.length === posts.length) {
    return
  }

  postsStorage.setValue(filteredPosts)
}

async function handlePostWritten() {
  const username = await currentUsernameStorage.getValue()

  if (!username) {
    return
  }

  const { posts: latestPosts } = await fetchPosts({ username, limit: 1 })
  const [latestPost] = latestPosts

  if (!latestPost) {
    return
  }

  const prevPosts = await postsStorage.getValue()

  if (!prevPosts || prevPosts.length === 0) {
    return
  }

  let latestPostWithStats: Post = latestPost
  try {
    latestPostWithStats = await enrichPostWithViewStat(latestPost)
  } catch (error) {
    console.error(`Failed to refresh stats for latest post ${latestPost.id}`, error)
  }

  const dedupedPosts = prevPosts.filter((post) => post.id !== latestPost.id)
  postsStorage.setValue([latestPostWithStats, ...dedupedPosts])
}

async function enrichPostWithViewStat(post: Post): Promise<Post> {
  const stat = await fetchPostStat(post.id)

  return {
    ...post,
    viewStat: buildViewStat(stat),
  }
}

function buildViewStat(stat: Awaited<ReturnType<typeof fetchPostStat>>): NonNullable<Post['viewStat']> {
  const DAY_MS = 24 * 60 * 60 * 1000
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const sumViewsWithinDays = (days: number) => {
    const lowerBound = startOfToday.getTime() - (days - 1) * DAY_MS

    return Object.entries(stat.countByDay).reduce((total, [day, count]) => {
      const dayTime = new Date(day).getTime()
      if (Number.isNaN(dayTime)) {
        return total
      }

      return dayTime >= lowerBound ? total + count : total
    }, 0)
  }

  return {
    views: stat.total,
    last7DaysViews: sumViewsWithinDays(7),
    last30DaysViews: sumViewsWithinDays(30),
    viewsByDay: stat.countByDay,
  }
}
