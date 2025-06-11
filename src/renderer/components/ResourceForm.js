// src/renderer/components/ResourceForm.js
// Vue component for resource form with automatic translation functionality

window.ResourceForm = {
  props: {
    resource: Object,
    isEditing: Boolean
  },
  emits: ['save', 'cancel'],

  template: `
    <div class="resource-form">
      <form @submit.prevent="handleSubmit" class="form">
        
        <!-- Section: Basic Information -->
        <div class="form-section">
          <h3 class="section-title">
            <i class="fas fa-info-circle"></i>
            Informations de base
          </h3>
          
          <div class="form-grid">
            <!-- Resource ID -->
            <div class="form-group">
              <label for="id" class="form-label">
                ID de la ressource *
                <i class="fas fa-question-circle" title="Identifiant unique pour la ressource"></i>
              </label>
              <input 
                id="id"
                v-model="formData.id" 
                type="text" 
                class="form-input"
                :class="{ 'error': errors.id }"
                placeholder="ex: interro0LLG"
                required
                @blur="validateIdField"
              >
              <span v-if="errors.id" class="error-message">{{ errors.id }}</span>
              <span v-else class="help-text">Utilisez uniquement lettres, chiffres et tirets</span>
            </div>

            <!-- Subject -->
            <div class="form-group">
              <label for="subject" class="form-label">Matière *</label>
              <select 
                id="subject" 
                v-model="formData.subject" 
                class="form-select"
                :class="{ 'error': errors.subject }"
                required
              >
                <option value="">Choisir une matière</option>
                <option value="maths">Mathématiques</option>
                <option value="physics">Physique</option>
                <option value="chemistry">Chimie</option>
              </select>
              <span v-if="errors.subject" class="error-message">{{ errors.subject }}</span>
            </div>

            <!-- Level -->
            <div class="form-group">
              <label for="level" class="form-label">Niveau *</label>
              <select 
                id="level" 
                v-model="formData.levelKey" 
                class="form-select"
                :class="{ 'error': errors.levelKey }"
                required
              >
                <option value="">Choisir un niveau</option>
                <option value="terminale">Terminale</option>
                <option value="prepa1">Prépa 1A</option>
                <option value="prepa2">Prépa 2A</option>
              </select>
              <span v-if="errors.levelKey" class="error-message">{{ errors.levelKey }}</span>
            </div>

            <!-- Type -->
            <div class="form-group">
              <label for="type" class="form-label">Type *</label>
              <select 
                id="type" 
                v-model="formData.typeKey" 
                class="form-select"
                :class="{ 'error': errors.typeKey }"
                required
              >
                <option value="">Choisir un type</option>
                <option value="exercise">Exercice</option>
                <option value="course">Cours</option>
                <option value="method">Méthode</option>
                <option value="interro">Interrogation</option>
              </select>
              <span v-if="errors.typeKey" class="error-message">{{ errors.typeKey }}</span>
            </div>

            <!-- Duration -->
            <div class="form-group">
              <label for="duration" class="form-label">Durée *</label>
              <input 
                id="duration"
                v-model="formData.duration" 
                type="text" 
                class="form-input"
                :class="{ 'error': errors.duration }"
                placeholder="ex: 2h, 90 min, 1h30"
                required
              >
              <span v-if="errors.duration" class="error-message">{{ errors.duration }}</span>
            </div>
          </div>
        </div>

        <!-- Section: Video -->
        <div class="form-section">
          <h3 class="section-title">
            <i class="fas fa-video"></i>
            Vidéo explicative
          </h3>
          
          <div class="form-group">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                v-model="formData.hasVideo"
                class="form-checkbox"
              >
              <span class="checkbox-custom"></span>
              Cette ressource a une vidéo explicative
            </label>
          </div>

          <!-- YouTube URL input - only shown when video is enabled -->
          <div v-if="formData.hasVideo" class="form-group">
            <label for="videoUrl" class="form-label">
              URL YouTube
              <i class="fas fa-question-circle" title="ID de la vidéo YouTube (ex: dQw4w9WgXcQ)"></i>
            </label>
            <input 
              id="videoUrl"
              v-model="formData.videoUrl" 
              type="text" 
              class="form-input"
              placeholder="ID de la vidéo YouTube (ex: dQw4w9WgXcQ)"
            >
            <span class="help-text">Copiez uniquement l'ID depuis l'URL YouTube</span>
          </div>
        </div>

        <!-- Section: PDF Documents -->
        <div class="form-section">
          <h3 class="section-title">
            <i class="fas fa-file-pdf"></i>
            Documents PDF
          </h3>
          
          <div class="form-grid">
            <!-- Statement PDF -->
            <div class="form-group">
              <label class="form-label">Énoncé (PDF)</label>
              <div class="file-input-group">
                <button 
                  type="button" 
                  @click="selectPdfFile('statement')" 
                  class="btn btn-secondary file-btn"
                >
                  <i class="fas fa-file-upload"></i>
                  {{ pdfFiles.statement ? 'Changer' : 'Sélectionner' }}
                </button>
                <span v-if="pdfFiles.statement" class="file-name">
                  {{ getFileName(pdfFiles.statement) }}
                </span>
                <span v-else-if="formData.pdfStatement" class="file-name existing">
                  {{ formData.pdfStatement.split('/').pop() }} (existant)
                </span>
                <span v-else class="file-placeholder">Aucun fichier sélectionné</span>
              </div>
            </div>

            <!-- Solution PDF -->
            <div class="form-group">
              <label class="form-label">Correction (PDF)</label>
              <div class="file-input-group">
                <button 
                  type="button" 
                  @click="selectPdfFile('solution')" 
                  class="btn btn-secondary file-btn"
                >
                  <i class="fas fa-file-upload"></i>
                  {{ pdfFiles.solution ? 'Changer' : 'Sélectionner' }}
                </button>
                <span v-if="pdfFiles.solution" class="file-name">
                  {{ getFileName(pdfFiles.solution) }}
                </span>
                <span v-else-if="formData.pdfSolution" class="file-name existing">
                  {{ formData.pdfSolution.split('/').pop() }} (existant)
                </span>
                <span v-else class="file-placeholder">Aucun fichier sélectionné</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Section: Automatic Translation -->
        <div class="form-section translation-section">
          <h3 class="section-title" style="color: #0369a1;">
            <i class="fas fa-globe"></i>
            Traduction automatique
          </h3>
          
          <!-- Translation toggle -->
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="autoTranslateEnabled" class="form-checkbox">
              <span class="checkbox-custom"></span>
              Traduire automatiquement FR → EN
            </label>
            <span class="help-text">Utilise LibreTranslate ou MyMemory (services gratuits)</span>
          </div>

          <!-- Translation controls - only shown when enabled -->
          <div v-if="autoTranslateEnabled" style="margin-top: 12px;">
            <button 
              type="button" 
              @click="translateToEnglish" 
              :disabled="translating || !formData.subject || !formData.id || !frTranslations.title || !frTranslations.description" 
              class="btn btn-primary"
              style="margin-bottom: 12px;"
            >
              <i v-if="translating" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-globe"></i>
              {{ translating ? 'Traduction...' : 'Traduire maintenant' }}
            </button>

            <!-- Progress bar for translation -->
            <div v-if="translationProgress.isVisible" class="translation-progress">
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ width: translationProgress.percentage + '%' }"
                ></div>
              </div>
              <p class="progress-message">{{ translationProgress.message }}</p>
            </div>

            <div class="help-text" style="margin-top: 8px;">
              <strong>Important :</strong> Remplissez d'abord la matière, l'ID, et au minimum le titre et la description français.
            </div>
          </div>
        </div>

        <!-- Section: Translations -->
        <div class="form-section">
          <h3 class="section-title">
            <i class="fas fa-language"></i>
            Traductions
          </h3>
          
          <!-- French translations -->
          <div class="translation-group">
            <h4 class="translation-title">
              <i class="fas fa-flag"></i>
              Français
            </h4>
            
            <div class="form-group">
              <label for="fr-title" class="form-label">Titre *</label>
              <input 
                id="fr-title"
                v-model="frTranslations.title" 
                type="text" 
                class="form-input"
                :class="{ 'error': errors.frTitle }"
                placeholder="ex: Interrogation 0 PC*"
                required
              >
              <span v-if="errors.frTitle" class="error-message">{{ errors.frTitle }}</span>
            </div>

            <div class="form-group">
              <label for="fr-description" class="form-label">Description *</label>
              <textarea 
                id="fr-description"
                v-model="frTranslations.description" 
                class="form-textarea"
                :class="{ 'error': errors.frDescription }"
                placeholder="Description courte de la ressource..."
                rows="3"
                required
              ></textarea>
              <span v-if="errors.frDescription" class="error-message">{{ errors.frDescription }}</span>
            </div>

            <div class="form-group">
              <label for="fr-fullDescription" class="form-label">Description complète</label>
              <textarea 
                id="fr-fullDescription"
                v-model="frTranslations.fullDescription" 
                class="form-textarea"
                placeholder="Description détaillée (optionnel)..."
                rows="5"
              ></textarea>
            </div>

            <div class="form-group">
              <label for="fr-notes" class="form-label">Notes et conseils</label>
              <textarea 
                id="fr-notes"
                v-model="frTranslations.notes" 
                class="form-textarea"
                placeholder="Notes pédagogiques (optionnel)..."
                rows="3"
              ></textarea>
            </div>
          </div>

          <!-- English translations -->
          <div class="translation-group">
            <h4 class="translation-title">
              <i class="fas fa-flag"></i>
              English
            </h4>
            
            <div class="form-group">
              <label for="en-title" class="form-label">Title *</label>
              <input 
                id="en-title"
                v-model="enTranslations.title" 
                type="text" 
                class="form-input"
                :class="{ 'error': errors.enTitle }"
                placeholder="ex: Quiz 0 PC*"
                required
              >
              <span v-if="errors.enTitle" class="error-message">{{ errors.enTitle }}</span>
            </div>

            <div class="form-group">
              <label for="en-description" class="form-label">Description *</label>
              <textarea 
                id="en-description"
                v-model="enTranslations.description" 
                class="form-textarea"
                :class="{ 'error': errors.enDescription }"
                placeholder="Short description of the resource..."
                rows="3"
                required
              ></textarea>
              <span v-if="errors.enDescription" class="error-message">{{ errors.enDescription }}</span>
            </div>

            <div class="form-group">
              <label for="en-fullDescription" class="form-label">Full description</label>
              <textarea 
                id="en-fullDescription"
                v-model="enTranslations.fullDescription" 
                class="form-textarea"
                placeholder="Detailed description (optional)..."
                rows="5"
              ></textarea>
            </div>

            <div class="form-group">
              <label for="en-notes" class="form-label">Notes and tips</label>
              <textarea 
                id="en-notes"
                v-model="enTranslations.notes" 
                class="form-textarea"
                placeholder="Educational notes (optional)..."
                rows="3"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <button type="button" @click="$emit('cancel')" class="btn btn-secondary">
            <i class="fas fa-times"></i>
            Annuler
          </button>
          <button type="submit" class="btn btn-primary" :disabled="!isFormValid || saving">
            <i v-if="saving" class="fas fa-spinner fa-spin"></i>
            <i v-else :class="isEditing ? 'fas fa-save' : 'fas fa-plus'"></i>
            {{ saving ? 'Sauvegarde...' : (isEditing ? 'Mettre à jour' : 'Ajouter') }}
          </button>
        </div>

      </form>
    </div>
  `,

  setup(props, { emit }) {
    const { ref, reactive, computed, onMounted, watch } = Vue

    // ==========================================
    // REACTIVE STATE
    // ==========================================

    // Form state management
    const saving = ref(false)
    const errors = reactive({})
    const existingResources = ref([])

    // Translation state
    const autoTranslateEnabled = ref(false)
    const translating = ref(false)
    const translationProgress = reactive({
      message: '',
      percentage: 0,
      isVisible: false
    })

    // Core form data
    const formData = reactive({
      id: '',
      subject: '',
      levelKey: '',
      typeKey: '',
      duration: '',
      hasVideo: false,
      videoUrl: '',
      pdfStatement: '',
      pdfSolution: ''
    })

    // Translation data for both languages
    const frTranslations = reactive({
      title: '',
      description: '',
      fullDescription: '',
      notes: ''
    })

    const enTranslations = reactive({
      title: '',
      description: '',
      fullDescription: '',
      notes: ''
    })

    // Selected PDF files (for new uploads)
    const pdfFiles = reactive({
      statement: null,
      solution: null
    })

    // ==========================================
    // COMPUTED PROPERTIES
    // ==========================================

    /**
     * Validates if the form has all required fields filled correctly
     */
    const isFormValid = computed(() => {
      return formData.id &&
             formData.subject &&
             formData.levelKey &&
             formData.typeKey &&
             formData.duration &&
             frTranslations.title &&
             frTranslations.description &&
             enTranslations.title &&
             enTranslations.description &&
             Object.keys(errors).length === 0
    })

    // ==========================================
    // TRANSLATION METHODS
    // ==========================================

    /**
     * Handles automatic translation from French to English
     * Uses external translation services (LibreTranslate/MyMemory)
     */
    const translateToEnglish = async () => {
      // Pre-validation checks
      if (!frTranslations.title || !frTranslations.title.trim() ||
          !frTranslations.description || !frTranslations.description.trim()) {
        alert('Remplissez au moins le titre et la description français avant de traduire')
        return
      }

      if (!formData.subject || !formData.id) {
        alert('Veuillez d\'abord remplir la matière et l\'ID de la ressource')
        return
      }

      // Initialize translation state
      translating.value = true
      translationProgress.isVisible = true
      translationProgress.message = 'Initialisation...'
      translationProgress.percentage = 0

      try {
        // Step 1: Test translation service connectivity
        translationProgress.message = 'Test des services de traduction...'
        const serviceTest = await window.electronAPI.testTranslationServices()

        if (!serviceTest.success) {
          throw new Error('Services de traduction indisponibles')
        }

        // Step 2: Select best available service
        let selectedService = 'libretranslate'
        if (serviceTest.data.libretranslate && serviceTest.data.libretranslate.status !== 'ok' &&
            serviceTest.data.mymemory && serviceTest.data.mymemory.status === 'ok') {
          selectedService = 'mymemory'
        }

        translationProgress.message = 'Service sélectionné: ' + selectedService
        translationProgress.percentage = 10

        // Step 3: Prepare French translations data
        const frData = {
          title: frTranslations.title.trim(),
          description: frTranslations.description.trim(),
          fullDescription: frTranslations.fullDescription ? frTranslations.fullDescription.trim() : '',
          notes: frTranslations.notes ? frTranslations.notes.trim() : ''
        }

        // Step 4: Set up progress listener
        window.electronAPI.onTranslationProgress((progress) => {
          translationProgress.message = progress.message
          // Reserve 10% for setup, 80% for translation, 10% for cleanup
          translationProgress.percentage = 10 + (progress.percentage * 0.8)
        })

        // Step 5: Execute automatic translation
        const result = await window.electronAPI.translateResourceAuto({
          subject: formData.subject,
          resourceId: formData.id,
          frTranslations: frData,
          options: {
            service: selectedService,
            googleApiKey: null
          }
        })

        // Step 6: Process translation results
        if (result.success) {
          translationProgress.message = 'Application des traductions...'
          translationProgress.percentage = 95

          // Apply English translations to form
          const translatedData = result.data.enTranslations

          Object.assign(enTranslations, {
            title: translatedData.title || '',
            description: translatedData.description || '',
            fullDescription: translatedData.fullDescription || '',
            notes: translatedData.notes || ''
          })

          // Force Vue reactivity update
          await Vue.nextTick()

          translationProgress.message = 'Terminé !'
          translationProgress.percentage = 100

          // Success notification
          setTimeout(() => {
            alert('Traduction automatique terminée avec succès !\n\n' +
                  'Les traductions anglaises ont été générées et sauvegardées.')
          }, 500)

        } else {
          throw new Error(result.error || 'Traduction échouée')
        }

      } catch (error) {
        // Handle translation errors with specific messages
        let errorMessage = 'Erreur de traduction: '

        if (error.message.includes('indisponibles')) {
          errorMessage += 'Les services de traduction ne sont pas accessibles. Vérifiez votre connexion internet.'
        } else if (error.message.includes('API')) {
          errorMessage += 'Problème avec l\'API de traduction. Réessayez dans quelques minutes.'
        } else {
          errorMessage += error.message
        }

        alert(errorMessage)

      } finally {
        // Cleanup translation state
        translating.value = false

        setTimeout(() => {
          translationProgress.isVisible = false
          translationProgress.message = ''
          translationProgress.percentage = 0
        }, 2000)

        // Remove event listeners
        window.electronAPI.removeTranslationProgressListener()
      }
    }

    // ==========================================
    // VALIDATION METHODS
    // ==========================================

    /**
     * Validates and cleans a resource ID
     * @param {string} id - The ID to validate
     * @returns {string} Clean ID
     */
    const validateId = (id) => {
      if (!id || typeof id !== 'string') {
        return ''
      }

      // Clean ID: lowercase, only alphanumeric and hyphens, max 50 chars
      return id
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .replace(/^-+|-+$/g, '')
        .substring(0, 50)
    }

    /**
     * Validates the ID field on blur
     */
    const validateIdField = () => {
      if (formData.id) {
        formData.id = validateId(formData.id)
      }
    }

    /**
     * Validates the entire form and populates errors object
     * @returns {boolean} True if form is valid
     */
    const validateForm = () => {
      // Clear existing errors
      Object.keys(errors).forEach(key => delete errors[key])

      // Validate required fields
      if (!formData.id.trim()) errors.id = 'L\'ID est requis'
      if (!formData.subject) errors.subject = 'La matière est requise'
      if (!formData.levelKey) errors.levelKey = 'Le niveau est requis'
      if (!formData.typeKey) errors.typeKey = 'Le type est requis'
      if (!formData.duration.trim()) errors.duration = 'La durée est requise'

      // Validate translations
      if (!frTranslations.title.trim()) errors.frTitle = 'Le titre français est requis'
      if (!frTranslations.description.trim()) errors.frDescription = 'La description française est requise'
      if (!enTranslations.title.trim()) errors.enTitle = 'Le titre anglais est requis'
      if (!enTranslations.description.trim()) errors.enDescription = 'La description anglaise est requise'

      return Object.keys(errors).length === 0
    }

    // ==========================================
    // FORM INITIALIZATION
    // ==========================================

    /**
     * Initializes the form for either editing or creating a resource
     */
    const initializeForm = async () => {
      if (props.resource) {
        // Edit mode - populate with existing resource data
        Object.assign(formData, {
          id: props.resource.id || '',
          subject: props.resource.subject || '',
          levelKey: props.resource.levelKey || '',
          typeKey: props.resource.typeKey || '',
          duration: props.resource.duration || '',
          hasVideo: props.resource.hasVideo || false,
          videoUrl: props.resource.videoUrl || '',
          pdfStatement: props.resource.pdfStatement || '',
          pdfSolution: props.resource.pdfSolution || ''
        })

        // Load translations from API
        try {
          const translationsResult = await window.electronAPI.getResourceTranslations({
            subject: props.resource.subject,
            resourceId: props.resource.id
          })

          if (translationsResult.success && translationsResult.data) {
            // Apply French translations
            if (translationsResult.data.fr) {
              Object.assign(frTranslations, {
                title: translationsResult.data.fr.title || '',
                description: translationsResult.data.fr.description || '',
                fullDescription: translationsResult.data.fr.fullDescription || '',
                notes: translationsResult.data.fr.notes || ''
              })
            }

            // Apply English translations
            if (translationsResult.data.en) {
              Object.assign(enTranslations, {
                title: translationsResult.data.en.title || '',
                description: translationsResult.data.en.description || '',
                fullDescription: translationsResult.data.en.fullDescription || '',
                notes: translationsResult.data.en.notes || ''
              })
            }

            await Vue.nextTick()

          } else {
            // Initialize with empty translations if none found
            Object.assign(frTranslations, { title: '', description: '', fullDescription: '', notes: '' })
            Object.assign(enTranslations, { title: '', description: '', fullDescription: '', notes: '' })
          }

        } catch (error) {
          // Fallback to empty translations on error
          Object.assign(frTranslations, { title: '', description: '', fullDescription: '', notes: '' })
          Object.assign(enTranslations, { title: '', description: '', fullDescription: '', notes: '' })
        }

      } else {
        // Create mode - initialize with empty form
        Object.keys(formData).forEach(key => {
          formData[key] = key === 'hasVideo' ? false : ''
        })

        Object.keys(frTranslations).forEach(key => { frTranslations[key] = '' })
        Object.keys(enTranslations).forEach(key => { enTranslations[key] = '' })
      }
    }

    // ==========================================
    // FILE HANDLING
    // ==========================================

    /**
     * Opens file dialog to select a PDF file
     * @param {string} type - 'statement' or 'solution'
     */
    const selectPdfFile = async (type) => {
      try {
        const title = type === 'statement' ? 'Sélectionner l\'énoncé PDF' : 'Sélectionner la correction PDF'
        const result = await window.electronAPI.selectPdfFile(title)

        if (result.success && !result.canceled) {
          pdfFiles[type] = result.filePath
        }
      } catch (error) {
        // Handle file selection errors silently - user can retry
      }
    }

    /**
     * Extracts filename from a file path
     * @param {string} filePath - Full file path
     * @returns {string} Filename only
     */
    const getFileName = (filePath) => {
      if (!filePath) return ''
      return filePath.split('/').pop() || filePath.split('\\').pop() || filePath
    }

    // ==========================================
    // FORM SUBMISSION
    // ==========================================

    /**
     * Handles form submission - validates and emits save event
     */
    const handleSubmit = async () => {
      if (!validateForm()) {
        return
      }

      saving.value = true

      try {
        // Prepare resource data
        const resourceData = {
          id: formData.id.trim(),
          subject: formData.subject,
          levelKey: formData.levelKey,
          typeKey: formData.typeKey,
          duration: formData.duration.trim(),
          hasVideo: formData.hasVideo,
          videoUrl: formData.hasVideo ? formData.videoUrl.trim() : ''
        }

        // Helper function to clean translation objects
        const cleanTranslations = (translations) => {
          const cleaned = {}
          Object.keys(translations).forEach(key => {
            const value = translations[key] ? translations[key].trim() : ''
            if (value) cleaned[key] = value
          })
          return cleaned
        }

        const cleanedFrTranslations = cleanTranslations(frTranslations)
        const cleanedEnTranslations = cleanTranslations(enTranslations)

        // Prepare PDF files data
        const pdfFilesData = {}
        if (pdfFiles.statement) pdfFilesData.statement = pdfFiles.statement
        if (pdfFiles.solution) pdfFilesData.solution = pdfFiles.solution

        // Emit save event with all data
        emit('save', {
          resource: resourceData,
          frTranslations: cleanedFrTranslations,
          enTranslations: cleanedEnTranslations,
          pdfFiles: pdfFilesData
        })

      } catch (error) {
        // Handle submission errors - could add user notification here
      } finally {
        saving.value = false
      }
    }

    // ==========================================
    // WATCHERS
    // ==========================================

    // Clear video URL when video is disabled
    watch(() => formData.hasVideo, (newValue) => {
      if (!newValue) {
        formData.videoUrl = ''
      }
    })

    // ==========================================
    // LIFECYCLE
    // ==========================================

    onMounted(async () => {
      try {
        // Load existing resources for reference
        const result = await window.electronAPI.loadResources()
        if (result.success) {
          existingResources.value = result.data.resources || []
        }

        // Initialize form based on mode (create/edit)
        await initializeForm()
      } catch (error) {
        // Handle initialization errors - form will still be usable
      }
    })

    // ==========================================
    // RETURN REACTIVE REFERENCES
    // ==========================================

    return {
      // State
      saving,
      errors,
      formData,
      frTranslations,
      enTranslations,
      pdfFiles,
      existingResources,
      autoTranslateEnabled,
      translating,
      translationProgress,

      // Computed
      isFormValid,

      // Methods
      validateId,
      validateIdField,
      selectPdfFile,
      getFileName,
      handleSubmit,
      translateToEnglish
    }
  }
}