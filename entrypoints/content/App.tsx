import {
  ThemeConfig,
  theme,
  ConfigProvider,
  Button,
} from 'antd'

const baseTheme = {
  token: {
    colorPrimary: '#D39AE3',
    colorInfo: '#4BBCE7',
    colorSuccess: '#49D17C',
    colorError: '#D9536F',
    colorWarning: '#F2C76E',
  },
}

const lightTheme: ThemeConfig = {
  ...baseTheme,
}

const darkTheme: ThemeConfig = {
  ...baseTheme,
  algorithm: theme.darkAlgorithm,
}

export function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(getTheme())

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'data-theme'
        ) {
          const newTheme = document.body.getAttribute('data-theme')
          setTheme(newTheme === 'dark' ? 'dark' : 'light')
        }
      })
    })

    observer.observe(document.body, {
      attributes: true,
    })

    return () => {
      observer.disconnect()
    }
  }, [])

  const onClick = useCallback(() => {
    (async () => {
      await requestToggleSidePanel()
    })()
  }, [])

  return (
    <ConfigProvider theme={theme === 'dark' ? darkTheme : lightTheme}>
      <Button
        onClick={onClick}
      >
        velove❤️
      </Button>
    </ConfigProvider>
  )
}

function getTheme(): 'light' | 'dark' {
  const theme = document.body.dataset.theme
  if (theme === 'dark') {
    return 'dark'
  }
  return 'light'
}