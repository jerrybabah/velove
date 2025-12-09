
import { theme as antdTheme, Typography, Tooltip } from 'antd'
import { useMemo, useState } from 'react'
import type { Post } from '../../../utils/storage'

const { Text } = Typography

interface StatsSectionProps {
  posts: Post[]
}

export function StatsSection({ posts }: StatsSectionProps) {
  const { token } = antdTheme.useToken()
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const stats = useMemo(() => {
    // Use local time for "today" to match user expectation
    const now = new Date()
    const getLocalISO = (d: Date) => {
        const offset = d.getTimezoneOffset() * 60000
        return new Date(d.getTime() - offset).toISOString().split('T')[0]
    }

    const todayStr = getLocalISO(now)
    
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = getLocalISO(yesterday)

    let totalViews = 0
    let todayViews = 0
    let yesterdayViews = 0
    
    // Initialize map for last 30 days
    const last30DaysMap = new Map<string, number>()
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dStr = getLocalISO(d)
      last30DaysMap.set(dStr, 0)
    }

    posts.forEach(post => {
      if (post.viewStat) {
        totalViews += post.viewStat.views
        
        if (post.viewStat.viewsByDay) {
            const t = post.viewStat.viewsByDay[todayStr] || 0
            const y = post.viewStat.viewsByDay[yesterdayStr] || 0
            todayViews += t
            yesterdayViews += y

            Object.entries(post.viewStat.viewsByDay).forEach(([date, count]) => {
                if (last30DaysMap.has(date)) {
                    last30DaysMap.set(date, last30DaysMap.get(date)! + count)
                }
            })
        }
      }
    })

    const trendData = Array.from(last30DaysMap.entries()).map(([date, count]) => ({ date, count }))
    
    return {
      totalViews,
      todayViews,
      yesterdayViews,
      trendData
    }
  }, [posts])

  const { yMin, yMax, trendPoints } = useMemo(() => {
    const counts = stats.trendData.map(d => d.count)
    const dataMin = Math.min(...counts)
    const dataMax = Math.max(...counts)
    
    let yMin = 0
    let yMax = 100

    if (counts.length > 0) {
        const diff = dataMax - dataMin
        if (diff === 0) {
            if (dataMax === 0) {
                yMin = 0
                yMax = 10
            } else {
                yMin = Math.max(0, dataMax - dataMax * 0.2)
                yMax = dataMax + dataMax * 0.2
            }
        } else {
            const padding = diff * 0.2
            yMin = Math.max(0, dataMin - padding)
            yMax = dataMax + padding
        }
    }

    const trendPoints = stats.trendData.map((d, i) => {
        const x = (i / (stats.trendData.length - 1)) * 100
        const range = yMax - yMin
        const normalizedY = range === 0 ? 0.5 : (d.count - yMin) / range
        const y = 100 - normalizedY * 100
        return { x, y, date: d.date, count: d.count }
    })

    return { yMin, yMax, trendPoints }
  }, [stats.trendData])

  const points = trendPoints.map(p => `${p.x},${p.y}`).join(' ')

  const formatYLabel = (val: number) => {
    if (val >= 10000) return `${(val / 10000).toFixed(1)}만`
    if (val >= 1000) return `${(val / 1000).toFixed(1)}k`
    return Math.round(val).toLocaleString()
  }

  const formatXLabel = (dateStr: string) => {
      const [, month, day] = dateStr.split('-')
      return `${parseInt(month)}.${parseInt(day)}`
  }

  return (
    <div style={{ 
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        background: token.colorBgContainer,
        padding: '20px',
    }}>
        <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: 24,
            background: token.colorFillAlter,
            borderRadius: 12,
            padding: '16px 0'
        }}>
            <StatItem label="오늘" value={stats.todayViews} color={token.colorPrimary} />
            <div style={{ width: 1, background: token.colorBorderSecondary }} />
            <StatItem label="어제" value={stats.yesterdayViews} />
            <div style={{ width: 1, background: token.colorBorderSecondary }} />
            <StatItem label="누적" value={stats.totalViews} />
        </div>

        <div style={{ display: 'flex', marginTop: 10 }}>
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between', 
                paddingRight: 8, 
                minWidth: 30,
                textAlign: 'right',
                height: 60
            }}>
                <Text type="secondary" style={{ fontSize: 10, lineHeight: 1 }}>{formatYLabel(yMax)}</Text>
                <Text type="secondary" style={{ fontSize: 10, lineHeight: 1 }}>{formatYLabel((yMax + yMin) / 2)}</Text>
                <Text type="secondary" style={{ fontSize: 10, lineHeight: 1 }}>{formatYLabel(yMin)}</Text>
            </div>

            <div style={{ flex: 1 }}>
                <div 
                    style={{ height: 60, position: 'relative', display: 'flex', alignItems: 'flex-end' }}
                    onMouseLeave={() => setHoveredIndex(null)}
                >
                    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                        {/* Gradient definition */}
                        <defs>
                            <linearGradient id="trendGradient" x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0%" stopColor={token.colorPrimary} stopOpacity="0.2"/>
                                <stop offset="100%" stopColor={token.colorPrimary} stopOpacity="0"/>
                            </linearGradient>
                        </defs>
                        
                        {/* Area path */}
                        <path
                            d={`M0,100 ${points.split(' ').map(p => `L${p}`).join(' ')} L100,100 Z`}
                            fill="url(#trendGradient)"
                        />
                        
                        {/* Line path */}
                        <path
                            d={`M${points.split(' ').join(' L')}`}
                            fill="none"
                            stroke={token.colorPrimary}
                            strokeWidth="2"
                            vectorEffect="non-scaling-stroke"
                        />

                        {/* Interaction layer */}
                        {trendPoints.map((p, i) => (
                            <rect
                                key={i}
                                x={p.x - (100 / (trendPoints.length - 1)) / 2}
                                y={0}
                                width={100 / (trendPoints.length - 1)}
                                height={100}
                                fill="transparent"
                                style={{ cursor: 'pointer' }}
                                onMouseEnter={() => setHoveredIndex(i)}
                            />
                        ))}

                        {/* Active Dot */}
                        {hoveredIndex !== null && trendPoints[hoveredIndex] && (
                            <circle
                                cx={trendPoints[hoveredIndex].x}
                                cy={trendPoints[hoveredIndex].y}
                                r={3}
                                fill={token.colorBgContainer}
                                stroke={token.colorPrimary}
                                strokeWidth={2}
                                style={{ pointerEvents: 'none' }}
                                vectorEffect="non-scaling-stroke"
                            />
                        )}
                    </svg>

                    {/* Tooltip Anchor */}
                    {hoveredIndex !== null && trendPoints[hoveredIndex] && (
                        <Tooltip 
                            title={`${trendPoints[hoveredIndex].date} : ${trendPoints[hoveredIndex].count.toLocaleString()}회`}
                            open={true}
                            placement="top"
                            key={hoveredIndex}
                            getPopupContainer={(triggerNode: HTMLElement) => triggerNode.parentElement || document.body}
                        >
                            <div style={{
                                position: 'absolute',
                                left: `${trendPoints[hoveredIndex].x}%`,
                                top: `${trendPoints[hoveredIndex].y}%`,
                                width: 1,
                                height: 1,
                                pointerEvents: 'none',
                                visibility: 'hidden'
                            }} />
                        </Tooltip>
                    )}
                </div>
                
                {/* X-axis labels */}
                <div style={{ 
                    position: 'relative', 
                    height: 20, 
                    marginTop: 4,
                }}>
                    {trendPoints.filter((_, i) => {
                        const len = trendPoints.length
                        if (len < 4) return true
                        // Show first, last, and 2 in between
                        const step = Math.floor((len - 1) / 3)
                        return i === 0 || i === step || i === step * 2 || i === len - 1
                    }).map((p, i) => (
                        <Text 
                            key={p.date} 
                            type="secondary" 
                            style={{ 
                                position: 'absolute', 
                                left: `${p.x}%`, 
                                transform: 'translateX(-50%)', 
                                fontSize: 10,
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {formatXLabel(p.date)}
                        </Text>
                    ))}
                </div>
            </div>
        </div>
    </div>
  )
}

function StatItem({ label, value, color }: { label: string, value: number, color?: string }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            <Text type="secondary" style={{ fontSize: 12, marginBottom: 4 }}>{label}</Text>
            <Text strong style={{ fontSize: 16, color }}>{value.toLocaleString()}</Text>
        </div>
    )
}
