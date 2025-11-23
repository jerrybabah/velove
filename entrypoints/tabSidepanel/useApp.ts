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
}