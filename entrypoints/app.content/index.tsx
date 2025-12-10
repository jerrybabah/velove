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
import { Toggle } from './Toggle'
import { Copy } from './Copy'

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

        let toggleAttempt = 0

        const toggleIntervalId = setInterval(async () => {
          const toggleEl = document.querySelector(`velove-toggle-1`)

          if (toggleEl || toggleAttempt >= 20) {
            clearInterval(toggleIntervalId)
            return
          }

          toggleAttempt += 1
          await renderToggle(ctx)
        }, 500)

        let themeAttempt = 0

        const themeIntervalId = setInterval(async () => {
          const storedTheme = await themeStorage.getValue()

          if (storedTheme !== null || themeAttempt >= 20) {
            clearInterval(themeIntervalId)
            return
          }

          themeAttempt += 1
          const currentTheme = document.body.getAttribute('data-theme')
          await themeStorage.setValue(currentTheme === 'dark' ? 'dark' : 'light')
        }, 500)

        const observer = new MutationObserver((mutations) => {
          mutations.forEach(async (mutation) => {
            if (
              mutation.type === 'attributes' &&
              mutation.attributeName === 'data-theme'
            ) {
              const newTheme = document.body.getAttribute('data-theme')
              await themeStorage.setValue(newTheme === 'dark' ? 'dark' : 'light')
            }
          })
        })

        observer.observe(document.body, {
          attributes: true,
        })
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

      browser.runtime.onMessage.addListener(async (msg, sender, sendRes) => {
        (async () => {
          try {
            if (msg.type === 'refreshPosts') {
              if (!sender.url) {
                sendRes({
                  data: null,
                  error: {
                    name: 'NoSenderUrlError',
                    message: 'No sender URL available',
                  },
                })
                return
              }

              const urlObj = new URL(sender.url)

              if (urlObj.pathname !== '/tabSidepanel.html') {
                sendRes({
                  data: null,
                  error: {
                    name: 'InvalidSenderError',
                    message: 'Sender is not the side panel',
                  },
                })
                return
              }

              const username = await currentUsernameStorage.getValue()
    
              if (!username) {
                sendRes({
                  data: null,
                  error: {
                    name: 'NoCurrentUsernameError',
                    message: 'No current username available',
                  },
                })
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
    
              await postsStorage.setValue(allPosts)
              await postsStorage.setMeta({ cachedAt: Date.now() })

              sendRes({ data: null, error: null })

            } else {
              sendRes({
                data: null,
                error: { name:
                  'UnknownMessageTypeError',
                  message: `Unknown message type: ${msg.type}`,
                },
              })
            }
          } catch (e) {
            console.error('Error in refreshPosts message handler', e)
            sendRes({
              data: null,
              error: {
                name: e instanceof Error ? e.name : 'UnknownError',
                message: e instanceof Error ? e.message : 'An unknown error occurred',
              },
            })
            return
          }
        })()

        return true
      })
  
      await injectScript('/interceptor-injected.js')

    } catch (error) {
      console.error('Failed to initialize content script', error)
    }
  },
})

async function handleUrlChanged(oldUrl: URL | null, newUrl: URL, ctx: ContentScriptContext): Promise<void> {
  await renderToggle(ctx)

  const isPostPage = checkPostPage(newUrl)

  if (isPostPage) {
    await renderCopy(ctx)
  }
}

function checkPostPage(url: URL): boolean {
  const pathMatch = url.pathname.match(/^\/@([^/]+)\/([^/]+)$/)
    
  if (!pathMatch) {
    return false
  }

  const [, , pathItem] = pathMatch
  const excludedPaths = ['posts', 'series', 'about', 'followers', 'followings']

  if (excludedPaths.includes(pathItem)) {
    return false
  }

  return Boolean(pathMatch)
}

let isRenderingCopy = false

async function renderCopy(ctx: ContentScriptContext) {
  if (isRenderingCopy) {
    return
  }

  isRenderingCopy = true

  try {
    const preEls = document.querySelectorAll<HTMLPreElement>('pre')

    await Promise.all(Array.from(preEls).map(async (preEl, index) => {
      const alreadyShadow = document.querySelector(`velove-copy-${index}`)
  
      if (alreadyShadow) {
        return
      }
  
      const codeText = preEl.innerText.trim()

      const shadow = await createShadowRootUi(ctx, {
        name: `velove-copy-${index}`,
        position: 'overlay',
        alignment: 'top-right',
        anchor: preEl,
        append: 'first',
        inheritStyles: true,
        onMount(shadowContainer, shadowRoot, shadowHost) {
          Object.assign(shadowHost.style, {
            width: '100%',
          })

          const cssContainer = shadowRoot.querySelector('head')!

          // Reset body margin in shadow DOM
          const style = document.createElement('style')
          style.textContent = `
            body {
              margin: 0 !important;
            }
          `
          cssContainer.appendChild(style)

          const root = createRoot(shadowContainer)
    
          root.render(
            <StyleProvider container={cssContainer}>
              <Copy text={codeText} />
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
    console.error('Error in renderCopy:', error)
  } finally {
    isRenderingCopy = false
  }
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
      const alreadyShadow = document.querySelector(`velove-toggle-${index}`)
  
      if (alreadyShadow) {
        return
      }

      if (notificationIconEl.innerText === '전체') {
        return
      }

      const shadow = await createShadowRootUi(ctx, {
        name: `velove-toggle-${index}`,
        position: 'inline',
        anchor: notificationIconEl,
        append: 'before',
        onMount(shadowContainer, shadowRoot) {
          const cssContainer = shadowRoot.querySelector('head')!
          const root = createRoot(shadowContainer)
    
          root.render(
            <StyleProvider container={cssContainer}>
              <Toggle />
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


  await postsStorage.setValue(allPosts)
  await postsStorage.setMeta({ cachedAt: Date.now() })
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

  await postsStorage.setValue(nextPosts)
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

  await postsStorage.setValue(filteredPosts)
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
  await postsStorage.setValue([latestPostWithStats, ...dedupedPosts])
}

async function enrichPostWithViewStat(post: Post): Promise<Post> {
  const stat = await fetchPostStat(post.id)

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  return {
    ...post,
    viewStat: {
      views: stat.total,
      viewsByDay: stat.countByDay,
    },
  }
}
