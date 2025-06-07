// src/renderer/components/ResourceForm.vue
// Composant Vue pour le formulaire de ressource (sera utilisé côté renderer)

window.ResourceForm = {
  props: {
    resource: Object,
    isEditing: Boolean
  },
  emits: ['save', 'cancel'],

  template: `
    <div class="resource-form">
      <form @submit.prevent="handleSubmit" class="form">

        <!-- Section: Informations de base -->
        <div class="form-section">
          <h3 class="section-title">
            <i class="fas fa-info-circle"></i>
            Informations de base
          </h3>

          <div class="form-grid">
            <!-- ID -->
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
                @blur="validateId"
              >
              <span v-if="errors.id" class="error-message">{{ errors.id }}</span>
              <span v-else class="help-text">Utilisez uniquement lettres, chiffres et tirets</span>
            </div>

            <!-- Matière -->
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

            <!-- Niveau -->
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

            <!-- Durée -->
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

        <!-- Section: Vidéo -->
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

        <!-- Section: Documents PDF -->
        <div class="form-section">
          <h3 class="section-title">
            <i class="fas fa-file-pdf"></i>
            Documents PDF
          </h3>

          <div class="form-grid">
            <!-- PDF Énoncé -->
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

            <!-- PDF Correction -->
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

        <!-- Section: Traductions -->
        <div class="form-section">
          <h3 class="section-title">
            <i class="fas fa-language"></i>
            Traductions
          </h3>

          <!-- Français -->
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

          <!-- Anglais -->
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

        <!-- Actions -->
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

    // === ÉTAT RÉACTIF ===
    const saving = ref(false)
    const errors = reactive({})

    // Données du formulaire
    const formData = reactive({
      id: '',
      subject: '',
      levelKey: '',
      typeKey: '',
      duration: '',
      hasVideo: false,
      videoUrl: ''
    })

    // Traductions
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

    // Fichiers PDF sélectionnés
    const pdfFiles = reactive({
      statement: null,
      solution: null
    })

    // === COMPUTED ===
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

    // === MÉTHODES ===

    // Initialiser le formulaire
    const initializeForm = () => {
      if (props.resource) {
        // Mode édition - remplir avec les données existantes
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

        // Charger les traductions existantes si disponibles
        // TODO: Récupérer depuis les traductions chargées
      }
    }

    // Valider l'ID
    const validateId = async () => {
      const id = formData.id.trim()
      delete errors.id

      if (!id) {
        errors.id = 'L\'ID est requis'
        return
      }

      if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
        errors.id = 'L\'ID ne peut contenir que des lettres, chiffres, tirets et underscores'
        return
      }

      // Vérifier l'unicité uniquement si c'est un nouvel ID
      if (!props.isEditing || id !== props.resource?.id) {
        try {
          const result = await window.electronAPI.generateUniqueId(id, [])
          if (result.success && result.data !== id) {
            errors.id = `Un ID similaire existe déjà. Suggestion: ${result.data}`
          }
        } catch (error) {
          console.error('Erreur validation ID:', error)
        }
      }
    }

    // Sélectionner un fichier PDF
    const selectPdfFile = async (type) => {
      try {
        const title = type === 'statement' ? 'Sélectionner l\'énoncé PDF' : 'Sélectionner la correction PDF'
        const result = await window.electronAPI.selectPdfFile(title)

        if (result.success && !result.canceled) {
          pdfFiles[type] = result.filePath
        }
      } catch (error) {
        console.error('Erreur sélection fichier:', error)
      }
    }

    // Obtenir le nom d'un fichier
    const getFileName = (filePath) => {
      if (!filePath) return ''
      return filePath.split('/').pop() || filePath.split('\\').pop() || filePath
    }

    // Valider le formulaire
    const validateForm = () => {
      Object.keys(errors).forEach(key => delete errors[key])

      // Validation de base
      if (!formData.id) errors.id = 'L\'ID est requis'
      if (!formData.subject) errors.subject = 'La matière est requise'
      if (!formData.levelKey) errors.levelKey = 'Le niveau est requis'
      if (!formData.typeKey) errors.typeKey = 'Le type est requis'
      if (!formData.duration) errors.duration = 'La durée est requise'

      // Validation des traductions
      if (!frTranslations.title) errors.frTitle = 'Le titre français est requis'
      if (!frTranslations.description) errors.frDescription = 'La description française est requise'
      if (!enTranslations.title) errors.enTitle = 'Le titre anglais est requis'
      if (!enTranslations.description) errors.enDescription = 'La description anglaise est requise'

      return Object.keys(errors).length === 0
    }

    // Soumettre le formulaire
    const handleSubmit = async () => {
      if (!validateForm()) {
        return
      }

      saving.value = true

      try {
        // Préparer les données
        const resourceData = {
          id: formData.id.trim(),
          subject: formData.subject,
          levelKey: formData.levelKey,
          typeKey: formData.typeKey,
          duration: formData.duration.trim(),
          hasVideo: formData.hasVideo,
          videoUrl: formData.hasVideo ? formData.videoUrl.trim() : ''
        }

        // Nettoyer les traductions
        const cleanTranslations = (translations) => {
          const cleaned = {}
          Object.keys(translations).forEach(key => {
            const value = translations[key]?.trim()
            if (value) cleaned[key] = value
          })
          return cleaned
        }

        const cleanedFrTranslations = cleanTranslations(frTranslations)
        const cleanedEnTranslations = cleanTranslations(enTranslations)

        // Préparer les fichiers PDF
        const pdfFilesData = {}
        if (pdfFiles.statement) pdfFilesData.statement = pdfFiles.statement
        if (pdfFiles.solution) pdfFilesData.solution = pdfFiles.solution

        // Émettre l'événement de sauvegarde
        emit('save', {
          resource: resourceData,
          frTranslations: cleanedFrTranslations,
          enTranslations: cleanedEnTranslations,
          pdfFiles: pdfFilesData
        })

      } catch (error) {
        console.error('Erreur lors de la soumission:', error)
      } finally {
        saving.value = false
      }
    }

    // === WATCHERS ===
    watch(() => formData.hasVideo, (newValue) => {
      if (!newValue) {
        formData.videoUrl = ''
      }
    })

    // === CYCLE DE VIE ===
    onMounted(() => {
      initializeForm()
    })

    return {
      // État
      saving,
      errors,
      formData,
      frTranslations,
      enTranslations,
      pdfFiles,

      // Computed
      isFormValid,

      // Méthodes
      validateId,
      selectPdfFile,
      getFileName,
      handleSubmit
    }
  }
}

// Enregistrer le composant globalement
if (window.Vue && window.Vue.createApp) {
  // Le composant sera utilisé via la définition ci-dessus
  console.log('✅ ResourceForm component défini')
}