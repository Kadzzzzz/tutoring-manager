// src/preload/preload.js
const { contextBridge, ipcRenderer } = require('electron')

/**
 * Bridge sécurisé entre Main et Renderer
 * Expose les fonctions IPC de manière contrôlée
 */

// API exposée à l'interface utilisateur
const electronAPI = {
  // === GESTION DU PROJET WEB ===
  validateWebProject: () => ipcRenderer.invoke('validate-web-project'),
  getWebProjectInfo: () => ipcRenderer.invoke('get-web-project-info'),

  // === GESTION DES RESSOURCES ===
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

  // === GESTION DES TRADUCTIONS ===
  getResourceTranslations: (params) => ipcRenderer.invoke('get-resource-translations', params),

  // 🌍 === NOUVELLES APIs DE TRADUCTION AUTOMATIQUE ===
  translateResourceAuto: (data) => ipcRenderer.invoke('translate-resource-auto', data),
  updateResourceTranslations: (data) => ipcRenderer.invoke('update-resource-translations', data),
  testTranslationServices: () => ipcRenderer.invoke('test-translation-services'),

  // Écouter les événements de progression de traduction
  onTranslationProgress: (callback) => {
    ipcRenderer.on('translation-progress', (event, data) => callback(data))
  },

  // Nettoyer les listeners de traduction
  removeTranslationProgressListener: () => {
    ipcRenderer.removeAllListeners('translation-progress')
  },

  // === GESTION DES FICHIERS ===
  selectPdfFile: (title) => ipcRenderer.invoke('select-pdf-file', title),
  listPdfFiles: () => ipcRenderer.invoke('list-pdf-files'),

  // === VALIDATION ===
  validateResource: (resource) => ipcRenderer.invoke('validate-resource', resource),
  validateTranslations: (translations) => ipcRenderer.invoke('validate-translations', translations),
  generateUniqueId: (baseId, existingResources) =>
    ipcRenderer.invoke('generate-unique-id', { baseId, existingResources }),

  // === SAUVEGARDE ET RESTAURATION ===
  restoreBackup: (backupDir) => ipcRenderer.invoke('restore-backup', backupDir),

  // === UTILITAIRES ===
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  logUserAction: (action, data) => ipcRenderer.invoke('log-user-action', action, data)
}

// Expose l'API dans le contexte du renderer de manière sécurisée
contextBridge.exposeInMainWorld('electronAPI', electronAPI)

// Expose aussi quelques constantes utiles
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

// Helper pour la gestion d'erreurs côté renderer
contextBridge.exposeInMainWorld('errorHandler', {
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

    return 'Une erreur inconnue s\'est produite'
  },

  hasError: (response) => {
    return !response || !response.success || response.error
  },

  getError: (response) => {
    if (!response) return 'Aucune réponse reçue'
    if (response.error) return response.error
    if (!response.success) return 'Opération échouée'
    return null
  }
})

// Utilitaires pour le debugging en mode développement
if (process.argv.includes('--dev')) {
  contextBridge.exposeInMainWorld('devTools', {
    log: (...args) => console.log('[RENDERER]', ...args),
    error: (...args) => console.error('[RENDERER ERROR]', ...args),
    warn: (...args) => console.warn('[RENDERER WARN]', ...args),
    info: (...args) => console.info('[RENDERER INFO]', ...args)
  })
}

console.log('🔧 Preload script loaded - Bridge IPC ready with translation APIs!')