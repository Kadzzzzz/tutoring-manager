// src/main/services/codeGenerator.js
// 🔧 GÉNÉRATEUR DE CODE COMPLET AVEC TRADUCTION AUTOMATIQUE
const { parse } = require('@babel/parser')
const traverse = require('@babel/traverse').default || require('@babel/traverse')
const generate = require('@babel/generator').default || require('@babel/generator')
const t = require('@babel/types')
const prettier = require('prettier')

/**
 * Service de génération de code complet
 * Utilise l'AST de Babel pour modifier et générer le nouveau code
 * + Traduction automatique intégrée
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
 * Crée l'AST pour les traductions d'une ressource
 */
function createTranslationResourceAST(translations) {
  const properties = []

  // Nettoyer et ajouter les traductions
  const cleanedTranslations = {
    title: String(translations.title || ''),
    description: String(translations.description || ''),
    fullDescription: String(translations.fullDescription || ''),
    notes: String(translations.notes || '')
  }

  for (const [key, value] of Object.entries(cleanedTranslations)) {
    if (value !== undefined) {
      properties.push(
        t.objectProperty(
          t.identifier(key),
          t.stringLiteral(value)
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
 * 🎯 FONCTIONS AST POUR LES TRADUCTIONS
 */

/**
 * Parse le fichier translations.js et retourne l'AST
 */
function parseTranslationsFile(content) {
  try {
    // Extraire la section d'export
    const exportMatch = content.match(/export\s+const\s+translations\s*=\s*([\s\S]*?)(?:\n\s*$|$)/)
    if (!exportMatch) {
      throw new Error('Export const translations non trouvé')
    }

    const objectContent = exportMatch[1].trim()
    // Enlever le point-virgule final s'il existe
    const cleanContent = objectContent.replace(/;?\s*$/, '')

    // Parser avec Babel
    const ast = parse(`const translations = ${cleanContent}`, {
      sourceType: 'module',
      plugins: ['objectRestSpread']
    })

    return ast
  } catch (error) {
    throw new Error(`Erreur parsing translations.js: ${error.message}`)
  }
}

/**
 * Trouve et nettoie/crée la section exercises pour une langue et matière
 */
function findAndCleanExercisesSection(ast, lang, subject) {
  let exercisesSection = null

  traverse(ast, {
    VariableDeclarator(path) {
      if (t.isIdentifier(path.node.id, { name: 'translations' })) {
        const translationsObj = path.node.init

        if (t.isObjectExpression(translationsObj)) {
          // Trouver la langue (fr ou en)
          let langProperty = translationsObj.properties.find(prop =>
            t.isObjectProperty(prop) &&
            t.isIdentifier(prop.key, { name: lang })
          )

          if (!langProperty) {
            // Créer la langue si elle n'existe pas
            langProperty = t.objectProperty(
              t.identifier(lang),
              t.objectExpression([])
            )
            translationsObj.properties.push(langProperty)
          }

          if (t.isObjectExpression(langProperty.value)) {
            // Trouver ou créer resources
            let resourcesProperty = langProperty.value.properties.find(prop =>
              t.isObjectProperty(prop) &&
              t.isIdentifier(prop.key, { name: 'resources' })
            )

            if (!resourcesProperty) {
              resourcesProperty = t.objectProperty(
                t.identifier('resources'),
                t.objectExpression([])
              )
              langProperty.value.properties.push(resourcesProperty)
            }

            if (t.isObjectExpression(resourcesProperty.value)) {
              // Trouver ou créer exercises
              let exercisesProperty = resourcesProperty.value.properties.find(prop =>
                t.isObjectProperty(prop) &&
                t.isIdentifier(prop.key, { name: 'exercises' })
              )

              if (!exercisesProperty) {
                exercisesProperty = t.objectProperty(
                  t.identifier('exercises'),
                  t.objectExpression([])
                )
                resourcesProperty.value.properties.push(exercisesProperty)
              }

              if (t.isObjectExpression(exercisesProperty.value)) {
                // Trouver ou créer la matière
                let subjectProperty = exercisesProperty.value.properties.find(prop =>
                  t.isObjectProperty(prop) &&
                  t.isIdentifier(prop.key, { name: subject })
                )

                if (!subjectProperty) {
                  subjectProperty = t.objectProperty(
                    t.identifier(subject),
                    t.objectExpression([])
                  )
                  exercisesProperty.value.properties.push(subjectProperty)
                }

                // 🔧 NETTOYAGE AUTOMATIQUE DES STRUCTURES CORROMPUES
                if (t.isObjectExpression(subjectProperty.value)) {
                  // Nettoyer les ressources imbriquées incorrectement
                  const cleanedProperties = []

                  subjectProperty.value.properties.forEach(prop => {
                    if (t.isObjectProperty(prop) && t.isObjectExpression(prop.value)) {
                      // Vérifier si cette propriété contient des ressources imbriquées
                      const resourceProps = []
                      const nestedResources = []

                      prop.value.properties.forEach(innerProp => {
                        if (t.isObjectProperty(innerProp)) {
                          // Si c'est une propriété standard (title, description, etc.)
                          if (['title', 'description', 'fullDescription', 'notes'].includes(innerProp.key.name)) {
                            resourceProps.push(innerProp)
                          } else if (t.isObjectExpression(innerProp.value)) {
                            // Si c'est une ressource imbriquée, l'extraire
                            nestedResources.push(t.objectProperty(innerProp.key, innerProp.value))
                          }
                        }
                      })

                      // Reconstruire la propriété avec seulement les props standards
                      const cleanedResource = t.objectProperty(
                        prop.key,
                        t.objectExpression(resourceProps)
                      )
                      cleanedProperties.push(cleanedResource)

                      // Ajouter les ressources imbriquées au niveau correct
                      nestedResources.forEach(nested => {
                        cleanedProperties.push(nested)
                      })
                    } else {
                      cleanedProperties.push(prop)
                    }
                  })

                  // Remplacer les propriétés par la version nettoyée
                  subjectProperty.value.properties = cleanedProperties
                  exercisesSection = subjectProperty.value
                } else {
                  // Recréer la section si elle n'est pas un objet
                  subjectProperty.value = t.objectExpression([])
                  exercisesSection = subjectProperty.value
                }
              }
            }
          }
        }
      }
    }
  })

  return exercisesSection
}

/**
 * Ajoute ou met à jour une ressource dans l'AST des traductions
 */
function addOrUpdateResourceInAST(ast, lang, subject, resourceId, translations) {
  const exercisesSection = findAndCleanExercisesSection(ast, lang, subject)

  if (!exercisesSection) {
    throw new Error(`Impossible de trouver/créer la section ${lang}.resources.exercises.${subject}`)
  }

  // Chercher si la ressource existe déjà
  const existingResourceIndex = exercisesSection.properties.findIndex(prop =>
    t.isObjectProperty(prop) &&
    t.isIdentifier(prop.key, { name: resourceId })
  )

  const resourceAST = createTranslationResourceAST(translations)

  if (existingResourceIndex !== -1) {
    // Mettre à jour la ressource existante
    exercisesSection.properties[existingResourceIndex] = t.objectProperty(
      t.identifier(resourceId),
      resourceAST
    )
    console.log(`✅ [AST] Ressource ${resourceId} mise à jour dans ${lang}.${subject}`)
  } else {
    // Ajouter la nouvelle ressource
    exercisesSection.properties.push(
      t.objectProperty(
        t.identifier(resourceId),
        resourceAST
      )
    )
    console.log(`✅ [AST] Ressource ${resourceId} ajoutée dans ${lang}.${subject}`)
  }
}

/**
 * Supprime une ressource de l'AST des traductions
 */
function removeResourceFromAST(ast, lang, subject, resourceId) {
  const exercisesSection = findAndCleanExercisesSection(ast, lang, subject)

  if (!exercisesSection) {
    console.warn(`Section ${lang}.resources.exercises.${subject} non trouvée pour suppression`)
    return
  }

  // Filtrer pour supprimer la ressource
  const originalLength = exercisesSection.properties.length
  exercisesSection.properties = exercisesSection.properties.filter(prop =>
    !(t.isObjectProperty(prop) && t.isIdentifier(prop.key, { name: resourceId }))
  )

  if (exercisesSection.properties.length < originalLength) {
    console.log(`✅ [AST] Ressource ${resourceId} supprimée de ${lang}.${subject}`)
  } else {
    console.warn(`⚠️ [AST] Ressource ${resourceId} non trouvée dans ${lang}.${subject}`)
  }
}

/**
 * 🎯 FONCTIONS PRINCIPALES POUR APP.VUE
 */

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
 * 🚀 FONCTIONS AVEC AST POUR LES TRADUCTIONS
 */

/**
 * Ajoute les traductions pour une nouvelle ressource (VERSION AST CORRIGÉE)
 */
async function addTranslationsForResource(translationsContent, subject, resourceId, frTranslations, enTranslations) {
  try {
    console.log(`🎯 [AST] Ajout traductions ${subject}/${resourceId}`)

    // Parser le fichier avec AST
    const ast = parseTranslationsFile(translationsContent)

    // Ajouter les traductions française et anglaise
    addOrUpdateResourceInAST(ast, 'fr', subject, resourceId, frTranslations)
    addOrUpdateResourceInAST(ast, 'en', subject, resourceId, enTranslations)

    // Générer le nouveau code
    const { code } = generate(ast, {
      minified: false,
      concise: false,
      retainLines: false
    })

    // Formatter avec Prettier
    const formattedCode = await prettier.format(code, {
      parser: 'babel',
      semi: false,
      singleQuote: true,
      tabWidth: 2,
      useTabs: false,
      trailingComma: 'none',
      printWidth: 120
    })

    // Reconstruire le fichier complet avec export
    const newContent = `// src/i18n/translations.js
// 🌍 FICHIER CENTRAL DE TOUTES LES TRADUCTIONS

export const ${formattedCode.replace('const ', '').replace(/;\s*$/, '')}`

    console.log('✅ [AST] Traductions ajoutées avec succès')
    return newContent

  } catch (error) {
    console.error('❌ [AST] Erreur ajout traductions:', error.message)
    throw new Error(`Erreur lors de l'ajout des traductions: ${error.message}`)
  }
}

/**
 * Met à jour les traductions pour une ressource existante (VERSION AST CORRIGÉE)
 */
async function updateTranslationsForResource(translationsContent, subject, resourceId, frTranslations, enTranslations) {
  try {
    console.log(`🎯 [AST] Mise à jour traductions ${subject}/${resourceId}`)

    // Parser le fichier avec AST
    const ast = parseTranslationsFile(translationsContent)

    // Mettre à jour les traductions française et anglaise
    addOrUpdateResourceInAST(ast, 'fr', subject, resourceId, frTranslations)
    addOrUpdateResourceInAST(ast, 'en', subject, resourceId, enTranslations)

    // Générer le nouveau code
    const { code } = generate(ast, {
      minified: false,
      concise: false,
      retainLines: false
    })

    // Formatter avec Prettier
    const formattedCode = await prettier.format(code, {
      parser: 'babel',
      semi: false,
      singleQuote: true,
      tabWidth: 2,
      useTabs: false,
      trailingComma: 'none',
      printWidth: 120
    })

    // Reconstruire le fichier complet avec export
    const newContent = `// src/i18n/translations.js
// 🌍 FICHIER CENTRAL DE TOUTES LES TRADUCTIONS

export const ${formattedCode.replace('const ', '').replace(/;\s*$/, '')}`

    console.log('✅ [AST] Traductions mises à jour avec succès')
    return newContent

  } catch (error) {
    console.error('❌ [AST] Erreur mise à jour traductions:', error.message)
    throw new Error(`Erreur lors de la mise à jour des traductions: ${error.message}`)
  }
}

/**
 * Supprime les traductions pour une ressource (VERSION AST CORRIGÉE)
 */
async function removeTranslationsForResource(translationsContent, subject, resourceId) {
  try {
    console.log(`🎯 [AST] Suppression traductions ${subject}/${resourceId}`)

    // Parser le fichier avec AST
    const ast = parseTranslationsFile(translationsContent)

    // Supprimer les traductions française et anglaise
    removeResourceFromAST(ast, 'fr', subject, resourceId)
    removeResourceFromAST(ast, 'en', subject, resourceId)

    // Générer le nouveau code
    const { code } = generate(ast, {
      minified: false,
      concise: false,
      retainLines: false
    })

    // Formatter avec Prettier
    const formattedCode = await prettier.format(code, {
      parser: 'babel',
      semi: false,
      singleQuote: true,
      tabWidth: 2,
      useTabs: false,
      trailingComma: 'none',
      printWidth: 120
    })

    // Reconstruire le fichier complet avec export
    const newContent = `// src/i18n/translations.js
// 🌍 FICHIER CENTRAL DE TOUTES LES TRADUCTIONS

export const ${formattedCode.replace('const ', '').replace(/;\s*$/, '')}`

    console.log('✅ [AST] Traductions supprimées avec succès')
    return newContent

  } catch (error) {
    console.error('❌ [AST] Erreur suppression traductions:', error.message)
    throw new Error(`Erreur lors de la suppression des traductions: ${error.message}`)
  }
}

/**
 * 🌐 FONCTIONS DE TRADUCTION AUTOMATIQUE
 */

/**
 * Service de traduction simple pour intégration
 */
async function translateText(text, fromLang = 'fr', toLang = 'en') {
  try {
    // Utilise LibreTranslate par défaut
    const response = await fetch('https://libretranslate.de/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: fromLang,
        target: toLang,
        format: 'text'
      })
    })

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`)
    }

    const result = await response.json()
    return result.translatedText || text
  } catch (error) {
    console.error('Translation error:', error)
    return text // Retourner le texte original en cas d'erreur
  }
}

/**
 * Ajoute une ressource avec traduction automatique
 */
async function addResourceWithAutoTranslation(translationsContent, subject, resourceId, frTranslations, options = {}) {
  try {
    console.log(`🌐 [AUTO] Traduction automatique activée pour ${subject}/${resourceId}`)

    let enTranslations = {}

    if (options.enableAutoTranslation) {
      // Traduire chaque champ
      const fieldsToTranslate = ['title', 'description', 'fullDescription', 'notes']

      for (const field of fieldsToTranslate) {
        if (frTranslations[field] && frTranslations[field].trim()) {
          console.log(`🔄 Traduction de ${field}...`)
          enTranslations[field] = await translateText(frTranslations[field])

          // Petit délai pour éviter de surcharger l'API
          await new Promise(resolve => setTimeout(resolve, 500))
        } else {
          enTranslations[field] = frTranslations[field] || ''
        }
      }

      console.log('✅ [AUTO] Traduction automatique terminée')
    } else {
      // Utiliser les traductions manuelles fournies
      enTranslations = options.enTranslations || frTranslations
    }

    // Ajouter les traductions avec la fonction AST existante
    return await addTranslationsForResource(translationsContent, subject, resourceId, frTranslations, enTranslations)

  } catch (error) {
    console.error('❌ [AUTO] Erreur traduction automatique:', error.message)
    // En cas d'erreur, utiliser les traductions françaises pour l'anglais
    return await addTranslationsForResource(translationsContent, subject, resourceId, frTranslations, frTranslations)
  }
}

module.exports = {
  addResourceToAppVue,
  updateResourceInAppVue,
  removeResourceFromAppVue,
  addTranslationsForResource,
  updateTranslationsForResource,
  removeTranslationsForResource,
  addResourceWithAutoTranslation,
  translateText
}