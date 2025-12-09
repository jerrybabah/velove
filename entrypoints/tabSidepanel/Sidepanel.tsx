import { SortAscendingOutlined } from '@ant-design/icons'
import { Dropdown, Empty, Spin, Typography, ConfigProvider, theme as antdTheme } from 'antd'
import { useLayoutEffect, useRef } from 'react'
import { PostCard } from './components/PostCard'
import { SORT_OPTIONS, useSidepanelState } from './hooks/useSidepanelState'

const { Text } = Typography

export function Sidepanel() {
  const themeConfig = useTheme()
  const token = antdTheme.getDesignToken(themeConfig)

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
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${token.colorBorderSecondary}`, background: token.colorBgElevated, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Dropdown menu={{ items: sortMenuItems, selectedKeys: [sortOption] }} trigger={['click']}>
            <Text style={{ cursor: 'pointer' }}>
              <SortAscendingOutlined style={{ marginRight: 4 }} />
              {SORT_OPTIONS.find((o) => o.value === sortOption)?.label}
            </Text>
          </Dropdown>
        </div>

        <div ref={containerRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', background: token.colorBgLayout }}>
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