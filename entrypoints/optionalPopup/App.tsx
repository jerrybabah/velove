import {
  ConfigProvider,
  Result,
  Button,
} from 'antd'

export function App() {
  const theme = useTheme()

  return (
    <ConfigProvider theme={theme}>
      <Result
        status='404'
        title='velog 전용 익스텐션입니다.'
        extra={
          <Button type='primary' href='https://velog.io' target='_blank'>
            velog 열기
          </Button>
        }
      />
    </ConfigProvider>
  )
}