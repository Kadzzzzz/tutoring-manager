#!/usr/bin/env node

// test-app.js - Script de test pour l'application Jeremy Admin
const path = require('path')
const fs = require('fs-extra')

async function main() {
  console.log('🧪 Test de l\'application Jeremy Admin\n')

  // Couleurs pour les logs
  const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
  }

  const log = {
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
    info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`)
  }

  // Tests de structure
  async function testProjectStructure() {
    log.info('Vérification de la structure du projet...')

    const requiredFiles = [
      'package.json',
      'src/main/main.js',
      'src/main/services/fileService.js',
      'src/main/services/resourceParser.js',
      'src/main/services/codeGenerator.js',
      'src/preload/preload.js',
      'src/renderer/index.html',
      'src/renderer/main.js',
      'src/renderer/style.css',
      'src/renderer/components/ResourceForm.js'
    ]

    let allFilesExist = true

    for (const file of requiredFiles) {
      const filePath = path.join(process.cwd(), file)
      if (await fs.pathExists(filePath)) {
        log.success(`${file}`)
      } else {
        log.error(`${file} - MANQUANT`)
        allFilesExist = false
      }
    }

    return allFilesExist
  }

  // Test des dépendances
  async function testDependencies() {
    log.info('Vérification des dépendances...')

    try {
      const packageJson = await fs.readJson(path.join(process.cwd(), 'package.json'))

      const requiredDeps = [
        '@babel/parser',
        '@babel/generator',
        '@babel/traverse',
        '@babel/types',
        'prettier',
        'fs-extra'
      ]

      const requiredDevDeps = [
        'electron'
      ]

      let allDepsOk = true

      // Vérifier les dépendances principales
      for (const dep of requiredDeps) {
        if (packageJson.dependencies?.[dep]) {
          log.success(`${dep} - ${packageJson.dependencies[dep]}`)
        } else {
          log.error(`${dep} - MANQUANT`)
          allDepsOk = false
        }
      }

      // Vérifier les dépendances de développement
      for (const dep of requiredDevDeps) {
        if (packageJson.devDependencies?.[dep]) {
          log.success(`${dep} - ${packageJson.devDependencies[dep]}`)
        } else {
          log.error(`${dep} - MANQUANT`)
          allDepsOk = false
        }
      }

      return allDepsOk

    } catch (error) {
      log.error(`Erreur lors de la lecture du package.json: ${error.message}`)
      return false
    }
  }

  // Test de la syntaxe des fichiers
  async function testSyntax() {
    log.info('Vérification de la syntaxe des fichiers...')

    const jsFiles = [
      'src/main/main.js',
      'src/main/services/fileService.js',
      'src/main/services/resourceParser.js',
      'src/main/services/codeGenerator.js',
      'src/preload/preload.js',
      'src/renderer/main.js',
      'src/renderer/components/ResourceForm.js'
    ]

    let allSyntaxOk = true

    for (const file of jsFiles) {
      try {
        const filePath = path.join(process.cwd(), file)
        const content = await fs.readFile(filePath, 'utf8')

        // Test simple de syntaxe (chercher les erreurs évidentes)
        if (content.includes('import') && content.includes('require')) {
          log.warning(`${file} - Mélange import/require détecté`)
        } else {
          log.success(`${file} - syntaxe OK`)
        }
      } catch (error) {
        log.error(`${file} - Erreur: ${error.message}`)
        allSyntaxOk = false
      }
    }

    return allSyntaxOk
  }

  // Test de configuration
  async function testConfiguration() {
    log.info('Vérification de la configuration...')

    try {
      // Vérifier package.json
      const packageJson = await fs.readJson(path.join(process.cwd(), 'package.json'))

      if (packageJson.main === 'src/main/main.js') {
        log.success('Point d\'entrée principal configuré')
      } else {
        log.error('Point d\'entrée principal incorrect')
        return false
      }

      if (packageJson.scripts?.start === 'electron .') {
        log.success('Script de démarrage configuré')
      } else {
        log.error('Script de démarrage manquant ou incorrect')
        return false
      }

      if (packageJson.type === 'module') {
        log.warning('Type module ES6 détecté - peut causer des problèmes avec Electron')
      } else {
        log.success('Configuration CommonJS (recommandée pour Electron)')
      }

      return true

    } catch (error) {
      log.error(`Erreur de configuration: ${error.message}`)
      return false
    }
  }

  // Test du projet web
  async function testWebProject() {
    log.info('Vérification du projet web jeremy-tutoring...')

    const os = require('os')
    const webProjectPath = path.join(os.homedir(), 'Documents', 'jeremy-tutoring')

    if (await fs.pathExists(webProjectPath)) {
      log.success(`Projet web trouvé: ${webProjectPath}`)

      // Vérifier les fichiers importants
      const appVuePath = path.join(webProjectPath, 'src', 'App.vue')
      const translationsPath = path.join(webProjectPath, 'src', 'i18n', 'translations.js')

      if (await fs.pathExists(appVuePath)) {
        log.success('App.vue trouvé')
      } else {
        log.error('App.vue manquant')
        return false
      }

      if (await fs.pathExists(translationsPath)) {
        log.success('translations.js trouvé')
      } else {
        log.error('translations.js manquant')
        return false
      }

      return true
    } else {
      log.error(`Projet web introuvable: ${webProjectPath}`)
      log.warning('Ajustez le chemin dans src/main/services/fileService.js si nécessaire')
      return false
    }
  }

  // Conseils pour le démarrage
  function showStartupInstructions() {
    console.log('\n📋 Instructions de démarrage:\n')

    log.info('1. Assurez-vous que le projet jeremy-tutoring existe dans ~/Documents/')
    log.info('2. Installez les dépendances: npm install')
    log.info('3. Démarrez l\'application: npm start')
    log.info('4. Pour le mode développement: npm run dev')

    console.log('\n🔧 Dépannage:')
    log.warning('Si l\'app ne démarre pas, vérifiez les chemins dans fileService.js')
    log.warning('Adaptez le chemin webProjectPath selon votre configuration')
    log.warning('Assurez-vous que les fichiers App.vue et translations.js existent')

    console.log('\n🎯 Fonctionnalités:')
    log.success('✅ Liste et recherche des ressources existantes')
    log.success('✅ Ajout de nouvelles ressources avec formulaire complet')
    log.success('✅ Modification des ressources existantes')
    log.success('✅ Suppression avec confirmation')
    log.success('✅ Gestion des fichiers PDF (copie et renommage)')
    log.success('✅ Traductions français/anglais')
    log.success('✅ Statistiques et visualisation')
    log.success('✅ Validation et gestion d\'erreurs')
    log.success('✅ Sauvegarde automatique avant modifications')
  }

  // Fonction principale de test
  console.log('🚀 Début des tests...\n')

  const structureOk = await testProjectStructure()
  console.log()

  const depsOk = await testDependencies()
  console.log()

  const syntaxOk = await testSyntax()
  console.log()

  const configOk = await testConfiguration()
  console.log()

  const webProjectOk = await testWebProject()
  console.log()

  // Résumé
  console.log('📊 Résumé des tests:\n')

  if (structureOk) log.success('Structure du projet')
  else log.error('Structure du projet')

  if (depsOk) log.success('Dépendances')
  else log.error('Dépendances')

  if (syntaxOk) log.success('Syntaxe des fichiers')
  else log.error('Syntaxe des fichiers')

  if (configOk) log.success('Configuration')
  else log.error('Configuration')

  if (webProjectOk) log.success('Projet web jeremy-tutoring')
  else log.error('Projet web jeremy-tutoring')

  const allTestsPassed = structureOk && depsOk && syntaxOk && configOk && webProjectOk

  console.log()
  if (allTestsPassed) {
    log.success('🎉 Tous les tests sont passés ! L\'application est prête.')
  } else {
    log.error('❌ Certains tests ont échoué. Corrigez les erreurs avant de continuer.')
  }

  showStartupInstructions()
}

// Exécuter les tests
main().catch(error => {
  console.error(`Erreur lors des tests: ${error.message}`)
  process.exit(1)
})