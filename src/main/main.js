// src/main/main.js
const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const DirectTranslationService = require('./services/directTranslationService')

// Import des services
const fileService = require('./services/fileService.js')
const resourceParser = require('./services/resourceParser.js')
const codeGenerator = require('./services/codeGenerator.js')

// Initialiser les services
const directTranslationService = new DirectTranslationService()

let mainWindow

/**
 * Crée la fenêtre principale de l'application
 */
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false
    },
    titleBarStyle: 'default',
    show: false // Ne pas montrer tant que pas prêt
  })

  // Charger l'interface
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))

  // Afficher quand prêt
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()

    // Ouvrir DevTools en mode développement
    if (process.argv.includes('--dev')) {
      mainWindow.webContents.openDevTools()
    }
  })

  // Gérer la fermeture
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

/**
 * Configuration des IPC handlers pour exposer les services
 */
function setupIpcHandlers() {

  // === GESTION DES FICHIERS ===

  // Validation du projet web
  ipcMain.handle('validate-web-project', async () => {
    try {
      await fileService.validateWebProject()
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // Informations sur le projet web
  ipcMain.handle('get-web-project-info', async () => {
    try {
      const info = await fileService.getWebProjectInfo()
      return { success: true, data: info }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // === GESTION DES RESSOURCES ===

  // Charger toutes les ressources existantes
  ipcMain.handle('load-resources', async () => {
    try {
      const appVueContent = await fileService.readAppVue()
      const translationsContent = await fileService.readTranslations()

      const resources = resourceParser.extractResourcesFromAppVue(appVueContent)
      const translations = resourceParser.extractTranslationsFromFile(translationsContent)
      const stats = resourceParser.getResourcesStats(resources)

      return {
        success: true,
        data: {
          resources,
          translations,
          stats
        }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // === GESTION DES TRADUCTIONS (SIMPLE) ===

  /**
   * Récupère les traductions d'une ressource existante
   */
  ipcMain.handle('get-resource-translations', async (event, { subject, resourceId }) => {
    try {
      console.log(`🔍 [MAIN] Récupération traductions pour ${subject}/${resourceId}`)

      // Lire le fichier translations.js (comme pour load-resources)
      const translationsContent = await fileService.readTranslations()
      const allTranslations = resourceParser.extractTranslationsFromFile(translationsContent)

      // Extraire les traductions pour cette ressource spécifique
      const resourceTranslations = {
        fr: {},
        en: {}
      }

      // Traductions françaises
      if (allTranslations.fr?.resources?.exercises?.[subject]?.[resourceId]) {
        resourceTranslations.fr = allTranslations.fr.resources.exercises[subject][resourceId]
      }

      // Traductions anglaises
      if (allTranslations.en?.resources?.exercises?.[subject]?.[resourceId]) {
        resourceTranslations.en = allTranslations.en.resources.exercises[subject][resourceId]
      }

      console.log(`✅ [MAIN] Traductions trouvées:`, resourceTranslations)

      return {
        success: true,
        data: resourceTranslations
      }

    } catch (error) {
      console.error('❌ [MAIN] Erreur récupération traductions:', error.message)
      return {
        success: false,
        error: error.message
      }
    }
  })

  // Ajouter une nouvelle ressource
  ipcMain.handle('add-resource', async (event, { resource, frTranslations, enTranslations, pdfFiles }) => {
    try {
      // Créer une sauvegarde
      const backupDir = await fileService.createBackup()

      try {
        // Copier les PDFs si fournis
        if (pdfFiles?.statement) {
          resource.pdfStatement = await fileService.copyPdfFile(
            pdfFiles.statement,
            resource.id,
            resource.subject,
            'statement'
          )
        }

        if (pdfFiles?.solution) {
          resource.pdfSolution = await fileService.copyPdfFile(
            pdfFiles.solution,
            resource.id,
            resource.subject,
            'solution'
          )
        }

        // Modifier App.vue
        const appVueContent = await fileService.readAppVue()
        const newAppVueContent = await codeGenerator.addResourceToAppVue(appVueContent, resource)
        await fileService.writeAppVue(newAppVueContent)

        // Modifier translations.js
        const translationsContent = await fileService.readTranslations()
        const newTranslationsContent = await codeGenerator.addTranslationsForResource(
          translationsContent,
          resource.subject,
          resource.id,
          frTranslations,
          enTranslations
        )
        await fileService.writeTranslations(newTranslationsContent)

        return {
          success: true,
          message: `Ressource "${resource.id}" ajoutée avec succès !`,
          backupDir
        }

      } catch (error) {
        // Restaurer la sauvegarde en cas d'erreur
        await fileService.restoreFromBackup(backupDir)
        throw error
      }

    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // Mettre à jour une ressource existante
  ipcMain.handle('update-resource', async (event, { oldResourceId, resource, frTranslations, enTranslations, pdfFiles }) => {
    try {
      const backupDir = await fileService.createBackup()

      try {
        // Gérer les PDFs
        if (pdfFiles?.statement) {
          resource.pdfStatement = await fileService.copyPdfFile(
            pdfFiles.statement,
            resource.id,
            resource.subject,
            'statement'
          )
        }

        if (pdfFiles?.solution) {
          resource.pdfSolution = await fileService.copyPdfFile(
            pdfFiles.solution,
            resource.id,
            resource.subject,
            'solution'
          )
        }

        // Modifier App.vue
        const appVueContent = await fileService.readAppVue()
        const newAppVueContent = await codeGenerator.updateResourceInAppVue(appVueContent, oldResourceId, resource)
        await fileService.writeAppVue(newAppVueContent)

        // Modifier translations.js
        const translationsContent = await fileService.readTranslations()
        const newTranslationsContent = await codeGenerator.updateTranslationsForResource(
          translationsContent,
          resource.subject,
          resource.id,
          frTranslations,
          enTranslations
        )
        await fileService.writeTranslations(newTranslationsContent)

        return {
          success: true,
          message: `Ressource "${resource.id}" mise à jour avec succès !`,
          backupDir
        }

      } catch (error) {
        await fileService.restoreFromBackup(backupDir)
        throw error
      }

    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // Supprimer une ressource
  ipcMain.handle('delete-resource', async (event, { resourceId, subject, pdfPaths }) => {
    try {
      const backupDir = await fileService.createBackup()

      try {
        // Supprimer les PDFs
        if (pdfPaths?.statement) {
          await fileService.deletePdfFile(pdfPaths.statement)
        }
        if (pdfPaths?.solution) {
          await fileService.deletePdfFile(pdfPaths.solution)
        }

        // Modifier App.vue
        const appVueContent = await fileService.readAppVue()
        const newAppVueContent = await codeGenerator.removeResourceFromAppVue(appVueContent, resourceId)
        await fileService.writeAppVue(newAppVueContent)

        // Modifier translations.js
        const translationsContent = await fileService.readTranslations()
        const newTranslationsContent = await codeGenerator.removeTranslationsForResource(
          translationsContent,
          subject,
          resourceId
        )
        await fileService.writeTranslations(newTranslationsContent)

        return {
          success: true,
          message: `Ressource "${resourceId}" supprimée avec succès !`,
          backupDir
        }

      } catch (error) {
        await fileService.restoreFromBackup(backupDir)
        throw error
      }

    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // === GESTION DES FICHIERS ===

  // Sélectionneur de fichiers PDF
  ipcMain.handle('select-pdf-file', async (event, title = 'Sélectionner un fichier PDF') => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        title,
        filters: [
          { name: 'Fichiers PDF', extensions: ['pdf'] }
        ],
        properties: ['openFile']
      })

      if (result.canceled) {
        return { success: false, canceled: true }
      }

      return { success: true, filePath: result.filePaths[0] }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // Lister les PDFs existants
  ipcMain.handle('list-pdf-files', async () => {
    try {
      const files = await fileService.listPdfFiles()
      return { success: true, data: files }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // === UTILITAIRES ===

  // Valider une ressource
  ipcMain.handle('validate-resource', async (event, resource) => {
    try {
      resourceParser.validateResource(resource)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // Valider les traductions
  ipcMain.handle('validate-translations', async (event, translations) => {
    try {
      resourceParser.validateResourceTranslations(translations)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // Générer un ID unique
  ipcMain.handle('generate-unique-id', async (event, { baseId, existingResources }) => {
    try {
      const uniqueId = resourceParser.generateUniqueId(existingResources, baseId)
      return { success: true, data: uniqueId }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // Restaurer depuis une sauvegarde
  ipcMain.handle('restore-backup', async (event, backupDir) => {
    try {
      await fileService.restoreFromBackup(backupDir)
      return { success: true, message: 'Sauvegarde restaurée avec succès !' }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })
}

/**
 * Initialisation de l'application
 */
app.whenReady().then(() => {
  setupIpcHandlers()
  createMainWindow()

  // Réactivation sur macOS
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

// ===============================================
// 🌍 NOUVELLES APIs IPC POUR LA TRADUCTION
// ===============================================

/**
 * Traduit automatiquement une ressource FR → EN
 */
ipcMain.handle('translate-resource-auto', async (event, data) => {
  try {
    console.log('🌍 IPC: translate-resource-auto appelé avec:', data)

    const { subject, resourceId, frTranslations, options = {} } = data

    // Validation des paramètres
    if (!subject || !resourceId || !frTranslations) {
      throw new Error('Paramètres manquants: subject, resourceId, et frTranslations requis')
    }

    // Fonction de progression pour communiquer avec le renderer
    const onProgress = (message, completed, total) => {
      event.sender.send('translation-progress', {
        message,
        completed,
        total,
        percentage: Math.round((completed / total) * 100)
      })
    }

    // Lancer la traduction automatique
    const result = await directTranslationService.translateResourceAutomatically(
      subject,
      resourceId,
      frTranslations,
      { ...options, onProgress }
    )

    console.log('✅ IPC: Traduction automatique terminée')
    return {
      success: true,
      data: result
    }

  } catch (error) {
    console.error('❌ IPC: Erreur traduction automatique:', error.message)
    return {
      success: false,
      error: error.message
    }
  }
})

/**
 * Met à jour manuellement les traductions d'une ressource
 */
/**
 * Met à jour manuellement les traductions d'une ressource
 */
ipcMain.handle('update-resource-translations', async (event, data) => {
  try {
    console.log('📝 IPC: update-resource-translations appelé avec:', data)

    const { subject, resourceId, frTranslations, enTranslations } = data

    if (!subject || !resourceId || !frTranslations || !enTranslations) {
      throw new Error('Paramètres manquants')
    }

    await directTranslationService.updateResourceTranslations(
      subject,
      resourceId,
      frTranslations,
      enTranslations
    )

    console.log('✅ IPC: Traductions mises à jour')
    return {
      success: true,
      message: 'Traductions mises à jour avec succès'
    }

  } catch (error) {
    console.error('❌ IPC: Erreur mise à jour traductions:', error.message)
    return {
      success: false,
      error: error.message
    }
  }
})

/**
 * Test de connectivité des services de traduction
 */
ipcMain.handle('test-translation-services', async () => {
  try {
    console.log('🧪 IPC: test-translation-services appelé')

    // 🔧 CORRECTION: Utiliser require au lieu d'import dynamique
    const { translationService } = require('./services/translationService.js')

    const results = await translationService.testServices()

    console.log('✅ IPC: Test des services terminé')
    return {
      success: true,
      data: results
    }

  } catch (error) {
    console.error('❌ IPC: Erreur test services:', error.message)
    return {
      success: false,
      error: error.message
    }
  }
})

// Quitter quand toutes les fenêtres sont fermées
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Sécurité : empêcher la navigation vers des sites externes
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl)

    if (parsedUrl.origin !== 'file://') {
      event.preventDefault()
    }
  })
})