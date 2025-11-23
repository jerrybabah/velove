import { ContentScriptContext } from '#imports'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { StyleProvider } from '@ant-design/cssinjs'

import {
  fetchPosts,
  fetchCurrentUsername,
  fetchEditedPost,
} from './api'
import { App } from './App'

let isRendering = false

export default defineContentScript({
  matches: ['https://*.velog.io/*'],
  runAt: 'document_start',
  async main(ctx) {
    try {
      document.addEventListener('DOMContentLoaded', async () => {
        const initUrl = new URL(location.href)

        await Promise.all([
          initStorage(),
          onUrlChanged(null, initUrl, ctx),
        ])
      })

      ctx.addEventListener(window, 'wxt:locationchange', async ({ oldUrl, newUrl }) => {
        await onUrlChanged(oldUrl, newUrl, ctx)
      })
  
      window.addEventListener('message', async (event) => {
        const { editedPostId, writePost, removedPostId } = event.data || {}
  
        if (editedPostId) {
          await handleEditedPostEvent(editedPostId)
        } else if (writePost) {
          await handleWritePostEvent()
        } else if (removedPostId) {
          await handleRemovedPostEvent(removedPostId)
        }
      })
  
      await injectScript('/interceptor-injected.js')

    } catch (error) {
      console.error('Failed to initialize content script', error)
    }
  },
})

async function onUrlChanged(oldUrl: URL | null, newUrl: URL, ctx: ContentScriptContext): Promise<void> {
  if (isRendering) {
    return
  }

  isRendering = true

  try {
    const notificationIconEls = await getNotificationIconElements()
  
    await Promise.all(Array.from(notificationIconEls).map(async (notificationIconEl, index) => {
      console.log('Injecting Velove UI at notification icon', { index })
      const alreadyShadow = document.querySelector(`velove-${index}`)
  
      if (alreadyShadow) {
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
    isRendering = false
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

async function handleEditedPostEvent(postId: string) {
  const posts = await postsStorage.getValue()

  if (!posts || posts.length === 0) {
    return
  }

  const targetIndex = posts.findIndex((post) => post.id === postId)

  if (targetIndex === -1) {
    return
  }

  const editedPost = await fetchEditedPost(postId)
  const updatedPost: Post = {
    ...posts[targetIndex],
    ...editedPost,
  }

  const nextPosts = [...posts]
  nextPosts[targetIndex] = updatedPost

  postsStorage.setValue(nextPosts)
}

async function handleRemovedPostEvent(postId: string) {
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

async function handleWritePostEvent() {
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

  const dedupedPosts = prevPosts.filter((post) => post.id !== latestPost.id)
  postsStorage.setValue([latestPost, ...dedupedPosts])
}
