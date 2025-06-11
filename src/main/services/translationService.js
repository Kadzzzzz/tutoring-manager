// src/main/services/translationService.js
// 🌐 SERVICE DE TRADUCTION AUTOMATIQUE (Version CommonJS)

class TranslationService {
  constructor() {
    this.libreTranslateUrl = 'https://libretranslate.de/translate'
    this.myMemoryUrl = 'https://api.mymemory.translated.net/get'
  }

  /**
   * Traduit un texte avec LibreTranslate (gratuit, sans clé API)
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
      console.error('LibreTranslate error:', error)
      throw error
    }
  }

  /**
   * Traduit un texte avec MyMemory (gratuit, avec limites)
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
      console.error('MyMemory error:', error)
      throw error
    }
  }

  /**
   * Traduit un texte avec Google Translate API (nécessite clé API)
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
      console.error('Google Translate error:', error)
      throw error
    }
  }

  /**
   * Fonction principale de traduction avec fallback
   */
  async translateText(text, options = {}) {
    const {
      fromLang = 'fr',
      toLang = 'en',
      service = 'libretranslate', // 'libretranslate', 'mymemory', 'google'
      googleApiKey = null
    } = options

    // Ne pas traduire les textes très courts ou vides
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
      console.error(`Translation failed with ${service}, trying fallback:`, error)

      // Fallback vers MyMemory si LibreTranslate échoue
      if (service === 'libretranslate') {
        try {
          return await this.translateWithMyMemory(text, fromLang, toLang)
        } catch (fallbackError) {
          console.error('Fallback translation also failed:', fallbackError)
          return text // Retourner le texte original en cas d'échec total
        }
      }

      return text
    }
  }

  /**
   * Traduit tous les champs d'une ressource
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
          onProgress(`Traduction de ${field}...`, completed, total)
        }

        try {
          translations[field] = await this.translateText(resourceData[field], {
            fromLang,
            toLang,
            service,
            googleApiKey
          })

          // Petit délai pour éviter de surcharger l'API
          await new Promise(resolve => setTimeout(resolve, 500))
        } catch (error) {
          console.error(`Failed to translate ${field}:`, error)
          translations[field] = resourceData[field] // Garder l'original en cas d'erreur
        }
      } else {
        translations[field] = resourceData[field] || ''
      }

      completed++
      if (onProgress) {
        onProgress(`${field} traduit`, completed, total)
      }
    }

    return translations
  }

  /**
   * Test de connectivité des services
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
        message: 'Service disponible'
      }
    } catch (error) {
      results.libretranslate = {
        status: 'error',
        error: error.message,
        message: 'Service indisponible'
      }
    }

    // Test MyMemory
    try {
      const mymemoryResult = await this.translateWithMyMemory(testText)
      results.mymemory = {
        status: 'ok',
        result: mymemoryResult,
        message: 'Service disponible'
      }
    } catch (error) {
      results.mymemory = {
        status: 'error',
        error: error.message,
        message: 'Service indisponible'
      }
    }

    return results
  }
}

// 🔧 EXPORT COMMONJS (compatible Electron)
const translationService = new TranslationService()

module.exports = {
  TranslationService,
  translationService
}