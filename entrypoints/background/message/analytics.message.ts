import { MessageHandler } from './type'
import { track as trackApi } from '../api'

export const analyticsHandler: MessageHandler = {
  async track(data, ctx) {
    if (!ctx.tab) {
      return
    }

    const { event } = data

    if (typeof event !== 'string') {
      throw new Error('no event name')
    }

    const props = data.props ?? {}

    await trackApi(event, {
      ...props,
      $current_url: ctx.tab.url,
      current_page_title: ctx.tab.title,
      $screen_height: ctx.tab.height,
      $screen_width: ctx.tab.width,
    })
  }
}