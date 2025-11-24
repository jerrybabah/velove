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
        title='velog.io 전용 익스텐션입니다'
        subTitle='velog에서 클릭하면 사이드패널이 열립니다'
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