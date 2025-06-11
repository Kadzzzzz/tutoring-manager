// src/main/main.js
const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const DirectTranslationService = require('./services/directTranslationService')

// Import services
const fileService = require('./services/fileService.js')
const resourceParser = require('./services/resourceParser.js')
const codeGenerator = require('./services/codeGenerator.js')

// Initialize services
const directTranslationService = new DirectTranslationService()

let mainWindow

/**
 * Creates the main application window
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
    show: false // Don't show until ready
  })

  // Load the interface
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))

  // Show when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()

    // Open DevTools in development mode
    if (process.argv.includes('--dev')) {
      mainWindow.webContents.openDevTools()
    }
  })

  // Handle window closing
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

/**
 * Sets up IPC handlers to expose services to the renderer
 */
function setupIpcHandlers() {

  // ==========================================
  // FILE MANAGEMENT
  // ==========================================

  // Validate web project
  ipcMain.handle('validate-web-project', async () => {
    try {
      await fileService.validateWebProject()
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // Get web project information
  ipcMain.handle('get-web-project-info', async () => {
    try {
      const info = await fileService.getWebProjectInfo()
      return { success: true, data: info }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // ==========================================
  // RESOURCE MANAGEMENT
  // ==========================================

  // Load all existing resources
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

  /**
   * Retrieves translations for an existing resource
   */
  ipcMain.handle('get-resource-translations', async (event, { subject, resourceId }) => {
    try {
      // Read translations.js file
      const translationsContent = await fileService.readTranslations()
      const allTranslations = resourceParser.extractTranslationsFromFile(translationsContent)

      // Extract translations for this specific resource
      const resourceTranslations = {
        fr: {},
        en: {}
      }

      // French translations
      if (allTranslations.fr?.resources?.exercises?.[subject]?.[resourceId]) {
        resourceTranslations.fr = allTranslations.fr.resources.exercises[subject][resourceId]
      }

      // English translations
      if (allTranslations.en?.resources?.exercises?.[subject]?.[resourceId]) {
        resourceTranslations.en = allTranslations.en.resources.exercises[subject][resourceId]
      }

      return {
        success: true,
        data: resourceTranslations
      }

    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  })

  // Add a new resource
  ipcMain.handle('add-resource', async (event, { resource, frTranslations, enTranslations, pdfFiles }) => {
    try {
      // Create a backup
      const backupDir = await fileService.createBackup()

      try {
        // Copy PDFs if provided
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

        // Modify App.vue
        const appVueContent = await fileService.readAppVue()
        const newAppVueContent = await codeGenerator.addResourceToAppVue(appVueContent, resource)
        await fileService.writeAppVue(newAppVueContent)

        // Modify translations.js
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
          message: `Resource "${resource.id}" added successfully!`,
          backupDir
        }

      } catch (error) {
        // Restore backup on error
        await fileService.restoreFromBackup(backupDir)
        throw error
      }

    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // Update an existing resource
  ipcMain.handle('update-resource', async (event, { oldResourceId, resource, frTranslations, enTranslations, pdfFiles }) => {
    try {
      const backupDir = await fileService.createBackup()

      try {
        // Handle PDFs
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

        // Modify App.vue
        const appVueContent = await fileService.readAppVue()
        const newAppVueContent = await codeGenerator.updateResourceInAppVue(appVueContent, oldResourceId, resource)
        await fileService.writeAppVue(newAppVueContent)

        // Modify translations.js
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
          message: `Resource "${resource.id}" updated successfully!`,
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

  // Delete a resource
  ipcMain.handle('delete-resource', async (event, { resourceId, subject, pdfPaths }) => {
    try {
      const backupDir = await fileService.createBackup()

      try {
        // Delete PDFs
        if (pdfPaths?.statement) {
          await fileService.deletePdfFile(pdfPaths.statement)
        }
        if (pdfPaths?.solution) {
          await fileService.deletePdfFile(pdfPaths.solution)
        }

        // Modify App.vue
        const appVueContent = await fileService.readAppVue()
        const newAppVueContent = await codeGenerator.removeResourceFromAppVue(appVueContent, resourceId)
        await fileService.writeAppVue(newAppVueContent)

        // Modify translations.js
        const translationsContent = await fileService.readTranslations()
        const newTranslationsContent = await codeGenerator.removeTranslationsForResource(
          translationsContent,
          subject,
          resourceId
        )
        await fileService.writeTranslations(newTranslationsContent)

        return {
          success: true,
          message: `Resource "${resourceId}" deleted successfully!`,
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

  // ==========================================
  // FILE OPERATIONS
  // ==========================================

  // PDF file selector
  ipcMain.handle('select-pdf-file', async (event, title = 'Select a PDF file') => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        title,
        filters: [
          { name: 'PDF Files', extensions: ['pdf'] }
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

  // List existing PDFs
  ipcMain.handle('list-pdf-files', async () => {
    try {
      const files = await fileService.listPdfFiles()
      return { success: true, data: files }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // ==========================================
  // UTILITIES
  // ==========================================

  // Validate a resource
  ipcMain.handle('validate-resource', async (event, resource) => {
    try {
      resourceParser.validateResource(resource)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // Validate translations
  ipcMain.handle('validate-translations', async (event, translations) => {
    try {
      resourceParser.validateResourceTranslations(translations)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // Generate unique ID
  ipcMain.handle('generate-unique-id', async (event, { baseId, existingResources }) => {
    try {
      const uniqueId = resourceParser.generateUniqueId(existingResources, baseId)
      return { success: true, data: uniqueId }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // Restore from backup
  ipcMain.handle('restore-backup', async (event, backupDir) => {
    try {
      await fileService.restoreFromBackup(backupDir)
      return { success: true, message: 'Backup restored successfully!' }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })
}

/**
 * Application initialization
 */
app.whenReady().then(() => {
  setupIpcHandlers()
  createMainWindow()

  // Reactivation on macOS
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

// ==========================================
// AUTOMATIC TRANSLATION IPC APIs
// ==========================================

/**
 * Automatically translates a resource from French to English
 */
ipcMain.handle('translate-resource-auto', async (event, data) => {
  try {
    const { subject, resourceId, frTranslations, options = {} } = data

    // Validate parameters
    if (!subject || !resourceId || !frTranslations) {
      throw new Error('Missing parameters: subject, resourceId, and frTranslations required')
    }

    // Progress function to communicate with renderer
    const onProgress = (message, completed, total) => {
      event.sender.send('translation-progress', {
        message,
        completed,
        total,
        percentage: Math.round((completed / total) * 100)
      })
    }

    // Launch automatic translation
    const result = await directTranslationService.translateResourceAutomatically(
      subject,
      resourceId,
      frTranslations,
      { ...options, onProgress }
    )

    return {
      success: true,
      data: result
    }

  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
})

/**
 * Manually updates resource translations
 */
ipcMain.handle('update-resource-translations', async (event, data) => {
  try {
    const { subject, resourceId, frTranslations, enTranslations } = data

    if (!subject || !resourceId || !frTranslations || !enTranslations) {
      throw new Error('Missing parameters')
    }

    await directTranslationService.updateResourceTranslations(
      subject,
      resourceId,
      frTranslations,
      enTranslations
    )

    return {
      success: true,
      message: 'Translations updated successfully'
    }

  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
})

/**
 * Tests translation service connectivity
 */
ipcMain.handle('test-translation-services', async () => {
  try {
    const { translationService } = require('./services/translationService.js')
    const results = await translationService.testServices()

    return {
      success: true,
      data: results
    }

  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
})

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Security: prevent navigation to external sites
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl)

    if (parsedUrl.origin !== 'file://') {
      event.preventDefault()
    }
  })
})