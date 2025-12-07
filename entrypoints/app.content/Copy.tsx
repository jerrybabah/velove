import {
  ConfigProvider,
  Typography,
} from 'antd'

const { Text } = Typography

export function Copy({ text }: { text: string }) {
  const theme = useTheme()

  return (
    <ConfigProvider theme={theme}>
      <Text copyable={{ text, tooltips: false }} />
    </ConfigProvider>
  )
}