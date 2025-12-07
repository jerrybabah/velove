import {
  ClockCircleOutlined,
  EyeOutlined,
  HeartOutlined,
  LockOutlined,
  MessageOutlined,
  SortAscendingOutlined,
} from '@ant-design/icons'
import { Card, Dropdown, Empty, Spin, Typography } from 'antd'
import { useLayoutEffect } from 'react'

const { Text, Paragraph } = Typography

const formatNumber = (value: number | undefined) => (value ?? 0).toLocaleString('ko-KR')

type SortOption = 'latest' | 'views' | 'likes' | 'comments' | 'oldest'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'latest', label: '최신순' },
  { value: 'views', label: '조회수순' },
  { value: 'likes', label: '좋아요순' },
  { value: 'comments', label: '댓글순' },
  { value: 'oldest', label: '오래된순' },
]

const formatRelativeDate = (timestamp: number): string => {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return '조금 전'
  if (minutes < 60) return `${minutes}분 전`
  if (hours < 24) return `${hours}시간 전`
  if (days < 7) return `${days}일 전`

  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}/${month}/${day}`
}

function useSidepanelState() {
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

function PostCard({ post, username, onClick }: { post: Post; username: string; onClick: () => void }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card
      size="small"
      hoverable
      onClick={onClick}
      style={{ margin: '8px 12px' }}
      styles={{ body: { padding: 12 } }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            minHeight: post.thumbnail ? 70 : 'auto',
            justifyContent: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            {post.isPrivate && <LockOutlined style={{ color: '#faad14', fontSize: 12, marginTop: 4 }} />}
            <Paragraph
              ellipsis={expanded ? false : {
                rows: 2,
                expandable: 'collapsible',
                symbol: (expanded: boolean) => expanded ? '접기' : '더보기',
                onExpand: (_, info) => {
                  setExpanded(info.expanded)
                },
              }}
              style={{ margin: 0, fontSize: 14, fontWeight: 500, wordBreak: 'keep-all' }}
              onClick={(e) => e.stopPropagation()}
            >
              {post.title}
            </Paragraph>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Text type="secondary" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
              <ClockCircleOutlined style={{ marginRight: 4 }} />
              {formatRelativeDate(post.releasedAt)}
            </Text>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
              <Text type="secondary" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                <EyeOutlined style={{ marginRight: 4 }} />
                {formatNumber(post.viewStat?.views)}
              </Text>
              <Text type="secondary" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                <HeartOutlined style={{ marginRight: 4 }} />
                {formatNumber(post.likes)}
              </Text>
              <Text type="secondary" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                <MessageOutlined style={{ marginRight: 4 }} />
                {formatNumber(post.commentsCount)}
              </Text>
            </div>
          </div>
        </div>

        {post.thumbnail && (
          <div style={{ flexShrink: 0 }}>
            <img
              src={post.thumbnail}
              alt={post.title}
              style={{
                display: 'block',
                width: 100,
                height: 70,
                objectFit: 'cover',
                borderRadius: 6,
              }}
            />
          </div>
        )}
      </div>
    </Card>
  )
}

export function Sidepanel() {
  const { username, posts, sortedPosts, sortOption, setSortOption, openPost } = useSidepanelState()
  const containerRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const prevBodyOverflow = document.body.style.overflow
    const prevHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = prevBodyOverflow
      document.documentElement.style.overflow = prevHtmlOverflow
    }
  }, [])

  const sortMenuItems = SORT_OPTIONS.map((option) => ({
    key: option.value,
    label: option.label,
    onClick: () => {
      setSortOption(option.value)
      containerRef.current?.scrollTo?.({ top: 0 })
    },
  }))

  if (!posts) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Empty description="게시물이 없습니다" />
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        <Dropdown menu={{ items: sortMenuItems, selectedKeys: [sortOption] }} trigger={['click']}>
          <Text style={{ cursor: 'pointer' }}>
            <SortAscendingOutlined style={{ marginRight: 4 }} />
            {SORT_OPTIONS.find((o) => o.value === sortOption)?.label}
          </Text>
        </Dropdown>
      </div>

      <div ref={containerRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {sortedPosts.map((post: Post) => (
          <PostCard
            key={post.id}
            post={post}
            username={username || ''}
            onClick={() => openPost(post)}
          />
        ))}
      </div>
    </div>
  )
}