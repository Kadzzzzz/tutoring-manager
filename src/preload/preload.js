// src/preload/preload.js
const { contextBridge, ipcRenderer } = require('electron')

/**
 * Bridge sécurisé entre Main et Renderer
 * Expose les fonctions IPC de manière contrôlée
 */

// API exposée à l'interface utilisateur
const electronAPI = {

  // === GESTION DU PROJET WEB ===

  /**
   * Valide que le projet web Jeremy Tutoring existe
   */
  validateWebProject: () => ipcRenderer.invoke('validate-web-project'),

  /**
   * Obtient les informations sur le projet web
   */
  getWebProjectInfo: () => ipcRenderer.invoke('get-web-project-info'),

  // === GESTION DES RESSOURCES ===

  /**
   * Charge toutes les ressources et traductions existantes
   */
  loadResources: () => ipcRenderer.invoke('load-resources'),

  /**
   * Ajoute une nouvelle ressource
   * @param {Object} resource - La ressource à ajouter
   * @param {Object} frTranslations - Traductions françaises
   * @param {Object} enTranslations - Traductions anglaises
   * @param {Object} pdfFiles - Fichiers PDF (optionnel)
   */
  addResource: (resource, frTranslations, enTranslations, pdfFiles = {}) =>
    ipcRenderer.invoke('add-resource', {
      resource,
      frTranslations,
      enTranslations,
      pdfFiles
    }),

  /**
   * Met à jour une ressource existante
   * @param {string} oldResourceId - ID actuel de la ressource
   * @param {Object} resource - Nouvelle version de la ressource
   * @param {Object} frTranslations - Traductions françaises
   * @param {Object} enTranslations - Traductions anglaises
   * @param {Object} pdfFiles - Nouveaux fichiers PDF (optionnel)
   */
  updateResource: (oldResourceId, resource, frTranslations, enTranslations, pdfFiles = {}) =>
    ipcRenderer.invoke('update-resource', {
      oldResourceId,
      resource,
      frTranslations,
      enTranslations,
      pdfFiles
    }),

  /**
   * Supprime une ressource
   * @param {string} resourceId - ID de la ressource à supprimer
   * @param {string} subject - Matière de la ressource
   * @param {Object} pdfPaths - Chemins des PDFs à supprimer
   */
  deleteResource: (resourceId, subject, pdfPaths = {}) =>
    ipcRenderer.invoke('delete-resource', {
      resourceId,
      subject,
      pdfPaths
    }),

  // === GESTION DES FICHIERS ===

  /**
   * Ouvre un sélecteur de fichier PDF
   * @param {string} title - Titre de la boîte de dialogue
   */
  selectPdfFile: (title) => ipcRenderer.invoke('select-pdf-file', title),

  /**
   * Liste tous les fichiers PDF dans le dossier exercices
   */
  listPdfFiles: () => ipcRenderer.invoke('list-pdf-files'),

  // === VALIDATION ===

  /**
   * Valide les données d'une ressource
   * @param {Object} resource - Ressource à valider
   */
  validateResource: (resource) => ipcRenderer.invoke('validate-resource', resource),

  /**
   * Valide les traductions d'une ressource
   * @param {Object} translations - Traductions à valider
   */
  validateTranslations: (translations) => ipcRenderer.invoke('validate-translations', translations),

  /**
   * Génère un ID unique pour une ressource
   * @param {string} baseId - ID de base
   * @param {Array} existingResources - Ressources existantes
   */
  generateUniqueId: (baseId, existingResources) =>
    ipcRenderer.invoke('generate-unique-id', { baseId, existingResources }),

  // === SAUVEGARDE ET RESTAURATION ===

  /**
   * Restaure les fichiers depuis une sauvegarde
   * @param {string} backupDir - Dossier de sauvegarde
   */
  restoreBackup: (backupDir) => ipcRenderer.invoke('restore-backup', backupDir),

  // === UTILITAIRES ===

  /**
   * Obtient la version de l'application
   */
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  /**
   * Notifie d'une action utilisateur (pour les logs)
   * @param {string} action - Action effectuée
   * @param {Object} data - Données associées
   */
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
  /**
   * Formate un message d'erreur pour l'affichage
   * @param {Error|string} error - Erreur à formater
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

    return 'Une erreur inconnue s\'est produite'
  },

  /**
   * Vérifie si une réponse IPC contient une erreur
   * @param {Object} response - Réponse IPC
   */
  hasError: (response) => {
    return !response || !response.success || response.error
  },

  /**
   * Extrait l'erreur d'une réponse IPC
   * @param {Object} response - Réponse IPC
   */
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

console.log('🔧 Preload script loaded - Bridge IPC ready!')