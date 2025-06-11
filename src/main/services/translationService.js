// src/main/services/translationService.js
// Automatic translation service supporting multiple providers

class TranslationService {
  constructor() {
    this.libreTranslateUrl = 'https://libretranslate.de/translate'
    this.myMemoryUrl = 'https://api.mymemory.translated.net/get'
  }

  /**
   * Translates text using LibreTranslate (free, no API key required)
   * @param {string} text - Text to translate
   * @param {string} fromLang - Source language code
   * @param {string} toLang - Target language code
   * @returns {string} Translated text
   */
  async translateWithLibreTranslate(text, fromLang = 'fr', toLang = 'en') {
    try {
      const response = await fetch(this.libreTranslateUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: fromLang,
          target: toLang,
          format: 'text'
        })
      })

      if (!response.ok) {
        throw new Error(`LibreTranslate error: ${response.status}`)
      }

      const result = await response.json()
      return result.translatedText || text
    } catch (error) {
      throw error
    }
  }

  /**
   * Translates text using MyMemory (free with limits)
   * @param {string} text - Text to translate
   * @param {string} fromLang - Source language code
   * @param {string} toLang - Target language code
   * @returns {string} Translated text
   */
  async translateWithMyMemory(text, fromLang = 'fr', toLang = 'en') {
    try {
      const params = new URLSearchParams({
        q: text,
        langpair: `${fromLang}|${toLang}`
      })

      const response = await fetch(`${this.myMemoryUrl}?${params}`)

      if (!response.ok) {
        throw new Error(`MyMemory error: ${response.status}`)
      }

      const result = await response.json()

      if (result.responseStatus === 200) {
        return result.responseData.translatedText
      } else {
        throw new Error('MyMemory translation failed')
      }
    } catch (error) {
      throw error
    }
  }

  /**
   * Translates text using Google Translate API (requires API key)
   * @param {string} text - Text to translate
   * @param {string} fromLang - Source language code
   * @param {string} toLang - Target language code
   * @param {string} apiKey - Google API key
   * @returns {string} Translated text
   */
  async translateWithGoogle(text, fromLang = 'fr', toLang = 'en', apiKey) {
    if (!apiKey) {
      throw new Error('Google Translate API key required')
    }

    try {
      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: text,
            source: fromLang,
            target: toLang,
            format: 'text'
          })
        }
      )

      if (!response.ok) {
        throw new Error(`Google Translate error: ${response.status}`)
      }

      const result = await response.json()
      return result.data.translations[0].translatedText
    } catch (error) {
      throw error
    }
  }

  /**
   * Main translation function with fallback support
   * @param {string} text - Text to translate
   * @param {Object} options - Translation options
   * @returns {string} Translated text
   */
  async translateText(text, options = {}) {
    const {
      fromLang = 'fr',
      toLang = 'en',
      service = 'libretranslate',
      googleApiKey = null
    } = options

    // Skip very short or empty texts
    if (!text || text.length < 3) {
      return text
    }

    try {
      switch (service) {
        case 'google':
          return await this.translateWithGoogle(text, fromLang, toLang, googleApiKey)
        case 'mymemory':
          return await this.translateWithMyMemory(text, fromLang, toLang)
        case 'libretranslate':
        default:
          return await this.translateWithLibreTranslate(text, fromLang, toLang)
      }
    } catch (error) {
      // Fallback to MyMemory if LibreTranslate fails
      if (service === 'libretranslate') {
        try {
          return await this.translateWithMyMemory(text, fromLang, toLang)
        } catch (fallbackError) {
          return text // Return original text if all methods fail
        }
      }

      return text
    }
  }

  /**
   * Translates all fields of a resource object
   * @param {Object} resourceData - Resource data to translate
   * @param {Object} options - Translation options including progress callback
   * @returns {Object} Translated resource data
   */
  async translateResource(resourceData, options = {}) {
    const {
      fromLang = 'fr',
      toLang = 'en',
      service = 'libretranslate',
      googleApiKey = null,
      onProgress = null
    } = options

    const fieldsToTranslate = ['title', 'description', 'fullDescription', 'notes']
    const translations = {}

    let completed = 0
    const total = fieldsToTranslate.length

    for (const field of fieldsToTranslate) {
      if (resourceData[field] && resourceData[field].trim()) {
        if (onProgress) {
          onProgress(`Translating ${field}...`, completed, total)
        }

        try {
          translations[field] = await this.translateText(resourceData[field], {
            fromLang,
            toLang,
            service,
            googleApiKey
          })

          // Small delay to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 500))
        } catch (error) {
          // Keep original text if translation fails
          translations[field] = resourceData[field]
        }
      } else {
        translations[field] = resourceData[field] || ''
      }

      completed++
      if (onProgress) {
        onProgress(`${field} translated`, completed, total)
      }
    }

    return translations
  }

  /**
   * Tests connectivity and availability of translation services
   * @returns {Object} Service status results
   */
  async testServices() {
    const testText = "Bonjour"
    const results = {}

    // Test LibreTranslate
    try {
      const libretranslateResult = await this.translateWithLibreTranslate(testText)
      results.libretranslate = {
        status: 'ok',
        result: libretranslateResult,
        message: 'Service available'
      }
    } catch (error) {
      results.libretranslate = {
        status: 'error',
        error: error.message,
        message: 'Service unavailable'
      }
    }

    // Test MyMemory
    try {
      const mymemoryResult = await this.translateWithMyMemory(testText)
      results.mymemory = {
        status: 'ok',
        result: mymemoryResult,
        message: 'Service available'
      }
    } catch (error) {
      results.mymemory = {
        status: 'error',
        error: error.message,
        message: 'Service unavailable'
      }
    }

    return results
  }
}

// CommonJS export for Electron compatibility
const translationService = new TranslationService()

module.exports = {
  TranslationService,
  translationService
}