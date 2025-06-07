// src/renderer/main.js
const { createApp, ref, computed, onMounted } = Vue

// Import du composant ResourceForm (sera défini plus bas)
// const ResourceForm = window.ResourceForm

// Application Vue principale
const app = createApp({
  setup() {
    // === ÉTAT RÉACTIF ===

    // État général
    const loading = ref(false)
    const currentView = ref('list') // 'list', 'add', 'edit', 'stats'
    const notification = ref(null)

    // Données du projet
    const projectInfo = ref(null)
    const resources = ref([])
    const translations = ref({})
    const stats = ref(null)

    // Filtres et recherche
    const searchQuery = ref('')
    const filterSubject = ref('')

    // Édition de ressource
    const editingResource = ref(null)

    // Confirmation de suppression
    const deleteConfirm = ref(null)

    // === COMPUTED ===

    // Ressources filtrées
    const filteredResources = computed(() => {
      let filtered = resources.value

      // Filtre par matière
      if (filterSubject.value) {
        filtered = filtered.filter(r => r.subject === filterSubject.value)
      }

      // Filtre par recherche
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(r => {
          const title = getResourceTitle(r).toLowerCase()
          const description = getResourceDescription(r).toLowerCase()
          return (
            r.id.toLowerCase().includes(query) ||
            r.subject.toLowerCase().includes(query) ||
            title.includes(query) ||
            description.includes(query)
          )
        })
      }

      return filtered
    })

    // === MÉTHODES UTILITAIRES ===

    // Obtenir le nom d'une matière
    const getSubjectName = (subject) => {
      return window.appConstants?.SUBJECT_NAMES[subject] || subject
    }

    // Obtenir le nom d'un niveau
    const getLevelName = (level) => {
      return window.appConstants?.LEVEL_NAMES[level] || level
    }

    // Obtenir le nom d'un type
    const getTypeName = (type) => {
      return window.appConstants?.TYPE_NAMES[type] || type
    }

    // Obtenir le titre d'une ressource
    const getResourceTitle = (resource) => {
      try {
        return translations.value?.fr?.resources?.exercises?.[resource.subject]?.[resource.id]?.title || resource.id
      } catch (e) {
        return resource.id
      }
    }

    // Obtenir la description d'une ressource
    const getResourceDescription = (resource) => {
      try {
        return translations.value?.fr?.resources?.exercises?.[resource.subject]?.[resource.id]?.description || 'Pas de description'
      } catch (e) {
        return 'Pas de description'
      }
    }

    // === GESTION DES NOTIFICATIONS ===

    const showNotification = (message, type = 'info', duration = 5000) => {
      const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-triangle',
        warning: 'fas fa-exclamation-circle',
        info: 'fas fa-info-circle'
      }

      notification.value = {
        message,
        type,
        icon: icons[type] || icons.info
      }

      // Auto-masquer après la durée spécifiée
      if (duration > 0) {
        setTimeout(() => {
          notification.value = null
        }, duration)
      }
    }

    // === CHARGEMENT DES DONNÉES ===

    // Valider le projet web
    const validateProject = async () => {
      try {
        const result = await window.electronAPI.validateWebProject()
        if (!result.success) {
          showNotification(
            `Projet web introuvable: ${result.error}`,
            'error',
            0 // Pas d'auto-masquage
          )
          return false
        }
        return true
      } catch (error) {
        showNotification('Erreur lors de la validation du projet', 'error')
        return false
      }
    }

    // Charger les informations du projet
    const loadProjectInfo = async () => {
      try {
        const result = await window.electronAPI.getWebProjectInfo()
        if (result.success) {
          projectInfo.value = result.data
        }
      } catch (error) {
        console.error('Erreur lors du chargement des infos projet:', error)
      }
    }

    // Charger toutes les données
    const loadData = async () => {
      loading.value = true

      try {
        // Valider le projet
        const isValid = await validateProject()
        if (!isValid) {
          loading.value = false
          return
        }

        // Charger les infos du projet
        await loadProjectInfo()

        // Charger les ressources
        const result = await window.electronAPI.loadResources()
        if (result.success) {
          resources.value = result.data.resources
          translations.value = result.data.translations
          stats.value = result.data.stats

          console.log(`✅ ${resources.value.length} ressources chargées`)
          if (resources.value.length === 0) {
            currentView.value = 'add'
            showNotification('Aucune ressource trouvée. Ajoutez votre première ressource !', 'info')
          }
        } else {
          showNotification(`Erreur lors du chargement: ${result.error}`, 'error')
        }

      } catch (error) {
        showNotification('Erreur lors du chargement des données', 'error')
        console.error('Erreur:', error)
      } finally {
        loading.value = false
      }
    }

    // Actualiser les données
    const refreshData = async () => {
      await loadData()
      showNotification('Données actualisées', 'success')
    }

    // === GESTION DES RESSOURCES ===

    // Créer une nouvelle ressource
    const createNewResource = () => {
      editingResource.value = null
      currentView.value = 'add'
    }

    // Éditer une ressource existante
    const editResource = (resource) => {
      editingResource.value = { ...resource }
      currentView.value = 'edit'
    }

    // Annuler l'édition
    const cancelEdit = () => {
      editingResource.value = null
      currentView.value = 'list'
    }

    // Gérer la sauvegarde d'une ressource
    const handleSaveResource = async (formData) => {
      loading.value = true

      try {
        let result

        if (currentView.value === 'add') {
          // Ajouter une nouvelle ressource
          result = await window.electronAPI.addResource(
            formData.resource,
            formData.frTranslations,
            formData.enTranslations,
            formData.pdfFiles
          )
        } else {
          // Mettre à jour une ressource existante
          result = await window.electronAPI.updateResource(
            editingResource.value.id,
            formData.resource,
            formData.frTranslations,
            formData.enTranslations,
            formData.pdfFiles
          )
        }

        if (result.success) {
          showNotification(result.message, 'success')

          // Recharger les données
          await loadData()

          // Retourner à la liste
          currentView.value = 'list'
          editingResource.value = null

        } else {
          showNotification(`Erreur lors de la sauvegarde: ${result.error}`, 'error')
        }

      } catch (error) {
        showNotification('Erreur lors de la sauvegarde', 'error')
        console.error('Erreur sauvegarde:', error)
      } finally {
        loading.value = false
      }
    }

    // Demander confirmation de suppression
    const deleteResourceConfirm = (resource) => {
      deleteConfirm.value = resource
    }

    // Confirmer la suppression
    const confirmDelete = async () => {
      if (!deleteConfirm.value) return

      loading.value = true

      try {
        const resource = deleteConfirm.value
        const pdfPaths = {
          statement: resource.pdfStatement,
          solution: resource.pdfSolution
        }

        const result = await window.electronAPI.deleteResource(
          resource.id,
          resource.subject,
          pdfPaths
        )

        if (result.success) {
          showNotification(result.message, 'success')

          // Recharger les données
          await loadData()

        } else {
          showNotification(`Erreur lors de la suppression: ${result.error}`, 'error')
        }

      } catch (error) {
        showNotification('Erreur lors de la suppression', 'error')
        console.error('Erreur suppression:', error)
      } finally {
        loading.value = false
        deleteConfirm.value = null
      }
    }

    // === CYCLE DE VIE ===

    onMounted(async () => {
      console.log('🚀 Application Jeremy Admin démarrée')

      // Charger les données au démarrage
      await loadData()
    })

    // === RETOUR PUBLIC ===

    return {
      // État
      loading,
      currentView,
      notification,
      projectInfo,
      resources,
      translations,
      stats,
      searchQuery,
      filterSubject,
      editingResource,
      deleteConfirm,

      // Computed
      filteredResources,

      // Méthodes
      getSubjectName,
      getLevelName,
      getTypeName,
      getResourceTitle,
      getResourceDescription,
      refreshData,
      createNewResource,
      editResource,
      cancelEdit,
      handleSaveResource,
      deleteResourceConfirm,
      confirmDelete
    }
  }
})

// === CHARGEMENT DU COMPOSANT RESOURCE FORM ===
// Le composant est défini dans ResourceForm.vue et chargé via script

// Attendre que ResourceForm soit chargé
const waitForResourceForm = () => {
  return new Promise((resolve) => {
    const check = () => {
      if (window.ResourceForm) {
        resolve(window.ResourceForm)
      } else {
        setTimeout(check, 100)
      }
    }
    check()
  })
}

// Enregistrer le composant ResourceForm
waitForResourceForm().then((ResourceForm) => {
  app.component('resource-form', ResourceForm)
  console.log('✅ ResourceForm component enregistré')
})

// Monter l'application
app.mount('#app')

// Debug global
window.app = app
console.log('✅ Application Vue montée avec succès!')