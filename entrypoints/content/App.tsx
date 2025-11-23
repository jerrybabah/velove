import {
  ConfigProvider,
  Button,
} from 'antd'

export function App() {
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
      >
        velove❤️
      </Button>
    </ConfigProvider>
  )
}