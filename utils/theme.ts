import {
  ThemeConfig,
  theme,
} from 'antd'

export const baseTheme = {
  token: {
    colorPrimary: '#D39AE3',
    colorInfo: '#4BBCE7',
    colorSuccess: '#49D17C',
    colorError: '#D9536F',
    colorWarning: '#F2C76E',
  },
}

export const lightTheme: ThemeConfig = {
  ...baseTheme,
}

export const darkTheme: ThemeConfig = {
  ...baseTheme,
  algorithm: theme.darkAlgorithm,
}

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    // WARN: content script에서만 유효한 초기화
    const theme = document.body.dataset.theme
    if (theme === 'dark') {
      return 'dark'
    }
    return 'light'
  })

  useEffect(() => {
    let mounted = true

    ;(async () => {
      const storedTheme = await themeStorage.getValue()
      if (mounted && storedTheme) setTheme(storedTheme)
    })()

    const unwatch = themeStorage.watch((newTheme) => {
      if (mounted && newTheme) setTheme(newTheme)
    })

    return () => {
      mounted = false
      unwatch()
    }
  }, [])

  return theme === 'dark' ? darkTheme : lightTheme
}
