export async function requestTrack({ event, props, distinctId }: { event: string, props?: { [key: string]: any }, distinctId?: string }): Promise<void> {
  const response = await browser.runtime.sendMessage({
    type: 'track',
    data: { event, props, distinctId },
  })

  if (response.error) {
    console.log(response.error)
  }
}

export async function requestGetLicense(): Promise<{ licenseKey: string, instanceId: string } | null> {
  const response = await browser.runtime.sendMessage({
    type: 'getLicense',
  })

  if (response.error) {
    throw new Error(response.error)
  }

  const license = response.data
  return license
}

export async function requestGetValidatedLicense(): Promise<{ licenseKey: string, instanceId: string } | null> {
  const response = await browser.runtime.sendMessage({
    type: 'getValidatedLicense',
  })

  if (response.error) {
    throw new Error(response.error)
  }

  const license = response.data
  return license
}

export async function requestValidateLicenseKey(licenseKey: string): Promise<{ error: string | null, valid: boolean }> {
  const response = await browser.runtime.sendMessage({
    type: 'validateLicenseKey',
    data: {
      licenseKey,
    },
  })

  if (response.error) {
    throw new Error(response.error)
  }

  return {
    error: response.data.error,
    valid: response.data.valid,
  }
}

export async function requestActivateLicenseKey(licenseKey: string): Promise<{ licenseKey: string, instanceId: string }> {
  const response = await browser.runtime.sendMessage({
    type: 'activateLicenseKey',
    data: {
      licenseKey,
    },
  })

  if (response.error) {
    const error = new Error(response.error.message)
    error.name = response.error.name
    throw error
  }

  const license = response.data
  return license
}

export async function requestDeactivateLicense(): Promise<void> {
  const response = await browser.runtime.sendMessage({
    type: 'deactivateLicense',
  })

  if (response.error) {
    throw new Error(response.error)
  }
}

export async function requestToggleSidePanel(): Promise<void> {
  const response = await browser.runtime.sendMessage({
    type: 'toggleSidePanel',
  })

  if (response.error) {
    throw new Error(response.error)
  }
}