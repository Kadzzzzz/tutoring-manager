// test-service.js - Script de diagnostic du service de traductions
const DirectTranslationService = require('./directTranslationService')
const path = require('path')

async function fullDiagnostic() {
  console.log('🔍 DIAGNOSTIC COMPLET DU SERVICE DE TRADUCTIONS')
  console.log('=' .repeat(60))

  const service = new DirectTranslationService()
  
  // 1. Test de chargement
  console.log('\n1️⃣ TEST DE CHARGEMENT')
  try {
    const translations = await service.loadTranslations()
    console.log('✅ Traductions chargées avec succès')
    
    // Vérifier la structure
    const physicsResources = translations?.fr?.resources?.exercises?.physics
    if (physicsResources) {
      console.log('📊 Ressources physics disponibles:')
      Object.keys(physicsResources).forEach(key => {
        console.log(`   - ${key}: "${physicsResources[key].title}"`)
      })
    } else {
      console.log('❌ Pas de ressources physics trouvées')
    }
    
  } catch (error) {
    console.error('❌ Erreur de chargement:', error.message)
    return false
  }

  // 2. Test de lecture spécifique
  console.log('\n2️⃣ TEST DE LECTURE SPÉCIFIQUE')
  
  const testCases = [
    { subject: 'physics', id: 'test1' },
    { subject: 'physics', id: 'mechanics' },
    { subject: 'physics', id: 'electromagnetism' },
    { subject: 'maths', id: 'integrals' },
    { subject: 'maths', id: 'interro0LLG' }
  ]

  for (const testCase of testCases) {
    try {
      console.log(`\n🔍 Test: ${testCase.subject}/${testCase.id}`)
      const result = await service.getResourceTranslations(testCase.subject, testCase.id)
      
      console.log(`   FR Titre: "${result.fr.title}"`)
      console.log(`   FR Desc:  "${result.fr.description}"`)
      console.log(`   EN Titre: "${result.en.title}"`)
      console.log(`   EN Desc:  "${result.en.description}"`)
      
      if (result.fr.title && result.fr.title !== '' && !result.fr.title.includes('undefined')) {
        console.log('   ✅ Traductions FR valides')
      } else {
        console.log('   ❌ Traductions FR invalides')
      }
      
      if (result.en.title && result.en.title !== '' && !result.en.title.includes('undefined')) {
        console.log('   ✅ Traductions EN valides')
      } else {
        console.log('   ❌ Traductions EN invalides')
      }
      
    } catch (error) {
      console.log(`   ❌ Erreur: ${error.message}`)
    }
  }

  // 3. Test de sauvegarde
  console.log('\n3️⃣ TEST DE SAUVEGARDE')
  try {
    const testResource = `testDiagnostic_${Date.now()}`
    
    const success = await service.saveResourceTranslations('physics', testResource,
      { 
        title: 'Test Diagnostic FR',
        description: 'Description de test FR', 
        fullDescription: 'Description complète FR',
        notes: 'Notes de test FR'
      },
      { 
        title: 'Test Diagnostic EN',
        description: 'Test description EN', 
        fullDescription: 'Full description EN',
        notes: 'Test notes EN'
      }
    )
    
    if (success) {
      console.log('✅ Sauvegarde réussie')
      
      // Vérifier que la ressource a été ajoutée
      const saved = await service.getResourceTranslations('physics', testResource)
      if (saved.fr.title === 'Test Diagnostic FR') {
        console.log('✅ Ressource correctement sauvegardée et relue')
      } else {
        console.log('❌ Problème de sauvegarde/relecture')
      }
      
      // Nettoyer
      await service.removeResourceTranslations('physics', testResource)
      console.log('🧹 Ressource de test supprimée')
      
    } else {
      console.log('❌ Sauvegarde échouée')
    }
    
  } catch (error) {
    console.log(`❌ Erreur de sauvegarde: ${error.message}`)
  }

  // 4. Diagnostic du problème de pré-remplissage
  console.log('\n4️⃣ DIAGNOSTIC PROBLÈME PRÉ-REMPLISSAGE')
  
  // Vérifier getResourceTranslations sur une ressource existante
  try {
    const existing = await service.getResourceTranslations('physics', 'test1')
    
    console.log('📊 Données pour pré-remplissage (physics/test1):')
    console.log('   Titre FR:', JSON.stringify(existing.fr.title))
    console.log('   Desc FR:', JSON.stringify(existing.fr.description))
    console.log('   Full FR:', JSON.stringify(existing.fr.fullDescription))
    console.log('   Notes FR:', JSON.stringify(existing.fr.notes))
    console.log('   Titre EN:', JSON.stringify(existing.en.title))
    console.log('   Desc EN:', JSON.stringify(existing.en.description))
    
    if (existing.fr.title === 'test1' && existing.en.title === 'test1') {
      console.log('✅ Les données sont correctes pour le pré-remplissage')
      console.log('⚠️  Le problème est probablement dans l\'interface utilisateur')
    } else {
      console.log('❌ Les données récupérées sont incorrectes')
    }
    
  } catch (error) {
    console.log(`❌ Erreur lecture ressource existante: ${error.message}`)
  }

  console.log('\n🎯 RÉSUMÉ DU DIAGNOSTIC')
  console.log('=' .repeat(60))
  
  return true
}

