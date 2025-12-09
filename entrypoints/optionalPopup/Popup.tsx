import {
  ConfigProvider,
  Result,
  Button,
  theme as antdTheme,
} from 'antd'

export function Popup() {
  const themeConfig = useTheme()
  const token = antdTheme.getDesignToken(themeConfig)

  useEffect(() => {
    const prevBackground = document.body.style.backgroundColor
    const prevColor = document.body.style.color

    document.body.style.backgroundColor = token.colorBgLayout
    document.body.style.color = token.colorText

    return () => {
      document.body.style.backgroundColor = prevBackground
      document.body.style.color = prevColor
    }
  }, [token.colorBgLayout, token.colorText])

  return (
    <ConfigProvider theme={themeConfig}>
      <Result
        status='404'
        title='velog 전용 익스텐션입니다'
        subTitle='velog.io에 머무른 상태에서 클릭해주세요'
        extra={
          <Button
            type='primary'
            href='https://velog.io'
            target='_blank'
            block
            size='large'
          >
            velog.io 새탭 열기
          </Button>
        }
      />
    </ConfigProvider>
  )
}