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