// Script de correction de fichier corrompu
async function fixCorruptedFile() {
  console.log('\n🔧 CORRECTION DU FICHIER CORROMPU')
  
  const service = new DirectTranslationService()
  const fs = require('fs-extra')
  
  try {
    const translationsPath = path.join(require('os').homedir(), 'Documents', 'tutoring-website', 'src', 'i18n', 'translations.js')
    
    // Créer une sauvegarde
    const backup = translationsPath + '.backup.' + Date.now()
    await fs.copy(translationsPath, backup)
    console.log('💾 Sauvegarde créée:', backup)
    
    // Lire le fichier actuel
    let content = await fs.readFile(translationsPath, 'utf8')
    
    // Corrections ciblées
    content = content
      // Corriger la section physics française mal imbriquée
      .replace(
        /notes:\s*"Exercices progressifs avec corrections détaillées",\s*test1:/g,
        'notes: "Exercices progressifs avec corrections détaillées"\n          },\n          test1:'
      )
      // Corriger la section physics anglaise mal imbriquée  
      .replace(
        /notes:\s*"Progressive exercises with detailed corrections",\s*test1:/g,
        'notes: "Progressive exercises with detailed corrections"\n          },\n          test1:'
      )
      // Nettoyer les "undefined"
      .replace(/"undefined"/g, '""')
      .replace(/fullDescription:\s*"undefined"/g, 'fullDescription: ""')
      .replace(/notes:\s*"undefined"/g, 'notes: ""')
      // Corriger les accolades
      .replace(/,(\s*})/g, '$1')
      .replace(/{\s*,/g, '{')
      .replace(/}}\s*,/g, '},')
    
    // Sauvegarder le fichier corrigé
    await fs.writeFile(translationsPath, content, 'utf8')
    console.log('✅ Fichier corrigé')
    
    // Tester le fichier corrigé
    try {
      await service.loadTranslations()
      console.log('✅ Validation réussie')
      
      // Supprimer la sauvegarde si tout va bien
      await fs.remove(backup)
      return true
    } catch (error) {
      console.error('❌ Validation échouée, restauration...')
      await fs.copy(backup, translationsPath)
      throw error
    }
    
  } catch (error) {
    console.error('❌ Erreur correction:', error.message)
    return false
  }
}

// Exécution
async function main() {
  try {
    // D'abord corriger le fichier
    console.log('🔧 Correction préalable du fichier...')
    await fixCorruptedFile()
    
    // Puis faire le diagnostic
    await fullDiagnostic()
    
  } catch (error) {
    console.error('💥 Erreur:', error.message)
  }
}

if (require.main === module) {
  main()
}

module.exports = { fullDiagnostic, fixCorruptedFile }
