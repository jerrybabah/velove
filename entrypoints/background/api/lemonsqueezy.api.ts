const LEMONSQUEEZY_API_URL = 'https://api.lemonsqueezy.com'

export async function validateLicense(licenseKey: string, instanceId?: string): Promise<{ error: string | null, valid: boolean }> {
  const response = await requestLicenseApi('/validate', {
    license_key: licenseKey,
    instance_id: instanceId,
  })

  if (response.status >= 500) {
    throw new Error(`status: ${response.status}`)
  }

  const body = await response.json()

  return {
    error: body.error,
    valid: body.valid,
  }
}

export async function activateLicenseKey(licenseKey: string): Promise<{ licenseKey: string, instanceId: string }> {
  const response = await requestLicenseApi('/activate', {
    license_key: licenseKey,
    instance_name: crypto.randomUUID(),
  })

  if (response.status >= 500) {
    throw new Error(`status: ${response.status}`)
  }

  const body = await response.json()

  if (response.status >= 400) {
    const error = new Error(body.error)
    error.name = 'KnownError'
    throw error
  }

  const instanceId = body.instance.id

  return { licenseKey, instanceId }
}

export async function deactivateLicense(licenseKey: string, instanceId: string): Promise<void> {
  const response = await requestLicenseApi('/deactivate', {
    license_key: licenseKey,
    instance_id: instanceId,
  })

  if (!response.ok) {
    throw new Error(`status: ${response.status}`)
  }
}

export async function getActivationInfo(licenseKey: string, instanceId: string): Promise<{ activationLimit: number, activationUsage: number, expiresAt: Date | null, activatedAt: Date } | null> {
  const response = await requestLicenseApi('/validate', {
    license_key: licenseKey,
    instance_id: instanceId,
  })

  if (response.status >= 500) {
    throw new Error(`status: ${response.status}`)
  }

  const body = await response.json()

  const {
    valid,
    error,
    license_key,
    instance,
  } = body

  if (!!error || !valid || !license_key || !instance) {
    return null
  }

  return {
    activationLimit: license_key.activation_limit,
    activationUsage: license_key.activation_usage,
    expiresAt: license_key.expires_at ? new Date(license_key.expires_at) : null,
    activatedAt: new Date(instance.created_at),
  }
}

async function requestLicenseApi(path: string, data: Record<string, any>): Promise<Response> {
  Object.keys(data).forEach((key) => {
    if (data[key] === undefined) {
      delete data[key]
    }
  })

  const option = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      accept: 'application/json',
    },
    body: new URLSearchParams(data).toString(),
  }

  const response = await fetch(`${LEMONSQUEEZY_API_URL}/v1/licenses${path}`, option)
  return response
}
