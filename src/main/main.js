// src/main/main.js
const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')

// Import des services
const fileService = require('./services/fileService.js')
const resourceParser = require('./services/resourceParser.js')
const codeGenerator = require('./services/codeGenerator.js')

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