import {
  ClockCircleOutlined,
  EyeOutlined,
  HeartOutlined,
  LockOutlined,
  MessageOutlined,
} from '@ant-design/icons'
import { Card, Typography } from 'antd'
import { useState } from 'react'

const { Text, Paragraph } = Typography

const formatNumber = (value: number | undefined) => (value ?? 0).toLocaleString('ko-KR')

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

type PostCardProps = {
  post: Post
  username: string
  onClick: () => void
}

export function PostCard({ post, username, onClick }: PostCardProps) {
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
              ellipsis={
                expanded
                  ? false
                  : {
                      rows: 2,
                      expandable: 'collapsible',
                      symbol: (expanded: boolean) => (expanded ? '접기' : '더보기'),
                      onExpand: (_, info) => {
                        setExpanded(info.expanded)
                      },
                    }
              }
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
