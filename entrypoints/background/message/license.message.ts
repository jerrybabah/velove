import { MessageHandler } from './type'
import {
  validateLicense as validateLicenseApi,
  activateLicenseKey as activateLicenseKeyApi,
  deactivateLicense as deactivateLicenseApi,
  getActivationInfo as getActivationInfoApi,
} from '../api'

export const licenseHandler: MessageHandler = {
  async getLicense(data, ctx): Promise<{ licenseKey: string, instanceId: string } | null> {
    const { licenseKey, instanceId } = await browser.storage.sync.get(['licenseKey', 'instanceId'])

    if (!licenseKey || !instanceId) {
      return null
    }

    return { licenseKey, instanceId }
  },

  async getValidatedLicense(data, ctx): Promise<{ licenseKey: string, instanceId: string } | null> {
    const { licenseKey, instanceId } = await browser.storage.sync.get(['licenseKey', 'instanceId'])

    if (!licenseKey || !instanceId) {
      return null
    }

    const { valid } = await validateLicenseApi(licenseKey, instanceId)

    if (!valid) {
      await browser.storage.sync.remove(['licenseKey', 'instanceId'])

      return null
    }

    return { licenseKey, instanceId }
  },

  async validateLicenseKey(data, ctx): Promise<{ error: string | null, valid: boolean }> {
    const { licenseKey } = data

    if (typeof licenseKey !== 'string') {
      throw new Error('no licenseKey')
    }

    const { error, valid } = await validateLicenseApi(licenseKey)
    return { error, valid }
  },

  async activateLicenseKey(data, ctx): Promise<{ licenseKey: string, instanceId: string }> {
    const { licenseKey } = data

    if (typeof licenseKey !== 'string') {
      throw new Error('no licenseKey')
    }

    const { licenseKey: activatedLicenseKey, instanceId } = await activateLicenseKeyApi(licenseKey)

    await browser.storage.sync.set({
      licenseKey: activatedLicenseKey,
      instanceId,
    })

    return {
      licenseKey: activatedLicenseKey,
      instanceId,
    }
  },

  async deactivateLicense(data, ctx): Promise<void> {
    const { licenseKey, instanceId } = await browser.storage.sync.get(['licenseKey', 'instanceId'])

    if (!licenseKey || !instanceId) {
      return
    }

    await deactivateLicenseApi(licenseKey, instanceId)

    await browser.storage.sync.remove(['licenseKey', 'instanceId'])
  },

  async getActivationInfo(data, ctx): Promise<{ licenseKey: string, instanceId: string, activationLimit: number, activationUsage: number, expiresAt: Date | null, activatedAt: Date } | null> {
    const { licenseKey, instanceId } = await browser.storage.sync.get(['licenseKey', 'instanceId'])

    if (!licenseKey || !instanceId) {
      return null
    }

    const activationInfo = await getActivationInfoApi(licenseKey, instanceId)

    if (!activationInfo) {
      await browser.storage.sync.remove(['licenseKey', 'instanceId'])

      return null
    }

    return {
      licenseKey,
      instanceId,
      ...activationInfo,
    }
  },
}