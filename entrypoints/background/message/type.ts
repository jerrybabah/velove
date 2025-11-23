import type { Browser } from 'wxt/browser'

export type MessageHandler = { [type: string]: (data: any, ctx: Browser.runtime.MessageSender) => Promise<any> | any }