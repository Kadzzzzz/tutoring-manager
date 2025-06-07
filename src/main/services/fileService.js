// src/main/services/fileService.js
const fs = require('fs-extra')
const path = require('path')
const os = require('os')

/**
 * Service de gestion des fichiers pour l'application admin
 * Gère la lecture/écriture des fichiers du site web et la copie des PDFs
 */
class FileService {
  constructor() {
    // Chemin vers le projet web Jeremy Tutoring
    this.webProjectPath = path.join(os.homedir(), 'Documents', 'jeremy-tutoring')
    this.appVuePath = path.join(this.webProjectPath, 'src', 'App.vue')
    this.translationsPath = path.join(this.webProjectPath, 'src', 'i18n', 'translations.js')
    this.documentsPath = path.join(this.webProjectPath, 'public', 'documents', 'exercices')
  }

  /**
   * Vérifie que les chemins du projet web existent
   */
  async validateWebProject() {
    const paths = [
      this.webProjectPath,
      this.appVuePath,
      this.translationsPath,
      this.documentsPath
    ]

    for (const filePath of paths) {
      if (!(await fs.pathExists(filePath))) {
        throw new Error(`Chemin introuvable: ${filePath}`)
      }
    }

    return true
  }

  /**
   * Lit le contenu du fichier App.vue
   */
  async readAppVue() {
    try {
      const content = await fs.readFile(this.appVuePath, 'utf8')
      return content
    } catch (error) {
      throw new Error(`Erreur lors de la lecture d'App.vue: ${error.message}`)
    }
  }

  /**
   * Écrit le nouveau contenu dans App.vue
   */
  async writeAppVue(content) {
    try {
      await fs.writeFile(this.appVuePath, content, 'utf8')
      return true
    } catch (error) {
      throw new Error(`Erreur lors de l'écriture d'App.vue: ${error.message}`)
    }
  }

  /**
   * Lit le contenu du fichier translations.js
   */
  async readTranslations() {
    try {
      const content = await fs.readFile(this.translationsPath, 'utf8')
      return content
    } catch (error) {
      throw new Error(`Erreur lors de la lecture de translations.js: ${error.message}`)
    }
  }

  /**
   * Écrit le nouveau contenu dans translations.js
   */
  async writeTranslations(content) {
    try {
      await fs.writeFile(this.translationsPath, content, 'utf8')
      return true
    } catch (error) {
      throw new Error(`Erreur lors de l'écriture de translations.js: ${error.message}`)
    }
  }

  /**
   * Copie un fichier PDF vers le dossier approprié avec le bon nom
   */
  async copyPdfFile(sourcePath, resourceId, subject, type) {
    try {
      if (!sourcePath || !(await fs.pathExists(sourcePath))) {
        throw new Error(`Fichier PDF source introuvable: ${sourcePath}`)
      }

      // Créer le dossier de destination s'il n'existe pas
      const destinationDir = path.join(this.documentsPath, subject)
      await fs.ensureDir(destinationDir)

      // Déterminer le nom du fichier selon le pattern
      const suffix = type === 'statement' ? 'enonce' : 'correction'
      const fileName = `${resourceId}-${suffix}.pdf`
      const destinationPath = path.join(destinationDir, fileName)

      // Copier le fichier
      await fs.copy(sourcePath, destinationPath)

      // Retourner le chemin relatif pour le web
      return `/documents/exercices/${subject}/${fileName}`
    } catch (error) {
      throw new Error(`Erreur lors de la copie du PDF: ${error.message}`)
    }
  }

  /**
   * Supprime un fichier PDF
   */
  async deletePdfFile(relativePath) {
    try {
      if (!relativePath) return true

      const fullPath = path.join(this.webProjectPath, 'public', relativePath)
      if (await fs.pathExists(fullPath)) {
        await fs.remove(fullPath)
      }
      return true
    } catch (error) {
      throw new Error(`Erreur lors de la suppression du PDF: ${error.message}`)
    }
  }

  /**
   * Liste tous les fichiers PDF dans le dossier exercices
   */
  async listPdfFiles() {
    try {
      const files = []
      const subjects = ['maths', 'physics', 'chemistry']

      for (const subject of subjects) {
        const subjectDir = path.join(this.documentsPath, subject)
        if (await fs.pathExists(subjectDir)) {
          const pdfFiles = await fs.readdir(subjectDir)
          for (const file of pdfFiles) {
            if (file.endsWith('.pdf')) {
              files.push({
                subject,
                fileName: file,
                fullPath: path.join(subjectDir, file),
                relativePath: `/documents/exercices/${subject}/${file}`
              })
            }
          }
        }
      }

      return files
    } catch (error) {
      throw new Error(`Erreur lors du listage des PDFs: ${error.message}`)
    }
  }

  /**
   * Créer une sauvegarde des fichiers avant modification
   */
  async createBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      const backupDir = path.join(os.homedir(), 'jeremy-admin-backups', timestamp)

      await fs.ensureDir(backupDir)

      // Sauvegarder App.vue
      await fs.copy(this.appVuePath, path.join(backupDir, 'App.vue'))

      // Sauvegarder translations.js
      await fs.copy(this.translationsPath, path.join(backupDir, 'translations.js'))

      return backupDir
    } catch (error) {
      throw new Error(`Erreur lors de la création de la sauvegarde: ${error.message}`)
    }
  }

  /**
   * Restaurer depuis une sauvegarde
   */
  async restoreFromBackup(backupDir) {
    try {
      const appVueBackup = path.join(backupDir, 'App.vue')
      const translationsBackup = path.join(backupDir, 'translations.js')

      if (await fs.pathExists(appVueBackup)) {
        await fs.copy(appVueBackup, this.appVuePath)
      }

      if (await fs.pathExists(translationsBackup)) {
        await fs.copy(translationsBackup, this.translationsPath)
      }

      return true
    } catch (error) {
      throw new Error(`Erreur lors de la restauration: ${error.message}`)
    }
  }

  /**
   * Obtenir des informations sur le projet web
   */
  async getWebProjectInfo() {
    try {
      const packageJsonPath = path.join(this.webProjectPath, 'package.json')
      const packageJson = await fs.readJson(packageJsonPath)

      return {
        name: packageJson.name,
        version: packageJson.version,
        path: this.webProjectPath,
        appVueExists: await fs.pathExists(this.appVuePath),
        translationsExists: await fs.pathExists(this.translationsPath),
        documentsExists: await fs.pathExists(this.documentsPath)
      }
    } catch (error) {
      return {
        path: this.webProjectPath,
        appVueExists: await fs.pathExists(this.appVuePath),
        translationsExists: await fs.pathExists(this.translationsPath),
        documentsExists: await fs.pathExists(this.documentsPath),
        error: error.message
      }
    }
  }
}

module.exports = new FileService()