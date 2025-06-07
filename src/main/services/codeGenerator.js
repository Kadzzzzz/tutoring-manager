// src/main/services/codeGenerator.js
const { parse } = require('@babel/parser')
const traverse = require('@babel/traverse').default || require('@babel/traverse')
const generate = require('@babel/generator').default || require('@babel/generator')
const t = require('@babel/types')
const prettier = require('prettier')

/**
 * Service de génération de code
 * Utilise l'AST de Babel pour modifier et générer le nouveau code
 */

/**
 * Crée l'AST pour une valeur
 */
function createValueAST(value) {
  if (typeof value === 'string') {
    return t.stringLiteral(value)
  } else if (typeof value === 'number') {
    return t.numericLiteral(value)
  } else if (typeof value === 'boolean') {
    return t.booleanLiteral(value)
  } else if (Array.isArray(value)) {
    return t.arrayExpression(value.map(item => createValueAST(item)))
  } else if (typeof value === 'object' && value !== null) {
    const properties = Object.entries(value).map(([key, val]) =>
      t.objectProperty(t.identifier(key), createValueAST(val))
    )
    return t.objectExpression(properties)
  } else {
    return t.nullLiteral()
  }
}

/**
 * Crée l'AST pour une ressource
 */
function createResourceAST(resource) {
  const properties = []

  // Ajouter toutes les propriétés de la ressource
  for (const [key, value] of Object.entries(resource)) {
    if (value !== undefined && value !== null && value !== '') {
      properties.push(
        t.objectProperty(
          t.identifier(key),
          createValueAST(value)
        )
      )
    }
  }

  return t.objectExpression(properties)
}

/**
 * Trouve l'index d'une ressource dans le tableau AST
 */
function findResourceIndexInArray(arrayExpression, resourceId) {
  return arrayExpression.elements.findIndex(element => {
    if (t.isObjectExpression(element)) {
      const idProperty = element.properties.find(prop =>
        t.isObjectProperty(prop) &&
        t.isIdentifier(prop.key, { name: 'id' }) &&
        t.isStringLiteral(prop.value, { value: resourceId })
      )
      return !!idProperty
    }
    return false
  })
}

/**
 * Ajoute une nouvelle ressource au tableau resources dans App.vue
 */
async function addResourceToAppVue(appVueContent, newResource) {
  try {
    // Extraire la section script
    const scriptMatch = appVueContent.match(/<script setup>([\s\S]*?)<\/script>/)
    if (!scriptMatch) {
      throw new Error('Section <script setup> introuvable')
    }

    const scriptContent = scriptMatch[1]
    const ast = parse(scriptContent, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx']
    })

    // Trouver et modifier le tableau resources
    traverse(ast, {
      VariableDeclarator(path) {
        if (
          t.isIdentifier(path.node.id, { name: 'resources' }) &&
          t.isArrayExpression(path.node.init)
        ) {
          // Créer l'AST pour la nouvelle ressource
          const resourceAST = createResourceAST(newResource)

          // Ajouter au tableau
          path.node.init.elements.push(resourceAST)
        }
      }
    })

    // Générer le nouveau code
    const { code } = generate(ast)

    // Formatter avec Prettier
    const formattedScript = await prettier.format(code, {
      parser: 'babel',
      semi: false,
      singleQuote: true,
      tabWidth: 2,
      useTabs: false,
      trailingComma: 'none'
    })

    // Remplacer dans le contenu complet
    const newAppVueContent = appVueContent.replace(
      /<script setup>([\s\S]*?)<\/script>/,
      `<script setup>${formattedScript}</script>`
    )

    return newAppVueContent
  } catch (error) {
    throw new Error(`Erreur lors de l'ajout de la ressource: ${error.message}`)
  }
}

/**
 * Met à jour une ressource existante dans App.vue
 */
