import { storage } from '#imports'

const isSidePanelOpenedStorage = storage.defineItem<boolean>('session:isSidePanelOpened')
let sidePanelPort: Browser.runtime.Port | null = null

export default defineBackground(() => {
  browser.runtime.onConnect.addListener(async (port) => {
    if (port.name !== 'sidePanel') {
      return
    }

    port.onDisconnect.addListener(async () => {
      await isSidePanelOpenedStorage.setValue(false)
      sidePanelPort = null
    })

    await isSidePanelOpenedStorage.setValue(true)
    sidePanelPort = port
  })

  browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })

  browser.tabs.onUpdated.addListener(async (tabId, info, tab) => {
    if (!tab.url) {
      return
    }

    const urlObj = new URL(tab.url)
    const host = urlObj.host

    if (host === 'velog.io') {
      await browser.sidePanel.setOptions({
        tabId,
        path: 'tabSidepanel.html',
        enabled: true
      })
    } else {
      await browser.sidePanel.setOptions({
        tabId,
        enabled: false
      })
    }
  })

  browser.runtime.onMessage.addListener((msg, sender) => {
    (async () => {
      if (!msg.toggleSidePanel || !sender.tab) {
        return
      }

      await browser.sidePanel.open({ tabId: sender.tab.id, windowId: sender.tab.windowId })
      await browser.sidePanel.setOptions({
        tabId: sender.tab.id,
        path: 'tabSidepanel.html',
        enabled: true,
      })

      const _isSidePanelOpened = await isSidePanelOpenedStorage.getValue()
      const isSidePanelOpened = _isSidePanelOpened ?? false

      if (!isSidePanelOpened) {
        isSidePanelOpenedStorage.setValue(true)
        return
      }

      if (!sidePanelPort) {
        return
      }

      sidePanelPort.postMessage({ close: true })
    })()
  })
})