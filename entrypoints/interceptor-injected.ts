export default defineUnlistedScript(() => {
  modifyFetch()
  modifyXhr()
})

function modifyFetch() {
  const { fetch: originFetch } = window

  // @ts-ignore
  if (originFetch.isModifiedByVelove) {
    return
  }

  window.fetch = async (...args) => {
    const [originResource, option] = args
    const resource = originResource instanceof Request ? originResource.clone() : originResource

    const response = await originFetch(originResource, option)

    // [START] send headers, body
    ;(async () => {
      try {  
        let host: string
        let path: string
        let method: string
        let headers: Record<string, string>
        let body: BodyInit | null | undefined
  
        if (resource instanceof Request) {
          const serverUrl = new URL(resource.url)
  
          host = serverUrl.host
          path = serverUrl.pathname
          method = resource.method
          headers = Object.fromEntries(resource.headers.entries())
          body = resource.body
  
        } else if (resource instanceof URL) {
          host = resource.host
          path = resource.pathname
          method = option?.method || 'GET'
          headers = option?.headers ? Object.fromEntries(new Headers(option.headers).entries()) : {}
          body = option?.body
  
        } else if (typeof resource === 'string') {
          const serverUrl = new URL(resource, window.location.origin)
  
          host = serverUrl.host
          path = serverUrl.pathname
          method = option?.method || 'GET'
          headers = option?.headers ? Object.fromEntries(new Headers(option.headers).entries()) : {}
          body = option?.body
  
        } else {
          throw new Error(`unknown resource type: ${resource}`)
        }
  
        if (
          (host !== 'v2.velog.io' && host !== 'v3.velog.io')
          || path !== '/graphql'
          || method !== 'POST'
        ) {
          return
        }
  
        if (
          !body
          || body instanceof FormData
          || body instanceof ArrayBuffer
          || ArrayBuffer.isView(body)
        ) {
          const bodyType = !body
            ? 'null'
            : body.constructor.name
  
          throw new Error(`unknown req body type: ${bodyType}`)
        }
  
        if (body instanceof ReadableStream) {
          const reader = body.getReader()
  
          let bodyText = ''
  
          while (true) {
            const { done, value: chunk } = await reader.read()
  
            if (done) {
              break
            }
  
            if (!chunk) {
              continue
            }
  
            const decoder = new TextDecoder('utf-8')
            const chunkedText = decoder.decode(chunk, { stream: true })
  
            bodyText += chunkedText
          }
  
          body = bodyText
        }

        let bodyText: string

        if (body instanceof URLSearchParams) {
          bodyText = body.toString()

        } else if (body instanceof Blob) {
          bodyText = await body.text()

        } else {
          bodyText = body
        }

        bodyText = convertGraphqlTextToJson(bodyText)
        const bodyObj: Record<string, any> = JSON.parse(bodyText)

        if (bodyObj.operationName === 'ReadPostForEdit') {
          window.postMessage({ editedPostId: bodyObj.variables.id }, '*')
        } else if (bodyObj.operationName === 'WritePost') {
          window.postMessage({ writePost: true }, '*')
        } else if (bodyObj.operationName === 'RemovePost') {
          window.postMessage({ removedPostId: bodyObj.variables.id }, '*')
        }

      } catch (e) {
        // console.log(e) // FOR DEBUGGING
      }
    })()
    // [END] send headers, body

    return response
  }

  // @ts-ignore
  window.fetch.isModifiedByVelove = true
}

function modifyXhr() {
  if ((XMLHttpRequest.prototype as any).isModifiedByVelove) {
    return
  }

  const {
    open: originOpen,
    send: originSend,
    setRequestHeader: originSetRequestHeader,
  } = XMLHttpRequest.prototype

  // @ts-ignore
  XMLHttpRequest.prototype.open = function (method, url, async = true, user, password) {
    // @ts-ignore
    this._method = method
    // @ts-ignore
    this._url = url
    // @ts-ignore
    this._async = async
    // @ts-ignore
    this._user = user
    // @ts-ignore
    this._password = password
    // @ts-ignore
    this._headers = {}

    // @ts-ignore
    originOpen.call(this, method, url, async, user, password)
  }

  XMLHttpRequest.prototype.setRequestHeader = function (header, value) {
    // @ts-ignore
    this._headers[header] = value

    originSetRequestHeader.call(this, header, value)
  }

  XMLHttpRequest.prototype.send = function (body) {
    // [START] send headers, body
    ;(async () => {
      try {
        let host: string
        let path: string
        // @ts-ignore
        const method: string = this._method
        // @ts-ignore
        const headers: Record<string, string> = this._headers
  
        // @ts-ignore
        if (this._url instanceof URL) {
          // @ts-ignore
          host = this._url.host
          // @ts-ignore
          path = this._url.pathname
  
        // @ts-ignore
        } else if (typeof this._url === 'string') {
          // @ts-ignore
          const serverUrl = new URL(this._url, window.location.origin)

          host = serverUrl.host
          path = serverUrl.pathname
  
        } else {
          // @ts-ignore
          throw new Error(`unknown url type: ${this._url}`)
        }

        if (
          (host !== 'v2.velog.io' && host !== 'v3.velog.io')
          || path !== '/graphql'
          || method !== 'POST'
        ) {
          return
        }

        if (
          !body
          || body instanceof Document
          || body instanceof FormData
          || body instanceof ArrayBuffer
          || ArrayBuffer.isView(body)
        ) {
          const bodyType = !body
            ? 'null'
            : body.constructor.name

          throw new Error(`unknown req body type: ${bodyType}`)
        }

        let bodyText: string

        if (body instanceof URLSearchParams) {
          bodyText = body.toString()

        } else if (body instanceof Blob) {
          bodyText = await body.text()

        } else {
          bodyText = body
        }

        bodyText = convertGraphqlTextToJson(bodyText)
        const bodyObj: Record<string, any> = JSON.parse(bodyText)

        if (bodyObj.operationName === 'ReadPostForEdit') {
          window.postMessage({ editedPostId: bodyObj.variables.id }, '*')
        } else if (bodyObj.operationName === 'WritePost') {
          window.postMessage({ writePost: true }, '*')
        } else if (bodyObj.operationName === 'RemovePost') {
          window.postMessage({ removedPostId: bodyObj.variables.id }, '*')
        }
  
      } catch (e) {
        // console.log(e) // FOR DEBUGGING
      }
    })()
    // [END] send headers, body

    originSend.call(this, body)
  }

  // @ts-ignore
  XMLHttpRequest.prototype.isModifiedByVelove = true
}

function convertGraphqlTextToJson(text: string): string {
  return text.replace(/"query":\s*"([^"]*)"/s, (m, q) => {
    const escaped = q
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n");
    return `"query":"${escaped}"`;
  });
}
