import { SortAscendingOutlined, BarChartOutlined, ReloadOutlined } from '@ant-design/icons'
import { Dropdown, Empty, Spin, Typography, ConfigProvider, theme as antdTheme, Tooltip, Switch } from 'antd'
import { useLayoutEffect, useRef, useState, useEffect } from 'react'
import { PostCard } from './components/PostCard'
import { StatsSection } from './components/StatsSection'
import { SORT_OPTIONS, useSidepanelState } from './hooks/useSidepanelState'
const { Text } = Typography

export function Sidepanel() {
  const themeConfig = useTheme()
  const token = antdTheme.getDesignToken(themeConfig)

  const { username, posts, sortedPosts, sortOption, setSortOption, openPost } = useSidepanelState()
  const [showStats, setShowStats] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setInterval(() => {
        setCooldownSeconds((prev) => prev - 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [cooldownSeconds])

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

  const handleRefresh = async () => {
    if (isRefreshing || cooldownSeconds > 0) return

    setCooldownSeconds(10)
    setIsRefreshing(true)

    await refreshPosts()
    setIsRefreshing(false)
  }

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
      <ConfigProvider theme={themeConfig}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: token.colorBgLayout }}>
          <Spin size="large" />
        </div>
      </ConfigProvider>
    )
  }

  if (posts.length === 0) {
    return (
      <ConfigProvider theme={themeConfig}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: token.colorBgLayout }}>
          <Empty description="게시물이 없습니다" />
        </div>
      </ConfigProvider>
    )
  }

  return (
    <ConfigProvider theme={themeConfig}>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: token.colorBgLayout,
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            background: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 10,
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Text
              strong
              style={{
                fontSize: 20,
                background: 'linear-gradient(45deg, #D39AE3, #4BBCE7)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: 1.2,
              }}
            >
              velove
            </Text>
            {username && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                @{username}
              </Text>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Tooltip title={cooldownSeconds > 0 ? `${cooldownSeconds}초 뒤에 갱신할 수 있습니다` : ''}>
              <div
                onClick={handleRefresh}
                style={{
                  cursor: (isRefreshing || cooldownSeconds > 0) ? 'not-allowed' : 'pointer',
                  padding: '6px 10px',
                  borderRadius: 20,
                  background: token.colorFillTertiary,
                  color: (isRefreshing || cooldownSeconds > 0) ? token.colorTextDisabled : token.colorText,
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  opacity: (isRefreshing || cooldownSeconds > 0) ? 0.5 : 1,
                }}
              >
                <ReloadOutlined spin={isRefreshing} />
              </div>
            </Tooltip>
            <Switch
              checked={showStats}
              onChange={setShowStats}
              checkedChildren={<BarChartOutlined />}
              unCheckedChildren={<BarChartOutlined />}
            />
            <Dropdown menu={{ items: sortMenuItems, selectedKeys: [sortOption] }} trigger={['click']}>
                <div
                style={{
                    cursor: 'pointer',
                    padding: '6px 10px',
                    borderRadius: 20,
                    background: token.colorFillTertiary,
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                }}
                >
                <Text style={{ fontSize: 12, fontWeight: 500 }}>
                    <SortAscendingOutlined style={{ marginRight: 4 }} />
                    {SORT_OPTIONS.find((o) => o.value === sortOption)?.label}
                </Text>
                </div>
            </Dropdown>
          </div>
        </div>

        {showStats && <StatsSection posts={posts} />}

        <div
          ref={containerRef}
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            padding: '16px',
            background: token.colorBgLayout,
          }}
        >
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
    </ConfigProvider>
  )
}

async function refreshPosts() {
  const [tab] = await browser.tabs.query({ active: true, lastFocusedWindow: true })

  if (!tab || !tab.id) {
    return
  }

  try {
    const res = await browser.tabs.sendMessage(tab.id, { type: 'refreshPosts' })

    if (res.error) {
      console.error('Failed to refresh posts:', res.error)
      return
    }

  } catch (e) {
    console.error('Failed to refresh posts:', e)
  }
}