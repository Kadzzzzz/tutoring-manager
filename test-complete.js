// test-complete-fixed.js - Nouveau script de test
// 🧪 VERSION CORRIGÉE DU TEST COMPLET

const fs = require('fs')
const path = require('path')

console.log('🧪 === TEST COMPLET DU SYSTÈME (VERSION CORRIGÉE) ===\n')

// Test 1: Vérification des chemins
console.log('1️⃣ VÉRIFICATION DES CHEMINS')
console.log('─'.repeat(40))

const os = require('os')
const webProjectPath = path.join(os.homedir(), 'Documents', 'tutoring-website')
const translationsPath = path.join(webProjectPath, 'src', 'i18n', 'translations.js')
const appVuePath = path.join(webProjectPath, 'src', 'App.vue')

const paths = [
  { name: 'Projet tutoring-website', path: webProjectPath },
  { name: 'Fichier translations.js', path: translationsPath },
  { name: 'Fichier App.vue', path: appVuePath }
]

let pathsOK = true
paths.forEach(item => {
  if (fs.existsSync(item.path)) {
    console.log(`✅ ${item.name}`)
  } else {
    console.log(`❌ ${item.name} - MANQUANT`)
    console.log(`   Chemin: ${item.path}`)
    pathsOK = false
  }
})

if (!pathsOK) {
  console.log('\n🚨 ARRÊT: Certains fichiers sont manquants')
  process.exit(1)
}

// Test 2: Vérification de preload.js
console.log('\n2️⃣ VÉRIFICATION DE PRELOAD.JS')
console.log('─'.repeat(40))

try {
  const preloadPath = path.join(__dirname, 'src', 'preload', 'preload.js')
  const preloadContent = fs.readFileSync(preloadPath, 'utf8')

  // Vérifier que getResourceTranslations est dans electronAPI
  const electronAPIMatch = preloadContent.match(/const electronAPI = \{([\s\S]*?)\}/m)

  if (electronAPIMatch) {
    const electronAPIContent = electronAPIMatch[1]
    if (electronAPIContent.includes('getResourceTranslations')) {
      console.log('✅ getResourceTranslations trouvé dans electronAPI')
    } else {
      console.log('❌ getResourceTranslations MANQUANT dans electronAPI')
      console.log('🚨 VOUS DEVEZ CORRIGER preload.js !')
    }
  } else {
    console.log('❌ Structure electronAPI non trouvée')
  }

  // Vérifier qu'il n'y a pas de ligne orpheline
  const orphanMatch = preloadContent.match(/^\s*getResourceTranslations:/m)
  if (orphanMatch) {
    console.log('❌ Ligne getResourceTranslations orpheline détectée')
    console.log('🚨 SUPPRIMEZ la ligne mal placée !')
  }

} catch (error) {
  console.log('❌ Erreur lecture preload.js:', error.message)
}

// Test 3: Test du service de traductions (nouveau)
console.log('\n3️⃣ TEST DU SERVICE DE TRADUCTIONS (NOUVEAU)')
console.log('─'.repeat(40))

try {
  const DirectTranslationService = require('./src/main/services/directTranslationService.js')
  const service = new DirectTranslationService()

  // Test de configuration avec la nouvelle version
  service.testConfiguration().then(result => {
    if (result) {
      console.log('\n🎉 === SERVICE DE TRADUCTIONS OPÉRATIONNEL ===')

      // Test d'extraction réelle
      console.log('\n4️⃣ TEST D\'EXTRACTION RÉELLE')
      console.log('─'.repeat(40))

      return service.getResourceTranslations('maths', 'interro0LLG')
    } else {
      throw new Error('Configuration du service échouée')
    }
  }).then(translations => {
    console.log('✅ Extraction de traductions réussie:')
    console.log('📝 Français:', translations.fr.title || 'MANQUANT')
    console.log('📝 English:', translations.en.title || 'MANQUANT')

    if (translations.fr.title && translations.en.title) {
      console.log('\n🎊 === TOUS LES TESTS PASSÉS AVEC SUCCÈS ===')
      console.log('✅ Le système de traductions fonctionne parfaitement !')

      console.log('\n📋 DERNIÈRES ÉTAPES:')
      console.log('1️⃣ Redémarrez l\'application Electron')
      console.log('2️⃣ Testez l\'édition d\'une ressource')
      console.log('3️⃣ Le formulaire devrait se pré-remplir automatiquement')
    } else {
      console.log('\n⚠️ Traductions partielles trouvées')
    }

  }).catch(error => {
    console.error('\n❌ Erreur dans les tests:', error.message)

    console.log('\n🛠️ ACTIONS CORRECTIVES:')
    console.log('1️⃣ Remplacez directTranslationService.js par la version corrigée')
    console.log('2️⃣ Corrigez preload.js si nécessaire')
    console.log('3️⃣ Relancez ce test')
  })

} catch (error) {
  console.error('❌ Erreur chargement service:', error.message)
  console.log('🚨 Le fichier directTranslationService.js doit être remplacé')
}

// Instructions finales
console.log('\n📱 TEST FINAL EN APPLICATION:')
console.log('─'.repeat(40))
console.log('👉 Après corrections:')
console.log('   1. Redémarrez l\'application Electron')
console.log('   2. Ouvrez DevTools (F12)')
console.log('   3. Tapez: typeof window.electronAPI?.getResourceTranslations')
console.log('   4. Doit retourner: "function"')
console.log('   5. Cliquez sur "Éditer" une ressource')
console.log('   6. Le formulaire doit se pré-remplir')

console.log('\n🎯 CHECKLIST FINALE:')
console.log('☐ preload.js corrigé (getResourceTranslations dans electronAPI)')
console.log('☐ directTranslationService.js remplacé par la version bulletproof')
console.log('☐ Application redémarrée')
console.log('☐ Test d\'édition réussi')