export const MIXPANEL_API_URL = 'https://api.mixpanel.com'

export async function setProfile({ distinctId, profile }: { distinctId: string, profile: Record<string, string> }): Promise<void> {
  const option = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      accept: 'text/plain'
    },
    body: JSON.stringify([{
      $token: import.meta.env.WXT_MIXPANEL_PROJECT_TOKEN,
      $distinct_id: distinctId,
      $set: profile,
    }]),
  }

  await fetch(`${MIXPANEL_API_URL}/engage?strict=1#profile-set`, option)
}

export async function track(event: string, props: Record<string, any>): Promise<void> {
  const token = btoa(`${import.meta.env.WXT_MIXPANEL_PROJECT_TOKEN}:`)

  const insertId = generateInsertId()

  const [platform, manifest, ip] = await Promise.all([
    browser.runtime.getPlatformInfo(),
    browser.runtime.getManifest(),
    getIp()
  ])

  const time = Date.now()

  const username = props.username

  const option = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
      authorization: `Basic ${token}`,
    },
    body: JSON.stringify([{
      event,
      properties: {
        ...props,
        time,
        distinct_id: username || generateAnonymousId(),
        ip,
        $insert_id: insertId,
        $os: platform.os,
        $lib_version: manifest.version,
      },
    }]),
  }

  await fetch(`${MIXPANEL_API_URL}/import?strict=1`, option)
}

async function getIp() {
  const ipPromise = fetch('https://api.ipify.org/?format=json')
    .then((response) => response.json())
    .then((json) => json.ip)

  const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(''), 1000))

  const ip = await Promise.race([ipPromise, timeoutPromise])
  return ip
}

function generateInsertId() {
  const insertId = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10)
  return insertId
}

function generateAnonymousId() {
  const uuid = crypto.randomUUID()
  return uuid
}
