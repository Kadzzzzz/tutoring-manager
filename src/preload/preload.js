// src/preload/preload.js
const { contextBridge, ipcRenderer } = require('electron')

/**
 * Secure bridge between Main and Renderer processes
 * Exposes IPC functions in a controlled manner
 */

// API exposed to the user interface
const electronAPI = {
  // ==========================================
  // WEB PROJECT MANAGEMENT
  // ==========================================
  validateWebProject: () => ipcRenderer.invoke('validate-web-project'),
  getWebProjectInfo: () => ipcRenderer.invoke('get-web-project-info'),

  // ==========================================
  // RESOURCE MANAGEMENT
  // ==========================================
  loadResources: () => ipcRenderer.invoke('load-resources'),
  addResource: (resource, frTranslations, enTranslations, pdfFiles = {}) =>
    ipcRenderer.invoke('add-resource', {
      resource,
      frTranslations,
      enTranslations,
      pdfFiles
    }),
  updateResource: (oldResourceId, resource, frTranslations, enTranslations, pdfFiles = {}) =>
    ipcRenderer.invoke('update-resource', {
      oldResourceId,
      resource,
      frTranslations,
      enTranslations,
      pdfFiles
    }),
  deleteResource: (resourceId, subject, pdfPaths = {}) =>
    ipcRenderer.invoke('delete-resource', {
      resourceId,
      subject,
      pdfPaths
    }),

  // ==========================================
  // TRANSLATION MANAGEMENT
  // ==========================================
  getResourceTranslations: (params) => ipcRenderer.invoke('get-resource-translations', params),

  // Automatic translation APIs
  translateResourceAuto: (data) => ipcRenderer.invoke('translate-resource-auto', data),
  updateResourceTranslations: (data) => ipcRenderer.invoke('update-resource-translations', data),
  testTranslationServices: () => ipcRenderer.invoke('test-translation-services'),

  // Listen to translation progress events
  onTranslationProgress: (callback) => {
    ipcRenderer.on('translation-progress', (event, data) => callback(data))
  },

  // Clean up translation listeners
  removeTranslationProgressListener: () => {
    ipcRenderer.removeAllListeners('translation-progress')
  },

  // ==========================================
  // FILE MANAGEMENT
  // ==========================================
  selectPdfFile: (title) => ipcRenderer.invoke('select-pdf-file', title),
  listPdfFiles: () => ipcRenderer.invoke('list-pdf-files'),

  // ==========================================
  // VALIDATION
  // ==========================================
  validateResource: (resource) => ipcRenderer.invoke('validate-resource', resource),
  validateTranslations: (translations) => ipcRenderer.invoke('validate-translations', translations),
  generateUniqueId: (baseId, existingResources) =>
    ipcRenderer.invoke('generate-unique-id', { baseId, existingResources }),

  // ==========================================
  // BACKUP AND RESTORATION
  // ==========================================
  restoreBackup: (backupDir) => ipcRenderer.invoke('restore-backup', backupDir),

  // ==========================================
  // UTILITIES
  // ==========================================
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  logUserAction: (action, data) => ipcRenderer.invoke('log-user-action', action, data)
}

// Expose the API in the renderer context securely
contextBridge.exposeInMainWorld('electronAPI', electronAPI)

// Expose useful constants
contextBridge.exposeInMainWorld('appConstants', {
  SUBJECTS: ['maths', 'physics', 'chemistry'],
  LEVELS: ['terminale', 'prepa1', 'prepa2'],
  TYPES: ['exercise', 'course', 'method', 'interro'],
  SUBJECT_NAMES: {
    maths: 'Mathématiques',
    physics: 'Physique',
    chemistry: 'Chimie'
  },
  LEVEL_NAMES: {
    terminale: 'Terminale',
    prepa1: 'Prépa 1A',
    prepa2: 'Prépa 2A'
  },
  TYPE_NAMES: {
    exercise: 'Exercice',
    course: 'Cours',
    method: 'Méthode',
    interro: 'Interrogation'
  }
})

// Helper for error handling in the renderer
contextBridge.exposeInMainWorld('errorHandler', {
  /**
   * Formats error objects into readable strings
   * @param {*} error - Error to format
   * @returns {string} Formatted error message
   */
  formatError: (error) => {
    if (typeof error === 'string') {
      return error
    }

    if (error instanceof Error) {
      return error.message
    }

    if (error && error.message) {
      return error.message
    }

    return 'An unknown error occurred'
  },

  /**
   * Checks if a response contains an error
   * @param {Object} response - Response object to check
   * @returns {boolean} True if response has an error
   */
  hasError: (response) => {
    return !response || !response.success || response.error
  },

  /**
   * Extracts error message from response
   * @param {Object} response - Response object
   * @returns {string|null} Error message or null
   */
  getError: (response) => {
    if (!response) return 'No response received'
    if (response.error) return response.error
    if (!response.success) return 'Operation failed'
    return null
  }
})

// Development utilities (only in dev mode)
if (process.argv.includes('--dev')) {
  contextBridge.exposeInMainWorld('devTools', {
    log: (...args) => console.log('[RENDERER]', ...args),
    error: (...args) => console.error('[RENDERER ERROR]', ...args),
    warn: (...args) => console.warn('[RENDERER WARN]', ...args),
    info: (...args) => console.info('[RENDERER INFO]', ...args)
  })
}