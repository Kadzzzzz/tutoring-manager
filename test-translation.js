#!/usr/bin/env node

// test-translations.js - Test spécifique des traductions
console.log('🧪 Test des traductions\n')

async function testTranslations() {
  try {
    console.log('📁 Import des services...')
    const resourceParser = require('./src/main/services/resourceParser')
    const codeGenerator = require('./src/main/services/codeGenerator')
    const fileService = require('./src/main/services/fileService')

    console.log('✅ Services importés')

    // Test 1: Lecture et extraction des traductions existantes
    console.log('\n1️⃣  Test de lecture des traductions existantes...')
    const translationsContent = await fileService.readTranslations()
    console.log('✅ Fichier translations.js lu, taille:', translationsContent.length, 'caractères')

    const translations = resourceParser.extractTranslationsFromFile(translationsContent)
    console.log('✅ Traductions extraites')

    if (translations?.fr?.resources?.exercises) {
      console.log('   Matières françaises:', Object.keys(translations.fr.resources.exercises))
    }

    if (translations?.en?.resources?.exercises) {
      console.log('   Matières anglaises:', Object.keys(translations.en.resources.exercises))
    }

    // Test 2: Test d'ajout de traductions
    console.log('\n2️⃣  Test d\'ajout de traductions...')

    const testResource = {
      id: 'testTranslation123',
      subject: 'maths'
    }

    const testFrTranslations = {
      title: 'Test de traduction',
      description: 'Description de test en français',
      fullDescription: 'Description complète en français',
      notes: 'Notes pédagogiques en français'
    }

    const testEnTranslations = {
      title: 'Translation test',
      description: 'Test description in English',
      fullDescription: 'Full description in English',
      notes: 'Pedagogical notes in English'
    }

    const newTranslationsContent = await codeGenerator.addTranslationsForResource(
      translationsContent,
      testResource.subject,
      testResource.id,
      testFrTranslations,
      testEnTranslations
    )

    console.log('✅ Traductions ajoutées en mémoire')

    // Vérifier que l'ajout a fonctionné
    const updatedTranslations = resourceParser.extractTranslationsFromFile(newTranslationsContent)

    const frAdded = updatedTranslations?.fr?.resources?.exercises?.maths?.[testResource.id]
    const enAdded = updatedTranslations?.en?.resources?.exercises?.maths?.[testResource.id]

    if (frAdded && enAdded) {
      console.log('✅ Vérification réussie - traductions ajoutées')
      console.log('   FR title:', frAdded.title)
      console.log('   EN title:', enAdded.title)
    } else {
      console.log('❌ Problème - traductions non trouvées après ajout')
      console.log('   FR:', !!frAdded)
      console.log('   EN:', !!enAdded)
    }

    // Test 3: Test de suppression de traductions
    console.log('\n3️⃣  Test de suppression de traductions...')

    const cleanedContent = await codeGenerator.removeTranslationsForResource(
      newTranslationsContent,
      testResource.subject,
      testResource.id
    )

    const cleanedTranslations = resourceParser.extractTranslationsFromFile(cleanedContent)
    const frRemoved = cleanedTranslations?.fr?.resources?.exercises?.maths?.[testResource.id]
    const enRemoved = cleanedTranslations?.en?.resources?.exercises?.maths?.[testResource.id]

    if (!frRemoved && !enRemoved) {
      console.log('✅ Vérification réussie - traductions supprimées')
    } else {
      console.log('❌ Problème - traductions non supprimées')
      console.log('   FR restant:', !!frRemoved)
      console.log('   EN restant:', !!enRemoved)
    }

    // Test 4: Recherche de traductions existantes
    console.log('\n4️⃣  Test de recherche de traductions existantes...')

    // Prendre la première ressource réelle
    const appVueContent = await fileService.readAppVue()
    const resources = resourceParser.extractResourcesFromAppVue(appVueContent)

    if (resources.length > 0) {
      const firstResource = resources[0]
      console.log('   Test avec ressource:', firstResource.id, 'matière:', firstResource.subject)

      const existingTranslations = resourceParser.findResourceTranslations(
        translations,
        firstResource.subject,
        firstResource.id
      )

      console.log('✅ Traductions trouvées:')
      console.log('   FR title:', existingTranslations.fr.title || '(vide)')
      console.log('   EN title:', existingTranslations.en.title || '(vide)')
    }

    console.log('\n🎉 Tous les tests de traductions terminés!')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message)
    console.error('Stack:', error.stack)
    process.exit(1)
  }
}

testTranslations()