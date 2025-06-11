// src/main/services/codeGenerator.js
// Complete code generator service with automatic translation integration
// Uses Babel AST for parsing and generating JavaScript/Vue code

const { parse } = require('@babel/parser')
const traverse = require('@babel/traverse').default || require('@babel/traverse')
const generate = require('@babel/generator').default || require('@babel/generator')
const t = require('@babel/types')
const prettier = require('prettier')

/**
 * Code generation service that uses Babel AST to modify and generate new code
 * Supports automatic translation integration for resource management
 */

// ==========================================
// AST UTILITY FUNCTIONS
// ==========================================

/**
 * Creates AST node for any JavaScript value
 * @param {*} value - Value to convert to AST
 * @returns {Object} Babel AST node
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
 * Creates AST node for a resource object
 * @param {Object} resource - Resource object to convert
 * @returns {Object} Babel AST object expression
 */
function createResourceAST(resource) {
  const properties = []

  // Add all non-empty resource properties
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
 * Creates AST node for translation resource object
 * @param {Object} translations - Translation object to convert
 * @returns {Object} Babel AST object expression
 */
function createTranslationResourceAST(translations) {
  const properties = []

  // Clean and standardize translations
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
 * Finds the index of a resource in an array AST expression
 * @param {Object} arrayExpression - Babel array expression AST
 * @param {string} resourceId - Resource ID to find
 * @returns {number} Index of resource or -1 if not found
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

// ==========================================
// TRANSLATIONS FILE AST FUNCTIONS
// ==========================================

/**
 * Parses translations.js file and returns AST
 * @param {string} content - File content to parse
 * @returns {Object} Babel AST
 * @throws {Error} If parsing fails
 */
function parseTranslationsFile(content) {
  try {
    // Extract export section
    const exportMatch = content.match(/export\s+const\s+translations\s*=\s*([\s\S]*?)(?:\n\s*$|$)/)
    if (!exportMatch) {
      throw new Error('Export const translations not found')
    }

    const objectContent = exportMatch[1].trim()
    // Remove trailing semicolon if present
    const cleanContent = objectContent.replace(/;?\s*$/, '')

    // Parse with Babel
    const ast = parse(`const translations = ${cleanContent}`, {
      sourceType: 'module',
      plugins: ['objectRestSpread']
    })

    return ast
  } catch (error) {
    throw new Error(`Error parsing translations.js: ${error.message}`)
  }
}

/**
 * Finds and cleans/creates the exercises section for a language and subject
 * @param {Object} ast - Babel AST
 * @param {string} lang - Language code ('fr' or 'en')
 * @param {string} subject - Subject key
 * @returns {Object|null} Exercises section AST node
 */
function findAndCleanExercisesSection(ast, lang, subject) {
  let exercisesSection = null

  traverse(ast, {
    VariableDeclarator(path) {
      if (t.isIdentifier(path.node.id, { name: 'translations' })) {
        const translationsObj = path.node.init

        if (t.isObjectExpression(translationsObj)) {
          // Find language (fr or en)
          let langProperty = translationsObj.properties.find(prop =>
            t.isObjectProperty(prop) &&
            t.isIdentifier(prop.key, { name: lang })
          )

          if (!langProperty) {
            // Create language if it doesn't exist
            langProperty = t.objectProperty(
              t.identifier(lang),
              t.objectExpression([])
            )
            translationsObj.properties.push(langProperty)
          }

          if (t.isObjectExpression(langProperty.value)) {
            // Find or create resources
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
              // Find or create exercises
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
                // Find or create subject
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

                // Automatic cleanup of corrupted nested structures
                if (t.isObjectExpression(subjectProperty.value)) {
                  // Clean up incorrectly nested resources
                  const cleanedProperties = []

                  subjectProperty.value.properties.forEach(prop => {
                    if (t.isObjectProperty(prop) && t.isObjectExpression(prop.value)) {
                      // Check if this property contains nested resources
                      const resourceProps = []
                      const nestedResources = []

                      prop.value.properties.forEach(innerProp => {
                        if (t.isObjectProperty(innerProp)) {
                          // If it's a standard property (title, description, etc.)
                          if (['title', 'description', 'fullDescription', 'notes'].includes(innerProp.key.name)) {
                            resourceProps.push(innerProp)
                          } else if (t.isObjectExpression(innerProp.value)) {
                            // If it's a nested resource, extract it
                            nestedResources.push(t.objectProperty(innerProp.key, innerProp.value))
                          }
                        }
                      })

                      // Rebuild property with only standard props
                      const cleanedResource = t.objectProperty(
                        prop.key,
                        t.objectExpression(resourceProps)
                      )
                      cleanedProperties.push(cleanedResource)

                      // Add nested resources at correct level
                      nestedResources.forEach(nested => {
                        cleanedProperties.push(nested)
                      })
                    } else {
                      cleanedProperties.push(prop)
                    }
                  })

                  // Replace properties with cleaned version
                  subjectProperty.value.properties = cleanedProperties
                  exercisesSection = subjectProperty.value
                } else {
                  // Recreate section if it's not an object
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
 * Adds or updates a resource in the translations AST
 * @param {Object} ast - Babel AST
 * @param {string} lang - Language code
 * @param {string} subject - Subject key
 * @param {string} resourceId - Resource ID
 * @param {Object} translations - Translation object
 */
function addOrUpdateResourceInAST(ast, lang, subject, resourceId, translations) {
  const exercisesSection = findAndCleanExercisesSection(ast, lang, subject)

  if (!exercisesSection) {
    throw new Error(`Cannot find/create section ${lang}.resources.exercises.${subject}`)
  }

  // Check if resource already exists
  const existingResourceIndex = exercisesSection.properties.findIndex(prop =>
    t.isObjectProperty(prop) &&
    t.isIdentifier(prop.key, { name: resourceId })
  )

  const resourceAST = createTranslationResourceAST(translations)

  if (existingResourceIndex !== -1) {
    // Update existing resource
    exercisesSection.properties[existingResourceIndex] = t.objectProperty(
      t.identifier(resourceId),
      resourceAST
    )
  } else {
    // Add new resource
    exercisesSection.properties.push(
      t.objectProperty(
        t.identifier(resourceId),
        resourceAST
      )
    )
  }
}

/**
 * Removes a resource from the translations AST
 * @param {Object} ast - Babel AST
 * @param {string} lang - Language code
 * @param {string} subject - Subject key
 * @param {string} resourceId - Resource ID to remove
 */
function removeResourceFromAST(ast, lang, subject, resourceId) {
  const exercisesSection = findAndCleanExercisesSection(ast, lang, subject)

  if (!exercisesSection) {
    return
  }

  // Filter to remove the resource
  const originalLength = exercisesSection.properties.length
  exercisesSection.properties = exercisesSection.properties.filter(prop =>
    !(t.isObjectProperty(prop) && t.isIdentifier(prop.key, { name: resourceId }))
  )
}

// ==========================================
// APP.VUE MODIFICATION FUNCTIONS
// ==========================================

/**
 * Adds a new resource to the resources array in App.vue
 * @param {string} appVueContent - App.vue file content
 * @param {Object} newResource - Resource object to add
 * @returns {string} Modified App.vue content
 * @throws {Error} If modification fails
 */
async function addResourceToAppVue(appVueContent, newResource) {
  try {
    // Extract script section
    const scriptMatch = appVueContent.match(/<script setup>([\s\S]*?)<\/script>/)
    if (!scriptMatch) {
      throw new Error('<script setup> section not found')
    }

    const scriptContent = scriptMatch[1]
    const ast = parse(scriptContent, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx']
    })

    // Find and modify resources array
    traverse(ast, {
      VariableDeclarator(path) {
        if (
          t.isIdentifier(path.node.id, { name: 'resources' }) &&
          t.isArrayExpression(path.node.init)
        ) {
          // Create AST for new resource
          const resourceAST = createResourceAST(newResource)

          // Add to array
          path.node.init.elements.push(resourceAST)
        }
      }
    })

    // Generate new code
    const { code } = generate(ast)

    // Format with Prettier
    const formattedScript = await prettier.format(code, {
      parser: 'babel',
      semi: false,
      singleQuote: true,
      tabWidth: 2,
      useTabs: false,
      trailingComma: 'none'
    })

    // Replace in complete content
    const newAppVueContent = appVueContent.replace(
      /<script setup>([\s\S]*?)<\/script>/,
      `<script setup>${formattedScript}</script>`
    )

    return newAppVueContent
  } catch (error) {
    throw new Error(`Error adding resource: ${error.message}`)
  }
}

/**
 * Updates an existing resource in App.vue
 * @param {string} appVueContent - App.vue file content
 * @param {string} resourceId - ID of resource to update
 * @param {Object} updatedResource - Updated resource object
 * @returns {string} Modified App.vue content
 * @throws {Error} If modification fails
 */
async function updateResourceInAppVue(appVueContent, resourceId, updatedResource) {
  try {
    const scriptMatch = appVueContent.match(/<script setup>([\s\S]*?)<\/script>/)
    if (!scriptMatch) {
      throw new Error('<script setup> section not found')
    }

    const scriptContent = scriptMatch[1]
    const ast = parse(scriptContent, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx']
    })

    // Find and modify resource
    traverse(ast, {
      VariableDeclarator(path) {
        if (
          t.isIdentifier(path.node.id, { name: 'resources' }) &&
          t.isArrayExpression(path.node.init)
        ) {
          // Find index of resource to modify
          const resourceIndex = findResourceIndexInArray(path.node.init, resourceId)

          if (resourceIndex !== -1) {
            // Replace with new resource
            const resourceAST = createResourceAST(updatedResource)
            path.node.init.elements[resourceIndex] = resourceAST
          } else {
            throw new Error(`Resource with ID ${resourceId} not found`)
          }
        }
      }
    })

    // Generate and format new code
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
    throw new Error(`Error updating resource: ${error.message}`)
  }
}

/**
 * Removes a resource from the resources array in App.vue
 * @param {string} appVueContent - App.vue file content
 * @param {string} resourceId - ID of resource to remove
 * @returns {string} Modified App.vue content
 * @throws {Error} If modification fails
 */
async function removeResourceFromAppVue(appVueContent, resourceId) {
  try {
    const scriptMatch = appVueContent.match(/<script setup>([\s\S]*?)<\/script>/)
    if (!scriptMatch) {
      throw new Error('<script setup> section not found')
    }

    const scriptContent = scriptMatch[1]
    const ast = parse(scriptContent, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx']
    })

    // Find and remove resource
    traverse(ast, {
      VariableDeclarator(path) {
        if (
          t.isIdentifier(path.node.id, { name: 'resources' }) &&
          t.isArrayExpression(path.node.init)
        ) {
          // Filter elements to remove resource
          path.node.init.elements = path.node.init.elements.filter(element => {
            if (t.isObjectExpression(element)) {
              const idProperty = element.properties.find(prop =>
                t.isObjectProperty(prop) &&
                t.isIdentifier(prop.key, { name: 'id' }) &&
                t.isStringLiteral(prop.value, { value: resourceId })
              )
              return !idProperty // Keep if not found (remove if found)
            }
            return true
          })
        }
      }
    })

    // Generate and format new code
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
    throw new Error(`Error removing resource: ${error.message}`)
  }
}

// ==========================================
// TRANSLATIONS MANAGEMENT FUNCTIONS
// ==========================================

/**
 * Adds translations for a new resource using AST
 * @param {string} translationsContent - translations.js file content
 * @param {string} subject - Subject key
 * @param {string} resourceId - Resource ID
 * @param {Object} frTranslations - French translations
 * @param {Object} enTranslations - English translations
 * @returns {string} Modified translations.js content
 * @throws {Error} If modification fails
 */
async function addTranslationsForResource(translationsContent, subject, resourceId, frTranslations, enTranslations) {
  try {
    // Parse file with AST
    const ast = parseTranslationsFile(translationsContent)

    // Add French and English translations
    addOrUpdateResourceInAST(ast, 'fr', subject, resourceId, frTranslations)
    addOrUpdateResourceInAST(ast, 'en', subject, resourceId, enTranslations)

    // Generate new code
    const { code } = generate(ast, {
      minified: false,
      concise: false,
      retainLines: false
    })

    // Format with Prettier
    const formattedCode = await prettier.format(code, {
      parser: 'babel',
      semi: false,
      singleQuote: true,
      tabWidth: 2,
      useTabs: false,
      trailingComma: 'none',
      printWidth: 120
    })

    // Rebuild complete file with export
    const newContent = `// src/i18n/translations.js
// Central file for all translations

export const ${formattedCode.replace('const ', '').replace(/;\s*$/, '')}`

    return newContent

  } catch (error) {
    throw new Error(`Error adding translations: ${error.message}`)
  }
}

/**
 * Updates translations for an existing resource using AST
 * @param {string} translationsContent - translations.js file content
 * @param {string} subject - Subject key
 * @param {string} resourceId - Resource ID
 * @param {Object} frTranslations - French translations
 * @param {Object} enTranslations - English translations
 * @returns {string} Modified translations.js content
 * @throws {Error} If modification fails
 */
async function updateTranslationsForResource(translationsContent, subject, resourceId, frTranslations, enTranslations) {
  try {
    // Parse file with AST
    const ast = parseTranslationsFile(translationsContent)

    // Update French and English translations
    addOrUpdateResourceInAST(ast, 'fr', subject, resourceId, frTranslations)
    addOrUpdateResourceInAST(ast, 'en', subject, resourceId, enTranslations)

    // Generate new code
    const { code } = generate(ast, {
      minified: false,
      concise: false,
      retainLines: false
    })

    // Format with Prettier
    const formattedCode = await prettier.format(code, {
      parser: 'babel',
      semi: false,
      singleQuote: true,
      tabWidth: 2,
      useTabs: false,
      trailingComma: 'none',
      printWidth: 120
    })

    // Rebuild complete file with export
    const newContent = `// src/i18n/translations.js
// Central file for all translations

export const ${formattedCode.replace('const ', '').replace(/;\s*$/, '')}`

    return newContent

  } catch (error) {
    throw new Error(`Error updating translations: ${error.message}`)
  }
}

/**
 * Removes translations for a resource using AST
 * @param {string} translationsContent - translations.js file content
 * @param {string} subject - Subject key
 * @param {string} resourceId - Resource ID
 * @returns {string} Modified translations.js content
 * @throws {Error} If modification fails
 */
async function removeTranslationsForResource(translationsContent, subject, resourceId) {
  try {
    // Parse file with AST
    const ast = parseTranslationsFile(translationsContent)

    // Remove French and English translations
    removeResourceFromAST(ast, 'fr', subject, resourceId)
    removeResourceFromAST(ast, 'en', subject, resourceId)

    // Generate new code
    const { code } = generate(ast, {
      minified: false,
      concise: false,
      retainLines: false
    })

    // Format with Prettier
    const formattedCode = await prettier.format(code, {
      parser: 'babel',
      semi: false,
      singleQuote: true,
      tabWidth: 2,
      useTabs: false,
      trailingComma: 'none',
      printWidth: 120
    })

    // Rebuild complete file with export
    const newContent = `// src/i18n/translations.js
// Central file for all translations

export const ${formattedCode.replace('const ', '').replace(/;\s*$/, '')}`

    return newContent

  } catch (error) {
    throw new Error(`Error removing translations: ${error.message}`)
  }
}

// ==========================================
// AUTOMATIC TRANSLATION FUNCTIONS
// ==========================================

/**
 * Simple translation service for integration
 * @param {string} text - Text to translate
 * @param {string} fromLang - Source language code
 * @param {string} toLang - Target language code
 * @returns {string} Translated text or original if translation fails
 */
async function translateText(text, fromLang = 'fr', toLang = 'en') {
  try {
    // Use LibreTranslate by default
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
    // Return original text on error
    return text
  }
}

/**
 * Adds a resource with automatic translation
 * @param {string} translationsContent - translations.js file content
 * @param {string} subject - Subject key
 * @param {string} resourceId - Resource ID
 * @param {Object} frTranslations - French translations
 * @param {Object} options - Translation options
 * @returns {string} Modified translations.js content
 */
async function addResourceWithAutoTranslation(translationsContent, subject, resourceId, frTranslations, options = {}) {
  try {
    let enTranslations = {}

    if (options.enableAutoTranslation) {
      // Translate each field
      const fieldsToTranslate = ['title', 'description', 'fullDescription', 'notes']

      for (const field of fieldsToTranslate) {
        if (frTranslations[field] && frTranslations[field].trim()) {
          enTranslations[field] = await translateText(frTranslations[field])

          // Small delay to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 500))
        } else {
          enTranslations[field] = frTranslations[field] || ''
        }
      }
    } else {
      // Use manual translations provided
      enTranslations = options.enTranslations || frTranslations
    }

    // Add translations with existing AST function
    return await addTranslationsForResource(translationsContent, subject, resourceId, frTranslations, enTranslations)

  } catch (error) {
    // On error, use French translations for English
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