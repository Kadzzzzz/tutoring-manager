// tutoring-manager/src/main/services/directTranslationService.js
const fs = require('fs').promises
const path = require('path')

class DirectTranslationService {
  constructor() {
    // 📁 Chemins corrects basés sur fileService.js
    this.webProjectPath = path.join(require('os').homedir(), 'Documents', 'tutoring-website')
    this.translationsPath = path.join(this.webProjectPath, 'src', 'i18n', 'translations.js')

    console.log('🔧 DirectTranslationService initialisé')
    console.log('📁 Projet web:', this.webProjectPath)
    console.log('📄 Fichier traductions:', this.translationsPath)
  }

  /**
   * 🎯 Récupère les traductions d'une ressource
   * @param {string} subject - Matière (maths, physics, chemistry)
   * @param {string} resourceId - ID de la ressource
   * @returns {Object} { fr: {...}, en: {...} }
   */
  async getResourceTranslations(subject, resourceId) {
    try {
      console.log(`🔍 Récupération traductions: ${subject}/${resourceId}`)

      // 1. Vérifier l'existence du fichier
      await this._verifyTranslationsFile()

      // 2. Charger et parser les traductions
      const translations = await this._loadTranslationsWithRegex()

      // 3. Extraire les traductions de la ressource
      const result = this._extractResourceTranslations(translations, subject, resourceId)

      console.log('✅ Traductions récupérées avec succès')
      return result

    } catch (error) {
      console.error('❌ Erreur récupération traductions:', error.message)
      throw new Error(`Impossible de récupérer les traductions pour ${subject}/${resourceId}: ${error.message}`)
    }
  }

  /**
   * 🔍 Vérifie l'existence du fichier
   */
  async _verifyTranslationsFile() {
    try {
      await fs.access(this.translationsPath)
      console.log('✅ Fichier translations.js trouvé')
    } catch (error) {
      throw new Error(`Fichier translations.js introuvable: ${this.translationsPath}`)
    }
  }

  /**
   * 📖 Parse le fichier translations.js avec regex (compatible ES6 modules)
   */
  async _loadTranslationsWithRegex() {
    try {
      // Lire le fichier
      const fileContent = await fs.readFile(this.translationsPath, 'utf8')

      // 🎯 Méthode robuste : extraire l'objet avec regex

      // 1. Supprimer les commentaires
      let cleanContent = fileContent
        .replace(/\/\*[\s\S]*?\*\//g, '') // Commentaires /* */
        .replace(/\/\/.*$/gm, '') // Commentaires //

      // 2. Extraire la partie entre = et export/fin de fichier
      const exportMatch = cleanContent.match(/export\s+const\s+translations\s*=\s*(\{[\s\S]*?\});?\s*$/)

      if (!exportMatch) {
        throw new Error('Format de fichier translations.js non reconnu')
      }

      const objectContent = exportMatch[1]

      // 3. Évaluer l'objet JavaScript pur
      const translations = eval(`(${objectContent})`)

      console.log('✅ Fichier translations.js parsé avec succès')
      console.log('📊 Langues trouvées:', Object.keys(translations))

      return translations

    } catch (error) {
      console.error('❌ Erreur parsing:', error.message)

      // 🆘 Méthode de fallback : regex plus simple
      try {
        return await this._fallbackParsingMethod()
      } catch (fallbackError) {
        throw new Error(`Impossible de parser translations.js: ${error.message}`)
      }
    }
  }

  /**
   * 🆘 Méthode de fallback pour le parsing
   */
  async _fallbackParsingMethod() {
    console.log('🔄 Tentative de parsing avec méthode de fallback...')

    const fileContent = await fs.readFile(this.translationsPath, 'utf8')

    // Extraire tout ce qui est entre les premières { et dernières }
    const startIndex = fileContent.indexOf('{')
    const lastIndex = fileContent.lastIndexOf('}')

    if (startIndex === -1 || lastIndex === -1) {
      throw new Error('Structure d\'objet JavaScript non trouvée')
    }

    const objectString = fileContent.substring(startIndex, lastIndex + 1)

    // Essayer d'évaluer
    const translations = eval(`(${objectString})`)

    console.log('✅ Parsing de fallback réussi')
    return translations
  }

  /**
   * 🎯 Extrait les traductions d'une ressource spécifique
   */
  _extractResourceTranslations(translations, subject, resourceId) {
    const result = { fr: {}, en: {} }

    try {
      // Extraire traductions françaises
      if (translations.fr?.resources?.exercises?.[subject]?.[resourceId]) {
        result.fr = { ...translations.fr.resources.exercises[subject][resourceId] }
        console.log('✅ Traductions FR extraites:', Object.keys(result.fr))
      } else {
        console.warn(`⚠️ Traductions FR non trouvées pour ${subject}.${resourceId}`)
      }

      // Extraire traductions anglaises
      if (translations.en?.resources?.exercises?.[subject]?.[resourceId]) {
        result.en = { ...translations.en.resources.exercises[subject][resourceId] }
        console.log('✅ Traductions EN extraites:', Object.keys(result.en))
      } else {
        console.warn(`⚠️ Traductions EN non trouvées pour ${subject}.${resourceId}`)
      }

      return result

    } catch (error) {
      console.error('❌ Erreur extraction:', error.message)
      throw new Error(`Impossible d'extraire les traductions: ${error.message}`)
    }
  }

  /**
   * 🧪 Test de configuration avec diagnostic complet
   */
  async testConfiguration() {
    console.log('🧪 Test de configuration DirectTranslationService...')

    try {
      // Test 1: Vérifier les chemins
      console.log('📁 Projet web:', this.webProjectPath)
      console.log('📄 Fichier translations:', this.translationsPath)

      // Test 2: Vérifier l'existence
      await this._verifyTranslationsFile()

      // Test 3: Parser le fichier
      const translations = await this._loadTranslationsWithRegex()

      // Test 4: Analyser la structure
      if (translations.fr?.resources?.exercises) {
        const subjects = Object.keys(translations.fr.resources.exercises)
        console.log('✅ Matières disponibles:', subjects)

        subjects.forEach(subject => {
          const resources = Object.keys(translations.fr.resources.exercises[subject] || {})
          console.log(`📚 Ressources en ${subject}:`, resources.length > 0 ? resources : 'Aucune')
        })
      }

      // Test 5: Test réel d'extraction
      console.log('\n🎯 Test d\'extraction sur une ressource existante...')
      const testSubject = 'maths'
      const testResource = 'interro0LLG' // Ou la première ressource trouvée

      const extracted = await this.getResourceTranslations(testSubject, testResource)
      console.log('✅ Test d\'extraction réussi')
      console.log('📝 Titre FR:', extracted.fr.title || 'MANQUANT')
      console.log('📝 Titre EN:', extracted.en.title || 'MANQUANT')

      console.log('🎉 Configuration parfaite - Service opérationnel !')
      return true

    } catch (error) {
      console.error('❌ Test de configuration échoué:', error.message)
      return false
    }
  }
}

module.exports = DirectTranslationService