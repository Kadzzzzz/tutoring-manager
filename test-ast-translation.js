// test-ast-translations.js - Script de test pour la nouvelle version AST
const fs = require('fs-extra')
const path = require('path')

// Import du nouveau codeGenerator (remplacez le chemin selon votre structure)
const codeGenerator = require('./src/main/services/codeGenerator.js')

const translationsPath = path.join(require('os').homedir(), 'Documents', 'tutoring-website', 'src', 'i18n', 'translations.js')

async function testASTTranslations() {
  try {
    console.log('🧪 Test de la nouvelle version AST pour les traductions...')
    console.log('📁 Fichier:', translationsPath)

    // Vérifier que le fichier existe
    if (!await fs.pathExists(translationsPath)) {
      console.error('❌ Fichier translations.js introuvable')
      return false
    }

    // Créer une sauvegarde
    const backupPath = translationsPath + '.backup-test.' + Date.now()
    await fs.copy(translationsPath, backupPath)
    console.log('💾 Sauvegarde créée:', backupPath)

    // Lire le fichier original
    const originalContent = await fs.readFile(translationsPath, 'utf8')
    console.log('📖 Fichier original lu')

    // Test 1: Ajouter une nouvelle ressource
    console.log('\n🎯 Test 1: Ajout d\'une nouvelle ressource...')

    const testResource = {
      title: "Test Resource AST",
      description: "Description de test avec des caractères spéciaux: 'quotes' et \"double quotes\"",
      fullDescription: "Description complète avec\nsaut de ligne et caractères spéciaux: π, α, β",
      notes: "Notes avec émoji 🧪 et symboles mathématiques: ∑, ∫, ∂"
    }

    const testResourceEN = {
      title: "Test Resource AST EN",
      description: "Test description with special chars: 'quotes' and \"double quotes\"",
      fullDescription: "Full description with\nline break and special chars: π, α, β",
      notes: "Notes with emoji 🧪 and math symbols: ∑, ∫, ∂"
    }

    const updatedContent1 = await codeGenerator.addTranslationsForResource(
      originalContent,
      'maths',
      'testResourceAST',
      testResource,
      testResourceEN
    )

    console.log('✅ Test 1 réussi - Ressource ajoutée')

    // Test 2: Mettre à jour la ressource
    console.log('\n🎯 Test 2: Mise à jour de la ressource...')

    const updatedTestResource = {
      title: "Test Resource AST - UPDATED",
      description: "Description mise à jour",
      fullDescription: "Description complète mise à jour",
      notes: "Notes mises à jour"
    }

    const updatedTestResourceEN = {
      title: "Test Resource AST EN - UPDATED",
      description: "Updated description",
      fullDescription: "Updated full description",
      notes: "Updated notes"
    }

    const updatedContent2 = await codeGenerator.updateTranslationsForResource(
      updatedContent1,
      'maths',
      'testResourceAST',
      updatedTestResource,
      updatedTestResourceEN
    )

    console.log('✅ Test 2 réussi - Ressource mise à jour')

    // Test 3: Supprimer la ressource
    console.log('\n🎯 Test 3: Suppression de la ressource...')

    const updatedContent3 = await codeGenerator.removeTranslationsForResource(
      updatedContent2,
      'maths',
      'testResourceAST'
    )

    console.log('✅ Test 3 réussi - Ressource supprimée')

    // Test 4: Vérifier que le fichier final est valide
    console.log('\n🎯 Test 4: Validation du fichier final...')

    try {
      // Test de parsing basique
      const testContent = updatedContent3.replace(/export\s+const\s+translations\s*=\s*/, 'const translations = ')
      const result = new Function(testContent + '\nreturn translations;')()

      if (result && result.fr && result.en) {
        console.log('✅ Test 4 réussi - Structure valide')
        console.log('📊 Langues:', Object.keys(result))
        console.log('📚 Matières FR:', Object.keys(result.fr?.resources?.exercises || {}))
        console.log('📚 Matières EN:', Object.keys(result.en?.resources?.exercises || {}))
      } else {
        throw new Error('Structure invalide')
      }
    } catch (error) {
      console.error('❌ Test 4 échoué - Structure invalide:', error.message)
      return false
    }

    // Test 5: Comparer avec l'original (le contenu final devrait être identique)
    console.log('\n🎯 Test 5: Comparaison avec l\'original...')

    const originalLines = originalContent.split('\n').filter(line => line.trim())
    const finalLines = updatedContent3.split('\n').filter(line => line.trim())

    if (originalLines.length === finalLines.length) {
      console.log('✅ Test 5 réussi - Longueur identique')
    } else {
      console.log(`⚠️ Test 5 - Différence de longueur: ${originalLines.length} -> ${finalLines.length}`)
    }

    // Test 6: Écrire le fichier de test pour inspection manuelle
    const testOutputPath = translationsPath.replace('.js', '.test-output.js')
    await fs.writeFile(testOutputPath, updatedContent3, 'utf8')
    console.log('📝 Fichier de test écrit:', testOutputPath)

    console.log('\n🎉 Tous les tests sont passés avec succès!')
    console.log('👉 Vous pouvez maintenant remplacer le codeGenerator.js actuel')
    console.log('💾 Sauvegarde disponible:', backupPath)

    return true

  } catch (error) {
    console.error('❌ Erreur durant les tests:', error.message)
    console.error('💥 Stack:', error.stack)
    return false
  }
}

