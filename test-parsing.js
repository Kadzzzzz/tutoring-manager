#!/usr/bin/env node

// test-parsing.js - Test spécifique du parsing des ressources
console.log('🧪 Test du parsing des ressources\n')

async function testParsing() {
  try {
    console.log('📁 Import des services...')
    const resourceParser = require('./src/main/services/resourceParser')
    const fileService = require('./src/main/services/fileService')

    console.log('✅ Services importés')

    console.log('\n📄 Lecture d\'App.vue...')
    const appVueContent = await fileService.readAppVue()
    console.log('✅ App.vue lu, taille:', appVueContent.length, 'caractères')

    console.log('\n🔍 Extraction des ressources...')
    const resources = resourceParser.extractResourcesFromAppVue(appVueContent)
    console.log('✅ Ressources extraites:', resources.length)

    if (resources.length > 0) {
      console.log('\n📋 Première ressource:')
      console.log(JSON.stringify(resources[0], null, 2))
    }

    console.log('\n📄 Lecture de translations.js...')
    const translationsContent = await fileService.readTranslations()
    console.log('✅ translations.js lu, taille:', translationsContent.length, 'caractères')

    console.log('\n🔍 Extraction des traductions...')
    const translations = resourceParser.extractTranslationsFromFile(translationsContent)
    console.log('✅ Traductions extraites')

    if (translations && translations.fr) {
      console.log('\n📋 Traductions françaises disponibles:')
      console.log('   Matières:', Object.keys(translations.fr.resources?.exercises || {}))
    }

    console.log('\n📊 Génération des statistiques...')
    const stats = resourceParser.getResourcesStats(resources)
    console.log('✅ Statistiques générées:', JSON.stringify(stats, null, 2))

    console.log('\n🎉 Test de parsing réussi!')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message)
    console.error('Stack:', error.stack)
    process.exit(1)
  }
}

testParsing()