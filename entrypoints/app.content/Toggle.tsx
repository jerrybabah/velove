import {
  ConfigProvider,
  Button,
} from 'antd'

export function Toggle() {
  const theme = useTheme()

  const onClick = useCallback(() => {
    (async () => {
      await requestToggleSidePanel()
    })()
  }, [])

  return (
    <ConfigProvider theme={theme}>
      <Button
        onClick={onClick}
        shape='round'
      >
        velove❤️
      </Button>
    </ConfigProvider>
  )
}