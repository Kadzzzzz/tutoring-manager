const fs = require('fs').promises
const path = require('path')

class DirectTranslationService {
  constructor() {
    this.webProjectPath = path.join(require('os').homedir(), 'Documents', 'tutoring-website')
    this.translationsPath = path.join(this.webProjectPath, 'src', 'i18n', 'translations.js')
  }

  /**
   * Retrieves translations for a specific resource
   */
  async getResourceTranslations(subject, resourceId) {
    try {
      await this._verifyTranslationsFile()
      const translations = await this._loadTranslationsWithRegex()
      return this._extractResourceTranslations(translations, subject, resourceId)
    } catch (error) {
      throw new Error(`Unable to retrieve translations for ${subject}/${resourceId}: ${error.message}`)
    }
  }

  /**
   * Updates resource translations in the translations file
   */
  async updateResourceTranslations(subject, resourceId, frTranslations, enTranslations) {
    try {
      const translations = await this._loadTranslationsWithRegex()
      this._ensureResourceStructure(translations, subject, resourceId)

      Object.assign(translations.fr.resources.exercises[subject][resourceId], frTranslations)
      Object.assign(translations.en.resources.exercises[subject][resourceId], enTranslations)

      await this._saveTranslationsFile(translations)
      return { success: true }
    } catch (error) {
      throw new Error(`Unable to update translations: ${error.message}`)
    }
  }

  /**
   * Automatically translates a resource from French to English
   */
  async translateResourceAutomatically(subject, resourceId, frTranslations, options = {}) {
    try {
      const {
        service = 'libretranslate',
        googleApiKey = null,
        onProgress = null
      } = options

      const { translationService } = require('./translationService.js')

      const fieldsToTranslate = ['title', 'description', 'fullDescription', 'notes']
      const enTranslations = {}

      let completed = 0
      const total = fieldsToTranslate.length

      for (const field of fieldsToTranslate) {
        if (frTranslations[field] && frTranslations[field].trim()) {
          if (onProgress) {
            onProgress(`Translating ${field}...`, completed, total)
          }

          try {
            enTranslations[field] = await translationService.translateText(frTranslations[field], {
              fromLang: 'fr',
              toLang: 'en',
              service,
              googleApiKey
            })

            // Delay to avoid overwhelming the API
            await new Promise(resolve => setTimeout(resolve, 1000))
          } catch (error) {
            enTranslations[field] = `[Translation failed] ${frTranslations[field]}`
          }
        } else {
          enTranslations[field] = frTranslations[field] || ''
        }

        completed++
        if (onProgress) {
          onProgress(`${field} translated`, completed, total)
        }
      }

      await this.updateResourceTranslations(subject, resourceId, frTranslations, enTranslations)

      return {
        success: true,
        frTranslations,
        enTranslations
      }
    } catch (error) {
      throw new Error(`Automatic translation failed: ${error.message}`)
    }
  }

  /**
   * Ensures the necessary structure exists for a resource
   */
  _ensureResourceStructure(translations, subject, resourceId) {
    // French structure
    if (!translations.fr.resources) translations.fr.resources = {}
    if (!translations.fr.resources.exercises) translations.fr.resources.exercises = {}
    if (!translations.fr.resources.exercises[subject]) translations.fr.resources.exercises[subject] = {}
    if (!translations.fr.resources.exercises[subject][resourceId]) translations.fr.resources.exercises[subject][resourceId] = {}

    // English structure
    if (!translations.en.resources) translations.en.resources = {}
    if (!translations.en.resources.exercises) translations.en.resources.exercises = {}
    if (!translations.en.resources.exercises[subject]) translations.en.resources.exercises[subject] = {}
    if (!translations.en.resources.exercises[subject][resourceId]) translations.en.resources.exercises[subject][resourceId] = {}
  }

  /**
   * Saves the translations.js file with backup
   */
  async _saveTranslationsFile(translations) {
    try {
      // Create backup
      const backupPath = `${this.translationsPath}.backup.${Date.now()}`
      const currentContent = await fs.readFile(this.translationsPath, 'utf8')
      await fs.writeFile(backupPath, currentContent, 'utf8')

      // Generate and write new content
      const newContent = this._generateTranslationsFileContent(translations)
      await fs.writeFile(this.translationsPath, newContent, 'utf8')
    } catch (error) {
      throw new Error(`Unable to save translations file: ${error.message}`)
    }
  }

  /**
   * Generates the content for translations.js file
   */
  _generateTranslationsFileContent(translations) {
    const header = `// src/i18n/translations.js

export const translations = `

    const footer = `
`

    // Serialize object with proper indentation
    const jsonString = JSON.stringify(translations, null, 2)
      .replace(/"([^"]+)":/g, '$1:') // Remove quotes from keys
      .replace(/\\n/g, '\\n') // Preserve line breaks
      .replace(/\\"/g, '\\"') // Preserve escaped quotes

    return header + jsonString + footer
  }

  async _verifyTranslationsFile() {
    try {
      await fs.access(this.translationsPath)
    } catch (error) {
      throw new Error(`Translations file not found: ${this.translationsPath}`)
    }
  }

  /**
   * Loads and parses the translations.js file using regex
   * Uses eval() for dynamic parsing - be cautious with untrusted content
   */
  async _loadTranslationsWithRegex() {
    try {
      const fileContent = await fs.readFile(this.translationsPath, 'utf8')

      let cleanContent = fileContent
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '')

      const exportMatch = cleanContent.match(/export\s+const\s+translations\s*=\s*(\{[\s\S]*?\});?\s*$/)

      if (!exportMatch) {
        throw new Error('Unrecognized translations.js file format')
      }

      const objectContent = exportMatch[1]
      const translations = eval(`(${objectContent})`)

      return translations
    } catch (error) {
      try {
        return await this._fallbackParsingMethod()
      } catch (fallbackError) {
        throw new Error(`Unable to parse translations.js: ${error.message}`)
      }
    }
  }

  /**
   * Fallback method for parsing translations when regex method fails
   */
  async _fallbackParsingMethod() {
    const fileContent = await fs.readFile(this.translationsPath, 'utf8')
    const startIndex = fileContent.indexOf('{')
    const lastIndex = fileContent.lastIndexOf('}')

    if (startIndex === -1 || lastIndex === -1) {
      throw new Error('JavaScript object structure not found')
    }

    const objectString = fileContent.substring(startIndex, lastIndex + 1)
    const translations = eval(`(${objectString})`)

    return translations
  }

  _extractResourceTranslations(translations, subject, resourceId) {
    const result = { fr: {}, en: {} }

    try {
      if (translations.fr?.resources?.exercises?.[subject]?.[resourceId]) {
        result.fr = { ...translations.fr.resources.exercises[subject][resourceId] }
      }

      if (translations.en?.resources?.exercises?.[subject]?.[resourceId]) {
        result.en = { ...translations.en.resources.exercises[subject][resourceId] }
      }

      return result
    } catch (error) {
      throw new Error(`Unable to extract translations: ${error.message}`)
    }
  }

  async testConfiguration() {
    try {
      await this._verifyTranslationsFile()
      const translations = await this._loadTranslationsWithRegex()

      if (translations.fr?.resources?.exercises) {
        const subjects = Object.keys(translations.fr.resources.exercises)

        subjects.forEach(subject => {
          const resources = Object.keys(translations.fr.resources.exercises[subject] || {})
        })
      }

      const testSubject = 'maths'
      const testResource = 'interro0LLG'
      await this.getResourceTranslations(testSubject, testResource)

      return true
    } catch (error) {
      return false
    }
  }
}

module.exports = DirectTranslationService