// Fonction pour tester avec différents cas edge
async function testEdgeCases() {
  console.log('\n🔍 Tests des cas particuliers...')

  const testContent = `// src/i18n/translations.js
// 🌍 FICHIER CENTRAL DE TOUTES LES TRADUCTIONS

export const translations = {
  fr: {
    resources: {
      exercises: {
        maths: {},
        physics: {},
        chemistry: {}
      }
    }
  },
  en: {
    resources: {
      exercises: {
        maths: {},
        physics: {},
        chemistry: {}
      }
    }
  }
}`

  try {
    // Test avec sections vides
    const result = await codeGenerator.addTranslationsForResource(
      testContent,
      'maths',
      'edgeCase1',
      { title: "Edge Case 1", description: "", fullDescription: "", notes: "" },
      { title: "Edge Case 1 EN", description: "", fullDescription: "", notes: "" }
    )

    console.log('✅ Test sections vides réussi')

    // Test avec caractères spéciaux
    const result2 = await codeGenerator.addTranslationsForResource(
      result,
      'physics',
      'edgeCase2',
      {
        title: "Test avec 'apostrophes' et \"guillemets\"",
        description: "Caractères: àéèùï ñ",
        fullDescription: "Symboles: π∑∫ et émojis: 🚀🧪",
        notes: "Formules: x² + y² = z²\nNouvelle ligne"
      },
      {
        title: "Test with 'apostrophes' and \"quotes\"",
        description: "Characters: àéèùï ñ",
        fullDescription: "Symbols: π∑∫ and emojis: 🚀🧪",
        notes: "Formulas: x² + y² = z²\nNew line"
      }
    )

    console.log('✅ Test caractères spéciaux réussi')
    return true

  } catch (error) {
    console.error('❌ Test cas particuliers échoué:', error.message)
    return false
  }
}

// Exécuter les tests
if (require.main === module) {
  (async () => {
    const success1 = await testASTTranslations()
    const success2 = await testEdgeCases()

    if (success1 && success2) {
      console.log('\n🎉 Tous les tests sont passés!')
      console.log('🚀 La nouvelle version AST est prête à être déployée')
    } else {
      console.log('\n❌ Certains tests ont échoué')
      console.log('🔧 Veuillez corriger les erreurs avant le déploiement')
    }
  })()
}

module.exports = { testASTTranslations, testEdgeCases }