async function updateResourceInAppVue(appVueContent, resourceId, updatedResource) {
  try {
    const scriptMatch = appVueContent.match(/<script setup>([\s\S]*?)<\/script>/)
    if (!scriptMatch) {
      throw new Error('Section <script setup> introuvable')
    }

    const scriptContent = scriptMatch[1]
    const ast = parse(scriptContent, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx']
    })

    // Trouver et modifier la ressource
    traverse(ast, {
      VariableDeclarator(path) {
        if (
          t.isIdentifier(path.node.id, { name: 'resources' }) &&
          t.isArrayExpression(path.node.init)
        ) {
          // Trouver l'index de la ressource à modifier
          const resourceIndex = findResourceIndexInArray(path.node.init, resourceId)

          if (resourceIndex !== -1) {
            // Remplacer par la nouvelle ressource
            const resourceAST = createResourceAST(updatedResource)
            path.node.init.elements[resourceIndex] = resourceAST
          } else {
            throw new Error(`Ressource avec l'ID ${resourceId} introuvable`)
          }
        }
      }
    })

    // Générer et formatter le nouveau code
    const { code } = generate(ast)
    const formattedScript = await prettier.format(code, {
      parser: 'babel',
      semi: false,
      singleQuote: true,
      tabWidth: 2,
      useTabs: false,
      trailingComma: 'none'
    })

    const newAppVueContent = appVueContent.replace(
      /<script setup>([\s\S]*?)<\/script>/,
      `<script setup>${formattedScript}</script>`
    )

    return newAppVueContent
  } catch (error) {
    throw new Error(`Erreur lors de la mise à jour de la ressource: ${error.message}`)
  }
}

/**
 * Supprime une ressource du tableau resources dans App.vue
 */
async function removeResourceFromAppVue(appVueContent, resourceId) {
  try {
    const scriptMatch = appVueContent.match(/<script setup>([\s\S]*?)<\/script>/)
    if (!scriptMatch) {
      throw new Error('Section <script setup> introuvable')
    }

    const scriptContent = scriptMatch[1]
    const ast = parse(scriptContent, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx']
    })

    // Trouver et supprimer la ressource
    traverse(ast, {
      VariableDeclarator(path) {
        if (
          t.isIdentifier(path.node.id, { name: 'resources' }) &&
          t.isArrayExpression(path.node.init)
        ) {
          // Filtrer les éléments pour supprimer la ressource
          path.node.init.elements = path.node.init.elements.filter(element => {
            if (t.isObjectExpression(element)) {
              const idProperty = element.properties.find(prop =>
                t.isObjectProperty(prop) &&
                t.isIdentifier(prop.key, { name: 'id' }) &&
                t.isStringLiteral(prop.value, { value: resourceId })
              )
              return !idProperty // Garder si pas trouvé (donc supprimer si trouvé)
            }
            return true
          })
        }
      }
    })

    // Générer et formatter le nouveau code
    const { code } = generate(ast)
    const formattedScript = await prettier.format(code, {
      parser: 'babel',
      semi: false,
      singleQuote: true,
      tabWidth: 2,
      useTabs: false,
      trailingComma: 'none'
    })

    const newAppVueContent = appVueContent.replace(
      /<script setup>([\s\S]*?)<\/script>/,
      `<script setup>${formattedScript}</script>`
    )

    return newAppVueContent
  } catch (error) {
    throw new Error(`Erreur lors de la suppression de la ressource: ${error.message}`)
  }
}

/**
 * Ajoute les traductions pour une nouvelle ressource
 */
