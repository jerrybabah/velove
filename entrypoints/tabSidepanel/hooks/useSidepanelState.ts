import { useEffect, useMemo, useState } from 'react'

export type SortOption = 'latest' | 'views' | 'likes' | 'comments' | 'oldest'

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'latest', label: '최신순' },
  { value: 'views', label: '조회수순' },
  { value: 'likes', label: '좋아요순' },
  { value: 'comments', label: '댓글순' },
  { value: 'oldest', label: '오래된순' },
]

export function useSidepanelState() {
  const [port, setPort] = useState<Browser.runtime.Port | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [posts, setPosts] = useState<Post[] | null>(null)
  const [sortOption, setSortOption] = useState<SortOption>('latest')

  useEffect(() => {
    const newPort = browser.runtime.connect({ name: 'sidePanel' })
    setPort(newPort)

    return () => {
      try {
        newPort.disconnect()
      } catch (_) {
        // ignore disconnect errors during cleanup
      }
    }
  }, [])

  useEffect(() => {
    if (!port) return

    const handleDisconnect = () => {
      const reopenedPort = browser.runtime.connect({ name: 'sidePanel' })
      setPort(reopenedPort)
    }

    const handleMessage = (msg: { close?: boolean }) => {
      if (msg?.close) {
        window.close()
      }
    }

    port.onDisconnect.addListener(handleDisconnect)
    port.onMessage.addListener(handleMessage)

    return () => {
      port.onDisconnect.removeListener(handleDisconnect)
      port.onMessage.removeListener(handleMessage)
    }
  }, [port])

  useEffect(() => {
    let mounted = true

    ;(async () => {
      const storedUsername = await currentUsernameStorage.getValue()
      if (mounted) setUsername(storedUsername)
    })()

    const unwatch = currentUsernameStorage.watch((newUsername) => {
      if (mounted) setUsername(newUsername)
    })

    return () => {
      mounted = false
      unwatch()
    }
  }, [])

  useEffect(() => {
    let mounted = true

    ;(async () => {
      const storedPosts = await postsStorage.getValue()
      if (mounted) setPosts(storedPosts)
    })()

    const unwatch = postsStorage.watch((newPosts) => {
      if (mounted) setPosts(newPosts)
    })

    return () => {
      mounted = false
      unwatch()
    }
  }, [])

  const sortedPosts = useMemo(() => {
    if (!posts) return []

    const sorted = [...posts]
    switch (sortOption) {
      case 'latest':
        return sorted.sort((a, b) => b.releasedAt - a.releasedAt)
      case 'oldest':
        return sorted.sort((a, b) => a.releasedAt - b.releasedAt)
      case 'views':
        return sorted.sort((a, b) => (b.viewStat?.views ?? 0) - (a.viewStat?.views ?? 0))
      case 'likes':
        return sorted.sort((a, b) => b.likes - a.likes)
      case 'comments':
        return sorted.sort((a, b) => b.commentsCount - a.commentsCount)
      default:
        return sorted
    }
  }, [posts, sortOption])

  const openPost = (post: Post) => {
    const targetUsername = username ?? post.username
    if (!targetUsername) return

    const url = `https://velog.io/@${targetUsername}/${post.urlSlug}`
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      const activeTabId = tabs[0]?.id
      if (activeTabId) {
        browser.tabs.update(activeTabId, { url })
      }
    })
  }

  return {
    username,
    posts,
    sortedPosts,
    sortOption,
    setSortOption,
    openPost,
  }
}
