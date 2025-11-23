export function useApp() {
  const [port, setPort] = useState<Browser.runtime.Port>()

  useEffect(() => {
    const newPort = browser.runtime.connect({ name: 'sidePanel' })
    setPort(newPort)
  }, [])

  useEffect(() => {
    if (!port) {
      return
    }

    port.onDisconnect.addListener(() => {
      const newPort = browser.runtime.connect({ name: 'sidePanel' })
      setPort(newPort)
    })

    port.onMessage.addListener((msg) => {
      if (msg.close) {
        window.close()
      }
    })
  }, [port])

  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      const username = await currentUsernameStorage.getValue()
      setUsername(username)
    })()

    const unwatch = currentUsernameStorage.watch((newUsername) => {
      setUsername(newUsername)
    })

    return () => {
      unwatch()
    }
  }, [])

  return {
    username,
  }
}