import type { Browser } from 'wxt/browser'

import { analyticsHandler } from './analytics.message'
import { licenseHandler } from './license.message'
import { sidePanelHandler } from './sidepanel.message'

const handler = {
  ...analyticsHandler,
  ...licenseHandler,
  ...sidePanelHandler,
}

export function messageHandler(req: any, ctx: Browser.runtime.MessageSender, sendRes: (response?: any) => void) {
  (async () => {
    try {
      const { type }  = req

      if (typeof type !== 'string') {
        throw new Error('no req type')
      }

      if (!handler[type]) {
        throw new Error(`unknown req type: ${type}`)
      }

      const resData = await handler[type](req.data, ctx)
      sendRes({
        data: resData === undefined ? null : resData,
        error: null,
      })

    } catch (e) {
      console.log(e)

      sendRes({
        data: null,
        error: {
          name: e instanceof Error ? e.name : 'unknown',
          message: e instanceof Error ? e.message : 'unknown',
        }
      })
    }
  })()

  return true
}
