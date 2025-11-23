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

export function getTheme(): 'light' | 'dark' {
  const theme = document.body.dataset.theme
  if (theme === 'dark') {
    return 'dark'
  }
  return 'light'
}

export function useTheme() {
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

  return theme === 'dark' ? darkTheme : lightTheme
}
