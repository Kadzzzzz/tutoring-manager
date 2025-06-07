// src/main/services/resourceParser.js
const { parse } = require('@babel/parser')
const traverse = require('@babel/traverse').default || require('@babel/traverse')
const t = require('@babel/types')

/**
 * Service de parsing des ressources existantes
 * Utilise l'AST de Babel pour extraire les données des fichiers
 */

/**
 * Parse une valeur de n'importe quel type
 */
function parseValue(node) {
  if (t.isStringLiteral(node)) {
    return node.value
  } else if (t.isNumericLiteral(node)) {
    return node.value
  } else if (t.isBooleanLiteral(node)) {
    return node.value
  } else if (t.isArrayExpression(node)) {
    return parseArrayElements(node.elements)
  } else if (t.isObjectExpression(node)) {
    return parseObjectExpression(node)
  } else if (t.isNullLiteral(node)) {
    return null
  } else if (node === undefined || node === null) {
    return undefined
  } else {
    // Pour les cas non gérés, retourner une représentation string
    return '[Unsupported value type]'
  }
}

/**
 * Parse les éléments d'un ArrayExpression
 */
function parseArrayElements(elements) {
  return elements.map(element => {
    if (t.isObjectExpression(element)) {
      return parseObjectExpression(element)
    }
    return parseValue(element)
  })
}

/**
 * Parse un ObjectExpression en objet JavaScript
 */
function parseObjectExpression(node) {
  if (!t.isObjectExpression(node)) {
    return parseValue(node)
  }

  const obj = {}
  
  for (const property of node.properties) {
    if (t.isObjectProperty(property)) {
      let key
      
      // Obtenir la clé
      if (t.isIdentifier(property.key)) {
        key = property.key.name
      } else if (t.isStringLiteral(property.key)) {
        key = property.key.value
      } else {
        continue // Ignorer les clés non supportées
      }

      // Obtenir la valeur
      obj[key] = parseValue(property.value)
    }
  }

  return obj
}

/**
 * Extrait le tableau resources du fichier App.vue
 */
function extractResourcesFromAppVue(appVueContent) {
  try {
    // Extraire la section <script setup>
    const scriptMatch = appVueContent.match(/<script setup>([\s\S]*?)<\/script>/)
    if (!scriptMatch) {
      throw new Error('Section <script setup> introuvable dans App.vue')
    }

    const scriptContent = scriptMatch[1]
    
    // Parser le JavaScript
    const ast = parse(scriptContent, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx']
    })

    let resources = []

    // Traverser l'AST pour trouver la déclaration const resources
    traverse(ast, {
      VariableDeclarator(path) {
        if (
          t.isIdentifier(path.node.id, { name: 'resources' }) &&
          t.isArrayExpression(path.node.init)
        ) {
          // Convertir les éléments du tableau en objets JavaScript
          resources = parseArrayElements(path.node.init.elements)
        }
      }
    })

    return resources
  } catch (error) {
    throw new Error(`Erreur lors de l'extraction des ressources: ${error.message}`)
  }
}

/**
 * Extrait les traductions du fichier translations.js
 */
function extractTranslationsFromFile(translationsContent) {
  try {
    // Supprimer l'export et ne garder que l'objet
    let jsContent = translationsContent.replace(/export\s+const\s+translations\s*=\s*/, 'const translations = ')

    // Ajouter le module.exports pour Node.js
    if (!jsContent.includes('module.exports')) {
      jsContent += '\nmodule.exports = { translations };'
    }

    // Parser le JavaScript en utilisant eval de manière contrôlée
    const module = { exports: {} }
    const requireFunc = () => ({}) // Mock require

    // Évaluer le code de manière sécurisée
    const func = new Function('module', 'exports', 'require', jsContent)
    func(module, module.exports, requireFunc)

    return module.exports.translations || null
  } catch (error) {
    // Fallback : essayer d'utiliser Babel
    try {
      const ast = parse(translationsContent, {
        sourceType: 'module',
        plugins: ['objectRestSpread']
      })

      let translations = null

      traverse(ast, {
        ExportNamedDeclaration(path) {
          if (path.node.declaration && t.isVariableDeclaration(path.node.declaration)) {
            const declarator = path.node.declaration.declarations[0]
            if (t.isIdentifier(declarator.id, { name: 'translations' })) {
              translations = parseObjectExpression(declarator.init)
            }
          }
        }
      })

      return translations
    } catch (babelError) {
      throw new Error(`Erreur lors de l'extraction des traductions: ${error.message}. Babel error: ${babelError.message}`)
    }
  }
}

