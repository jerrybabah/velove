import { MessageHandler } from './type'
import { isSidePanelOpenedStorage, sidePanelPort } from '../store'

export const sidePanelHandler: MessageHandler = {
  toggleSidePanel: async (data, ctx) => {
    if (!ctx.tab || !ctx.tab.id || !ctx.tab.windowId) {
      return
    }

    await browser.sidePanel.open({ tabId: ctx.tab.id, windowId: ctx.tab.windowId })
    await browser.sidePanel.setOptions({
      tabId: ctx.tab.id,
      path: 'tabSidepanel.html',
      enabled: true,
    })

    const _isSidePanelOpened = await isSidePanelOpenedStorage.getValue()
    const isSidePanelOpened = _isSidePanelOpened ?? false

    if (!isSidePanelOpened) {
      await isSidePanelOpenedStorage.setValue(true)
      return
    }

    if (!sidePanelPort) {
      return
    }

    sidePanelPort.postMessage({ close: true })
  }
}