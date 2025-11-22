export default defineBackground(() => {
  browser.action.onClicked.addListener((tab) => {
    if (!tab.url) {
      return
    }

    const urlObj = new URL(tab.url)
    const host = urlObj.host

    if (host !== 'velog.io') {
      browser.action.setPopup({ popup: 'optionalPopup.html' })
      browser.action.openPopup()
      browser.action.setPopup({ popup: '' })
      return
    }



    // browser.sidePanel.open({ tabId: tab.id, windowId: tab.windowId })
  })
})