async function addTranslationsForResource(translationsContent, subject, resourceId, frTranslations, enTranslations) {
  try {
    // Nettoyer les traductions
    const cleanTranslations = (trans) => {
      const cleaned = {}
      for (const [key, value] of Object.entries(trans)) {
        cleaned[key] = String(value || '').replace(/"/g, '\\"').replace(/\n/g, '\\n')
      }
      return cleaned
    }

    const cleanFr = cleanTranslations(frTranslations)
    const cleanEn = cleanTranslations(enTranslations)

    // Créer l'entrée de traduction
    const translationEntry = `          ${resourceId}: {
            title: "${cleanFr.title}",
            description: "${cleanFr.description}",
            fullDescription: "${cleanFr.fullDescription}",
            notes: "${cleanFr.notes}"
          }`

    const translationEntryEn = `          ${resourceId}: {
            title: "${cleanTranslations(enTranslations).title}",
            description: "${cleanTranslations(enTranslations).description}",
            fullDescription: "${cleanTranslations(enTranslations).fullDescription}",
            notes: "${cleanTranslations(enTranslations).notes}"
          }`

    let newContent = translationsContent

    // Supprimer l'ancienne version si elle existe
    newContent = newContent.replace(new RegExp(`\\s*,?\\s*${resourceId}:\\s*{[^}]*}`, 'g'), '')

    // Pattern pour la section française exercises > maths (première occurrence)
    const frMathsPattern = new RegExp(`(exercises:\\s*{[\\s\\S]*?${subject}:\\s*{)([\\s\\S]*?)(\\s*}[\\s\\S]*?,\\s*${subject === 'maths' ? 'physics' : subject === 'physics' ? 'chemistry' : 'chemistry'}|\\s*}[\\s\\S]*?}[\\s\\S]*?},)`)

    if (frMathsPattern.test(newContent)) {
      newContent = newContent.replace(frMathsPattern, (match, before, content, after) => {
        // Si la section contient déjà des ressources, ajouter avec une virgule
        if (content.trim() && !content.trim().endsWith(',')) {
          return `${before}${content},\n${translationEntry}\n${after}`
        } else if (content.trim()) {
          return `${before}${content}\n${translationEntry}\n${after}`
        } else {
          // Section vide
          return `${before}\n${translationEntry}\n${after}`
        }
      })
      console.log('✅ Traduction française ajoutée')
    } else {
      console.warn(`❌ Section française ${subject} non trouvée`)
    }

    // Pattern pour la section anglaise (deuxième occurrence des exercises)
    let exercisesCount = 0
    const enPattern = new RegExp(`(exercises:\\s*{[\\s\\S]*?${subject}:\\s*{)([\\s\\S]*?)(\\s*}[\\s\\S]*?)(?=\\s*,\\s*(?:physics|chemistry|maths):|\\s*}[\\s\\S]*?}[\\s\\S]*?}[\\s\\S]*?$)`, 'g')

    newContent = newContent.replace(enPattern, (match, before, content, after) => {
      exercisesCount++
      // Deuxième occurrence = section anglaise
      if (exercisesCount === 2) {
        if (content.trim() && !content.trim().endsWith(',')) {
          return `${before}${content},\n${translationEntryEn}\n${after}`
        } else if (content.trim()) {
          return `${before}${content}\n${translationEntryEn}\n${after}`
        } else {
          return `${before}\n${translationEntryEn}\n${after}`
        }
      }
      return match
    })

    if (exercisesCount >= 2) {
      console.log('✅ Traduction anglaise ajoutée')
    } else {
      console.warn(`❌ Section anglaise ${subject} non trouvée`)
    }

    return newContent
  } catch (error) {
    throw new Error(`Erreur lors de l'ajout des traductions: ${error.message}`)
  }
}

/**
 * Met à jour les traductions pour une ressource existante
 */
async function updateTranslationsForResource(translationsContent, subject, resourceId, frTranslations, enTranslations) {
  try {
    // D'abord supprimer l'ancienne version
    let newContent = await removeTranslationsForResource(translationsContent, subject, resourceId)
    // Puis ajouter la nouvelle version
    return await addTranslationsForResource(newContent, subject, resourceId, frTranslations, enTranslations)
  } catch (error) {
    throw new Error(`Erreur lors de la mise à jour des traductions: ${error.message}`)
  }
}

/**
 * Supprime les traductions pour une ressource
 */
async function removeTranslationsForResource(translationsContent, subject, resourceId) {
  try {
    // Pattern pour supprimer une ressource spécifique dans une section
    const resourcePattern = new RegExp(`\\s*,?\\s*${resourceId}:\\s*{[^}]*}\\s*,?`, 'g')

    let newContent = translationsContent.replace(resourcePattern, '')

    // Nettoyer les virgules en trop
    newContent = newContent.replace(/,(\s*,)+/g, ',') // Virgules multiples
    newContent = newContent.replace(/,(\s*})/g, '$1') // Virgule avant accolade fermante
    newContent = newContent.replace(/{\s*,/g, '{') // Virgule après accolade ouvrante

    return newContent
  } catch (error) {
    throw new Error(`Erreur lors de la suppression des traductions: ${error.message}`)
  }
}

module.exports = {
  addResourceToAppVue,
  updateResourceInAppVue,
  removeResourceFromAppVue,
  addTranslationsForResource,
  updateTranslationsForResource,
  removeTranslationsForResource
}