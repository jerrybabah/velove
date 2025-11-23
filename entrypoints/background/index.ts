import { isSidePanelOpenedStorage, setSidePanelPort } from './store'
import { messageHandler } from './message'

export default defineBackground(() => {
  browser.runtime.onMessage.addListener(messageHandler)

  browser.runtime.onConnect.addListener(async (port) => {
    if (port.name !== 'sidePanel') {
      return
    }

    port.onDisconnect.addListener(async () => {
      await isSidePanelOpenedStorage.setValue(false)
      setSidePanelPort(null)
    })

    await isSidePanelOpenedStorage.setValue(true)
    setSidePanelPort(port)
  })

  browser.action.onClicked.addListener(async (tab) => {
    if (!tab.url) {
      return
    }

    const urlObj = new URL(tab.url)
    const host = urlObj.host

    if (host === 'velog.io') {
      return
    }

    await browser.action.setPopup({ popup: 'optionalPopup.html' })
    await browser.action.openPopup()
    await browser.action.setPopup({ popup: '' })
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
})