/**
 * Trouve une ressource spécifique par ID
 */
function findResourceById(resources, resourceId) {
  return resources.find(resource => resource.id === resourceId)
}

/**
 * Trouve les traductions d'une ressource spécifique
 */
function findResourceTranslations(translations, subject, resourceId) {
  try {
    const frTranslations = translations?.fr?.resources?.exercises?.[subject]?.[resourceId]
    const enTranslations = translations?.en?.resources?.exercises?.[subject]?.[resourceId]
    
    return {
      fr: frTranslations || {},
      en: enTranslations || {}
    }
  } catch (error) {
    return { fr: {}, en: {} }
  }
}

/**
 * Valide qu'une ressource a tous les champs requis
 */
function validateResource(resource) {
  const requiredFields = ['id', 'subject', 'levelKey', 'typeKey', 'duration']
  const missingFields = requiredFields.filter(field => !resource[field])
  
  if (missingFields.length > 0) {
    throw new Error(`Champs manquants dans la ressource: ${missingFields.join(', ')}`)
  }

  // Valider les valeurs des enums
  const validSubjects = ['maths', 'physics', 'chemistry']
  const validLevels = ['terminale', 'prepa1', 'prepa2']
  const validTypes = ['exercise', 'course', 'method', 'interro']

  if (!validSubjects.includes(resource.subject)) {
    throw new Error(`Matière invalide: ${resource.subject}`)
  }

  if (!validLevels.includes(resource.levelKey)) {
    throw new Error(`Niveau invalide: ${resource.levelKey}`)
  }

  if (!validTypes.includes(resource.typeKey)) {
    throw new Error(`Type invalide: ${resource.typeKey}`)
  }

  return true
}

/**
 * Valide les traductions d'une ressource
 */
function validateResourceTranslations(translations) {
  if (!translations.fr?.title) {
    throw new Error('Titre français requis')
  }

  if (!translations.fr?.description) {
    throw new Error('Description française requise')
  }

  if (!translations.en?.title) {
    throw new Error('Titre anglais requis')
  }

  if (!translations.en?.description) {
    throw new Error('Description anglaise requise')
  }

  return true
}

/**
 * Génère un ID unique pour une nouvelle ressource
 */
function generateUniqueId(existingResources, baseId) {
  if (!existingResources.find(r => r.id === baseId)) {
    return baseId
  }

  let counter = 1
  let newId = `${baseId}${counter}`
  
  while (existingResources.find(r => r.id === newId)) {
    counter++
    newId = `${baseId}${counter}`
  }

  return newId
}

/**
 * Obtient des statistiques sur les ressources
 */
function getResourcesStats(resources) {
  const stats = {
    total: resources.length,
    bySubject: {},
    byLevel: {},
    byType: {},
    withVideo: 0,
    withPdfs: 0
  }

  resources.forEach(resource => {
    // Par matière
    stats.bySubject[resource.subject] = (stats.bySubject[resource.subject] || 0) + 1
    
    // Par niveau
    stats.byLevel[resource.levelKey] = (stats.byLevel[resource.levelKey] || 0) + 1
    
    // Par type
    stats.byType[resource.typeKey] = (stats.byType[resource.typeKey] || 0) + 1
    
    // Avec vidéo
    if (resource.hasVideo) {
      stats.withVideo++
    }
    
    // Avec PDFs
    if (resource.pdfStatement || resource.pdfSolution) {
      stats.withPdfs++
    }
  })

  return stats
}

module.exports = {
  extractResourcesFromAppVue,
  extractTranslationsFromFile,
  findResourceById,
  findResourceTranslations,
  validateResource,
  validateResourceTranslations,
  generateUniqueId,
  getResourcesStats
}