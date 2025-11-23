export const isSidePanelOpenedStorage = storage.defineItem<boolean>('session:isSidePanelOpened')

export let sidePanelPort: Browser.runtime.Port | null = null

export function setSidePanelPort(port: Browser.runtime.Port | null): void {
  sidePanelPort = port
}