// direct-translation-service.js - Service ULTRA SIMPLE
const fs = require('fs-extra')
const path = require('path')

class DirectTranslationService {
  constructor() {
    const parentDir = path.join(require('os').homedir(), 'Documents')
    this.translationsPath = path.join(parentDir, 'jeremy-tutoring', 'src', 'i18n', 'translations.js')
  }

  /**
   * LECTURE ULTRA SIMPLE - Trouve toutes les occurrences d'une ressource
   */
  async getResourceTranslations(subject, resourceId) {
    try {
      const content = await fs.readFile(this.translationsPath, 'utf8')

      // Pattern pour trouver TOUTES les occurrences d'une ressource
      const pattern = new RegExp(
        `${resourceId}:\\s*{\\s*` +
        `title:\\s*"([^"]*)",\\s*` +
        `description:\\s*"([^"]*)",\\s*` +
        `fullDescription:\\s*"([^"]*)",\\s*` +
        `notes:\\s*"([^"]*)"\\s*` +
        `}`,
        'g'
      )

      const matches = [...content.matchAll(pattern)]
      console.log(`🔍 Trouvé ${matches.length} occurrences de ${resourceId}`)

      return {
        fr: {
          title: matches[0] ? matches[0][1] : '',
          description: matches[0] ? matches[0][2] : '',
          fullDescription: matches[0] ? matches[0][3] : '',
          notes: matches[0] ? matches[0][4] : ''
        },
        en: {
          title: matches[1] ? matches[1][1] : '',
          description: matches[1] ? matches[1][2] : '',
          fullDescription: matches[1] ? matches[1][3] : '',
          notes: matches[1] ? matches[1][4] : ''
        }
      }
    } catch (error) {
      console.error('Erreur lecture:', error.message)
      return {
        fr: { title: '', description: '', fullDescription: '', notes: '' },
        en: { title: '', description: '', fullDescription: '', notes: '' }
      }
    }
  }

  /**
   * ÉCRITURE ULTRA SIMPLE - Trouve la bonne place et remplace
   */
  async saveResourceTranslations(subject, resourceId, frTranslations, enTranslations) {
    try {
      let content = await fs.readFile(this.translationsPath, 'utf8')

      const clean = (str) => String(str || '').replace(/"/g, '\\"').replace(/\n/g, ' ')

      // 1. Supprimer toutes les anciennes occurrences
      const removePattern = new RegExp(`\\s*,?\\s*${resourceId}:\\s*{[^}]*}`, 'g')
      content = content.replace(removePattern, '')

      // 2. Créer les nouvelles entrées
      const frEntry = `          ${resourceId}: {
            title: "${clean(frTranslations.title)}",
            description: "${clean(frTranslations.description)}",
            fullDescription: "${clean(frTranslations.fullDescription)}",
            notes: "${clean(frTranslations.notes)}"
          }`

      const enEntry = `          ${resourceId}: {
            title: "${clean(enTranslations.title)}",
            description: "${clean(enTranslations.description)}",
            fullDescription: "${clean(enTranslations.fullDescription)}",
            notes: "${clean(enTranslations.notes)}"
          }`

      // 3. Trouver les sections maths pour ajouter les entrées
      // Pattern pour section française (chercher la première occurrence de maths dans exercises)
      const frPattern = new RegExp(`(\\s+${subject}:\\s*{)([^}]*)(\\s*})`, 'g')
      const frMatches = [...content.matchAll(frPattern)]

      if (frMatches.length >= 1) {
        // Première occurrence = section française
        const match = frMatches[0]
        const before = match[1]
        const existing = match[2].trim()
        const after = match[3]

        const newContent = existing ? existing + ',\n' + frEntry : '\n' + frEntry + '\n'
        content = content.replace(match[0], before + newContent + after)
        console.log('✅ Ajouté en français')
      }

      if (frMatches.length >= 2) {
        // Deuxième occurrence = section anglaise
        const match = frMatches[1]
        const before = match[1]
        const existing = match[2].trim()
        const after = match[3]

        const newContent = existing ? existing + ',\n' + enEntry : '\n' + enEntry + '\n'
        content = content.replace(match[0], before + newContent + after)
        console.log('✅ Ajouté en anglais')
      }

      // 4. Sauvegarder
      await fs.writeFile(this.translationsPath, content, 'utf8')
      console.log('✅ Fichier sauvegardé')
      return true

    } catch (error) {
      console.error('Erreur sauvegarde:', error.message)
      return false
    }
  }

  /**
   * Test simple
   */
  async test() {
    console.log('🧪 Test service ultra simple...')
    console.log('📁 Chemin:', this.translationsPath)

    // Vérifier le fichier
    const exists = await fs.pathExists(this.translationsPath)
    console.log('📄 Fichier existe:', exists)

    if (!exists) return false

    // Test de lecture existante
    console.log('\n1️⃣ Lecture existante...')
    const existing = await this.getResourceTranslations('maths', 'interro0LLG')
    console.log('   FR:', existing.fr.title)
    console.log('   EN:', existing.en.title)

    // Test d'ajout
    console.log('\n2️⃣ Test d\'ajout...')
    const success = await this.saveResourceTranslations('maths', 'testUltraSimple',
      { title: 'Ultra FR', description: 'Desc FR', fullDescription: 'Full FR', notes: 'Notes FR' },
      { title: 'Ultra EN', description: 'Desc EN', fullDescription: 'Full EN', notes: 'Notes EN' }
    )

    if (success) {
      // Vérifier l'ajout
      const added = await this.getResourceTranslations('maths', 'testUltraSimple')
      console.log('   Ajouté FR:', added.fr.title)
      console.log('   Ajouté EN:', added.en.title)
    }

    return success
  }
}

module.exports = DirectTranslationService

if (require.main === module) {
  const service = new DirectTranslationService()
  service.test().catch(console.error)
}