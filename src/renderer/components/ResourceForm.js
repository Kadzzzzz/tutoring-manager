// src/renderer/components/ResourceForm.js
// Composant Vue pour le formulaire de ressource avec traduction automatique

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
                @blur="validateIdField"
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

        <!-- SECTION: TRADUCTION AUTOMATIQUE -->
        <div class="form-section translation-section">
          <h3 class="section-title" style="color: #0369a1;">
            <i class="fas fa-globe"></i>
            Traduction automatique
          </h3>
          
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="autoTranslateEnabled" class="form-checkbox">
              <span class="checkbox-custom"></span>
              Traduire automatiquement FR → EN
            </label>
            <span class="help-text">Utilise LibreTranslate ou MyMemory (services gratuits)</span>
          </div>

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

            <!-- Barre de progression -->
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
              <strong>⚠️ Important :</strong> Remplissez d'abord la matière, l'ID, et au minimum le titre et la description français.
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
    const existingResources = ref([])

    // État de la traduction automatique
    const autoTranslateEnabled = ref(false)
    const translating = ref(false)
    const translationProgress = reactive({
      message: '',
      percentage: 0,
      isVisible: false
    })

    // Données du formulaire
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

    /**
     * TRADUCTION AUTOMATIQUE
     */
    const translateToEnglish = async () => {
      // Validation préalable
      if (!frTranslations.title || !frTranslations.title.trim() ||
          !frTranslations.description || !frTranslations.description.trim()) {
        alert('⚠️ Remplissez au moins le titre et la description français avant de traduire')
        return
      }

      if (!formData.subject || !formData.id) {
        alert('⚠️ Veuillez d\'abord remplir la matière et l\'ID de la ressource')
        return
      }

      translating.value = true
      translationProgress.isVisible = true
      translationProgress.message = 'Initialisation...'
      translationProgress.percentage = 0

      try {
        console.log('🌍 Début de la traduction automatique...')

        // 1. Test de connectivité des services
        console.log('🧪 Test des services de traduction...')
        translationProgress.message = 'Test des services de traduction...'
        const serviceTest = await window.electronAPI.testTranslationServices()

        if (!serviceTest.success) {
          throw new Error('Services de traduction indisponibles')
        }

        console.log('✅ Services disponibles:', serviceTest.data)

        // 2. Choisir le meilleur service disponible
        let selectedService = 'libretranslate'
        if (serviceTest.data.libretranslate && serviceTest.data.libretranslate.status !== 'ok' &&
            serviceTest.data.mymemory && serviceTest.data.mymemory.status === 'ok') {
          selectedService = 'mymemory'
        }

        console.log('🎯 Service sélectionné:', selectedService)
        translationProgress.message = 'Service sélectionné: ' + selectedService
        translationProgress.percentage = 10

        // 3. Préparer les traductions françaises
        const frData = {
          title: frTranslations.title.trim(),
          description: frTranslations.description.trim(),
          fullDescription: frTranslations.fullDescription ? frTranslations.fullDescription.trim() : '',
          notes: frTranslations.notes ? frTranslations.notes.trim() : ''
        }

        // 4. Écouter la progression
        window.electronAPI.onTranslationProgress((progress) => {
          translationProgress.message = progress.message
          translationProgress.percentage = 10 + (progress.percentage * 0.8) // 10% déjà fait, 80% pour la traduction
          console.log('📊 ' + progress.message + ' (' + progress.percentage + '%)')
        })

        // 5. Lancer la traduction automatique
        console.log('🚀 Lancement de la traduction...')
        const result = await window.electronAPI.translateResourceAuto({
          subject: formData.subject,
          resourceId: formData.id,
          frTranslations: frData,
          options: {
            service: selectedService,
            googleApiKey: null
          }
        })

        // 6. Traiter le résultat
        if (result.success) {
          console.log('✅ Traduction réussie:', result.data)

          translationProgress.message = 'Application des traductions...'
          translationProgress.percentage = 95

          // Appliquer les traductions anglaises dans le formulaire
          const translatedData = result.data.enTranslations

          Object.assign(enTranslations, {
            title: translatedData.title || '',
            description: translatedData.description || '',
            fullDescription: translatedData.fullDescription || '',
            notes: translatedData.notes || ''
          })

          // Force la réactivité
          await Vue.nextTick()

          translationProgress.message = 'Terminé !'
          translationProgress.percentage = 100

          // Notification de succès
          setTimeout(() => {
            alert('🎉 Traduction automatique terminée avec succès !\n\n' +
                  'Les traductions anglaises ont été générées et sauvegardées.')
          }, 500)

          console.log('🎯 Traductions appliquées dans le formulaire')

        } else {
          throw new Error(result.error || 'Traduction échouée')
        }

      } catch (error) {
        console.error('❌ Erreur traduction automatique:', error)

        // Messages d'erreur plus spécifiques
        let errorMessage = '❌ Erreur de traduction: '

        if (error.message.includes('indisponibles')) {
          errorMessage += 'Les services de traduction ne sont pas accessibles. Vérifiez votre connexion internet.'
        } else if (error.message.includes('API')) {
          errorMessage += 'Problème avec l\'API de traduction. Réessayez dans quelques minutes.'
        } else {
          errorMessage += error.message
        }

        alert(errorMessage)

      } finally {
        translating.value = false

        // Masquer la progression après un délai
        setTimeout(() => {
          translationProgress.isVisible = false
          translationProgress.message = ''
          translationProgress.percentage = 0
        }, 2000)

        // Nettoyer les listeners
        window.electronAPI.removeTranslationProgressListener()

        console.log('🔄 Traduction terminée (cleanup effectué)')
      }
    }

    /**
     * Valide et nettoie un ID de ressource
     */
    const validateId = (id) => {
      if (!id || typeof id !== 'string') {
        return ''
      }

      return id
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .replace(/^-+|-+$/g, '')
        .substring(0, 50)
    }

    /**
     * Valide le champ ID
     */
    const validateIdField = () => {
      if (formData.id) {
        formData.id = validateId(formData.id)
      }
    }

    /**
     * Initialise le formulaire en mode édition ou création
     */
    const initializeForm = async () => {
      if (props.resource) {
        console.log('🔧 Mode édition - Initialisation du formulaire')

        // Mode édition - remplir avec les données de base
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

        // Charger les traductions via l'API
        try {
          console.log('📖 Chargement des traductions depuis l\'API...')

          const translationsResult = await window.electronAPI.getResourceTranslations({
            subject: props.resource.subject,
            resourceId: props.resource.id
          })

          if (translationsResult.success && translationsResult.data) {
            console.log('✅ Traductions chargées:', translationsResult.data)

            // Appliquer les traductions françaises
            if (translationsResult.data.fr) {
              Object.assign(frTranslations, {
                title: translationsResult.data.fr.title || '',
                description: translationsResult.data.fr.description || '',
                fullDescription: translationsResult.data.fr.fullDescription || '',
                notes: translationsResult.data.fr.notes || ''
              })
            }

            // Appliquer les traductions anglaises
            if (translationsResult.data.en) {
              Object.assign(enTranslations, {
                title: translationsResult.data.en.title || '',
                description: translationsResult.data.en.description || '',
                fullDescription: translationsResult.data.en.fullDescription || '',
                notes: translationsResult.data.en.notes || ''
              })
            }

            await Vue.nextTick()
            console.log('🎯 Formulaire prêt avec traductions')

          } else {
            console.warn('⚠️ Aucune traduction trouvée')
            // Initialiser avec des valeurs vides
            Object.assign(frTranslations, { title: '', description: '', fullDescription: '', notes: '' })
            Object.assign(enTranslations, { title: '', description: '', fullDescription: '', notes: '' })
          }

        } catch (error) {
          console.error('❌ Erreur lors du chargement des traductions:', error)
          // En cas d'erreur, initialiser avec des valeurs vides
          Object.assign(frTranslations, { title: '', description: '', fullDescription: '', notes: '' })
          Object.assign(enTranslations, { title: '', description: '', fullDescription: '', notes: '' })
        }

      } else {
        // Mode création - formulaire vide
        console.log('➕ Mode création - nouveau formulaire')

        Object.keys(formData).forEach(key => {
          formData[key] = key === 'hasVideo' ? false : ''
        })

        Object.keys(frTranslations).forEach(key => { frTranslations[key] = '' })
        Object.keys(enTranslations).forEach(key => { enTranslations[key] = '' })
      }
    }

    // Sélectionner un fichier PDF
    const selectPdfFile = async (type) => {
      try {
        const title = type === 'statement' ? 'Sélectionner l\'énoncé PDF' : 'Sélectionner la correction PDF'
        const result = await window.electronAPI.selectPdfFile(title)

        if (result.success && !result.canceled) {
          pdfFiles[type] = result.filePath
          console.log('PDF ' + type + ' sélectionné:', result.filePath)
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

      if (!formData.id.trim()) errors.id = 'L\'ID est requis'
      if (!formData.subject) errors.subject = 'La matière est requise'
      if (!formData.levelKey) errors.levelKey = 'Le niveau est requis'
      if (!formData.typeKey) errors.typeKey = 'Le type est requis'
      if (!formData.duration.trim()) errors.duration = 'La durée est requise'

      if (!frTranslations.title.trim()) errors.frTitle = 'Le titre français est requis'
      if (!frTranslations.description.trim()) errors.frDescription = 'La description française est requise'
      if (!enTranslations.title.trim()) errors.enTitle = 'Le titre anglais est requis'
      if (!enTranslations.description.trim()) errors.enDescription = 'La description anglaise est requise'

      return Object.keys(errors).length === 0
    }

    // Soumettre le formulaire
    const handleSubmit = async () => {
      if (!validateForm()) {
        console.log('Validation échouée:', errors)
        return
      }

      saving.value = true

      try {
        const resourceData = {
          id: formData.id.trim(),
          subject: formData.subject,
          levelKey: formData.levelKey,
          typeKey: formData.typeKey,
          duration: formData.duration.trim(),
          hasVideo: formData.hasVideo,
          videoUrl: formData.hasVideo ? formData.videoUrl.trim() : ''
        }

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

        const pdfFilesData = {}
        if (pdfFiles.statement) pdfFilesData.statement = pdfFiles.statement
        if (pdfFiles.solution) pdfFilesData.solution = pdfFiles.solution

        console.log('Soumission du formulaire:', {
          resource: resourceData,
          frTranslations: cleanedFrTranslations,
          enTranslations: cleanedEnTranslations,
          pdfFiles: pdfFilesData
        })

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
    onMounted(async () => {
      console.log('🔧 ResourceForm monté - Initialisation...')

      try {
        const result = await window.electronAPI.loadResources()
        if (result.success) {
          existingResources.value = result.data.resources || []
          console.log('📚 Ressources existantes chargées:', existingResources.value.length)
        }

        await initializeForm()
        console.log('✅ ResourceForm initialisé')
      } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error)
      }
    })

    return {
      // État
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

      // Méthodes
      validateId,
      validateIdField,
      selectPdfFile,
      getFileName,
      handleSubmit,
      translateToEnglish
    }
  }
}

console.log('✅ ResourceForm component défini avec traduction automatique');