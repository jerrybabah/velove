import {
  ClockCircleOutlined,
  EyeOutlined,
  HeartOutlined,
  LockOutlined,
  MessageOutlined,
} from '@ant-design/icons'
import { Typography, theme } from 'antd'
import { useState } from 'react'

const { Text } = Typography

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
  const { token } = theme.useToken()
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: token.colorBgContainer,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        cursor: 'pointer',
        border: `1px solid ${isHovered ? token.colorPrimaryBorder : 'transparent'}`,
        boxShadow: isHovered
          ? '0 8px 24px rgba(0,0,0,0.08)'
          : '0 2px 8px rgba(0,0,0,0.02)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'translateY(-2px)' : 'none',
        display: 'flex',
        gap: 16,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ marginBottom: 8 }}>
          {post.isPrivate && (
            <LockOutlined
              style={{ color: token.colorWarning, marginRight: 6, fontSize: 14 }}
            />
          )}
          <Text
            strong
            style={{
              fontSize: 15,
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              color: token.colorText,
            }}
          >
            {post.title}
          </Text>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <ClockCircleOutlined style={{ marginRight: 4 }} />
            {formatRelativeDate(post.releasedAt)}
          </Text>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span
              style={{
                fontSize: 12,
                color: token.colorPrimary,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <EyeOutlined style={{ marginRight: 4 }} />{' '}
              {formatNumber(post.viewStat?.views)}
            </span>
            <span
              style={{
                fontSize: 12,
                color: token.colorTextSecondary,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <HeartOutlined style={{ marginRight: 4 }} /> {formatNumber(post.likes)}
            </span>
            <span
              style={{
                fontSize: 12,
                color: token.colorTextSecondary,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <MessageOutlined style={{ marginRight: 4 }} />{' '}
              {formatNumber(post.commentsCount)}
            </span>
          </div>
        </div>
      </div>

      {post.thumbnail && (
        <div
          style={{
            width: 88,
            height: 88,
            flexShrink: 0,
            borderRadius: 12,
            overflow: 'hidden',
            background: token.colorFillQuaternary,
            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)',
          }}
        >
          <img
            src={post.thumbnail}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.3s ease',
              transform: isHovered ? 'scale(1.05)' : 'scale(1)',
            }}
          />
        </div>
      )}
    </div>
  )
}
