// fix-translations.js - Script pour réparer le fichier translations.js corrompu
const fs = require('fs-extra')
const path = require('path')

const translationsPath = path.join(require('os').homedir(), 'Documents', 'tutoring-website', 'src', 'i18n', 'translations.js')

async function fixTranslationsFile() {
  try {
    console.log('🔧 Réparation du fichier translations.js...')
    console.log('📁 Chemin:', translationsPath)

    // Vérifier que le fichier existe
    if (!await fs.pathExists(translationsPath)) {
      console.error('❌ Fichier introuvable:', translationsPath)
      return false
    }

    // Créer une sauvegarde
    const backupPath = translationsPath + '.backup-repair.' + Date.now()
    await fs.copy(translationsPath, backupPath)
    console.log('💾 Sauvegarde créée:', backupPath)

    // Lire le fichier
    let content = await fs.readFile(translationsPath, 'utf8')

    console.log('🔍 Analyse des problèmes...')

    // Analyser les problèmes
    const openBraces = (content.match(/{/g) || []).length
    const closeBraces = (content.match(/}/g) || []).length
    console.log(`   Accolades ouvertes: ${openBraces}`)
    console.log(`   Accolades fermées: ${closeBraces}`)

    // Appliquer les réparations
    console.log('🛠️ Application des corrections...')

    // 1. Corriger la section maths corrompue
    content = content.replace(
      /maths: {interro0LLG: {[\s\S]*?}}},/g,
      `maths: {
          interro0LLG: {
            title: "Interrogation 0 PC*",
            description: "Couvre arithmétique, combinatoire et analyse.",
            fullDescription: "L'exercice 1 traite de l'irrationnalité de ln(3)/ln(2) par une démonstration par l'absurde.\\nL'exercice 2 développe l'arithmétique des nombres premiers avec des estimations logarithmiques et aboutit à la preuve de l'infinité des nombres premiers.\\nLes exercices 3 et 5 explorent la combinatoire des ensembles finis : dénombrement de parties avec contraintes, formule de la crosse de hockey, et propriétés des intersections démontrées par récurrence.\\nL'exercice 4 combine analyse et trigonométrie avec des inégalités sur des suites, l'utilisation de l'arctangente, et des identités impliquant tan(π/12) = 2 - √3.",
            notes: "Interrogation de haut niveau nécessitant une excellente maîtrise des techniques fondamentales. L'exercice est issu de la PC*3 du Lycée Louis-le-Grand."
          },
          testUltraSimple: {
            title: "Ultra FR",
            description: "Desc FR",
            fullDescription: "Full FR",
            notes: "Notes FR"
          }
        },`
    )

    // 2. Corriger la section physics corrompue  
    content = content.replace(
      /physics: {[\s\S]*?}},/g,
      `physics: {
          mechanics: {
            title: "Mécanique du point",
            description: "Cours et exercices sur la cinématique et la dynamique",
            fullDescription: "Étude complète de la mécanique du point : référentiels, vitesse, accélération, forces et théorèmes de Newton.",
            notes: "Exercices progressifs avec corrections détaillées"
          },
          test: {
            title: "test",
            description: "test",
            fullDescription: "",
            notes: ""
          }
        },`
    )

    // 3. Réparer la section anglaise maths
    content = content.replace(
      /maths: {interro0LLG: {[\s\S]*?}}}/,
      `maths: {
          interro0LLG: {
            title: "Quiz 0 PC*",
            description: "Covering arithmetic, combinatorics, and analysis.",
            fullDescription: "Exercise 1 deals with the irrationality of ln(3)/ln(2) through a proof by contradiction.\\nExercise 2 explores prime number arithmetic using logarithmic estimates and leads to a proof of the infinitude of prime numbers.\\nExercises 3 and 5 delve into combinatorics on finite sets: counting subsets under constraints, the hockey stick identity, and properties of intersections proved by induction.\\nExercise 4 combines analysis and trigonometry with inequalities on sequences, the use of arctangent, and identities involving tan(π/12) = 2 - √3.",
            notes: "High-level quiz requiring excellent command of fundamental techniques. The exercise originates from the PC*3 class at Lycée Louis-le-Grand."
          },
          testUltraSimple: {
            title: "Ultra EN",
            description: "Desc EN",
            fullDescription: "Full EN",
            notes: "Notes EN"
          }
        }`
    )

    // 4. Réparer la section anglaise physics
    content = content.replace(
      /physics: {[\s\S]*?test: {[\s\S]*?}[\s\S]*?}}/g,
      `physics: {
          mechanics: {
            title: "Point mechanics",
            description: "Course and exercises on kinematics and dynamics",
            fullDescription: "Complete study of point mechanics: reference frames, velocity, acceleration, forces and Newton's theorems.",
            notes: "Progressive exercises with detailed corrections"
          },
          test: {
            title: "test",
            description: "test",
            fullDescription: "",
            notes: ""
          }
        }`
    )

    // 5. Nettoyer les problèmes généraux
    content = content
      .replace(/,(\s*,)+/g, ',')              // Virgules multiples
      .replace(/,(\s*})/g, '$1')              // Virgule avant accolade fermante
      .replace(/{\s*,/g, '{')                 // Virgule après accolade ouvrante
      .replace(/"undefined"/g, '""')          // "undefined" -> ""
      .replace(/\n\s*\n\s*\n/g, '\n\n')      // Espaces multiples

    // 6. Vérification finale
    const finalOpenBraces = (content.match(/{/g) || []).length
    const finalCloseBraces = (content.match(/}/g) || []).length
    
    console.log('📊 Après réparation:')
    console.log(`   Accolades ouvertes: ${finalOpenBraces}`)
    console.log(`   Accolades fermées: ${finalCloseBraces}`)

    if (finalOpenBraces !== finalCloseBraces) {
      console.warn('⚠️ Accolades toujours non équilibrées, correction manuelle nécessaire')
    }

    // Sauvegarder le fichier réparé
    await fs.writeFile(translationsPath, content, 'utf8')
    console.log('✅ Fichier réparé et sauvegardé')

    // Tester la validité
    try {
      // Test basique de parsing
      const testContent = content.replace(/export\s+const\s+translations\s*=\s*/, 'const translations = ')
      new Function(testContent + '\nreturn translations;')()
      console.log('✅ Structure JavaScript valide')
    } catch (error) {
      console.warn('⚠️ Structure toujours problématique:', error.message)
    }

    return true

  } catch (error) {
    console.error('❌ Erreur lors de la réparation:', error.message)
    return false
  }
}

// Exécuter la réparation
if (require.main === module) {
  fixTranslationsFile().then(success => {
    if (success) {
      console.log('\n🎉 Réparation terminée avec succès!')
      console.log('👉 Rechargez votre site web pour voir les corrections')
    } else {
      console.log('\n❌ Échec de la réparation')
    }
  }).catch(error => {
    console.error('💥 Erreur critique:', error)
  })
}

module.exports = { fixTranslationsFile }
