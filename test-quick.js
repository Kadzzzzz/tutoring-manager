// tutoring-manager/test-quick.js
// Test rapide pour vérifier les corrections

const fs = require('fs')
const path = require('path')

console.log('🧪 === TEST RAPIDE APRÈS CORRECTIONS ===')

// Test 1: Vérifier preload.js
console.log('1️⃣ VÉRIFICATION PRELOAD.JS')
console.log('────────────────────────────────────────')

const preloadPath = './src/preload/preload.js'
if (fs.existsSync(preloadPath)) {
  const preloadContent = fs.readFileSync(preloadPath, 'utf8')

  // Compter les occurrences de getResourceTranslations
  const matches = preloadContent.match(/getResourceTranslations/g) || []
  console.log('📊 Occurrences de getResourceTranslations:', matches.length)

  // Chercher dans l'objet electronAPI
  const electronAPIMatch = preloadContent.match(/const electronAPI = \{[\s\S]*?\}/)[0]
  const inAPI = (electronAPIMatch.match(/getResourceTranslations/g) || []).length

  if (inAPI === 1) {
    console.log('✅ getResourceTranslations correctement placé dans electronAPI')
  } else {
    console.log('❌ Problème avec getResourceTranslations dans electronAPI')
  }

  // Vérifier les lignes orphelines
  const lines = preloadContent.split('\n')
  let orphanLines = []
  let inElectronAPI = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    if (line.includes('const electronAPI = {')) {
      inElectronAPI = true
      continue
    }

    if (inElectronAPI && line === '}') {
      inElectronAPI = false
      continue
    }

    if (!inElectronAPI && line.includes('getResourceTranslations') && !line.includes('//')) {
      orphanLines.push(i + 1)
    }
  }

  if (orphanLines.length === 0) {
    console.log('✅ Aucune ligne orpheline détectée')
  } else {
    console.log('❌ Lignes orphelines détectées:', orphanLines)
  }

} else {
  console.log('❌ Fichier preload.js introuvable')
}

// Test 2: Vérifier main.js
console.log('\n2️⃣ VÉRIFICATION MAIN.JS')
console.log('────────────────────────────────────────')

const mainPath = './src/main/main.js'
if (fs.existsSync(mainPath)) {
  const mainContent = fs.readFileSync(mainPath, 'utf8')

  // Vérifier l'import du service
  if (mainContent.includes('DirectTranslationService')) {
    console.log('✅ Import DirectTranslationService trouvé')
  } else {
    console.log('❌ Import DirectTranslationService manquant')
  }

  // Vérifier le handler
  if (mainContent.includes("ipcMain.handle('get-resource-translations'")) {
    console.log('✅ Handler get-resource-translations trouvé')
  } else {
    console.log('❌ Handler get-resource-translations manquant')
  }

  // Vérifier l'initialisation
  if (mainContent.includes('directTranslationService = new DirectTranslationService()')) {
    console.log('✅ Initialisation du service trouvée')
  } else {
    console.log('❌ Initialisation du service manquante')
  }

} else {
  console.log('❌ Fichier main.js introuvable')
}

// Test 3: Vérifier ResourceForm.js
console.log('\n3️⃣ VÉRIFICATION RESOURCEFORM.JS')
console.log('────────────────────────────────────────')

const resourceFormPath = './src/renderer/components/ResourceForm.js'
if (fs.existsSync(resourceFormPath)) {
  const resourceFormContent = fs.readFileSync(resourceFormPath, 'utf8')

  // Vérifier validateId
  if (resourceFormContent.includes('const validateId = ')) {
    console.log('✅ Fonction validateId trouvée')
  } else {
    console.log('❌ Fonction validateId manquante')
  }

  // Vérifier initializeForm
  if (resourceFormContent.includes('const initializeForm = async')) {
    console.log('✅ Fonction initializeForm async trouvée')
  } else {
    console.log('❌ Fonction initializeForm async manquante')
  }

  // Vérifier getResourceTranslations
  if (resourceFormContent.includes('window.electronAPI.getResourceTranslations')) {
    console.log('✅ Appel API getResourceTranslations trouvé')
  } else {
    console.log('❌ Appel API getResourceTranslations manquant')
  }

} else {
  console.log('❌ Fichier ResourceForm.js introuvable')
}

console.log('\n🎯 RÉSUMÉ')
console.log('────────────────────────────────────────')
console.log('Après avoir appliqué les corrections:')
console.log('1. Redémarrez l\'application: npm start -- --no-sandbox')
console.log('2. Testez l\'édition d\'une ressource')
console.log('3. Vérifiez les logs dans DevTools (F12)')
console.log('4. Le formulaire devrait se pré-remplir avec les traductions')

console.log('\n✅ Test rapide terminé !')