#!/usr/bin/env node

// simple-test.js - Test simple des corrections
console.log('🧪 Test simple des corrections\n')

async function testCorrections() {
  try {
    const path = require('path')
    const fs = require('fs-extra')

    // 1. Vérifier le chemin du projet jeremy-tutoring
    const parentDir = require('os').homedir() + '/Documents'
    const jeremyTutoringPath = path.join(parentDir, 'jeremy-tutoring')
    const translationsPath = path.join(jeremyTutoringPath, 'src', 'i18n', 'translations.js')

    console.log('📁 Vérification des chemins...')
    console.log('   Parent:', parentDir)
    console.log('   Jeremy-tutoring:', jeremyTutoringPath)
    console.log('   Translations:', translationsPath)

    if (await fs.pathExists(jeremyTutoringPath)) {
      console.log('✅ Projet jeremy-tutoring trouvé')
    } else {
      console.log('❌ Projet jeremy-tutoring NON trouvé')
      return
    }

    if (await fs.pathExists(translationsPath)) {
      console.log('✅ Fichier translations.js trouvé')
    } else {
      console.log('❌ Fichier translations.js NON trouvé')
      return
    }

    // 2. Tester la lecture du fichier
    console.log('\n📖 Test de lecture du fichier...')
    const content = await fs.readFile(translationsPath, 'utf8')
    console.log('✅ Fichier lu, taille:', content.length, 'caractères')

    // 3. Tester l'extraction des traductions
    console.log('\n🔍 Test d\'extraction...')
    const resourceParser = require('./src/main/services/resourceParser')
    const translations = resourceParser.extractTranslationsFromFile(content)

    if (translations) {
      console.log('✅ Traductions extraites')
      console.log('   FR exercises:', Object.keys(translations?.fr?.resources?.exercises || {}))
      console.log('   EN exercises:', Object.keys(translations?.en?.resources?.exercises || {}))

      // Vérifier une ressource existante
      const interro = translations?.fr?.resources?.exercises?.maths?.interro0LLG
      if (interro) {
        console.log('✅ Ressource existante trouvée:', interro.title)
      } else {
        console.log('❌ Ressource existante NON trouvée')
      }
    } else {
      console.log('❌ Échec de l\'extraction')
    }

    // 4. Test d'ajout de traductions
    console.log('\n➕ Test d\'ajout de traductions...')
    const codeGenerator = require('./src/main/services/codeGenerator')

    const testTranslations = {
      fr: { title: 'Test FR', description: 'Desc FR', fullDescription: 'Full FR', notes: 'Notes FR' },
      en: { title: 'Test EN', description: 'Desc EN', fullDescription: 'Full EN', notes: 'Notes EN' }
    }

    const newContent = await codeGenerator.addTranslationsForResource(
      content, 'maths', 'testCorrection', testTranslations.fr, testTranslations.en
    )

    if (newContent.includes('testCorrection')) {
      console.log('✅ Traductions ajoutées dans le contenu')

      // Test d'extraction du nouveau contenu
      const newTranslations = resourceParser.extractTranslationsFromFile(newContent)
      const addedFr = newTranslations?.fr?.resources?.exercises?.maths?.testCorrection
      const addedEn = newTranslations?.en?.resources?.exercises?.maths?.testCorrection

      if (addedFr && addedEn) {
        console.log('✅ Nouvelles traductions vérifiées:')
        console.log('   FR:', addedFr.title)
        console.log('   EN:', addedEn.title)
      } else {
        console.log('❌ Nouvelles traductions non trouvées après extraction')
      }
    } else {
      console.log('❌ Traductions non ajoutées')
    }

    console.log('\n🎉 Test terminé !')

  } catch (error) {
    console.error('❌ Erreur durant le test:', error.message)
    console.error('Stack:', error.stack)
  }
}

testCorrections()