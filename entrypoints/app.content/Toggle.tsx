import {
  ConfigProvider,
  Button,
  Typography,
} from 'antd'

const { Text } = Typography

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
        <Text
          strong
          style={{
            background: 'linear-gradient(45deg, #D39AE3, #4BBCE7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          velove
        </Text>
      </Button>
    </ConfigProvider>
  )
}